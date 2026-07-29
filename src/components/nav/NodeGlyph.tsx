"use client";

/**
 * The 16px icon slot on a tree row.
 *
 * Folders and workstreams show what they are. Decisions and actions show their
 * state instead — those two kinds ARE their status, which is the whole point of
 * putting them in the tree.
 */

import {
  CheckCircle2,
  CheckSquare,
  CircleDashed,
  Diamond,
  FileText,
  Folder,
  Square,
} from "lucide-react";
import type { ProjectNode } from "@/types/project";

type NodeGlyphProps = {
  node: ProjectNode;
  /** Actions toggle done straight from the tree — the cheapest useful interaction here. */
  onToggleAction?: (id: string, done: boolean) => void;
};

export function NodeGlyph({ node, onToggleAction }: NodeGlyphProps) {
  if (node.kind === "folder") {
    return <Folder className="size-4 shrink-0 text-seymour-text/60" aria-hidden />;
  }

  if (node.kind === "workstream") {
    return <FileText className="size-4 shrink-0 text-seymour-text/60" aria-hidden />;
  }

  if (node.kind === "decision") {
    if (node.status === "resolved") {
      return (
        <CheckCircle2
          className="size-4 shrink-0 text-seymour-accent"
          aria-label="Resolved decision"
        />
      );
    }
    if (node.status === "deferred") {
      return (
        <CircleDashed
          className="size-4 shrink-0 text-seymour-text/40"
          aria-label="Deferred decision"
        />
      );
    }
    return <Diamond className="size-4 shrink-0 text-seymour-text/60" aria-label="Open decision" />;
  }

  const Icon = node.done ? CheckSquare : Square;

  if (!onToggleAction) {
    return (
      <Icon
        className={`size-4 shrink-0 ${node.done ? "text-seymour-accent" : "text-seymour-text/60"}`}
        aria-label={node.done ? "Completed action" : "Open action"}
      />
    );
  }

  return (
    <button
      type="button"
      // Stop the click from also selecting the row.
      onClick={(event) => {
        event.stopPropagation();
        onToggleAction(node.id, !node.done);
      }}
      className="shrink-0 rounded transition-colors hover:text-seymour-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60"
      aria-label={node.done ? `Mark "${node.label}" as not done` : `Mark "${node.label}" as done`}
      aria-pressed={node.done}
    >
      <Icon
        className={`size-4 ${node.done ? "text-seymour-accent" : "text-seymour-text/60"}`}
        aria-hidden
      />
    </button>
  );
}
