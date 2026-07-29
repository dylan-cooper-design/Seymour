/**
 * Pure tree helpers for the project forest. No React, no side effects.
 *
 * Three rules everything downstream depends on:
 *
 * 1. Operate on a forest (ProjectNode[]), return a new forest. Never mutate.
 * 2. A "path" is an array of ids, root -> node, inclusive. Not indices — those
 *    go stale after any insert — and not labels, which aren't unique.
 * 3. Every mutator returns the IDENTICAL input array when nothing matched.
 *    That lets React skip re-renders and makes "did anything change?" testable
 *    with a `===` check.
 */

import type { NodeKind, ProjectNode } from "@/types/project";

export type Forest = ProjectNode[];
/** Ids from a root down to the node, inclusive. */
export type NodePath = string[];
export type DropPosition = "before" | "after" | "inside";

// ─── nesting rules ────────────────────────────────────────────────────────────

/**
 * What each kind may contain. `workstream -> action` is deliberate: an action
 * doesn't have to hang off a decision, since standalone tasks are legitimate.
 */
export const CONTAINS: Record<NodeKind, readonly NodeKind[]> = {
  folder: ["folder", "workstream"],
  workstream: ["decision", "action"],
  decision: ["action"],
  action: [],
} as const;

/** What may sit at the top level of the tree. */
export const ROOT_ACCEPTS: readonly NodeKind[] = ["folder", "workstream"] as const;

/** `null` parent means the root of the forest. */
export function canContain(parentKind: NodeKind | null, childKind: NodeKind): boolean {
  if (parentKind === null) return ROOT_ACCEPTS.includes(childKind);
  return CONTAINS[parentKind].includes(childKind);
}

// ─── the single recursive primitive ───────────────────────────────────────────

/**
 * Rebuild the forest, applying `fn` to every node. Returning `null` drops the
 * node (and its subtree). Returns the input array unchanged if nothing changed.
 *
 * Every mutator below is built on this so the identity-on-no-op behaviour is
 * implemented once, correctly, instead of three times with three sets of bugs.
 */
function transformForest(nodes: Forest, fn: (node: ProjectNode) => ProjectNode | null): Forest {
  let changed = false;
  const out: ProjectNode[] = [];

  for (const node of nodes) {
    const replaced = fn(node);
    if (replaced === null) {
      changed = true;
      continue;
    }

    const nextChildren = transformForest(replaced.children, fn);
    const nextNode =
      nextChildren === replaced.children
        ? replaced
        : ({ ...replaced, children: nextChildren } as ProjectNode);

    if (nextNode !== node) changed = true;
    out.push(nextNode);
  }

  return changed ? out : nodes;
}

// ─── read ─────────────────────────────────────────────────────────────────────

export function findNode(roots: Forest, id: string): ProjectNode | undefined {
  for (const node of roots) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function findPath(roots: Forest, id: string): NodePath | undefined {
  for (const node of roots) {
    if (node.id === id) return [node.id];
    const childPath = findPath(node.children, id);
    if (childPath) return [node.id, ...childPath];
  }
  return undefined;
}

/** `undefined` when the node is at the root, or absent entirely. */
export function findParent(roots: Forest, id: string): ProjectNode | undefined {
  for (const node of roots) {
    if (node.children.some((child) => child.id === id)) return node;
    const found = findParent(node.children, id);
    if (found) return found;
  }
  return undefined;
}

/** Outermost -> innermost, excluding the node itself. */
export function getAncestors(roots: Forest, id: string): ProjectNode[] {
  const path = findPath(roots, id);
  if (!path) return [];
  return path
    .slice(0, -1)
    .map((ancestorId) => findNode(roots, ancestorId))
    .filter((node): node is ProjectNode => node !== undefined);
}

/**
 * Template nodes keep a stable `templateKey` so the agent can name them without
 * echoing a UUID, and so references survive the user renaming the node.
 */
export function findByTemplateKey(roots: Forest, key: string): ProjectNode | undefined {
  for (const node of roots) {
    if (node.templateKey === key) return node;
    const found = findByTemplateKey(node.children, key);
    if (found) return found;
  }
  return undefined;
}

/**
 * Walk up from `id` (inclusive) to the first node of `kind`.
 *
 * This is how the active chat thread is derived: only workstreams own threads,
 * so clicking a decision keeps you in its parent workstream's conversation.
 */
export function nearestSelfOrAncestorOfKind<K extends NodeKind>(
  roots: Forest,
  id: string,
  kind: K
): Extract<ProjectNode, { kind: K }> | undefined {
  const path = findPath(roots, id);
  if (!path) return undefined;

  for (let i = path.length - 1; i >= 0; i -= 1) {
    const node = findNode(roots, path[i]);
    if (node?.kind === kind) return node as Extract<ProjectNode, { kind: K }>;
  }
  return undefined;
}

export function walk(
  roots: Forest,
  visit: (node: ProjectNode, path: NodePath, depth: number) => void
): void {
  const step = (nodes: Forest, parentPath: NodePath, depth: number) => {
    for (const node of nodes) {
      const path = [...parentPath, node.id];
      visit(node, path, depth);
      step(node.children, path, depth + 1);
    }
  };
  step(roots, [], 0);
}

export type FlatNode = {
  node: ProjectNode;
  path: NodePath;
  depth: number;
  parentId: string | null;
};

/** Depth-first flatten. Used for drag hit-testing and rendering. */
export function flatten(roots: Forest): FlatNode[] {
  const out: FlatNode[] = [];
  const step = (nodes: Forest, parentPath: NodePath, parentId: string | null, depth: number) => {
    for (const node of nodes) {
      const path = [...parentPath, node.id];
      out.push({ node, path, depth, parentId });
      step(node.children, path, node.id, depth + 1);
    }
  };
  step(roots, [], null, 0);
  return out;
}

export function collectIds(roots: Forest): Set<string> {
  const ids = new Set<string>();
  walk(roots, (node) => ids.add(node.id));
  return ids;
}

export function isDescendantOf(roots: Forest, candidateId: string, ancestorId: string): boolean {
  const ancestor = findNode(roots, ancestorId);
  if (!ancestor) return false;
  return findNode(ancestor.children, candidateId) !== undefined;
}

// ─── write ────────────────────────────────────────────────────────────────────

export function updateNode(
  roots: Forest,
  id: string,
  updater: (node: ProjectNode) => ProjectNode
): Forest {
  return transformForest(roots, (node) => (node.id === id ? updater(node) : node));
}

export function mapNodes(roots: Forest, fn: (node: ProjectNode) => ProjectNode): Forest {
  return transformForest(roots, fn);
}

export function removeNode(roots: Forest, id: string): Forest {
  return transformForest(roots, (node) => (node.id === id ? null : node));
}

/** `parentId: null` inserts at the root. Out-of-range indices clamp. */
export function insertNodes(
  roots: Forest,
  parentId: string | null,
  nodes: Forest,
  index?: number
): Forest {
  if (nodes.length === 0) return roots;

  const splice = (siblings: Forest): Forest => {
    const at = clampIndex(index, siblings.length);
    return [...siblings.slice(0, at), ...nodes, ...siblings.slice(at)];
  };

  if (parentId === null) return splice(roots);
  if (!findNode(roots, parentId)) return roots;

  return transformForest(roots, (node) =>
    node.id === parentId ? ({ ...node, children: splice(node.children) } as ProjectNode) : node
  );
}

function clampIndex(index: number | undefined, length: number): number {
  if (index === undefined || Number.isNaN(index)) return length;
  return Math.max(0, Math.min(Math.trunc(index), length));
}

/**
 * Move a node to a new parent and index.
 *
 * The index is deliberately recomputed after removal when the source and
 * destination parents match — without that, dragging a row *downward* within
 * its own list lands one slot short. That off-by-one is the classic
 * reorder bug, so it has dedicated tests.
 */
export function moveNode(
  roots: Forest,
  id: string,
  target: { parentId: string | null; index?: number }
): Forest {
  const node = findNode(roots, id);
  if (!node) return roots;

  const { parentId } = target;

  // Moving a node inside itself (or its own subtree) would orphan the subtree.
  if (parentId === id || (parentId !== null && isDescendantOf(roots, parentId, id))) {
    return roots;
  }

  const parentNode = parentId === null ? null : findNode(roots, parentId);
  if (parentId !== null && !parentNode) return roots;
  if (!canContain(parentNode?.kind ?? null, node.kind)) return roots;

  const currentParent = findParent(roots, id);
  const currentParentId = currentParent?.id ?? null;

  // Locked nodes (the template's top-level folders) may be reordered but not reparented.
  if (node.locked && currentParentId !== parentId) return roots;

  const destinationSiblings = parentNode ? parentNode.children : roots;
  let index = clampIndex(target.index, destinationSiblings.length);

  if (currentParentId === parentId) {
    const sourceSiblings = currentParent ? currentParent.children : roots;
    const currentIndex = sourceSiblings.findIndex((sibling) => sibling.id === id);
    if (currentIndex !== -1 && currentIndex < index) index -= 1;
    if (currentIndex === index) return roots;
  }

  const withoutNode = removeNode(roots, id);
  return insertNodes(withoutNode, parentId, [node], index);
}

/** Drop `id` before/after/inside `referenceId`. Delegates the index math to moveNode. */
export function moveRelativeTo(
  roots: Forest,
  id: string,
  referenceId: string,
  position: DropPosition
): Forest {
  if (id === referenceId) return roots;
  const reference = findNode(roots, referenceId);
  if (!reference) return roots;

  if (position === "inside") {
    return moveNode(roots, id, { parentId: referenceId, index: reference.children.length });
  }

  const referenceParent = findParent(roots, referenceId);
  const siblings = referenceParent ? referenceParent.children : roots;
  const referenceIndex = siblings.findIndex((sibling) => sibling.id === referenceId);
  if (referenceIndex === -1) return roots;

  return moveNode(roots, id, {
    parentId: referenceParent?.id ?? null,
    index: position === "after" ? referenceIndex + 1 : referenceIndex,
  });
}

/**
 * Whether a drag would be accepted. Mirrors every guard in `moveNode` so the UI
 * can refuse the drop before the user commits to it.
 */
export function canDrop(
  roots: Forest,
  dragId: string,
  referenceId: string,
  position: DropPosition
): boolean {
  if (dragId === referenceId) return false;

  const dragged = findNode(roots, dragId);
  const reference = findNode(roots, referenceId);
  if (!dragged || !reference) return false;

  // Can't drop a node into its own subtree.
  if (isDescendantOf(roots, referenceId, dragId)) return false;

  const targetParent = position === "inside" ? reference : findParent(roots, referenceId);
  const targetParentId = targetParent?.id ?? null;

  if (!canContain(targetParent?.kind ?? null, dragged.kind)) return false;

  if (dragged.locked) {
    const currentParentId = findParent(roots, dragId)?.id ?? null;
    if (currentParentId !== targetParentId) return false;
  }

  return true;
}
