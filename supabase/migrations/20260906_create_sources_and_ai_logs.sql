-- ==============================================================================
-- Phase 9: RSS Feeds & AI News Automation Migration
-- Safe & Idempotent (handles pre-existing tables cleanly)
-- ==============================================================================

-- 1. Sources Table
create table if not exists public.sources (
  id text primary key,
  name text not null default '',
  url text not null default '',
  feed_url text not null default '',
  category text not null default 'bangladesh',
  category_label text not null default 'বাংলাদেশ',
  is_active boolean not null default true,
  fetch_interval_minutes integer not null default 60,
  last_fetched_at timestamptz,
  last_status text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Ensure all required columns exist even if public.sources was pre-existing
alter table public.sources add column if not exists id text;
alter table public.sources add column if not exists name text not null default '';
alter table public.sources add column if not exists url text not null default '';
alter table public.sources add column if not exists feed_url text not null default '';
alter table public.sources add column if not exists category text not null default 'bangladesh';
alter table public.sources add column if not exists category_label text not null default 'বাংলাদেশ';
alter table public.sources add column if not exists is_active boolean not null default true;
alter table public.sources add column if not exists fetch_interval_minutes integer not null default 60;
alter table public.sources add column if not exists last_fetched_at timestamptz;
alter table public.sources add column if not exists last_status text;
alter table public.sources add column if not exists error_message text;
alter table public.sources add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_sources_feed_url on public.sources(feed_url);
create index if not exists idx_sources_is_active on public.sources(is_active);
create index if not exists idx_sources_category on public.sources(category);

alter table public.sources enable row level security;

drop policy if exists "Allow service role full access to sources" on public.sources;
create policy "Allow service role full access to sources"
  on public.sources for all to service_role
  using (true)
  with check (true);

-- 2. AI & Ingestion Logs Table
create table if not exists public.ai_logs (
  id text primary key,
  source_id text references public.sources(id) on delete set null,
  source_url text not null default '',
  provider text not null default 'gemini',
  model text not null default 'gemini-1.5-flash',
  status text not null default 'completed',
  prompt_tokens integer,
  completion_tokens integer,
  error_message text,
  raw_title text,
  raw_summary text,
  processed_article_id text references public.articles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Ensure all required columns exist even if public.ai_logs was pre-existing
alter table public.ai_logs add column if not exists source_id text;
alter table public.ai_logs add column if not exists source_url text not null default '';
alter table public.ai_logs add column if not exists provider text not null default 'gemini';
alter table public.ai_logs add column if not exists model text not null default 'gemini-1.5-flash';
alter table public.ai_logs add column if not exists status text not null default 'completed';
alter table public.ai_logs add column if not exists prompt_tokens integer;
alter table public.ai_logs add column if not exists completion_tokens integer;
alter table public.ai_logs add column if not exists error_message text;
alter table public.ai_logs add column if not exists raw_title text;
alter table public.ai_logs add column if not exists raw_summary text;
alter table public.ai_logs add column if not exists processed_article_id text;
alter table public.ai_logs add column if not exists created_at timestamptz not null default now();

create index if not exists idx_ai_logs_created_at on public.ai_logs(created_at desc);
create index if not exists idx_ai_logs_status on public.ai_logs(status);
create index if not exists idx_ai_logs_source_url on public.ai_logs(source_url);

alter table public.ai_logs enable row level security;

drop policy if exists "Allow service role full access to ai_logs" on public.ai_logs;
create policy "Allow service role full access to ai_logs"
  on public.ai_logs for all to service_role
  using (true)
  with check (true);

-- 3. Partial Unique Index on articles.source_url to prevent duplicate ingestion
create unique index if not exists idx_articles_source_url_unique 
  on public.articles (source_url) 
  where (source_url is not null and source_url != '#' and source_url != '');

-- 4. Initial Seed Trusted Bengali News RSS Sources
insert into public.sources (id, name, url, feed_url, category, category_label, is_active, fetch_interval_minutes)
values
  (
    'src-bbc-bangla',
    'BBC News বাংলা',
    'https://www.bbc.com/bengali',
    'https://feeds.bbci.co.uk/bengali/rss.xml',
    'international',
    'আন্তর্জাতিক',
    true,
    60
  ),
  (
    'src-prothom-alo',
    'প্রথম আলো',
    'https://www.prothomalo.com',
    'https://www.prothomalo.com/feed',
    'bangladesh',
    'বাংলাদেশ',
    true,
    60
  ),
  (
    'src-daily-star',
    'ডেইলি স্টার বাংলা',
    'https://bangla.thedailystar.net',
    'https://bangla.thedailystar.net/feed',
    'bangladesh',
    'বাংলাদেশ',
    true,
    60
  )
on conflict (id) do update set
  category = excluded.category,
  category_label = excluded.category_label,
  feed_url = excluded.feed_url,
  url = excluded.url,
  name = excluded.name;
