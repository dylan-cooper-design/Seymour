/**
 * The project tree — Seymour's core data model.
 *
 * One recursive node type, four kinds. Folders nest arbitrarily; workstreams
 * hold decisions; decisions unblock actions. What may nest inside what is
 * enforced at runtime by CONTAINS in `@/lib/tree/nodes`, not by the type system,
 * because decisions and actions must share the tree's selection, expansion,
 * indentation, and drag machinery with folders. Modelling them as non-node
 * fields would require a second code path for every one of those systems.
 */

/** Bump when the persisted shape changes incompatibly. Stale blobs reset to the template. */
export const SCHEMA_VERSION = 3;

export type NodeKind = "folder" | "workstream" | "decision" | "action";

type NodeBase<K extends NodeKind> = {
  id: string;
  kind: K;
  label: string;
  children: ProjectNode[];
  /** Markdown. The node's document — replaces the old ItemDetail/DetailSection pair. */
  note?: string;
  /** Stable handle for nodes the template created. Survives rename, unlike the label. */
  templateKey?: string;
  /** Template top-level folders: renameable and reorderable, but not deletable
   *  and not draggable into another node. Keeps the prompt's structural
   *  guarantees ("Foundations exists") actually true. */
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FolderNode = NodeBase<"folder">;

export type WorkstreamNode = NodeBase<"workstream"> & {
  /** One sentence: what settling this workstream accomplishes. */
  objective?: string;
};

export type DecisionStatus = "open" | "resolved" | "deferred";

export type DecisionOption = {
  label: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  assumes?: string[];
  recommended?: boolean;
};

export type DecisionNode = NodeBase<"decision"> & {
  status: DecisionStatus;
  /** The option that was picked. Present iff status === "resolved". */
  resolution?: string;
  /** Why. One or two sentences, written at resolution time. */
  rationale?: string;
  /** The table the agent presented, kept so the decision can be revisited. */
  options?: DecisionOption[];
  resolvedAt?: string;
};

export type ActionNode = NodeBase<"action"> & {
  /** Binary by design. An enum here would invite the agent to invent
   *  intermediate states that nothing renders. */
  done: boolean;
  doneAt?: string;
};

export type ProjectNode = FolderNode | WorkstreamNode | DecisionNode | ActionNode;

/**
 * A forest, not a synthetic root. A root node would render as a row in the
 * sidebar and force a special case into every helper.
 */
export type ProjectTree = {
  schemaVersion: number;
  projectName: string;
  roots: ProjectNode[];
};
