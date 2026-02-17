"use client";

import type { MilestoneStatus, NavGroup } from "@/types/navigation";

const GOAL_THREAD_ID = "goal-definition";

type NavProps = {
  projectName: string;
  foundationLabel: string;
  groups: NavGroup[];
  activeNavItemId: string;
  onSelectItem: (itemId: string) => void;
  onToggleGroup: (groupId: string) => void;
};

function StatusDot({ status }: { status: MilestoneStatus }) {
  if (status === "complete-decision") {
    return <span className="size-2 rounded-full bg-[#e3e2e1]" aria-hidden="true" />;
  }

  if (status === "incomplete-action") {
    return (
      <span
        className="size-2 rotate-45 rounded-[1px] border border-[#e3e2e1]"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className="size-2 rounded-full border border-dashed border-[#e3e2e1]"
      aria-hidden="true"
    />
  );
}

function SectionRow({
  label,
  isExpanded,
  isDimmed = false,
  onClick,
}: {
  label: string;
  isExpanded: boolean;
  isDimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-2 border-b border-[#302f2d] px-6 text-left ${
        isDimmed ? "opacity-50" : "opacity-100"
      }`}
      aria-expanded={isExpanded}
    >
      <span className="flex-1 text-sm font-medium text-[#e3e2e1]">{label}</span>
      <span className="text-lg leading-none text-[#e3e2e1]" aria-hidden="true">
        {isExpanded ? "−" : "+"}
      </span>
    </button>
  );
}

export function Nav({
  projectName,
  foundationLabel,
  groups,
  activeNavItemId,
  onSelectItem,
  onToggleGroup,
}: NavProps) {
  const hasMilestones = groups.some((group) => group.items.length > 0);

  return (
    <aside
      className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-[#302f2d] bg-[#141414]"
      aria-label="Navigation"
    >
      <div className="flex items-center gap-2 border-b border-[#302f2d] px-6 pb-[17px] pt-4">
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase text-[#e3e2e1]/50">
            Current Project
          </p>
          <p className="text-xs font-medium text-[#ffffff]">{projectName}</p>
        </div>
        <span className="text-sm text-[#e3e2e1]" aria-hidden="true">
          ˅
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <button
            type="button"
            onClick={() => onSelectItem(GOAL_THREAD_ID)}
            className={`flex h-8 w-full items-center gap-2 rounded px-3 text-left transition-colors ${
              activeNavItemId === GOAL_THREAD_ID ? "bg-[#302f2d]" : "hover:bg-[#232426]"
            }`}
            aria-current={activeNavItemId === GOAL_THREAD_ID ? "page" : undefined}
          >
            <span
              className="inline-block size-4 shrink-0 rounded border border-[#e3e2e1]/70"
              aria-hidden="true"
            />
            <span
              className={`text-sm font-medium ${
                activeNavItemId === GOAL_THREAD_ID ? "text-[#d4b774]" : "text-[#e3e2e1]"
              }`}
            >
              {foundationLabel}
            </span>
          </button>
        </div>

        {!hasMilestones && (
          <div className="px-6 py-4">
            <p className="text-sm text-[#e3e2e1]/70">
              Set a goal to generate your plan.
            </p>
          </div>
        )}

        {hasMilestones &&
          groups.map((group) => (
            <div key={group.id}>
              <SectionRow
                label={group.label}
                isExpanded={group.isExpanded}
                isDimmed={group.isDimmed}
                onClick={() => onToggleGroup(group.id)}
              />
              {group.isExpanded && (
                <div className="border-b border-[#302f2d] px-4 py-2">
                  {group.items.map((item) => {
                    const isActive = item.id === activeNavItemId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectItem(item.id)}
                        className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left last:mb-0 ${
                          isActive ? "bg-[#302f2d]" : "bg-transparent"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <StatusDot status={item.status} />
                        <span
                          className={`flex-1 text-sm ${
                            isActive ? "text-[#d4b774]" : "text-[#e3e2e1]"
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.decisions && item.decisions.length > 0 && (
                          <span
                            className="text-xs text-[#e3e2e1]/50"
                            aria-label={`${item.decisions.length} decisions`}
                          >
                            {item.decisions.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>
    </aside>
  );
}
