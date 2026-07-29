/**
 * Supabase-backed storage. Async, client-side only (uses the browser client).
 *
 * NOTE ON COLUMN NAMES: the payload is the new project tree, but it still
 * travels in the original columns (`nav_model`, `active_nav_item_id`,
 * `threads_by_nav_item_id`) because they are jsonb/text and accept the new
 * shape as-is. Renaming them is migration 0002, deliberately kept separate so
 * the tree rewrite and the storage rewrite can be verified independently.
 */

import { createClient } from "@/lib/supabase/client";
import type { ProjectTree } from "@/types/project";
import type { ThreadsByNodeId } from "@/types/navigation";

export type UserState = {
  projectTree: ProjectTree | null;
  selectedNodeId: string | null;
  threadsByNodeId: ThreadsByNodeId | null;
};

function emptyState(): UserState {
  return { projectTree: null, selectedNodeId: null, threadsByNodeId: null };
}

/**
 * Load all user state in one round-trip.
 */
export async function loadUserState(): Promise<UserState> {
  if (typeof window === "undefined") return emptyState();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyState();
  const { data } = await supabase
    .from("user_state")
    .select("nav_model, active_nav_item_id, threads_by_nav_item_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return emptyState();
  return {
    // Rows written before the tree rewrite hold the old NavModel shape. The
    // caller version-checks and falls back to the template, so this cast is
    // only ever "whatever JSON was there".
    projectTree: (data.nav_model as ProjectTree) ?? null,
    selectedNodeId: (data.active_nav_item_id as string) ?? null,
    threadsByNodeId: (data.threads_by_nav_item_id as ThreadsByNodeId) ?? null,
  };
}

/**
 * Write all user state in one upsert.
 */
export async function saveUserState(state: Partial<UserState>): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_state").upsert(
    {
      user_id: user.id,
      nav_model: state.projectTree ?? null,
      active_nav_item_id: state.selectedNodeId ?? null,
      threads_by_nav_item_id: state.threadsByNodeId ?? null,
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
export async function clearUserState(): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_state").delete().eq("user_id", user.id);
}
