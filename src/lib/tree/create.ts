/**
 * Node constructors. Every node gets a fresh id and timestamps here so no
 * caller has to remember to set them.
 */

import type {
  ActionNode,
  DecisionNode,
  FolderNode,
  ProjectNode,
  WorkstreamNode,
} from "@/types/project";

export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Non-crypto fallback for environments without WebCrypto. Ids only need to be
  // unique within one user's tree, never unguessable.
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function base(label: string) {
  const now = new Date().toISOString();
  return { id: createId(), label: label.trim(), children: [], createdAt: now, updatedAt: now };
}

export function createFolder(label: string, init: Partial<FolderNode> = {}): FolderNode {
  return { ...base(label), kind: "folder", ...init };
}

export function createWorkstream(
  label: string,
  init: Partial<WorkstreamNode> = {}
): WorkstreamNode {
  return { ...base(label), kind: "workstream", ...init };
}

export function createDecision(label: string, init: Partial<DecisionNode> = {}): DecisionNode {
  return { ...base(label), kind: "decision", status: "open", ...init };
}

export function createAction(label: string, init: Partial<ActionNode> = {}): ActionNode {
  return { ...base(label), kind: "action", done: false, ...init };
}

/** Stamps `updatedAt`. Use for every edit so the timestamp can't drift out of sync. */
export function touch<T extends ProjectNode>(node: T): T {
  return { ...node, updatedAt: new Date().toISOString() };
}
