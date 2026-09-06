-- ==============================================================================
-- SongbadChakra — Job Recovery, Retry & Dead-Letter support
-- Idempotent: safe to run repeatedly against existing deployments.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Add retry/lease columns to ai_jobs
-- ------------------------------------------------------------------------------
alter table public.ai_jobs add column if not exists max_attempts integer not null default 3;
alter table public.ai_jobs add column if not exists lease_expires_at timestamptz;

comment on column public.ai_jobs.max_attempts is
  'Maximum pipeline attempts before a job moves to dead_letter.';
comment on column public.ai_jobs.lease_expires_at is
  'Heartbeat/deadline. An in-progress job whose lease has expired is treated as stuck and recovered by the job-recovery cycle.';

-- ------------------------------------------------------------------------------
-- 2. Extend the status state machine with 'dead_letter'
-- ------------------------------------------------------------------------------
alter table public.ai_jobs drop constraint if exists ai_jobs_status_check;
alter table public.ai_jobs add constraint ai_jobs_status_check
  check (status in (
    'queued', 'collecting', 'collected', 'writing', 'written',
    'fact_checking', 'fact_checked', 'image_reviewing', 'image_reviewed',
    'seo_reviewing', 'seo_reviewed', 'duplicate_checking', 'duplicate_checked',
    'rule_checking', 'published', 'retrying', 'held', 'rejected', 'failed',
    'dead_letter'
  ));

-- ------------------------------------------------------------------------------
-- 3. Query performance for recovery scans
-- ------------------------------------------------------------------------------
create index if not exists idx_ai_jobs_status_updated on public.ai_jobs(status, updated_at);
create index if not exists idx_ai_jobs_lease_expires on public.ai_jobs(lease_expires_at)
  where lease_expires_at is not null;