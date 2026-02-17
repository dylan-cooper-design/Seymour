"use client";

import type { Decision, NavItem } from "@/types/navigation";

type MilestoneDetailPanelProps = {
  milestone: NavItem;
  onToggleDecision: (milestoneId: string, decisionId: string) => void;
};

function DecisionRow({
  decision,
  onToggle,
}: {
  decision: Decision;
  onToggle: () => void;
}) {
  const isDone = decision.status === "done";

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-[#302f2d] bg-[#232426] p-3"
      role="listitem"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDone ? "Mark as todo" : "Mark as done"}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-[#3f3e3a] transition hover:border-[#d4b774] focus:outline-none focus:ring-2 focus:ring-[#d4b774]/60"
      >
        {isDone ? (
          <span className="size-2.5 rounded-sm bg-[#d4b774]" aria-hidden />
        ) : (
          <span className="size-2.5 rounded-sm border border-[#3f3e3a]" aria-hidden />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${isDone ? "text-[#e3e2e1]/50 line-through" : "text-[#e3e2e1]"}`}
        >
          {decision.title}
        </p>
        <p className="mt-0.5 text-xs text-[#e3e2e1]/70">{decision.actionItem}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
          isDone
            ? "bg-[#d4b774]/20 text-[#d4b774]"
            : "bg-[#302f2d] text-[#e3e2e1]/70"
        }`}
      >
        {decision.status}
      </span>
    </div>
  );
}

export function MilestoneDetailPanel({
  milestone,
  onToggleDecision,
}: MilestoneDetailPanelProps) {
  const decisions = milestone.decisions ?? [];

  if (decisions.length === 0) {
    return (
      <aside
        className="shrink-0 border-b border-[#302f2d] bg-[#1c1d1f] px-6 py-4"
        aria-label="Milestone details"
      >
        <h2 className="text-sm font-medium text-[#ffffff]">{milestone.label}</h2>
        {milestone.objective && (
          <p className="mt-1 text-xs text-[#e3e2e1]/70">{milestone.objective}</p>
        )}
        <p className="mt-4 text-sm text-[#e3e2e1]/50">
          No decisions defined for this milestone yet.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="shrink-0 overflow-y-auto border-b border-[#302f2d] bg-[#1c1d1f] px-6 py-4"
      aria-label="Milestone details"
    >
      <h2 className="text-sm font-medium text-[#ffffff]">{milestone.label}</h2>
      {milestone.objective && (
        <p className="mt-1 text-xs text-[#e3e2e1]/70">{milestone.objective}</p>
      )}
      <div className="mt-4 flex flex-col gap-2" role="list">
        {decisions.map((decision) => (
          <DecisionRow
            key={decision.id}
            decision={decision}
            onToggle={() => onToggleDecision(milestone.id, decision.id)}
          />
        ))}
      </div>
    </aside>
  );
}
