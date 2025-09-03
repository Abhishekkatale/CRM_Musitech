create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text unique,
  role text check (role in ('admin', 'client', 'subuser')),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clients enable row level security;


create table if not exists public.subusers (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  permissions jsonb,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subusers enable row level security;

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text,
  target_profile_id uuid references public.profiles(id) on delete set null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;