/**
 * Container status is DERIVED, never stored.
 *
 * The old MilestoneStatus enum conflated decisions and actions into one
 * three-value union, which is why no component ever rendered it correctly, and
 * a stored container status goes stale the instant the agent adds a decision
 * underneath it. Decisions store their own status; actions store a boolean;
 * folders and workstreams are computed from their descendants.
 */

import type { ProjectNode } from "@/types/project";
import { walk } from "./nodes";

export type DerivedStatus =
  /** No decisions or actions anywhere below. Nothing to do yet. */
  | "empty"
  /** At least one open decision or unfinished action below. */
  | "active"
  /** Has work below, and all of it is resolved, deferred, or done. */
  | "settled";

export function countOpenDecisions(node: ProjectNode): number {
  let count = 0;
  if (node.kind === "decision" && node.status === "open") count += 1;
  walk(node.children, (child) => {
    if (child.kind === "decision" && child.status === "open") count += 1;
  });
  return count;
}

export function countPendingActions(node: ProjectNode): number {
  let count = 0;
  if (node.kind === "action" && !node.done) count += 1;
  walk(node.children, (child) => {
    if (child.kind === "action" && !child.done) count += 1;
  });
  return count;
}

export function derivedStatus(node: ProjectNode): DerivedStatus {
  if (node.kind === "decision") {
    return node.status === "open" ? "active" : "settled";
  }
  if (node.kind === "action") {
    return node.done ? "settled" : "active";
  }

  let hasWork = false;
  walk(node.children, (child) => {
    if (child.kind === "decision" || child.kind === "action") hasWork = true;
  });
  if (!hasWork) return "empty";

  return countOpenDecisions(node) + countPendingActions(node) > 0 ? "active" : "settled";
}
