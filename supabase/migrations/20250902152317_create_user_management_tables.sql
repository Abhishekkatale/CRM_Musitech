-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  password_hash text,
  role text check (role in ('admin', 'client', 'subuser')),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clients table
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subusers table
create table subusers (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text,
  permissions jsonb,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit logs
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid references users(id) on delete set null,
  action text,
  target_user_id uuid references users(id) on delete set null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all tables
alter table users enable row level security;
alter table clients enable row level security;
alter table subusers enable row level security;
alter table audit_logs enable row level security;
