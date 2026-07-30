/**
 * Everything the user has open, across projects.
 *
 * Seymour used to persist exactly one project's worth of state — a tree, a
 * selection, and a session map, each in its own top-level field. That is why
 * the original ProjectSwitcher had to be deleted: switching swapped a new tree
 * into those fields and the outgoing project's plan and chat history were
 * simply gone. Nesting per-project state inside a `projects` list is what makes
 * switching non-destructive, because the outgoing project has somewhere to be
 * written back to.
 */

import type { SessionsByWorkstreamId } from "./navigation";
import type { ProjectTree } from "./project";

/**
 * One project's complete state. Switching projects is swapping this whole
 * object at once, never merging fields out of three parallel maps.
 */
export type ProjectState = {
  id: string;
  tree: ProjectTree;
  selectedNodeId: string | null;
  sessionsByWorkstreamId: SessionsByWorkstreamId;
};

export type Workspace = {
  /** Mirrors `SCHEMA_VERSION`. A mismatch resets the whole blob, same as before. */
  schemaVersion: number;
  activeProjectId: string;
  projects: ProjectState[];
};

export function findProject(workspace: Workspace, id: string): ProjectState | undefined {
  return workspace.projects.find((project) => project.id === id);
}

/** The active project, falling back to the first one if the id has gone stale. */
export function activeProject(workspace: Workspace): ProjectState | undefined {
  return findProject(workspace, workspace.activeProjectId) ?? workspace.projects[0];
}
