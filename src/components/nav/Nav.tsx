"use client";

import { clearAllStorage } from "@/lib/storage";
import type { SidebarNavData } from "@/types/navigation";
import { NavItem } from "@/components/ui/NavItem";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectSwitcher, type Project } from "./ProjectSwitcher";
import { MilestoneTree } from "./MilestoneTree";
import { Layers } from "lucide-react";

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
    <div className="border-b border-seymour-border px-4 py-2">
      <div className="mb-1">
        <SectionLabel>Platform</SectionLabel>
      </div>
      {items.map((item) => (
        <NavItem
          key={item.id}
          label={item.label}
          isActive={item.id === activeNavItemId}
          onClick={() => onSelectItem(item.id)}
          icon={<Layers className="size-4 shrink-0 text-seymour-text/60" />}
        />
      ))}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

type NavProps = {
  nav: SidebarNavData;
  activeNavItemId: string;
  onSelectItem: (itemId: string) => void;
  onSelectProject?: (project: Project) => void;
};

export function Nav({ nav, activeNavItemId, onSelectItem, onSelectProject }: NavProps) {
  return (
    <aside
      className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col border-r border-seymour-border bg-seymour-bg"
      aria-label="Navigation"
    >
      <ProjectSwitcher currentProject={nav.projectName} onSelectProject={onSelectProject} />

      <div className="flex-1 overflow-y-auto">
        <PlatformMenuItem
          items={nav.platform}
          activeNavItemId={activeNavItemId}
          onSelectItem={onSelectItem}
        />
        <MilestoneTree
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
