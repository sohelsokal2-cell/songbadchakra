-- ==============================================================================
-- Phase 9: RSS Feeds & AI News Automation Migration
-- Safe idempotent creation of sources & ai_logs tables with TEXT primary keys
-- ==============================================================================

-- 1. Sources Table (Idempotent - never drops existing data)
create table if not exists public.sources (
  id text primary key,
  name text not null,
  url text not null,
  feed_url text not null unique,
  category text not null default 'bangladesh',
  category_label text not null default 'বাংলাদেশ',
  is_active boolean not null default true,
  fetch_interval_minutes integer not null default 60,
  last_fetched_at timestamptz,
  last_status text,
  error_message text,
  created_at timestamptz not null default now()
);

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
  source_url text not null,
  provider text not null default 'gemini',
  model text not null default 'gemini-1.5-flash',
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  prompt_tokens integer,
  completion_tokens integer,
  error_message text,
  raw_title text,
  raw_summary text,
  processed_article_id text references public.articles(id) on delete set null,
  created_at timestamptz not null default now()
);

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
