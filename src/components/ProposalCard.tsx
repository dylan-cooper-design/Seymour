"use client";

/**
 * A substance proposal — a resolved decision, a note, or a new action — sitting
 * on an assistant message, waiting for the user to accept, edit, or reject it.
 * Nothing here writes to the tree; see page.tsx's onProposalAccept, which is
 * the only place `applyProposal` runs. See APPROACH.md §4.
 */

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { ProjectTree } from "@/types/project";
import type { ProposalRecord } from "@/types/tree-patch";
import { findNode } from "@/lib/tree/nodes";
import { Markdown } from "@/components/ui/Markdown";

type ProposalCardProps = {
  proposal: ProposalRecord;
  tree: ProjectTree;
  onAccept: (edited: ProposalRecord) => void;
  onReject: () => void;
};

function proposalTitle(proposal: ProposalCardProps["proposal"], tree: ProjectTree): string {
  if (proposal.kind === "note") {
    return findNode(tree.roots, proposal.nodeId)?.label ?? "Note";
  }
  if (proposal.kind === "resolveDecision") {
    return findNode(tree.roots, proposal.nodeId)?.label ?? "Decision";
  }
  return "New action";
}

/** The one field each proposal kind is really "about" — what Edit changes. */
function primaryText(proposal: ProposalCardProps["proposal"]): string {
  if (proposal.kind === "note") return proposal.note;
  if (proposal.kind === "resolveDecision") return proposal.resolution;
  return proposal.label;
}

function withPrimaryText(
  proposal: ProposalCardProps["proposal"],
  text: string
): ProposalCardProps["proposal"] {
  if (proposal.kind === "note") return { ...proposal, note: text };
  if (proposal.kind === "resolveDecision") return { ...proposal, resolution: text };
  return { ...proposal, label: text };
}

export function ProposalCard({ proposal, tree, onAccept, onReject }: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(primaryText(proposal));

  const title = proposalTitle(proposal, tree);
  const kindLabel =
    proposal.kind === "note"
      ? "Note"
      : proposal.kind === "resolveDecision"
        ? "Resolved decision"
        : "New action";

  if (proposal.status !== "pending") {
    return (
      <div className="flex w-full max-w-chat-content items-center gap-2 rounded-lg border border-seymour-border/50 bg-seymour-surface-2/50 px-4 py-2 text-label text-seymour-text/50">
        <span>
          {kindLabel} — {title}
        </span>
        <span className="ml-auto">{proposal.status === "accepted" ? "Accepted" : "Rejected"}</span>
      </div>
    );
  }

  const handleAccept = () => {
    onAccept(withPrimaryText(proposal, draft));
  };

  return (
    <div className="w-full max-w-chat-content overflow-hidden rounded-xl border border-seymour-accent/40 bg-seymour-surface-2">
      <div className="flex items-center justify-between gap-4 border-b border-seymour-border/50 px-4 py-3">
        <span className="text-body-sm font-medium text-seymour-text">
          {kindLabel} — {title}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-md border border-seymour-border bg-seymour-canvas px-3 py-2 text-body-sm text-seymour-text focus:outline-none focus:ring-2 focus:ring-seymour-accent/60"
          />
        ) : (
          <Markdown>{draft}</Markdown>
        )}

        {proposal.kind === "resolveDecision" && proposal.rationale && (
          <p className="text-body-sm text-seymour-text/70">
            <span className="text-seymour-text">Rationale: </span>
            {proposal.rationale}
          </p>
        )}

        {proposal.kind === "resolveDecision" && proposal.options && proposal.options.length > 0 && (
          <div className="flex flex-col gap-1 text-body-sm text-seymour-text/60">
            {proposal.options.map((option) => (
              <span key={option.label}>
                {option.recommended ? "★ " : ""}
                {option.label}
                {option.description ? ` — ${option.description}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-seymour-border/50 px-4 py-2">
        <button
          type="button"
          onClick={handleAccept}
          className="flex items-center gap-1.5 rounded-md bg-seymour-accent px-3 py-1.5 text-label font-medium text-seymour-canvas transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60"
        >
          <Check size={14} />
          Accept
        </button>
        <button
          type="button"
          onClick={() => setIsEditing((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-seymour-border-subtle px-3 py-1.5 text-label text-seymour-text/80 transition hover:text-seymour-text focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60"
        >
          <Pencil size={14} />
          {isEditing ? "Done editing" : "Edit"}
        </button>
        <button
          type="button"
          onClick={onReject}
          className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label text-seymour-text/50 transition hover:text-seymour-error-text focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60"
        >
          <X size={14} />
          Reject
        </button>
      </div>
    </div>
  );
}
