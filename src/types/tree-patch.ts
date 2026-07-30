/**
 * The agent's write contract onto the project tree — see APPROACH.md §4.
 *
 * Two tiers, matching the write-authority split: structure is applied
 * immediately (creating/renaming/filing — low-stakes, easily undone).
 * Substance is proposed as a card the user must accept before it lands.
 */

import type { DecisionOption } from "@/types/project";

export type NewNodeSpec = {
  kind: "folder" | "workstream" | "decision";
  label: string;
  /** Workstream only. */
  objective?: string;
  children?: NewNodeSpec[];
};

export type StructurePatch = {
  /** parentId is a real node id from PROJECT_CONTEXT. `null` inserts at the tree root. */
  createUnder?: Array<{ parentId: string | null; nodes: NewNodeSpec[] }>;
  rename?: Array<{ id: string; label: string }>;
  /** Workstream only; applying to any other kind is a no-op. */
  setObjective?: Array<{ id: string; objective: string }>;
  setProjectName?: string;
};

export type Proposal =
  | { id: string; kind: "note"; nodeId: string; note: string }
  | {
      id: string;
      kind: "resolveDecision";
      nodeId: string;
      resolution: string;
      rationale?: string;
      options?: DecisionOption[];
    }
  | { id: string; kind: "action"; parentId: string; label: string };

export type ProposalStatus = "pending" | "accepted" | "rejected";

/** A proposal as it lives on a thread message, once the client has seen it. */
export type ProposalRecord = Proposal & { status: ProposalStatus };

export type AgentPatch = {
  structure?: StructurePatch;
  proposals?: Proposal[];
};
