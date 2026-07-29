"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { toMlaTitleCase } from "@/lib/format";

/**
 * Replaces ProjectSwitcher. Multi-project needs a schema change — the old
 * switcher swapped in a mock nav model and silently destroyed the previous
 * project's plan and chat history — so until that exists this is display-only.
 */
export function ProjectHeader({ projectName }: { projectName: string }) {
  return (
    <div className="w-full border-b border-seymour-border px-6 pb-4 pt-4">
      <SectionLabel>Current Project</SectionLabel>
      <p className="truncate text-label font-medium text-seymour-white">
        {toMlaTitleCase(projectName)}
      </p>
    </div>
  );
}
