"use client";

import { LogOut } from "lucide-react";
import { clearWorkspace } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { Forest } from "@/lib/tree/nodes";
import type { TreeExpansion } from "@/hooks/useTreeExpansion";
import { NodeTree } from "./NodeTree";
import { ProjectHeader, type ProjectOption } from "./ProjectHeader";

type NavProps = {
  projects: ProjectOption[];
  activeProjectId: string | null;
  onSwitchProject: (projectId: string) => void;
  roots: Forest;
  selectedNodeId: string | null;
  activeThreadId: string | null;
  expansion: TreeExpansion;
  onSelect: (id: string) => void;
  onToggleAction?: (id: string, done: boolean) => void;
};

export function Nav({
  projects,
  activeProjectId,
  onSwitchProject,
  roots,
  selectedNodeId,
  activeThreadId,
  expansion,
  onSelect,
  onToggleAction,
}: NavProps) {
  return (
    <aside
      className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col border-r border-seymour-border bg-seymour-bg"
      aria-label="Project tree"
    >
      <ProjectHeader
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitchProject={onSwitchProject}
      />

      <div className="flex-1 overflow-y-auto">
        <NodeTree
          roots={roots}
          selectedNodeId={selectedNodeId}
          activeThreadId={activeThreadId}
          expansion={expansion}
          onSelect={onSelect}
          onToggleAction={onToggleAction}
        />
      </div>

      <div className="border-t border-seymour-border p-4">
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await clearWorkspace();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-2 rounded border border-seymour-border px-3 py-2 text-label text-seymour-text/70 transition hover:bg-seymour-surface-2 hover:text-seymour-text"
        >
          <LogOut className="size-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
