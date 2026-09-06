-- ==============================================================================
-- SongbadChakra Phase 10: AI News Automation Engine
-- Safe idempotent migrations — no DROP TABLE, no data loss
-- ==============================================================================

-- ------------------------------------------------------------
-- 1. ai_roles — defines each AI role and its configuration
-- ------------------------------------------------------------
create table if not exists public.ai_roles (
  id text primary key,
  role_name text not null unique,
  display_name text not null,
  description text not null default '',
  instructions text not null default '',
  minimum_score integer not null default 80 check (minimum_score between 0 and 100),
  auto_enabled boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_roles_role_name on public.ai_roles(role_name);

alter table public.ai_roles enable row level security;
drop policy if exists "Allow service role full access to ai_roles" on public.ai_roles;
create policy "Allow service role full access to ai_roles"
  on public.ai_roles for all to service_role using (true) with check (true);

-- Seed default roles
insert into public.ai_roles (id, role_name, display_name, description, minimum_score, auto_enabled, is_active)
values
  ('role-collector',         'collector',         'তথ্য সংগ্রাহক',       'RSS ও নিউজ ফিড থেকে সংবাদ সংগ্রহ করে।',                           0,  true, true),
  ('role-writer',            'writer',            'সংবাদ লেখক',          'সংগৃহীত তথ্য থেকে মৌলিক বাংলা সংবাদ রচনা করে।',                   0,  true, true),
  ('role-fact-checker',      'fact_checker',      'তথ্য যাচাইকারী',      'সংবাদের দাবি, তথ্য ও উদ্ধৃতি যাচাই করে স্কোর দেয়।',              90, true, true),
  ('role-image-reviewer',    'image_reviewer',    'ছবি যাচাইকারী',       'সংবাদ-সংশ্লিষ্ট ছবির প্রাসঙ্গিকতা ও লাইসেন্স যাচাই করে।',       85, true, true),
  ('role-seo-reviewer',      'seo_reviewer',      'SEO বিশেষজ্ঞ',        'শিরোনাম, মেটা, স্লাগ ও পঠনযোগ্যতা মূল্যায়ন করে।',              80, true, true),
  ('role-duplicate-checker', 'duplicate_checker', 'ডুপ্লিকেট শনাক্তকারী', 'বিদ্যমান সংবাদের সাথে নতুন সংবাদের মিল পরীক্ষা করে।',           0,  true, true)
on conflict (id) do update set
  display_name = excluded.display_name,
  description  = excluded.description,
  minimum_score = excluded.minimum_score;

-- ------------------------------------------------------------
-- 2. ai_providers — AI service provider registry
-- ------------------------------------------------------------
create table if not exists public.ai_providers (
  id text primary key,
  provider_name text not null unique,
  display_name text not null,
  base_url text not null,
  api_style text not null default 'openai' check (api_style in ('openai', 'gemini', 'custom')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_providers enable row level security;
drop policy if exists "Allow service role full access to ai_providers" on public.ai_providers;
create policy "Allow service role full access to ai_providers"
  on public.ai_providers for all to service_role using (true) with check (true);

insert into public.ai_providers (id, provider_name, display_name, base_url, api_style, is_active)
values
  ('prov-gemini',     'gemini',     'Google Gemini',  'https://generativelanguage.googleapis.com', 'gemini', true),
  ('prov-groq',       'groq',       'Groq',           'https://api.groq.com/openai',               'openai', true),
  ('prov-openrouter', 'openrouter', 'OpenRouter',     'https://openrouter.ai/api',                 'openai', false),
  ('prov-nvidia',     'nvidia',     'NVIDIA NIM',     'https://integrate.api.nvidia.com',          'openai', false)
on conflict (id) do update set
  display_name = excluded.display_name,
  base_url     = excluded.base_url,
  api_style    = excluded.api_style;

-- ------------------------------------------------------------
-- 3. ai_api_key_labels — references to secrets (no raw keys)
--    The actual key lives in Cloudflare Secrets / env vars.
--    This table only stores a label (env var name) + metadata.
-- ------------------------------------------------------------
create table if not exists public.ai_api_key_labels (
  id text primary key,
  provider_id text not null references public.ai_providers(id) on delete cascade,
  label text not null,                     -- env var name, e.g. "GROQ_API_KEY"
  display_label text not null,             -- human label, e.g. "Groq Key 1"
  is_active boolean not null default true,
  priority integer not null default 1,     -- lower = higher priority
  last_used_at timestamptz,
  last_error_at timestamptz,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_key_labels_provider on public.ai_api_key_labels(provider_id);

alter table public.ai_api_key_labels enable row level security;
drop policy if exists "Allow service role full access to ai_api_key_labels" on public.ai_api_key_labels;
create policy "Allow service role full access to ai_api_key_labels"
  on public.ai_api_key_labels for all to service_role using (true) with check (true);

insert into public.ai_api_key_labels (id, provider_id, label, display_label, is_active, priority)
values
  ('key-gemini-1', 'prov-gemini', 'GEMINI_API_KEY',  'Gemini Key 1', true, 1),
  ('key-groq-1',   'prov-groq',   'GROQ_API_KEY',    'Groq Key 1',   true, 1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 4. ai_models — AI model registry
-- ------------------------------------------------------------
create table if not exists public.ai_models (
  id text primary key,
  provider_id text not null references public.ai_providers(id) on delete cascade,
  model_name text not null,       -- exact API identifier
  display_name text not null,
  context_length integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_models_provider on public.ai_models(provider_id);

alter table public.ai_models enable row level security;
drop policy if exists "Allow service role full access to ai_models" on public.ai_models;
create policy "Allow service role full access to ai_models"
  on public.ai_models for all to service_role using (true) with check (true);

insert into public.ai_models (id, provider_id, model_name, display_name, context_length, is_active)
values
  ('model-gemini-flash',      'prov-gemini', 'gemini-1.5-flash',               'Gemini 1.5 Flash',         1000000, true),
  ('model-gemini-flash-8b',   'prov-gemini', 'gemini-1.5-flash-8b',            'Gemini 1.5 Flash 8B',      1000000, true),
  ('model-groq-llama',        'prov-groq',   'llama-3.3-70b-versatile',        'Llama 3.3 70B (Groq)',     128000,  true),
  ('model-groq-llama-scout',  'prov-groq',   'meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout (Groq)', 131072, true),
  ('model-openrouter-llama',  'prov-openrouter', 'meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B (OR)', 128000, false),
  ('model-nvidia-llama',      'prov-nvidia', 'meta/llama-3.3-70b-instruct',    'Llama 3.3 70B (NVIDIA)',   128000,  false)
on conflict (id) do update set
  model_name   = excluded.model_name,
  display_name = excluded.display_name;

-- ------------------------------------------------------------
-- 5. ai_role_models — priority-ordered model assignments per role
-- ------------------------------------------------------------
create table if not exists public.ai_role_models (
  id text primary key,
  role_id text not null references public.ai_roles(id) on delete cascade,
  model_id text not null references public.ai_models(id) on delete cascade,
  api_key_label_id text references public.ai_api_key_labels(id) on delete set null,
  priority integer not null default 1,  -- 1 = primary, 2 = fallback 1, etc.
  is_active boolean not null default true,
  max_retries integer not null default 2,
  timeout_ms integer not null default 30000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_role_models_role on public.ai_role_models(role_id, priority);

alter table public.ai_role_models enable row level security;
drop policy if exists "Allow service role full access to ai_role_models" on public.ai_role_models;
create policy "Allow service role full access to ai_role_models"
  on public.ai_role_models for all to service_role using (true) with check (true);

-- Assign models to roles (Writer, Fact Checker, SEO Reviewer share the same pool)
-- Writer: Gemini Flash primary, Groq Llama fallback
insert into public.ai_role_models (id, role_id, model_id, api_key_label_id, priority, is_active, max_retries, timeout_ms)
values
  ('rm-writer-1',   'role-writer',          'model-gemini-flash',     'key-gemini-1', 1, true, 2, 30000),
  ('rm-writer-2',   'role-writer',          'model-groq-llama',       'key-groq-1',   2, true, 2, 30000),
  ('rm-fc-1',       'role-fact-checker',    'model-gemini-flash',     'key-gemini-1', 1, true, 2, 30000),
  ('rm-fc-2',       'role-fact-checker',    'model-groq-llama',       'key-groq-1',   2, true, 2, 30000),
  ('rm-seo-1',      'role-seo-reviewer',    'model-gemini-flash-8b',  'key-gemini-1', 1, true, 2, 20000),
  ('rm-seo-2',      'role-seo-reviewer',    'model-groq-llama',       'key-groq-1',   2, true, 2, 20000),
  ('rm-img-1',      'role-image-reviewer',  'model-gemini-flash-8b',  'key-gemini-1', 1, true, 2, 15000),
  ('rm-img-2',      'role-image-reviewer',  'model-groq-llama-scout', 'key-groq-1',   2, true, 2, 15000),
  ('rm-dup-1',      'role-duplicate-checker', 'model-gemini-flash-8b', 'key-gemini-1', 1, true, 1, 15000)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6. ai_rule_config — configurable Rule Engine thresholds
-- ------------------------------------------------------------
create table if not exists public.ai_rule_config (
  id text primary key default 'default',
  fact_checker_min integer not null default 90 check (fact_checker_min between 0 and 100),
  seo_min integer not null default 80 check (seo_min between 0 and 100),
  image_min integer not null default 85 check (image_min between 0 and 100),
  image_optional boolean not null default true,
  require_image boolean not null default false,
  auto_publish boolean not null default true,
  max_items_per_run integer not null default 10,
  updated_at timestamptz not null default now()
);

alter table public.ai_rule_config enable row level security;
drop policy if exists "Allow service role full access to ai_rule_config" on public.ai_rule_config;
create policy "Allow service role full access to ai_rule_config"
  on public.ai_rule_config for all to service_role using (true) with check (true);

insert into public.ai_rule_config (id, fact_checker_min, seo_min, image_min, image_optional, auto_publish, max_items_per_run)
values ('default', 90, 80, 85, true, true, 10)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 7. ai_jobs — per-article pipeline state machine
-- ------------------------------------------------------------
create table if not exists public.ai_jobs (
  id text primary key,
  source_id text references public.sources(id) on delete set null,
  source_url text not null,
  raw_title text,
  raw_description text,
  status text not null default 'queued' check (status in (
    'queued', 'collecting', 'collected', 'writing', 'written',
    'fact_checking', 'fact_checked', 'image_reviewing', 'image_reviewed',
    'seo_reviewing', 'seo_reviewed', 'duplicate_checking', 'duplicate_checked',
    'rule_checking', 'published', 'retrying', 'held', 'rejected', 'failed'
  )),
  attempt integer not null default 1,
  article_id text references public.articles(id) on delete set null,
  collector_result jsonb,
  writer_result jsonb,
  fact_checker_result jsonb,
  image_reviewer_result jsonb,
  seo_reviewer_result jsonb,
  duplicate_checker_result jsonb,
  rule_engine_result jsonb,
  hold_reason text,
  reject_reason text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_jobs_status      on public.ai_jobs(status);
create index if not exists idx_ai_jobs_created_at  on public.ai_jobs(created_at desc);
create index if not exists idx_ai_jobs_source_url  on public.ai_jobs(source_url);

alter table public.ai_jobs enable row level security;
drop policy if exists "Allow service role full access to ai_jobs" on public.ai_jobs;
create policy "Allow service role full access to ai_jobs"
  on public.ai_jobs for all to service_role using (true) with check (true);

-- ------------------------------------------------------------
-- 8. ai_pipeline_logs — per-role execution logs within a job
-- ------------------------------------------------------------
create table if not exists public.ai_pipeline_logs (
  id text primary key,
  job_id text not null references public.ai_jobs(id) on delete cascade,
  role text not null,
  provider text,
  model text,
  api_key_label text,        -- label only, NEVER the actual key
  status text not null check (status in ('pending', 'running', 'success', 'failed', 'skipped')),
  score integer,
  decision text,
  attempt integer not null default 1,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pipeline_logs_job_id     on public.ai_pipeline_logs(job_id);
create index if not exists idx_pipeline_logs_role        on public.ai_pipeline_logs(role);
create index if not exists idx_pipeline_logs_created_at on public.ai_pipeline_logs(created_at desc);

alter table public.ai_pipeline_logs enable row level security;
drop policy if exists "Allow service role full access to ai_pipeline_logs" on public.ai_pipeline_logs;
create policy "Allow service role full access to ai_pipeline_logs"
  on public.ai_pipeline_logs for all to service_role using (true) with check (true);

-- ------------------------------------------------------------
-- 9. Extend articles table: link to ai_job
-- ------------------------------------------------------------
alter table public.articles add column if not exists ai_job_id text references public.ai_jobs(id) on delete set null;
create index if not exists idx_articles_ai_job_id on public.articles(ai_job_id);

-- ------------------------------------------------------------
-- 10. Extend sources table: license metadata
-- ------------------------------------------------------------
alter table public.sources add column if not exists license_notes text;
alter table public.sources add column if not exists attribution_required boolean not null default true;
