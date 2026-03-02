"use client";

import { ChevronRight } from "lucide-react";
import { clearAllStorage } from "@/lib/storage";
import type { SidebarNavData } from "@/types/navigation";
import { NavItem } from "@/components/ui/NavItem";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectSwitcher } from "./ProjectSwitcher";

// ─── PlatformMenuItem ─────────────────────────────────────────────────────────

function PlatformMenuItem({
  items,
  activeNavItemId,
  onSelectItem,
}: {
  items: SidebarNavData["platform"];
  activeNavItemId: string;
  onSelectItem: (id: string) => void;
}) {
  return (
    <div className="border-b border-seymour-border px-6 py-2">
      <div className="mb-1">
        <SectionLabel>Platform</SectionLabel>
      </div>
      {items.map((item) => (
        <NavItem
          key={item.id}
          label={item.label}
          isActive={item.id === activeNavItemId}
          onClick={() => onSelectItem(item.id)}
        />
      ))}
    </div>
  );
}

// ─── MilestoneGroup ───────────────────────────────────────────────────────────

function MilestoneGroup({
  milestones,
  activeNavItemId,
  onSelectItem,
}: {
  milestones: SidebarNavData["milestones"];
  activeNavItemId: string;
  onSelectItem: (id: string) => void;
}) {
  const hasMilestones = milestones.some((m) => m.children.length > 0);

  if (!hasMilestones) {
    return (
      <div className="px-6 py-4">
        <p className="text-label-sm text-seymour-text/70">
          Set a goal to generate your plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      <div className="px-6 pb-1">
        <SectionLabel>Milestones</SectionLabel>
      </div>
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={milestone.isDimmed ? "opacity-50" : "opacity-100"}
        >
          <div className="flex items-center gap-2 px-6 py-2">
            <span
              className="size-4 shrink-0 rounded-full border border-seymour-text/50"
              aria-hidden="true"
            />
            <span className="flex-1 text-label-sm text-seymour-text">
              {milestone.label}
            </span>
            {milestone.children.length > 0 && (
              <ChevronRight
                className="size-4 shrink-0 text-seymour-text/50"
                aria-hidden="true"
              />
            )}
          </div>
          {milestone.children.map((child) => (
            <div key={child.id} className="pl-8 pr-2">
              <NavItem
                label={child.label}
                isActive={child.id === activeNavItemId}
                onClick={() => onSelectItem(child.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

type NavProps = {
  nav: SidebarNavData;
  activeNavItemId: string;
  onSelectItem: (itemId: string) => void;
};

export function Nav({ nav, activeNavItemId, onSelectItem }: NavProps) {
  return (
    <aside
      className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col border-r border-seymour-border bg-seymour-bg"
      aria-label="Navigation"
    >
      <ProjectSwitcher currentProject={nav.projectName} />

      <div className="flex-1 overflow-y-auto">
        <PlatformMenuItem
          items={nav.platform}
          activeNavItemId={activeNavItemId}
          onSelectItem={onSelectItem}
        />
        <MilestoneGroup
          milestones={nav.milestones}
          activeNavItemId={activeNavItemId}
          onSelectItem={onSelectItem}
        />
      </div>

      <div className="border-t border-seymour-border p-4">
        <button
          type="button"
          onClick={() => {
            clearAllStorage();
            window.location.reload();
          }}
          className="w-full rounded border border-seymour-border px-3 py-2 text-label text-seymour-text/70 transition hover:bg-seymour-surface-2 hover:text-seymour-text"
        >
          Reset App
        </button>
      </div>
    </aside>
  );
}
