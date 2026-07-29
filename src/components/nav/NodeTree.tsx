"use client";

import type { Forest } from "@/lib/tree/nodes";
import type { TreeExpansion } from "@/hooks/useTreeExpansion";
import { NodeRow } from "./NodeRow";

type NodeTreeProps = {
  roots: Forest;
  selectedNodeId: string | null;
  activeThreadId: string | null;
  expansion: TreeExpansion;
  onSelect: (id: string) => void;
  onToggleAction?: (id: string, done: boolean) => void;
};

/**
 * Plain nested lists rather than `role="tree"`. A tree role without roving
 * tabindex and arrow-key navigation promises screen readers a navigation model
 * that isn't implemented — worse than an honest list. Upgrade when keyboard
 * navigation lands.
 */
export function NodeTree({
  roots,
  selectedNodeId,
  activeThreadId,
  expansion,
  onSelect,
  onToggleAction,
}: NodeTreeProps) {
  return (
    <ul className="flex flex-col py-2">
      {roots.map((node) => (
        <NodeRow
          key={node.id}
          node={node}
          depth={0}
          selectedNodeId={selectedNodeId}
          activeThreadId={activeThreadId}
          expansion={expansion}
          onSelect={onSelect}
          onToggleAction={onToggleAction}
        />
      ))}
    </ul>
  );
}
