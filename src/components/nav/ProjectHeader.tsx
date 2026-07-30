"use client";

/**
 * The sidebar's project switcher.
 *
 * This replaced a display-only header, which itself replaced the original
 * ProjectSwitcher — that one swapped in a mock nav model and silently destroyed
 * the outgoing project's plan and chat history. Switching is safe again because
 * every project's state persists side by side in the workspace (see
 * `@/types/workspace`), so this component only ever reports which project the
 * user picked; it never owns or discards project state itself.
 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { toMlaTitleCase } from "@/lib/format";

export type ProjectOption = {
  id: string;
  name: string;
};

type ProjectHeaderProps = {
  projects: ProjectOption[];
  activeProjectId: string | null;
  onSwitchProject: (projectId: string) => void;
};

export function ProjectHeader({ projects, activeProjectId, onSwitchProject }: ProjectHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  // Close on outside click or Escape. Both listeners live on document so the
  // menu closes even when the click lands in another pane entirely.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // One project is not a choice — render the plain header rather than a
  // dropdown that can only ever reselect what's already open.
  if (projects.length <= 1) {
    return (
      <div className="w-full border-b border-seymour-border px-6 pb-4 pt-4">
        <SectionLabel>Current Project</SectionLabel>
        <p className="truncate text-label font-medium text-seymour-white">
          {toMlaTitleCase(active?.name ?? "Untitled project")}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full border-b border-seymour-border px-3 pb-3 pt-4"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 rounded px-3 py-1 text-left transition hover:bg-seymour-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent"
      >
        <span className="min-w-0 flex-1">
          <SectionLabel>Current Project</SectionLabel>
          <span className="block truncate text-label font-medium text-seymour-white">
            {toMlaTitleCase(active?.name ?? "Untitled project")}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-seymour-text/50" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded border border-seymour-border-subtle bg-seymour-surface-2 py-1 shadow-lg shadow-black/40"
        >
          {projects.map((project) => {
            const isActive = project.id === active?.id;
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setIsOpen(false);
                  if (!isActive) onSwitchProject(project.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-label text-seymour-text transition hover:bg-seymour-border focus:outline-none focus-visible:bg-seymour-border"
              >
                <Check
                  className={`size-3.5 shrink-0 text-seymour-accent ${isActive ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{toMlaTitleCase(project.name)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
