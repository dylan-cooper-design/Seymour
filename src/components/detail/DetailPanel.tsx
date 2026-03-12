import type { Goal, ItemDetail, NavItem, NavModel } from "@/types/navigation";
import { DetailHeader } from "./DetailHeader";
import { SectionBlock } from "./SectionBlock";
import { toMlaTitleCase } from "@/lib/format";

const GOAL_THREAD_ID = "goal-definition";

type DetailPanelProps = {
  activeNavItemId: string;
  navModel: NavModel;
  selectedItem?: NavItem;
  currentGoal?: Goal | null;
};

function DetailContent({ detail }: { detail: ItemDetail }) {
  return (
    <div className="flex flex-col gap-6">
      {detail.sections.map((section) => (
        <SectionBlock key={section.label} {...section} />
      ))}
    </div>
  );
}

function EmptyDetail({ isFoundation }: { isFoundation: boolean; label: string }) {
  if (isFoundation) {
    return (
      <p className="text-body-sm text-seymour-text/40">
        Your project context will appear here after you share your goal in the chat.
      </p>
    );
  }
  return (
    <p className="text-body-sm text-seymour-text/40">
      Details will appear here as decisions are made in the chat.
    </p>
  );
}

function mergeGoalIntoDetail(detail: ItemDetail | undefined, goal: Goal | null | undefined): ItemDetail | undefined {
  if (!goal) return detail;
  if (!detail) return { sections: [{ label: "GOAL", content: goal.text }] };

  const hasGoalSection = detail.sections.some((s) => s.label === "GOAL");
  if (hasGoalSection) return detail;

  return {
    sections: [{ label: "GOAL", content: goal.text }, ...detail.sections],
  };
}

export function DetailPanel({ activeNavItemId, navModel, selectedItem, currentGoal }: DetailPanelProps) {
  const isFoundation = activeNavItemId === GOAL_THREAD_ID;

  const rawTitle = isFoundation ? navModel.foundationLabel : (selectedItem?.label ?? "");
  const title = isFoundation ? rawTitle : toMlaTitleCase(rawTitle);

  const rawDetail = isFoundation ? navModel.foundationDetail : selectedItem?.detail;
  const detail = isFoundation ? mergeGoalIntoDetail(rawDetail, currentGoal) : rawDetail;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <DetailHeader title={title} />
      {detail ? (
        <DetailContent detail={detail} />
      ) : (
        <EmptyDetail isFoundation={isFoundation} label={title} />
      )}
    </div>
  );
}
