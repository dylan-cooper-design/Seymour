"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChoiceCard } from "@/components/ChoiceCard";
import type { SuggestionGroup } from "@/agents/first/parse-agent-reply";
import { MessageList } from "@/components/MessageList";
import { Nav } from "@/components/nav/Nav";
import { DetailPanel } from "@/components/detail/DetailPanel";
import { ChatHistoryPanel } from "@/components/detail/ChatHistoryPanel";
import { ResizableSplit } from "@/components/detail/ResizableSplit";
import { useTreeExpansion, type TreeExpansion } from "@/hooks/useTreeExpansion";
import { loadWorkspace, saveWorkspace } from "@/lib/storage";
import { createDemoWorkspace } from "@/lib/demo";
import {
  findByTemplateKey,
  findNode,
  getAncestors,
  nearestSelfOrAncestorOfKind,
  updateNode,
  walk,
} from "@/lib/tree/nodes";
import { touch } from "@/lib/tree/create";
import {
  applyProposal,
  applyStructurePatch,
  proposalTargetId,
  structurePatchTargetIds,
} from "@/lib/tree/patch";
import { INITIAL_TEMPLATE_KEY, TEMPLATE_KEYS } from "@/lib/templates/product-design";
import { SCHEMA_VERSION, type ActionNode, type ProjectTree } from "@/types/project";
import type {
  ChatSession,
  MessageState,
  SessionsByWorkstreamId,
  ThreadMessage,
} from "@/types/navigation";
import type { Proposal, ProposalRecord, StructurePatch } from "@/types/tree-patch";
import { activeProject, type ProjectState, type Workspace } from "@/types/workspace";

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
    // Carried through deliberately: without this, every accepted or rejected
    // proposal card silently disappears from the transcript on reload, leaving
    // a tree change with no visible record of where it came from.
    ...(Array.isArray(message.proposals) ? { proposals: message.proposals } : {}),
  };
}

function normalizeSession(session: Partial<ChatSession>, workstreamId: string): ChatSession {
  return {
    id: typeof session.id === "string" && session.id ? session.id : createMessageId(),
    workstreamId,
    messages: (session.messages ?? []).map(normalizeThreadMessage),
    taggedNodeIds: Array.isArray(session.taggedNodeIds) ? session.taggedNodeIds : [],
    createdAt: typeof session.createdAt === "number" ? session.createdAt : Date.now(),
    updatedAt: typeof session.updatedAt === "number" ? session.updatedAt : Date.now(),
  };
}

function normalizeSessions(sessions: SessionsByWorkstreamId): SessionsByWorkstreamId {
  const normalized: SessionsByWorkstreamId = {};
  for (const [workstreamId, list] of Object.entries(sessions)) {
    normalized[workstreamId] = (list ?? []).map((session) =>
      normalizeSession(session, workstreamId)
    );
  }
  return normalized;
}

function workstreamGreeting(objective?: string): string {
  return objective ?? "What do you want to figure out here?";
}

function createGreetingSession(workstreamId: string, objective?: string): ChatSession {
  const now = Date.now();
  return {
    id: createMessageId(),
    workstreamId,
    messages: [createMessage("assistant", workstreamGreeting(objective), { state: "complete" })],
    taggedNodeIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * One session list per workstream — never per folder, decision, or action.
 *
 * Clicking a decision keeps you in its parent workstream's conversation, because
 * that IS the conversation about that decision. Giving decisions their own
 * conversations would shatter one discussion into stubs that can't be merged back.
 * A session gets attributed to a specific node only via `taggedNodeIds`, set when
 * a write actually targets it (see `structurePatchTargetIds`/`proposalTargetId`).
 */
function ensureSessions(
  sessions: SessionsByWorkstreamId,
  tree: ProjectTree
): SessionsByWorkstreamId {
  const next: SessionsByWorkstreamId = { ...sessions };
  const validIds = new Set<string>();

  walk(tree.roots, (node) => {
    if (node.kind !== "workstream") return;
    validIds.add(node.id);
    if (!next[node.id] || next[node.id].length === 0) {
      next[node.id] = [createGreetingSession(node.id, node.objective)];
    }
  });

  for (const key of Object.keys(next)) {
    if (!validIds.has(key)) delete next[key];
  }

  return next;
}

function latestSessionId(sessions: ChatSession[] | undefined): string | null {
  if (!sessions || sessions.length === 0) return null;
  return sessions[sessions.length - 1].id;
}

function firstWorkstreamId(tree: ProjectTree): string | null {
  let found: string | null = null;
  walk(tree.roots, (node) => {
    if (found === null && node.kind === "workstream") found = node.id;
  });
  return found;
}

function initialSelection(tree: ProjectTree): string | null {
  return findByTemplateKey(tree.roots, INITIAL_TEMPLATE_KEY)?.id ?? firstWorkstreamId(tree);
}

/**
 * Everything needed to render a project, derived from its stored state.
 *
 * Both hydrate and project-switch go through this, so a switched-into project
 * gets exactly the same repair pass as a freshly loaded one: sessions filled
 * in for every workstream, a selection that's guaranteed to still exist, and
 * the active thread resolved from that selection.
 */
function openProject(project: ProjectState) {
  const sessions = ensureSessions(
    normalizeSessions(project.sessionsByWorkstreamId ?? {}),
    project.tree
  );

  const selectedNodeId =
    project.selectedNodeId && findNode(project.tree.roots, project.selectedNodeId)
      ? project.selectedNodeId
      : initialSelection(project.tree);

  const activeThreadId = selectedNodeId
    ? (nearestSelfOrAncestorOfKind(project.tree.roots, selectedNodeId, "workstream")?.id ??
      firstWorkstreamId(project.tree))
    : firstWorkstreamId(project.tree);

  return {
    tree: project.tree,
    sessions,
    selectedNodeId,
    activeThreadId,
    activeSessionId: latestSessionId(activeThreadId ? sessions[activeThreadId] : undefined),
  };
}

/**
 * Open every row above `nodeId` in a tree that isn't in state yet.
 *
 * `expansion.revealNode` resolves ancestors against the *rendered* tree, which
 * during a project switch is still the outgoing project's — so it would look
 * the node up in the wrong forest and silently find nothing.
 */
function revealIn(tree: ProjectTree, nodeId: string | null, expansion: TreeExpansion) {
  if (!nodeId) return;
  for (const ancestor of getAncestors(tree.roots, nodeId)) expansion.expand(ancestor.id);
}

// ─── SSE ──────────────────────────────────────────────────────────────────────

type StreamEvent =
  | { type: "text"; content: string; seq: number }
  | { type: "structure"; content: StructurePatch }
  | { type: "proposals"; content: Proposal[] }
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

  /**
   * The starting workspace, built once per mount. Used as-is until stored state
   * arrives, and kept as this user's initial content if nothing was stored.
   */
  const [seed] = useState(() => {
    const workspace = createDemoWorkspace();
    const active = activeProject(workspace) ?? workspace.projects[0];
    return { workspace, opened: openProject(active) };
  });

  /**
   * Every project's stored state. The entry for `activeProjectId` is a stale
   * copy — the live state below is the real one — and gets folded back in when
   * the workspace is assembled for saving or when the user switches away.
   */
  const [projects, setProjects] = useState<ProjectState[]>(seed.workspace.projects);
  const [activeProjectId, setActiveProjectId] = useState<string>(seed.workspace.activeProjectId);

  const [tree, setTree] = useState<ProjectTree>(seed.opened.tree);
  /** Any node. Drives the highlighted row, the doc pane, and the history filter. */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(seed.opened.selectedNodeId);
  /**
   * The workstream whose session list is open. Sticky by design: selecting a
   * folder (which owns no session list) highlights it without throwing away the
   * chat you were in. That is what makes deep-tree navigation feel like a layers
   * panel rather than a tab switcher.
   */
  const [activeThreadId, setActiveThreadId] = useState<string | null>(seed.opened.activeThreadId);
  /** Which of activeThreadId's sessions is open in the chat pane. */
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    seed.opened.activeSessionId
  );
  const [sessionsByWorkstreamId, setSessionsByWorkstreamId] = useState<SessionsByWorkstreamId>(
    seed.opened.sessions
  );

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

  const activeSessions = useMemo(
    () => (activeThreadId ? (sessionsByWorkstreamId[activeThreadId] ?? []) : []),
    [activeThreadId, sessionsByWorkstreamId]
  );

  const activeSession = useMemo(
    () => activeSessions.find((session) => session.id === activeSessionId),
    [activeSessions, activeSessionId]
  );

  const messages = useMemo<ThreadMessage[]>(() => activeSession?.messages ?? [], [activeSession]);

  const isStreaming = useMemo(
    () => messages.some((message) => message.state === "streaming"),
    [messages]
  );

  // The exact node the right-panel history is scoped to — the selected node's
  // owning workstream (itself, if it is one). No workstream ancestor (a folder
  // at the root) means there is nothing to show history for.
  const historyWorkstreamId = useMemo(
    () =>
      selectedNodeId
        ? (nearestSelfOrAncestorOfKind(tree.roots, selectedNodeId, "workstream")?.id ?? null)
        : null,
    [tree, selectedNodeId]
  );

  const nodeHistory = useMemo(() => {
    if (!historyWorkstreamId || !selectedNodeId) return [];
    const sessions = sessionsByWorkstreamId[historyWorkstreamId] ?? [];
    return sessions
      .filter((session) => session.taggedNodeIds.includes(selectedNodeId))
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessionsByWorkstreamId, historyWorkstreamId, selectedNodeId]);

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
  }, [activeSessionId]);

  useEffect(() => {
    document.body.style.pointerEvents = "";
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  // ── hydrate ────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function hydrate() {
      // No usable stored workspace (first run, or a blob from before the
      // current schema): keep the seed already in state and let the persist
      // effect below write it out as this user's starting point.
      const workspace = (await loadWorkspace()) ?? seed.workspace;
      const active = activeProject(workspace) ?? workspace.projects[0];
      const opened = openProject(active);

      setProjects(workspace.projects);
      setActiveProjectId(active.id);
      setTree(opened.tree);
      setSessionsByWorkstreamId(opened.sessions);
      setSelectedNodeId(opened.selectedNodeId);
      setActiveThreadId(opened.activeThreadId);
      setActiveSessionId(opened.activeSessionId);
      setIsHydrated(true);

      const foundations = findByTemplateKey(opened.tree.roots, TEMPLATE_KEYS.foundations);
      if (foundations) expansion.expand(foundations.id);
      revealIn(opened.tree, opened.selectedNodeId, expansion);
    }
    void hydrate();
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── persist ────────────────────────────────────────────────────────────────

  /**
   * The workspace as it should be stored right now. `projects` holds a stale
   * entry for the active project — folding the live state in here is what lets
   * the inactive projects stay untouched without mirroring every keystroke
   * into the projects array.
   */
  const workspace = useMemo<Workspace>(
    () => ({
      schemaVersion: SCHEMA_VERSION,
      activeProjectId,
      projects: projects.map((project) =>
        project.id === activeProjectId
          ? { id: project.id, tree, selectedNodeId, sessionsByWorkstreamId }
          : project
      ),
    }),
    [projects, activeProjectId, tree, selectedNodeId, sessionsByWorkstreamId]
  );

  // Still unthrottled — every streamed token triggers a full-blob upsert. Fixed
  // in the storage-hardening phase, deliberately kept out of this change.
  useEffect(() => {
    if (!isHydrated) return;
    void saveWorkspace(workspace);
  }, [isHydrated, workspace]);

  // ── projects ───────────────────────────────────────────────────────────────

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        // The active project's name comes from `tree`, which runs ahead of its
        // stored copy — the agent can rename a project mid-conversation.
        name: project.id === activeProjectId ? tree.projectName : project.tree.projectName,
      })),
    [projects, activeProjectId, tree.projectName]
  );

  const handleSwitchProject = useCallback(
    (nextProjectId: string) => {
      if (nextProjectId === activeProjectId) return;
      const next = projects.find((project) => project.id === nextProjectId);
      if (!next) return;

      // Write the outgoing project's live state back before leaving it. Not
      // doing this is exactly what made the original ProjectSwitcher destroy
      // the previous project's plan and chat history.
      setProjects((prev) =>
        prev.map((project) =>
          project.id === activeProjectId
            ? { id: project.id, tree, selectedNodeId, sessionsByWorkstreamId }
            : project
        )
      );

      const opened = openProject(next);
      setActiveProjectId(nextProjectId);
      setTree(opened.tree);
      setSessionsByWorkstreamId(opened.sessions);
      setSelectedNodeId(opened.selectedNodeId);
      setActiveThreadId(opened.activeThreadId);
      setActiveSessionId(opened.activeSessionId);

      // Chat-pane state belongs to the project we just left.
      setError(undefined);
      setRetryText(undefined);
      setSuggestions([]);
      setIsNearBottom(true);

      const foundations = findByTemplateKey(opened.tree.roots, TEMPLATE_KEYS.foundations);
      if (foundations) expansion.expand(foundations.id);
      revealIn(opened.tree, opened.selectedNodeId, expansion);
    },
    [activeProjectId, projects, tree, selectedNodeId, sessionsByWorkstreamId, expansion]
  );

  // ── selection ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setError(undefined);
      setRetryText(undefined);
      setIsNearBottom(true);

      const workstream = nearestSelfOrAncestorOfKind(tree.roots, nodeId, "workstream");
      // A folder has no workstream ancestor — keep the conversation we're in.
      if (workstream && workstream.id !== activeThreadId) {
        setActiveThreadId(workstream.id);
        setActiveSessionId(latestSessionId(sessionsByWorkstreamId[workstream.id]));
      }

      const node = findNode(tree.roots, nodeId);
      if (node && node.children.length > 0) expansion.toggle(nodeId);
    },
    [tree, expansion, activeThreadId, sessionsByWorkstreamId]
  );

  const handleOpenSession = useCallback((workstreamId: string, sessionId: string) => {
    setActiveThreadId(workstreamId);
    setActiveSessionId(sessionId);
  }, []);

  const handleNewChat = useCallback(() => {
    const workstreamId =
      activeThreadId ??
      (selectedNodeId
        ? nearestSelfOrAncestorOfKind(tree.roots, selectedNodeId, "workstream")?.id
        : undefined) ??
      firstWorkstreamId(tree);
    if (!workstreamId) return;

    const workstream = findNode(tree.roots, workstreamId);
    const session = createGreetingSession(
      workstreamId,
      workstream && workstream.kind === "workstream" ? workstream.objective : undefined
    );

    setSessionsByWorkstreamId((prev) => ({
      ...prev,
      [workstreamId]: [...(prev[workstreamId] ?? []), session],
    }));
    setActiveThreadId(workstreamId);
    setActiveSessionId(session.id);
  }, [activeThreadId, selectedNodeId, tree]);

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

  // ── sessions ───────────────────────────────────────────────────────────────

  const updateSessionMessages = useCallback(
    (
      workstreamId: string,
      sessionId: string,
      updater: (messages: ThreadMessage[]) => ThreadMessage[]
    ) => {
      setSessionsByWorkstreamId((prev) => {
        const list = prev[workstreamId] ?? [];
        return {
          ...prev,
          [workstreamId]: list.map((session) =>
            session.id === sessionId
              ? { ...session, messages: updater(session.messages), updatedAt: Date.now() }
              : session
          ),
        };
      });
    },
    []
  );

  const tagSession = useCallback((workstreamId: string, sessionId: string, nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    setSessionsByWorkstreamId((prev) => {
      const list = prev[workstreamId] ?? [];
      return {
        ...prev,
        [workstreamId]: list.map((session) =>
          session.id === sessionId
            ? { ...session, taggedNodeIds: [...new Set([...session.taggedNodeIds, ...nodeIds])] }
            : session
        ),
      };
    });
  }, []);

  // ── proposals ──────────────────────────────────────────────────────────────
  // Substance the agent proposes — resolved decisions, notes, new actions — sits
  // on the message that proposed it until the user accepts or rejects it. Only
  // acceptance writes to the tree and tags the session; see APPROACH.md §4.

  const setProposalStatus = useCallback(
    (
      workstreamId: string,
      sessionId: string,
      messageId: string,
      proposalId: string,
      status: ProposalRecord["status"]
    ) => {
      updateSessionMessages(workstreamId, sessionId, (msgs) =>
        msgs.map((m) =>
          m.id === messageId
            ? {
                ...m,
                proposals: m.proposals?.map((p) => (p.id === proposalId ? { ...p, status } : p)),
              }
            : m
        )
      );
    },
    [updateSessionMessages]
  );

  const handleProposalAccept = useCallback(
    (workstreamId: string, sessionId: string, messageId: string, proposal: ProposalRecord) => {
      setTree((prev) => {
        const roots = applyProposal(prev.roots, proposal);
        return roots === prev.roots ? prev : { ...prev, roots };
      });
      setProposalStatus(workstreamId, sessionId, messageId, proposal.id, "accepted");
      tagSession(workstreamId, sessionId, [proposalTargetId(proposal)]);
    },
    [setProposalStatus, tagSession]
  );

  const handleProposalReject = useCallback(
    (workstreamId: string, sessionId: string, messageId: string, proposalId: string) => {
      setProposalStatus(workstreamId, sessionId, messageId, proposalId, "rejected");
    },
    [setProposalStatus]
  );

  // ── chat ───────────────────────────────────────────────────────────────────

  const updateAssistantMessage = useCallback(
    (
      workstreamId: string,
      sessionId: string,
      assistantMessageId: string,
      updater: (message: ThreadMessage) => ThreadMessage
    ) => {
      updateSessionMessages(workstreamId, sessionId, (msgs) =>
        msgs.map((message) => (message.id === assistantMessageId ? updater(message) : message))
      );
    },
    [updateSessionMessages]
  );

  const finalizeAssistantMessage = useCallback(
    (workstreamId: string, sessionId: string, assistantMessageId: string, state: MessageState) => {
      updateAssistantMessage(workstreamId, sessionId, assistantMessageId, (message) => ({
        ...message,
        state,
      }));
    },
    [updateAssistantMessage]
  );

  const sendMessage = useCallback(
    async (overrideText?: string, options?: { silent?: boolean }) => {
      const text = (overrideText ?? inputValue).trim();
      if (!text || isSendingRef.current) return;
      const workstreamId = activeThreadId;
      const sessionId = activeSessionId;
      if (!workstreamId || !sessionId) return;

      const silent = options?.silent ?? false;
      const priorMessages = (activeSession?.messages ?? [])
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
      updateSessionMessages(workstreamId, sessionId, (msgs) =>
        silent ? [...msgs, assistantMessage] : [...msgs, userMessage, assistantMessage]
      );

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
            tree,
            activeNodeId: selectedNodeId ?? workstreamId,
            threadMessages: priorMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { reply?: string; ok?: boolean };
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
          markErrorWithRetry(data.reply ?? "Something went wrong. Try again.");
          return;
        }

        if (!res.body) {
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
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
              updateAssistantMessage(workstreamId, sessionId, assistantMessage.id, (message) => ({
                ...message,
                text: message.text + event.content,
                state: "streaming",
              }));
              continue;
            }

            if (event.type === "structure") {
              const roots = applyStructurePatch(tree.roots, event.content);
              const projectName = event.content.setProjectName?.trim() || tree.projectName;
              if (roots !== tree.roots || projectName !== tree.projectName) {
                const nextTree: ProjectTree = { ...tree, roots, projectName };
                setTree(nextTree);
                // New workstreams need a seeded greeting the moment they exist,
                // same as ones the template ships with — otherwise clicking into
                // one shows a blank session instead of its label/objective.
                setSessionsByWorkstreamId((prev) => ensureSessions(prev, nextTree));
              }
              tagSession(workstreamId, sessionId, structurePatchTargetIds(event.content));
              continue;
            }

            if (event.type === "proposals") {
              const records: ProposalRecord[] = event.content.map((proposal) => ({
                ...proposal,
                status: "pending",
              }));
              updateAssistantMessage(workstreamId, sessionId, assistantMessage.id, (m) => ({
                ...m,
                proposals: [...(m.proposals ?? []), ...records],
              }));
              continue;
            }

            if (event.type === "suggestions") {
              setSuggestions(event.content);
              continue;
            }

            if (event.type === "error") {
              finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
              markErrorWithRetry(event.message || "The stream ended with an error.");
              doneEventReceived = true;
              break;
            }

            if (event.type === "done") {
              finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "complete");
              doneEventReceived = true;
              break;
            }
          }

          if (doneEventReceived) break;
        }

        if (streamTimeoutId) clearTimeout(streamTimeoutId);

        if (!doneEventReceived) {
          finalizeAssistantMessage(
            workstreamId,
            sessionId,
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
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "cancelled");
        } else if (isAbortError && interrupted) {
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
          markErrorWithRetry("Connection lost. Partial response saved.");
        } else if (isAbortError && timedOut) {
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
          markErrorWithRetry("Request timed out. Partial response saved.");
        } else {
          finalizeAssistantMessage(workstreamId, sessionId, assistantMessage.id, "error");
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
      activeSession,
      activeSessionId,
      activeThreadId,
      finalizeAssistantMessage,
      inputValue,
      selectedNodeId,
      tagSession,
      tree,
      updateAssistantMessage,
      updateSessionMessages,
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
  }, [activeSessionId, isNearBottom, messages, scrollToBottom]);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-seymour-canvas">
      <Nav
        projects={projectOptions}
        activeProjectId={activeProjectId}
        onSwitchProject={handleSwitchProject}
        roots={tree.roots}
        selectedNodeId={selectedNodeId}
        activeThreadId={activeThreadId}
        expansion={expansion}
        onSelect={handleSelect}
        onToggleAction={handleToggleAction}
      />
      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-seymour-canvas" role="main">
        <section className="flex flex-1 flex-col items-center overflow-hidden" aria-label="Chat">
          <MessageList
            messages={messages}
            tree={tree}
            isStreaming={isStreaming}
            onStopGenerating={handleStopGenerating}
            onScroll={handleMessagesScroll}
            onProposalAccept={(messageId, proposal) =>
              activeThreadId &&
              activeSessionId &&
              handleProposalAccept(activeThreadId, activeSessionId, messageId, proposal)
            }
            onProposalReject={(messageId, proposalId) =>
              activeThreadId &&
              activeSessionId &&
              handleProposalReject(activeThreadId, activeSessionId, messageId, proposalId)
            }
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
            onNewChat={handleNewChat}
            disabled={isSending}
          />
        </div>
      </main>
      <aside
        className="sticky top-0 h-screen w-[400px] min-w-[400px] max-w-[400px] overflow-hidden border-l border-seymour-border bg-seymour-bg"
        aria-label="Detail panel"
      >
        <ResizableSplit
          topLabel="Doc"
          bottomLabel="History"
          top={<DetailPanel node={selectedNode} />}
          bottom={
            <ChatHistoryPanel
              sessions={nodeHistory}
              activeSessionId={activeSessionId}
              onOpenSession={(sessionId) => {
                if (historyWorkstreamId) handleOpenSession(historyWorkstreamId, sessionId);
              }}
            />
          }
        />
      </aside>
    </div>
  );
}
