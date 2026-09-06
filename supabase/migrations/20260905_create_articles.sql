create table if not exists public.articles (
  id text primary key,
  title text not null,
  slug text not null unique,
  summary text not null default '',
  content text not null,
  category text not null,
  category_label text not null,
  source_name text not null,
  source_url text not null default '#',
  image_url text not null,
  published_at timestamptz not null default now(),
  is_breaking boolean not null default false,
  status text not null check (status in ('published', 'draft')),
  author jsonb,
  division text,
  district text,
  is_video boolean not null default false,
  video_duration text,
  is_opinion boolean not null default false,
  is_photo_feature boolean not null default false,
  reading_time integer,
  tags text[]
);

create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_status on public.articles(status);

alter table public.articles enable row level security;

create policy "Allow public published article reads"
  on public.articles for select to anon, authenticated
  using (status = 'published');

create policy "Allow service role article reads"
  on public.articles for select to service_role using (true);

create policy "Allow service role article inserts"
  on public.articles for insert to service_role with check (true);

create policy "Allow service role article updates"
  on public.articles for update to service_role using (true) with check (true);

create policy "Allow service role article deletes"
  on public.articles for delete to service_role using (true);
