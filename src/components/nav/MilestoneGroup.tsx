"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { Milestone, MilestoneChild } from "@/types/navigation";
import { MilestoneItem } from "./MilestoneItem";

type MilestoneGroupProps = {
  milestone: Milestone;
  activeNavItemId: string;
  onSelectItem: (id: string) => void;
};

export function MilestoneGroup({
  milestone,
  activeNavItemId,
  onSelectItem,
}: MilestoneGroupProps) {
  const hasChildren = milestone.children.length > 0;
  const hasActiveChild =
    hasChildren && milestone.children.some((c) => c.id === activeNavItemId);
  const [isExpanded, setIsExpanded] = useState(
    () => hasActiveChild || (milestone.isExpanded ?? false)
  );

  // Auto-expand when the active child changes (e.g. after hydration or nav patch)
  useEffect(() => {
    if (hasActiveChild) setIsExpanded(true);
  }, [hasActiveChild]);

  // Auto-expand when nav patch sets isExpanded on the group
  useEffect(() => {
    if (milestone.isExpanded) setIsExpanded(true);
  }, [milestone.isExpanded]);

  const allComplete =
    hasChildren &&
    milestone.children.every((c) => c.status === "complete-decision");

  return (
    <div
      className="opacity-100"
      data-milestone-group={milestone.id}
    >
      <button
        type="button"
        onClick={() => hasChildren && setIsExpanded((v) => !v)}
        className={`flex h-8 w-full items-center justify-center gap-2 px-4 py-2 text-left transition-colors hover:bg-seymour-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-seymour-accent/60 ${milestone.isDimmed && !hasActiveChild ? "opacity-50" : "opacity-100"}`}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-disabled={!hasChildren}
      >
        {allComplete ? (
          <CheckCircle2 className="size-4 shrink-0 text-seymour-text" aria-hidden />
        ) : (
          <span className="size-4 shrink-0 rounded-full border border-dashed border-seymour-text/50" aria-hidden />
        )}
        <span className="flex-1 text-sm text-seymour-text">
          {milestone.label}
        </span>
        {(hasChildren || milestone.isDimmed) && (
          <ChevronRight
            className={`size-4 shrink-0 text-seymour-text/50 transition-transform ${
              hasChildren && isExpanded ? "rotate-90" : ""
            }`}
            aria-hidden
          />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div className="pl-6">
          <div className="flex flex-col gap-1 border-l border-seymour-border pl-2">
            {milestone.children.map((child: MilestoneChild) => (
              <MilestoneItem
                key={child.id}
                label={child.label}
                isActive={child.id === activeNavItemId}
                isDimmed={milestone.isDimmed && child.id !== activeNavItemId}
                onClick={() => onSelectItem(child.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
