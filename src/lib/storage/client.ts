/**
 * Supabase-backed storage. Async, client-side only (uses the browser client).
 *
 * NOTE ON COLUMN NAMES: the payload is now a whole `Workspace` (every project
 * the user has), but it still travels in the original `nav_model` column
 * because it is jsonb and accepts the new shape as-is. The other two columns
 * (`active_nav_item_id`, `threads_by_nav_item_id`) held per-project state that
 * now lives inside the workspace blob; they are written for forward-compat
 * only and never read back. Collapsing them is migration 0002, deliberately
 * kept separate so the state rewrite and the storage rewrite can be verified
 * independently.
 */

import { createClient } from "@/lib/supabase/client";
import { SCHEMA_VERSION } from "@/types/project";
import type { Workspace } from "@/types/workspace";
import { activeProject } from "@/types/workspace";

/**
 * A stored blob is usable only if it parses as a workspace at the CURRENT
 * schema version. A failed shape check and a version mismatch take the same
 * branch — one code path for "unusable blob" beats two.
 *
 * Pre-workspace rows (a bare `ProjectTree`, or the NavModel before that) fail
 * here and reset to the seeded workspace. That is deliberate: this project is
 * pre-release and every prior shape predates multi-project, so there is no
 * multi-project history to preserve.
 *
 * Replaced with a zod schema in the patch-contract phase.
 */
export function isUsableWorkspace(value: unknown): value is Workspace {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Workspace>;
  return (
    candidate.schemaVersion === SCHEMA_VERSION &&
    typeof candidate.activeProjectId === "string" &&
    Array.isArray(candidate.projects) &&
    candidate.projects.length > 0
  );
}

/**
 * Load the workspace in one round-trip. `null` means "nothing usable stored" —
 * the caller seeds a fresh workspace rather than this module deciding what the
 * default content should be.
 */
export async function loadWorkspace(): Promise<Workspace | null> {
  if (typeof window === "undefined") return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_state")
    .select("nav_model")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return isUsableWorkspace(data.nav_model) ? data.nav_model : null;
}

/**
 * Write the workspace in one upsert.
 */
export async function saveWorkspace(workspace: Workspace): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const active = activeProject(workspace);
  await supabase.from("user_state").upsert(
    {
      user_id: user.id,
      nav_model: workspace,
      // Write-only, for forward-compat with the not-yet-migrated columns.
      active_nav_item_id: active?.selectedNodeId ?? null,
      threads_by_nav_item_id: null,
      // The goal now lives as the note on Foundations > Problem statement.
      current_goal: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

/**
 * Delete the user's row (called on sign-out).
 */
export async function clearWorkspace(): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_state").delete().eq("user_id", user.id);
}
