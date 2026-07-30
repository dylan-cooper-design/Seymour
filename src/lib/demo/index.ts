/**
 * TEMPORARY — the two projects the app seeds itself with while the UI is being
 * built: one populated (Moonshot) so every surface has real content to render,
 * and one empty (Seymour) so the blank new-project state stays reachable.
 *
 * TO REMOVE: delete `src/lib/demo/` and the single `createDemoWorkspace`
 * import in `src/app/page.tsx`, replacing it with a workspace holding one
 * `createProductDesignTemplate()` project.
 */

import { createProductDesignTemplate } from "@/lib/templates/product-design";
import { findByTemplateKey } from "@/lib/tree/nodes";
import { INITIAL_TEMPLATE_KEY } from "@/lib/templates/product-design";
import { SCHEMA_VERSION } from "@/types/project";
import type { ProjectState, Workspace } from "@/types/workspace";
import { createMoonshotProject } from "./moonshot";

/** The untouched template — what a brand-new project actually looks like. */
export function createSeymourProject(): ProjectState {
  const tree = createProductDesignTemplate({ projectName: "Seymour" });
  return {
    id: "demo-seymour",
    tree,
    selectedNodeId: findByTemplateKey(tree.roots, INITIAL_TEMPLATE_KEY)?.id ?? null,
    sessionsByWorkstreamId: {},
  };
}

export function createDemoWorkspace(): Workspace {
  const moonshot = createMoonshotProject();
  return {
    schemaVersion: SCHEMA_VERSION,
    // Moonshot opens first — seeing populated data is the point of the seed.
    activeProjectId: moonshot.id,
    projects: [moonshot, createSeymourProject()],
  };
}
