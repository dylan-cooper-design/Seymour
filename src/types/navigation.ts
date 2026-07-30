import type { ProposalRecord } from "@/types/tree-patch";

export type MessageRole = "user" | "assistant";

export type MessageState = "streaming" | "complete" | "error" | "cancelled";

export type ThreadMessage = {
  id: string;
  role: MessageRole;
  text: string;
  state?: MessageState;
  timestamp?: number;
  /** Substance proposals attached to this message — see APPROACH.md §4. */
  proposals?: ProposalRecord[];
};

/**
 * One bounded conversation. A workstream can have many sessions over time —
 * "new chat" starts another one rather than appending to a single continuous
 * thread. `taggedNodeIds` is populated only by writes (`applyStructurePatch` /
 * `applyProposal`); being merely discussed doesn't tag a node.
 */
export type ChatSession = {
  id: string;
  workstreamId: string;
  messages: ThreadMessage[];
  taggedNodeIds: string[];
  createdAt: number;
  updatedAt: number;
};

/**
 * Chat sessions keyed by the workstream that owns them. Only workstream nodes
 * own a session list, so this is 1:1 with the workstreams in the project tree.
 */
export type SessionsByWorkstreamId = Record<string, ChatSession[]>;
