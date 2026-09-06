-- ==============================================================================
-- Migration: Create contact_messages table with Row Level Security (RLS)
-- Created at: 2026-09-05
-- ==============================================================================

-- 1. Create table
create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for efficient admin querying
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_contact_messages_is_read on public.contact_messages(is_read);

-- 3. Enable Row Level Security (RLS)
alter table public.contact_messages enable row level security;

-- 4. Policy: Allow anonymous visitors and users to submit contact inquiries (INSERT only)
create policy "Allow public anonymous contact submission"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- 5. Policy: Only service role and authenticated editors/admins can view contact messages (SELECT)
create policy "Allow admins to view contact messages"
  on public.contact_messages
  for select
  to service_role
  using (true);

-- 6. Policy: Only service role and authenticated admins can update message status (e.g. mark as read)
create policy "Allow admins to update contact message status"
  on public.contact_messages
  for update
  to service_role
  using (true)
  with check (true);

-- 7. Policy: Only service role and authenticated admins can delete inquiries
create policy "Allow admins to delete contact messages"
  on public.contact_messages
  for delete
  to service_role
  using (true);
