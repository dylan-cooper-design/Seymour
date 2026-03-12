"use client";

import type { Milestone } from "@/types/navigation";
import { MilestoneGroup } from "./MilestoneGroup";
import { SectionLabel } from "@/components/ui/SectionLabel";

type MilestoneTreeProps = {
  milestones: Milestone[];
  activeNavItemId: string;
  onSelectItem: (id: string) => void;
};

export function MilestoneTree({
  milestones,
  activeNavItemId,
  onSelectItem,
}: MilestoneTreeProps) {
  const hasMilestones = milestones.some((m) => m.children.length > 0);

  if (!hasMilestones) {
    return (
      <div className="px-4 py-4">
        <p className="text-label-sm text-seymour-text/70">
          Set a goal to generate your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      <div className="px-4 pb-1">
        <SectionLabel>Milestones</SectionLabel>
      </div>
      <div className="flex flex-col gap-1">
        {milestones.map((milestone) => (
          <MilestoneGroup
            key={milestone.id}
            milestone={milestone}
            activeNavItemId={activeNavItemId}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}
