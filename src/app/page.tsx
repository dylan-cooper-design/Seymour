"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChoiceCard } from "@/components/ChoiceCard";
import type { SuggestionGroup } from "@/agents/first/parse-agent-reply";
import { MessageList } from "@/components/MessageList";
import { Nav } from "@/components/nav/Nav";
import { DetailPanel } from "@/components/detail/DetailPanel";
import { useTreeExpansion } from "@/hooks/useTreeExpansion";
import { loadUserState, saveUserState } from "@/lib/storage";
import {
  findByTemplateKey,
  findNode,
  nearestSelfOrAncestorOfKind,
  updateNode,
  walk,
} from "@/lib/tree/nodes";
import { touch } from "@/lib/tree/create";
import {
  INITIAL_TEMPLATE_KEY,
  TEMPLATE_KEYS,
  createProductDesignTemplate,
} from "@/lib/templates/product-design";
import { SCHEMA_VERSION, type ActionNode, type ProjectTree } from "@/types/project";
import type { MessageState, ThreadMessage, ThreadsByNodeId } from "@/types/navigation";

const API_TIMEOUT_MS = 30_000;
const STREAM_IDLE_TIMEOUT_MS = 30_000;
const AUTO_SCROLL_THRESHOLD_PX = 100;

// ─── helpers ──────────────────────────────────────────────────────────────────

function createMessageId(): string {
  return crypto.randomUUID();
}

function createMessage(
  role: ThreadMessage["role"],
  text: string,
  options?: { id?: string; state?: MessageState; timestamp?: number }
): ThreadMessage {
  return {
    id: options?.id ?? createMessageId(),
    role,
    text,
    state: options?.state,
    timestamp: options?.timestamp ?? Date.now(),
  };
}

function normalizeThreadMessage(message: Partial<ThreadMessage>): ThreadMessage {
  return {
    id: typeof message.id === "string" && message.id ? message.id : createMessageId(),
    role: message.role === "user" ? "user" : "assistant",
    text: typeof message.text === "string" ? message.text : "",
    state: message.role === "assistant" ? message.state : undefined,
    timestamp: typeof message.timestamp === "number" ? message.timestamp : Date.now(),
  };
}

function normalizeThreads(threads: ThreadsByNodeId): ThreadsByNodeId {
  const normalized: ThreadsByNodeId = {};
  for (const [threadId, messages] of Object.entries(threads)) {
    normalized[threadId] = (messages ?? []).map(normalizeThreadMessage);
  }
  return normalized;
}

function workstreamGreeting(label: string, objective?: string): string {
  return objective ? `**${label}**\n\n${objective}` : `**${label}**`;
}

/**
 * One thread per workstream — never per folder, decision, or action.
 *
 * Clicking a decision keeps you in its parent workstream's conversation, because
 * that IS the conversation about that decision. Giving decisions their own
 * threads would shatter one discussion into stubs that can't be merged back.
 */
function ensureThreads(threads: ThreadsByNodeId, tree: ProjectTree): ThreadsByNodeId {
  const next: ThreadsByNodeId = { ...threads };
  const validIds = new Set<string>();

  walk(tree.roots, (node) => {
    if (node.kind !== "workstream") return;
    validIds.add(node.id);
    if (!next[node.id] || next[node.id].length === 0) {
      next[node.id] = [
        createMessage("assistant", workstreamGreeting(node.label, node.objective), {
          state: "complete",
        }),
      ];
    }
  });

  for (const key of Object.keys(next)) {
    if (!validIds.has(key)) delete next[key];
  }

  return next;
}

/**
 * A stored blob is usable only if it parses as a tree at the CURRENT schema
 * version. A failed shape check and a version mismatch take the same branch —
 * one code path for "unusable blob" beats two.
 *
 * Replaced with a zod schema in the patch-contract phase.
 */
function isUsableTree(value: unknown): value is ProjectTree {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ProjectTree>;
  return (
    candidate.schemaVersion === SCHEMA_VERSION &&
    typeof candidate.projectName === "string" &&
    Array.isArray(candidate.roots)
  );
}

function firstWorkstreamId(tree: ProjectTree): string | null {
  let found: string | null = null;
  walk(tree.roots, (node) => {
    if (found === null && node.kind === "workstream") found = node.id;
  });
  return found;
}

function initialTree(): ProjectTree {
  return createProductDesignTemplate();
}

function initialSelection(tree: ProjectTree): string | null {
  return findByTemplateKey(tree.roots, INITIAL_TEMPLATE_KEY)?.id ?? firstWorkstreamId(tree);
}

// ─── SSE ──────────────────────────────────────────────────────────────────────

type StreamEvent =
  | { type: "text"; content: string; seq: number }
  | { type: "nav_patch"; content: unknown }
  | { type: "suggestions"; content: SuggestionGroup[] }
  | { type: "done" }
  | { type: "error"; message: string };

function parseSseEvents(chunk: string): { events: StreamEvent[]; remainder: string } {
  const rawEvents = chunk.split("\n\n");
  const remainder = rawEvents.pop() ?? "";
  const events: StreamEvent[] = [];

  for (const rawEvent of rawEvents) {
    const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) continue;
    try {
      events.push(JSON.parse(dataLine.slice(6)) as StreamEvent);
    } catch {
      continue;
    }
  }

  return { events, remainder };
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const [tree, setTree] = useState<ProjectTree>(initialTree);
  /** Any node. Drives the highlighted row and the detail panel. */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  /**
   * The workstream whose conversation is open. Sticky by design: selecting a
   * folder (which owns no thread) highlights it without throwing away the chat
   * you were in. That is what makes deep-tree navigation feel like a layers
   * panel rather than a tab switcher.
   */
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadsByNodeId, setThreadsByNodeId] = useState<ThreadsByNodeId>({});

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [retryText, setRetryText] = useState<string | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<Record<number, string>>({});

  const expansion = useTreeExpansion(tree.roots, {
    defaultExpandedIds: [],
  });

  const selectedNode = useMemo(
    () => (selectedNodeId ? findNode(tree.roots, selectedNodeId) : undefined),
    [tree, selectedNodeId]
  );

  const messages = useMemo<ThreadMessage[]>(
    () => (activeThreadId ? (threadsByNodeId[activeThreadId] ?? []) : []),
    [activeThreadId, threadsByNodeId]
  );

  const isStreaming = useMemo(
    () => messages.some((message) => message.state === "streaming"),
    [messages]
  );

  // First unanswered group index (clamped to 0 when all are answered)
  const groupIdx = (() => {
    if (suggestions.length <= 1) return 0;
    const first = suggestions.findIndex((_, i) => !(i in pendingAnswers));
    return first === -1 ? suggestions.length - 1 : first;
  })();

  useEffect(() => {
    setPendingAnswers({});
  }, [suggestions]);

  useEffect(() => {
    setSuggestions([]);
    setPendingAnswers({});
  }, [activeThreadId]);

  useEffect(() => {
    document.body.style.pointerEvents = "";
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  // ── hydrate ────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function hydrate() {
      const stored = await loadUserState();
      const usable = isUsableTree(stored.projectTree);
      const hydratedTree = usable ? (stored.projectTree as ProjectTree) : initialTree();
      // If the blob was unusable the tree was rebuilt, so old thread keys point
      // at nodes that no longer exist. Drop them rather than orphan them.
      const storedThreads = usable ? (stored.threadsByNodeId ?? {}) : {};
      const hydratedThreads = ensureThreads(normalizeThreads(storedThreads), hydratedTree);

      const storedSelection =
        usable && stored.selectedNodeId && findNode(hydratedTree.roots, stored.selectedNodeId)
          ? stored.selectedNodeId
          : initialSelection(hydratedTree);

      const thread = storedSelection
        ? (nearestSelfOrAncestorOfKind(hydratedTree.roots, storedSelection, "workstream")?.id ??
          firstWorkstreamId(hydratedTree))
        : firstWorkstreamId(hydratedTree);

      setTree(hydratedTree);
      setThreadsByNodeId(hydratedThreads);
      setSelectedNodeId(storedSelection);
      setActiveThreadId(thread);
      setIsHydrated(true);

      const foundations = findByTemplateKey(hydratedTree.roots, TEMPLATE_KEYS.foundations);
      if (foundations) expansion.expand(foundations.id);
      if (storedSelection) expansion.revealNode(storedSelection);
    }
    void hydrate();
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── persist ────────────────────────────────────────────────────────────────
  // Still unthrottled — every streamed token triggers a full-blob upsert. Fixed
  // in the storage-hardening phase, deliberately kept out of this change.
  useEffect(() => {
    if (!isHydrated) return;
    void saveUserState({ projectTree: tree, selectedNodeId, threadsByNodeId });
  }, [isHydrated, tree, selectedNodeId, threadsByNodeId]);

  // ── selection ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setError(undefined);
      setRetryText(undefined);
      setIsNearBottom(true);

      const workstream = nearestSelfOrAncestorOfKind(tree.roots, nodeId, "workstream");
      // A folder has no workstream ancestor — keep the conversation we're in.
      if (workstream) setActiveThreadId(workstream.id);

      const node = findNode(tree.roots, nodeId);
      if (node && node.children.length > 0) expansion.toggle(nodeId);
    },
    [tree, expansion]
  );

  const handleToggleAction = useCallback((nodeId: string, done: boolean) => {
    setTree((prev) => {
      const roots = updateNode(prev.roots, nodeId, (node) => {
        if (node.kind !== "action") return node;
        const next: ActionNode = {
          ...node,
          done,
          doneAt: done ? new Date().toISOString() : undefined,
        };
        return touch(next);
      });
      return roots === prev.roots ? prev : { ...prev, roots };
    });
  }, []);

  // ── chat ───────────────────────────────────────────────────────────────────

  const updateAssistantMessage = useCallback(
    (
      threadId: string,
      assistantMessageId: string,
      updater: (message: ThreadMessage) => ThreadMessage
    ) => {
      setThreadsByNodeId((prev) => {
        const thread = prev[threadId] ?? [];
        return {
          ...prev,
          [threadId]: thread.map((message) =>
            message.id === assistantMessageId ? updater(message) : message
          ),
        };
      });
    },
    []
  );

  const finalizeAssistantMessage = useCallback(
    (threadId: string, assistantMessageId: string, state: MessageState) => {
      updateAssistantMessage(threadId, assistantMessageId, (message) => ({ ...message, state }));
    },
    [updateAssistantMessage]
  );

  const sendMessage = useCallback(
    async (overrideText?: string, options?: { silent?: boolean }) => {
      const text = (overrideText ?? inputValue).trim();
      if (!text || isSendingRef.current) return;
      const threadId = activeThreadId;
      if (!threadId) return;

      const silent = options?.silent ?? false;
      const priorMessages = (threadsByNodeId[threadId] ?? [])
        .filter((m) => m.state === "complete" || m.state === undefined)
        .map((m) => ({ role: m.role, text: m.text }));
      const userMessage = createMessage("user", text);
      const assistantMessage = createMessage("assistant", "", { state: "streaming" });

      isSendingRef.current = true;
      stopRequestedRef.current = false;
      setIsSending(true);
      setError(undefined);
      if (!silent) {
        setRetryText(undefined);
        setInputValue("");
      }
      setSuggestions([]);
      setThreadsByNodeId((prev) => ({
        ...prev,
        [threadId]: silent
          ? [...(prev[threadId] ?? []), assistantMessage]
          : [...(prev[threadId] ?? []), userMessage, assistantMessage],
      }));

      const controller = new AbortController();
      let timedOut = false;
      let interrupted = false;
      let streamTimeoutId: ReturnType<typeof setTimeout> | undefined;
      abortControllerRef.current = controller;
      const requestTimeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, API_TIMEOUT_MS);

      const resetStreamTimeout = () => {
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        streamTimeoutId = setTimeout(() => {
          interrupted = true;
          controller.abort();
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      const markErrorWithRetry = (message: string) => {
        if (!silent) setRetryText(text);
        setError(message);
      };

      try {
        const res = await fetch("/api/agents/first", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            navModel: tree,
            activeNavItemId: selectedNodeId ?? threadId,
            threadMessages: priorMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { reply?: string; ok?: boolean };
          finalizeAssistantMessage(threadId, assistantMessage.id, "error");
          markErrorWithRetry(data.reply ?? "Something went wrong. Try again.");
          return;
        }

        if (!res.body) {
          finalizeAssistantMessage(threadId, assistantMessage.id, "error");
          markErrorWithRetry("No response stream was returned.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let highestSeq = -1;
        let doneEventReceived = false;
        let gotAnyText = false;

        resetStreamTimeout();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          resetStreamTimeout();

          buffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSseEvents(buffer);
          buffer = remainder;

          for (const event of events) {
            if (event.type === "text") {
              if (event.seq <= highestSeq) continue;
              highestSeq = event.seq;
              gotAnyText = true;
              updateAssistantMessage(threadId, assistantMessage.id, (message) => ({
                ...message,
                text: message.text + event.content,
                state: "streaming",
              }));
              continue;
            }

            if (event.type === "nav_patch") {
              // The old group/item patch ops don't map onto the node tree. The
              // replacement contract (tree_patch) lands with the prompt rewrite;
              // until then these are dropped rather than misapplied.
              continue;
            }

            if (event.type === "suggestions") {
              setSuggestions(event.content);
              continue;
            }

            if (event.type === "error") {
              finalizeAssistantMessage(threadId, assistantMessage.id, "error");
              markErrorWithRetry(event.message || "The stream ended with an error.");
              doneEventReceived = true;
              break;
            }

            if (event.type === "done") {
              finalizeAssistantMessage(threadId, assistantMessage.id, "complete");
              doneEventReceived = true;
              break;
            }
          }

          if (doneEventReceived) break;
        }

        if (streamTimeoutId) clearTimeout(streamTimeoutId);

        if (!doneEventReceived) {
          finalizeAssistantMessage(
            threadId,
            assistantMessage.id,
            gotAnyText ? "complete" : "error"
          );
          if (!gotAnyText) {
            markErrorWithRetry("Connection ended before a response was received.");
          }
        }
      } catch (err) {
        const isAbortError = err instanceof Error && err.name === "AbortError";

        if (isAbortError && stopRequestedRef.current) {
          finalizeAssistantMessage(threadId, assistantMessage.id, "cancelled");
        } else if (isAbortError && interrupted) {
          finalizeAssistantMessage(threadId, assistantMessage.id, "error");
          markErrorWithRetry("Connection lost. Partial response saved.");
        } else if (isAbortError && timedOut) {
          finalizeAssistantMessage(threadId, assistantMessage.id, "error");
          markErrorWithRetry("Request timed out. Partial response saved.");
        } else {
          finalizeAssistantMessage(threadId, assistantMessage.id, "error");
          const msg = err instanceof Error ? err.message : "Something went wrong. Try again.";
          markErrorWithRetry(msg);
        }
      } finally {
        if (streamTimeoutId) clearTimeout(streamTimeoutId);
        clearTimeout(requestTimeoutId);
        abortControllerRef.current = null;
        isSendingRef.current = false;
        stopRequestedRef.current = false;
        setIsSending(false);
      }
    },
    [
      activeThreadId,
      finalizeAssistantMessage,
      inputValue,
      selectedNodeId,
      threadsByNodeId,
      tree,
      updateAssistantMessage,
    ]
  );

  const handleStopGenerating = useCallback(() => {
    if (!abortControllerRef.current) return;
    stopRequestedRef.current = true;
    abortControllerRef.current.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (!retryText) return;
    void sendMessage(retryText);
  }, [retryText, sendMessage]);

  const handleChoiceSelect = useCallback(
    (option: string, fromGroupIdx: number) => {
      if (suggestions.length <= 1) {
        void sendMessage(option);
        return;
      }
      const newAnswers = { ...pendingAnswers, [fromGroupIdx]: option };
      setPendingAnswers(newAnswers);

      // Auto-send once every question has an answer
      if (Object.keys(newAnswers).length >= suggestions.length) {
        const text = suggestions
          .map((s, i) => `Q: ${s.question ?? `Question ${i + 1}`}\nA: ${newAnswers[i] ?? ""}`)
          .join("\n\n");
        void sendMessage(text);
      }
    },
    [suggestions, pendingAnswers, sendMessage]
  );

  // ── scroll ─────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    if (isNearBottom) scrollToBottom();
  }, [activeThreadId, isNearBottom, messages, scrollToBottom]);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-seymour-canvas">
      <Nav
        projectName={tree.projectName}
        roots={tree.roots}
        selectedNodeId={selectedNodeId}
        activeThreadId={activeThreadId}
        expansion={expansion}
        onSelect={handleSelect}
        onToggleAction={handleToggleAction}
      />
      <aside
        className="sticky top-0 h-screen w-[400px] min-w-[400px] max-w-[400px] overflow-hidden border-r border-seymour-border bg-seymour-bg"
        aria-label="Detail panel"
      >
        <DetailPanel node={selectedNode} />
      </aside>
      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-seymour-canvas" role="main">
        <section className="flex flex-1 flex-col items-center overflow-hidden" aria-label="Chat">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            onStopGenerating={handleStopGenerating}
            onScroll={handleMessagesScroll}
            ref={messagesRef}
          />
          {error && (
            <div
              className="flex w-full items-center justify-between gap-4 border-t border-seymour-error-border/50 bg-seymour-error-bg/50 px-6 py-2 text-body-sm text-seymour-error-text"
              role="alert"
            >
              <span>{error}</span>
              {retryText && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-md border border-seymour-error-text/40 px-2 py-1 text-label text-seymour-error-text transition hover:bg-seymour-error-bg/30 focus:outline-none focus:ring-2 focus:ring-seymour-error-text/60"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </section>
        <div className="shrink-0">
          <ChoiceCard
            suggestions={suggestions}
            groupIdx={groupIdx}
            onSelect={handleChoiceSelect}
            disabled={isSending}
          />
          <ChatComposer
            value={inputValue}
            onChange={setInputValue}
            onSend={sendMessage}
            disabled={isSending}
          />
        </div>
      </main>
    </div>
  );
}
