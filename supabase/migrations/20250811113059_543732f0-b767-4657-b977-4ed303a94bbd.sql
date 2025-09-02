-- Table
create table if not exists public.lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_ref text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.lead_comments enable row level security;

-- Recreate policies idempotently
drop policy if exists "Anyone can read lead comments" on public.lead_comments;
drop policy if exists "Anyone can insert lead comments" on public.lead_comments;
drop policy if exists "Anyone can update lead comments" on public.lead_comments;
drop policy if exists "Anyone can delete lead comments" on public.lead_comments;

create policy "Anyone can read lead comments"
  on public.lead_comments for select using (true);

create policy "Anyone can insert lead comments"
  on public.lead_comments for insert with check (true);

create policy "Anyone can update lead comments"
  on public.lead_comments for update using (true);

create policy "Anyone can delete lead comments"
  on public.lead_comments for delete using (true);

-- Realtime
alter table public.lead_comments replica identity full;
alter publication supabase_realtime add table if not exists public.lead_comments;