"use client";

/**
 * One row in the project tree, and — recursively — everything beneath it.
 *
 * This single component replaces the old MilestoneGroup/MilestoneItem pair,
 * which hardcoded a depth of exactly two.
 */

import { ChevronRight } from "lucide-react";
import type { ProjectNode } from "@/types/project";
import type { TreeExpansion } from "@/hooks/useTreeExpansion";
import { toMlaTitleCase } from "@/lib/format";
import { NodeGlyph } from "./NodeGlyph";

/**
 * Horizontal indent per level.
 *
 * A deliberate departure from the 8px grid, which governs vertical rhythm and
 * padding rather than tree indentation: at 8px the levels are hard to tell
 * apart, and at 16px a depth-5 row eats a third of the sidebar. 12px is a clean
 * multiple of 4 and leaves the label room to breathe. Mirrored as the
 * `nav-indent` spacing token so the value is named in one place.
 */
const INDENT_PER_LEVEL_PX = 12;

export type NodeRowProps = {
  node: ProjectNode;
  depth: number;
  selectedNodeId: string | null;
  /** The workstream whose conversation is currently open. */
  activeThreadId: string | null;
  expansion: TreeExpansion;
  onSelect: (id: string) => void;
  onToggleAction?: (id: string, done: boolean) => void;
};

export function NodeRow({
  node,
  depth,
  selectedNodeId,
  activeThreadId,
  expansion,
  onSelect,
  onToggleAction,
}: NodeRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && expansion.isExpanded(node.id);
  const isSelected = node.id === selectedNodeId;
  // Show which conversation you're in when the selected row isn't the workstream
  // itself — e.g. after clicking a decision nested inside it.
  const ownsActiveThread = node.id === activeThreadId && !isSelected;
  const displayLabel = toMlaTitleCase(node.label);

  return (
    <li>
      <div
        className={`relative flex h-8 w-full items-center gap-2 px-2 transition-colors ${
          isSelected
            ? "bg-seymour-border text-seymour-accent"
            : "text-seymour-text hover:bg-seymour-surface"
        }`}
      >
        {ownsActiveThread && (
          <span
            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-seymour-accent/40"
            aria-hidden
          />
        )}

        <span aria-hidden className="shrink-0" style={{ width: depth * INDENT_PER_LEVEL_PX }} />

        {hasChildren ? (
          <button
            type="button"
            onClick={() => expansion.toggle(node.id)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${displayLabel}`}
            className="shrink-0 rounded text-seymour-text/50 transition-colors hover:text-seymour-text focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60"
          >
            <ChevronRight
              className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              aria-hidden
            />
          </button>
        ) : (
          <span aria-hidden className="size-4 shrink-0" />
        )}

        <NodeGlyph node={node} onToggleAction={onToggleAction} />

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-current={isSelected ? "page" : undefined}
          className="min-w-0 flex-1 truncate text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-seymour-accent/60"
        >
          <span
            className={node.kind === "action" && node.done ? "line-through opacity-60" : undefined}
          >
            {displayLabel}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul>
          {node.children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              activeThreadId={activeThreadId}
              expansion={expansion}
              onSelect={onSelect}
              onToggleAction={onToggleAction}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
