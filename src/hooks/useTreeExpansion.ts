"use client";

/**
 * Which tree rows are expanded.
 *
 * Deliberately NOT stored on the node. The old model persisted `isExpanded` into
 * the nav data and then fought it with two force-open effects — and under the
 * new architecture that would mean a database write on every chevron click.
 * Expansion is per-device UI state, so it lives in localStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collectIds, getAncestors, type Forest } from "@/lib/tree/nodes";

const STORAGE_KEY = "seymour:expanded-node-ids";

function readStored(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : null;
  } catch {
    return null;
  }
}

function writeStored(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // A full or disabled localStorage shouldn't break the tree.
  }
}

export type TreeExpansion = {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  /** Reveal a node by opening everything above it. */
  revealNode: (id: string) => void;
};

export function useTreeExpansion(
  roots: Forest,
  options: { defaultExpandedIds?: string[] } = {}
): TreeExpansion {
  const { defaultExpandedIds } = options;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const hasHydrated = useRef(false);

  // Read localStorage in an effect, not in the initial state, so the server and
  // the first client render agree.
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const stored = readStored();
    setExpandedIds(new Set(stored ?? defaultExpandedIds ?? []));
    // defaultExpandedIds is only consulted on first mount, by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop ids for nodes that no longer exist so the set can't grow without bound.
  useEffect(() => {
    if (!hasHydrated.current) return;
    setExpandedIds((prev) => {
      const live = collectIds(roots);
      const next = new Set([...prev].filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [roots]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    writeStored(expandedIds);
  }, [expandedIds]);

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const collapse = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const rootsRef = useRef(roots);
  rootsRef.current = roots;

  /** Replaces the old force-open effects with one explicit rule. */
  const revealNode = useCallback((id: string) => {
    const ancestorIds = getAncestors(rootsRef.current, id).map((n) => n.id);
    if (ancestorIds.length === 0) return;
    setExpandedIds((prev) => {
      const missing = ancestorIds.filter((ancestorId) => !prev.has(ancestorId));
      if (missing.length === 0) return prev;
      const next = new Set(prev);
      for (const ancestorId of missing) next.add(ancestorId);
      return next;
    });
  }, []);

  return useMemo(
    () => ({ isExpanded, toggle, expand, collapse, revealNode }),
    [isExpanded, toggle, expand, collapse, revealNode]
  );
}
