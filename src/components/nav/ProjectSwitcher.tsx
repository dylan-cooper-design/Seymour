"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ChevronsUpDown } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  name: string;
  description?: string;
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "seymour",
    name: "Seymour",
    description: "AI decision partner. Tracks goals, milestones, and trade-offs.",
  },
  {
    id: "simplina",
    name: "Simplina",
    description: "Onboarding flow builder. Cuts time-to-activation.",
  },
  {
    id: "mango-doodles",
    name: "Mango Doodles",
    description: "Brand asset library for design and marketing.",
  },
];

type ProjectSwitcherProps = {
  currentProject: string;
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
  onNewProject?: () => void;
};

// ─── ProjectSwitcher ──────────────────────────────────────────────────────────

export function ProjectSwitcher({
  currentProject,
  projects = MOCK_PROJECTS,
  onSelectProject,
  onNewProject,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(currentProject);

  function handleSelect(project: Project) {
    setSelectedName(project.name);
    onSelectProject?.(project);
  }

  return (
    <DropdownMenu.Root modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Switch project"
          className="flex w-full items-center gap-2 border-b border-seymour-border px-6 pb-4 pt-4 text-left transition-colors hover:bg-seymour-surface focus-visible:outline-none data-[state=open]:bg-seymour-surface"
        >
          <div className="min-w-0 flex-1">
            <SectionLabel>Current Project</SectionLabel>
            <p className="truncate text-xs font-medium text-seymour-white">
              {selectedName}
            </p>
          </div>
          <ChevronsUpDown
            className={`size-4 shrink-0 transition-colors ${
              open ? "text-seymour-text" : "text-seymour-text/70"
            }`}
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          alignOffset={24}
          sideOffset={4}
          className="z-50 w-48 overflow-hidden rounded-lg border border-seymour-border bg-seymour-surface py-1 shadow-xl"
        >
          <DropdownMenu.Label className="px-3 py-1">
            <SectionLabel>Projects</SectionLabel>
          </DropdownMenu.Label>

          {projects.map((project) => (
            <DropdownMenu.Item
              key={project.id}
              onSelect={() => handleSelect(project)}
              className="group flex h-8 cursor-pointer items-center gap-2 px-3 text-sm text-seymour-white outline-none data-[highlighted]:bg-seymour-surface-2"
            >
              <FolderIcon
                className="size-4 shrink-0 text-seymour-text/60 transition-all duration-200 group-data-[highlighted]:scale-110 group-data-[highlighted]:text-seymour-accent"
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{project.name}</span>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-seymour-border" />

          <DropdownMenu.Item
            onSelect={onNewProject}
            className="group flex h-8 cursor-pointer items-center gap-2 px-3 text-sm text-seymour-text/60 outline-none transition-colors data-[highlighted]:bg-seymour-surface-2 data-[highlighted]:text-seymour-text"
          >
            <PlusIcon
              className="size-4 shrink-0 transition-all duration-200 group-data-[highlighted]:scale-110 group-data-[highlighted]:text-seymour-accent"
              aria-hidden="true"
            />
            <span>New Project</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
