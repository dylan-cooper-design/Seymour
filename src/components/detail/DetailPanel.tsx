"use client";

/**
 * The middle column: everything known about the selected node.
 *
 * The old ItemDetail/DetailSection/SectionBlock trio is gone. It was the agent's
 * way of faking structure the node type now models properly — most acutely for
 * "NEXT ACTIONS", which are real action nodes in the tree. Two places to look
 * for the same fact is a guaranteed bug.
 */

import type { DecisionNode, ProjectNode, WorkstreamNode } from "@/types/project";
import { Markdown } from "@/components/ui/Markdown";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { toMlaTitleCase } from "@/lib/format";
import { countOpenDecisions, countPendingActions } from "@/lib/tree/status";
import { DetailHeader } from "./DetailHeader";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function Prose({ children }: { children: string }) {
  return <p className="text-body-sm leading-relaxed text-seymour-text">{children}</p>;
}

/**
 * A workstream's content is one freeform document (`note`), not a set of
 * labeled fields — structure comes from headings the note itself contains
 * (see Markdown's h1-h3 handling), not from this panel. Before there's a
 * note, `objective` stands in as a muted placeholder in the same spot,
 * never alongside the note as a separate labeled field.
 */
function WorkstreamBody({ node }: { node: WorkstreamNode }) {
  if (node.note) return <Markdown>{node.note}</Markdown>;
  if (node.objective) {
    return (
      <p className="text-body-sm italic leading-relaxed text-seymour-text/40">{node.objective}</p>
    );
  }
  return null;
}

function DecisionRecord({ node }: { node: DecisionNode }) {
  const statusLabel =
    node.status === "resolved" ? "Resolved" : node.status === "deferred" ? "Deferred" : "Open";

  return (
    <div className="flex flex-col gap-6">
      <Field label="Status">
        <Prose>{statusLabel}</Prose>
      </Field>

      {node.resolution && (
        <Field label="Decision">
          <Prose>{node.resolution}</Prose>
        </Field>
      )}

      {node.rationale && (
        <Field label="Rationale">
          <Prose>{node.rationale}</Prose>
        </Field>
      )}

      {node.options && node.options.length > 0 && (
        <Field label="Options considered">
          <div className="flex flex-col gap-4">
            {node.options.map((option) => (
              <div key={option.label} className="flex flex-col gap-1">
                <p className="text-body-sm font-semibold text-seymour-white">
                  {option.label}
                  {option.recommended && (
                    <span className="ml-2 text-label-sm text-seymour-accent">Recommended</span>
                  )}
                </p>
                {option.description && (
                  <p className="text-body-sm text-seymour-text/80">{option.description}</p>
                )}
                {option.pros && option.pros.length > 0 && (
                  <p className="text-body-sm text-seymour-text/70">
                    <span className="text-seymour-text">Pros: </span>
                    {option.pros.join("; ")}
                  </p>
                )}
                {option.cons && option.cons.length > 0 && (
                  <p className="text-body-sm text-seymour-text/70">
                    <span className="text-seymour-text">Cons: </span>
                    {option.cons.join("; ")}
                  </p>
                )}
                {option.assumes && option.assumes.length > 0 && (
                  <p className="text-body-sm text-seymour-text/70">
                    <span className="text-seymour-text">Assumes: </span>
                    {option.assumes.join("; ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}

function ContainerSummary({ node }: { node: ProjectNode }) {
  const openDecisions = countOpenDecisions(node);
  const pendingActions = countPendingActions(node);
  if (openDecisions === 0 && pendingActions === 0) return null;

  const parts: string[] = [];
  if (openDecisions > 0) {
    parts.push(`${openDecisions} open decision${openDecisions === 1 ? "" : "s"}`);
  }
  if (pendingActions > 0) {
    parts.push(`${pendingActions} pending action${pendingActions === 1 ? "" : "s"}`);
  }

  return (
    <Field label="Outstanding">
      <Prose>{parts.join(" · ")}</Prose>
    </Field>
  );
}

export function DetailPanel({ node }: { node?: ProjectNode }) {
  if (!node) {
    return (
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
        <p className="text-body-sm text-seymour-text/40">Select something in the tree.</p>
      </div>
    );
  }

  // Folders only navigate — they never carry readable content of their own.
  // A folder's guidance lives in a README child instead (see the product
  // design template), so a note on a folder node is never rendered here.
  // Workstreams render their note/objective through WorkstreamBody below,
  // so they're excluded here too rather than shown a second time.
  const showGenericNote =
    Boolean(node.note) && node.kind !== "folder" && node.kind !== "workstream";

  const workstreamHasContent = node.kind === "workstream" && Boolean(node.note || node.objective);

  const hasBody = showGenericNote || workstreamHasContent || node.kind === "decision";

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <DetailHeader title={toMlaTitleCase(node.label)} />

      {node.kind === "workstream" && <WorkstreamBody node={node} />}

      {node.kind === "decision" && <DecisionRecord node={node} />}

      {(node.kind === "folder" || node.kind === "workstream") && <ContainerSummary node={node} />}

      {showGenericNote && node.note && (
        <Field label="Notes">
          <Markdown>{node.note}</Markdown>
        </Field>
      )}

      {!hasBody && (
        <p className="text-body-sm text-seymour-text/40">
          Details will appear here as decisions are made in the chat.
        </p>
      )}
    </div>
  );
}
