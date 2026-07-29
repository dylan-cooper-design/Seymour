-- 0001_user_state.sql
--
-- Reconstructs the CURRENT schema, which until now existed only in the hosted
-- Supabase project and was never version-controlled. Written defensively with
-- `if not exists` guards so it is safe to run against the live database.
--
-- Columns are inferred from src/lib/storage/client.ts.

create table if not exists public.user_state (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  nav_model               jsonb,
  active_nav_item_id      text,
  threads_by_nav_item_id  jsonb,
  current_goal            jsonb,
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- IMPORTANT: @supabase/ssr ships the anon key in the client bundle. Without RLS,
-- any authenticated user can read and overwrite every other user's row. These
-- policies scope every operation to the calling user.
-- ---------------------------------------------------------------------------

alter table public.user_state enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_state'
      and policyname = 'user_state_select_own'
  ) then
    create policy user_state_select_own on public.user_state
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_state'
      and policyname = 'user_state_insert_own'
  ) then
    create policy user_state_insert_own on public.user_state
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_state'
      and policyname = 'user_state_update_own'
  ) then
    create policy user_state_update_own on public.user_state
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_state'
      and policyname = 'user_state_delete_own'
  ) then
    create policy user_state_delete_own on public.user_state
      for delete using (auth.uid() = user_id);
  end if;
end $$;
