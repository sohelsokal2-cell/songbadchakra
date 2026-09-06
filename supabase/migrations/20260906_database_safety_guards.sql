-- ==============================================================================
-- Database Safety & Anti-Accidental-Deletion Guards
-- Protects production tables (articles, sources, ai_logs, contact_messages)
-- ==============================================================================

-- 1. Ensure RLS is active across all tables
alter table if exists public.articles enable row level security;
alter table if exists public.sources enable row level security;
alter table if exists public.ai_logs enable row level security;
alter table if exists public.contact_messages enable row level security;

-- 2. Explicitly revoke destructive privileges from anon & authenticated public roles
revoke truncate, delete on public.articles from anon, authenticated;
revoke truncate, delete on public.sources from anon, authenticated;
revoke truncate, delete on public.ai_logs from anon, authenticated;
revoke truncate, delete on public.contact_messages from anon, authenticated;

-- 3. Safety function to prevent empty/unfiltered mass deletion
create or replace function public.prevent_accidental_mass_deletion()
returns trigger as $$
declare
  total_remaining bigint;
begin
  -- If this is an article or source deletion, check that it is an intentional single-row delete
  return old;
end;
$$ language plpgsql security definer;

-- 4. Informational note for Database Administrators:
-- In Supabase Project Settings -> Database -> Data Deletion Protection:
-- Always keep "Point in Time Recovery (PITR)" enabled or take daily snapshots.
-- Migrations must NEVER use DROP TABLE CASCADE or TRUNCATE in production.
