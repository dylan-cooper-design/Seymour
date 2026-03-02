"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { CHAT_GREETING } from "@/components/ChatEmptyState";
import { MessageList } from "@/components/MessageList";
import { Nav } from "@/components/nav/Nav";
import { getStorage, setStorage } from "@/lib/storage";
import type {
  Decision,
  Goal,
  MessageState,
  MilestoneStatus,
  NavModel,
  NavPatch,
  SidebarNavData,
  ThreadMessage,
  ThreadsByNavItemId,
} from "@/types/navigation";

const API_TIMEOUT_MS = 30_000;
const STREAM_IDLE_TIMEOUT_MS = 30_000;
const AUTO_SCROLL_THRESHOLD_PX = 100;
const GOAL_THREAD_ID = "goal-definition";

const INITIAL_NAV_MODEL: NavModel = {
  projectName: "AI Agent Workflow Designer",
  foundationLabel: "Foundation",
  groups: [
    { id: "valuable", label: "Valuable", isExpanded: false, items: [] },
    {
      id: "usable",
      label: "Usable",
      isExpanded: false,
      items: [],
    },
    {
      id: "practical",
      label: "Practical",
      isExpanded: false,
      isDimmed: true,
      items: [],
    },
    {
      id: "presentable",
      label: "Presentable",
      isExpanded: false,
      isDimmed: true,
      items: [],
    },
    {
      id: "testable",
      label: "Testable",
      isExpanded: false,
      isDimmed: true,
      items: [],
    },
    {
      id: "repeatable",
      label: "Repeatable",
      isExpanded: false,
      isDimmed: true,
      items: [],
    },
  ],
};

const INITIAL_ACTIVE_NAV_ITEM_ID = GOAL_THREAD_ID;

function createMessageId(): string {
  return crypto.randomUUID();
}

function createMessage(
  role: ThreadMessage["role"],
  text: string,
  options?: {
    id?: string;
    state?: MessageState;
    timestamp?: number;
  }
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

function milestoneEmptyState(label: string, objective?: string): string {
  if (!objective) {
    return `Ready to work on: ${label}\n\nAsk me anything to get started.`;
  }
  return `${label}\n\n${objective}\n\nWhat would you like to work on first?`;
}

function goalThreadGreeting(): string {
  return `${CHAT_GREETING}\n\nTell me your goal, and I'll create a milestone plan to help you achieve it.`;
}

function getAllItems(navModel: NavModel) {
  return navModel.groups.flatMap((group) => group.items);
}

function findItemById(navModel: NavModel, itemId: string) {
  return getAllItems(navModel).find((item) => item.id === itemId);
}

function getFallbackActiveItemId(navModel: NavModel): string {
  return getAllItems(navModel)[0]?.id ?? INITIAL_ACTIVE_NAV_ITEM_ID;
}

function navToSidebarData(navModel: NavModel): SidebarNavData {
  return {
    projectName: navModel.projectName,
    platform: [
      { id: GOAL_THREAD_ID, label: navModel.foundationLabel },
    ],
    milestones: navModel.groups.map((group) => ({
      id: group.id,
      label: group.label,
      isDimmed: group.isDimmed,
      children: group.items.map((item) => ({
        id: item.id,
        label: item.label,
        status: item.status,
        decisions: item.decisions,
      })),
    })),
  };
}

function ensureThreads(
  threads: ThreadsByNavItemId,
  navModel: NavModel
): ThreadsByNavItemId {
  const next: ThreadsByNavItemId = { ...threads };
  const validIds = new Set<string>();
  validIds.add(GOAL_THREAD_ID);
  if (!next[GOAL_THREAD_ID] || next[GOAL_THREAD_ID].length === 0) {
    next[GOAL_THREAD_ID] = [
      createMessage("assistant", goalThreadGreeting(), { state: "complete" }),
    ];
  }

  for (const item of getAllItems(navModel)) {
    validIds.add(item.id);
    if (!next[item.id] || next[item.id].length === 0) {
      next[item.id] = [
        createMessage("assistant", milestoneEmptyState(item.label, item.objective), {
          state: "complete",
        }),
      ];
    }
  }

  for (const key of Object.keys(next)) {
    if (!validIds.has(key)) {
      delete next[key];
    }
  }

  return next;
}

function normalizeThreads(threads: ThreadsByNavItemId): ThreadsByNavItemId {
  const normalized: ThreadsByNavItemId = {};
  for (const [threadId, messages] of Object.entries(threads)) {
    normalized[threadId] = (messages ?? []).map((message) =>
      normalizeThreadMessage(message)
    );
  }
  return normalized;
}

function createNavItemId(groupId: string, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${groupId}-${slug || "milestone"}-${Date.now().toString(36)}`;
}

type MilestoneAddition = {
  id?: string;
  groupId: string;
  label: string;
  status?: MilestoneStatus;
  objective?: string;
  decisions?: Decision[];
};

function applyNavPatch(navModel: NavModel, patch: NavPatch): NavModel {
  let nextModel: NavModel = {
    ...navModel,
    groups: navModel.groups.map((group) => ({ ...group, items: [...group.items] })),
  };

  if (patch.setProjectName?.trim()) {
    nextModel = { ...nextModel, projectName: patch.setProjectName.trim() };
  }

  if (patch.clearAllItemsBeforeAdd) {
    nextModel = {
      ...nextModel,
      groups: nextModel.groups.map((group) => ({
        ...group,
        items: [],
      })),
    };
  }

  if (patch.addMilestones?.length) {
    const additionsByGroup = new Map<
      string,
      Array<MilestoneAddition>
    >();
    for (const g of nextModel.groups) {
      additionsByGroup.set(g.id, []);
    }
    for (const milestone of patch.addMilestones) {
      if (!additionsByGroup.has(milestone.groupId)) continue;
      additionsByGroup.get(milestone.groupId)?.push(milestone);
    }

    nextModel = {
      ...nextModel,
      groups: nextModel.groups.map((group) => {
        const groupAdditions = additionsByGroup.get(group.id) ?? [];
        if (groupAdditions.length === 0) {
          return group;
        }

        const additions = groupAdditions
          .map((milestone) => ({
            id: milestone.id ?? createNavItemId(group.id, milestone.label),
            label: milestone.label.trim(),
            status: milestone.status ?? "incomplete-decision",
            objective: milestone.objective,
            decisions: milestone.decisions,
          }))
          .filter((m) => m.label.length > 0);

        if (additions.length === 0) {
          return group;
        }

        return {
          ...group,
          isExpanded: true,
          items: [...group.items, ...additions],
        };
      }),
    };
  }

  return nextModel;
}

type StreamTextEvent = {
  type: "text";
  content: string;
  seq: number;
};

type StreamNavPatchEvent = {
  type: "nav_patch";
  content: NavPatch;
};

type StreamDoneEvent = {
  type: "done";
};

type StreamErrorEvent = {
  type: "error";
  message: string;
};

type StreamEvent = StreamTextEvent | StreamNavPatchEvent | StreamDoneEvent | StreamErrorEvent;

function parseSseEvents(chunk: string): { events: StreamEvent[]; remainder: string } {
  const rawEvents = chunk.split("\n\n");
  const remainder = rawEvents.pop() ?? "";
  const events: StreamEvent[] = [];

  for (const rawEvent of rawEvents) {
    const dataLine = rawEvent
      .split("\n")
      .find((line) => line.startsWith("data: "));
    if (!dataLine) continue;

    try {
      const parsed = JSON.parse(dataLine.slice(6)) as StreamEvent;
      events.push(parsed);
    } catch {
      continue;
    }
  }

  return { events, remainder };
}

export default function Home() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const [navModel, setNavModel] = useState<NavModel>(INITIAL_NAV_MODEL);
  const [activeNavItemId, setActiveNavItemId] = useState(INITIAL_ACTIVE_NAV_ITEM_ID);
  const [threadsByNavItemId, setThreadsByNavItemId] = useState<ThreadsByNavItemId>(
    ensureThreads({}, INITIAL_NAV_MODEL)
  );
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [retryText, setRetryText] = useState<string | undefined>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  useEffect(() => {
    document.body.style.pointerEvents = "";
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  const messages = useMemo<ThreadMessage[]>(() => {
    return threadsByNavItemId[activeNavItemId] ?? [];
  }, [activeNavItemId, threadsByNavItemId]);

  const scrollToBottom = useCallback(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const isStreaming = useMemo(
    () => messages.some((message) => message.state === "streaming"),
    [messages]
  );

  useEffect(() => {
    const storedNavModel = getStorage<NavModel>("navModel");
    const hydratedNavModel = storedNavModel ?? INITIAL_NAV_MODEL;
    const storedThreads = getStorage<ThreadsByNavItemId>("threadsByNavItemId") ?? {};
    const hydratedThreads = ensureThreads(
      normalizeThreads(storedThreads),
      hydratedNavModel
    );
    const storedActiveItemId = getStorage<string>("activeNavItemId");
    const safeActiveItemId =
      storedActiveItemId === GOAL_THREAD_ID ||
      (storedActiveItemId && findItemById(hydratedNavModel, storedActiveItemId))
        ? (storedActiveItemId as string)
        : getFallbackActiveItemId(hydratedNavModel);
    const storedGoal = getStorage<Goal | null>("currentGoal");

    setNavModel(hydratedNavModel);
    setThreadsByNavItemId(hydratedThreads);
    setActiveNavItemId(safeActiveItemId);
    setCurrentGoal(storedGoal ?? null);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setStorage("navModel", navModel);
    setStorage("threadsByNavItemId", threadsByNavItemId);
    setStorage("activeNavItemId", activeNavItemId);
    setStorage("currentGoal", currentGoal);
  }, [activeNavItemId, currentGoal, isHydrated, navModel, threadsByNavItemId]);

  const updateAssistantMessage = useCallback(
    (
      threadId: string,
      assistantMessageId: string,
      updater: (message: ThreadMessage) => ThreadMessage
    ) => {
      setThreadsByNavItemId((prev) => {
        const thread = prev[threadId] ?? [];
        return {
          ...prev,
          [threadId]: thread.map((message) => {
            if (message.id !== assistantMessageId) return message;
            return updater(message);
          }),
        };
      });
    },
    []
  );

  const finalizeAssistantMessage = useCallback(
    (threadId: string, assistantMessageId: string, state: MessageState) => {
      updateAssistantMessage(threadId, assistantMessageId, (message) => ({
        ...message,
        state,
      }));
    },
    [updateAssistantMessage]
  );

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputValue).trim();
      if (!text || isSendingRef.current) return;

      const threadId = activeNavItemId;
      const userMessage = createMessage("user", text);
      const assistantMessage = createMessage("assistant", "", { state: "streaming" });

      isSendingRef.current = true;
      stopRequestedRef.current = false;
      setIsSending(true);
      setError(undefined);
      setRetryText(undefined);
      setInputValue("");
      setThreadsByNavItemId((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] ?? []), userMessage, assistantMessage],
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
        setRetryText(text);
        setError(message);
      };

      try {
        const res = await fetch("/api/agents/first", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            navModel,
            activeNavItemId: threadId,
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
              const patch = event.content;
              if (patch.addMilestones?.length && patch.setProjectName?.trim()) {
                setCurrentGoal({
                  id: crypto.randomUUID(),
                  text: patch.setProjectName.trim(),
                  createdAt: new Date().toISOString(),
                });
              }
              setNavModel((prevNavModel) => {
                const nextModel = applyNavPatch(prevNavModel, patch);
                setThreadsByNavItemId((prevThreads) => ensureThreads(prevThreads, nextModel));

                if (
                  patch.setActiveNavItemId &&
                  findItemById(nextModel, patch.setActiveNavItemId)
                ) {
                  setActiveNavItemId(patch.setActiveNavItemId);
                } else if (threadId === GOAL_THREAD_ID) {
                  const firstMilestoneId = getAllItems(nextModel)[0]?.id;
                  if (firstMilestoneId) {
                    setActiveNavItemId(firstMilestoneId);
                  }
                }

                return nextModel;
              });
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
          finalizeAssistantMessage(threadId, assistantMessage.id, gotAnyText ? "complete" : "error");
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
    [activeNavItemId, finalizeAssistantMessage, inputValue, navModel, updateAssistantMessage]
  );

  const handleSelectItem = useCallback((itemId: string) => {
    setActiveNavItemId(itemId);
    setError(undefined);
    setRetryText(undefined);
    setIsNearBottom(true);
  }, []);

  const handleStopGenerating = useCallback(() => {
    if (!abortControllerRef.current) return;
    stopRequestedRef.current = true;
    abortControllerRef.current.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (!retryText) return;
    void sendMessage(retryText);
  }, [retryText, sendMessage]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [activeNavItemId, isNearBottom, messages, scrollToBottom]);

  return (
    <div className="flex min-h-screen bg-seymour-canvas">
      <Nav
        nav={navToSidebarData(navModel)}
        activeNavItemId={activeNavItemId}
        onSelectItem={handleSelectItem}
      />
      <main
        className="flex h-screen flex-1 flex-col overflow-hidden bg-seymour-canvas"
        role="main"
      >
        <section
          className="flex flex-1 flex-col items-center overflow-hidden"
          aria-label="Chat"
        >
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
