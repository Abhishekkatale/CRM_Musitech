-- Create table for per-lead comments keyed by frontend lead id (string)
create table if not exists public.lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_ref text not null, -- references the lead id used in the frontend (can be migrated to FK later)
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.lead_comments enable row level security;

-- Permissive policies for now (we'll tighten after auth is added)
create policy if not exists "Anyone can read lead comments"
  on public.lead_comments for select using (true);

create policy if not exists "Anyone can insert lead comments"
  on public.lead_comments for insert with check (true);

create policy if not exists "Anyone can update lead comments"
  on public.lead_comments for update using (true);

create policy if not exists "Anyone can delete lead comments"
  on public.lead_comments for delete using (true);

-- Realtime configuration
alter table public.lead_comments replica identity full;
alter publication supabase_realtime add table public.lead_comments;