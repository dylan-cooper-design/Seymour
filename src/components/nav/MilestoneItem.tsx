"use client";

import { toMlaTitleCase } from "@/lib/format";

type MilestoneItemProps = {
  label: string;
  isActive?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
};

export function MilestoneItem({
  label,
  isActive = false,
  isDimmed = false,
  onClick,
}: MilestoneItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full rounded px-2 py-1 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent/60 ${
        isActive ? "bg-seymour-border text-seymour-accent" : "text-seymour-text hover:bg-seymour-surface"
      } ${isDimmed ? "opacity-50" : "opacity-100"}`}
      aria-current={isActive ? "page" : undefined}
    >
      {toMlaTitleCase(label)}
    </button>
  );
}
