-- Complete User Management System Migration
-- Idempotent – safe to run multiple times

-------------------------------------------------
-- Enable required extensions
-------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-------------------------------------------------
-- ENUM TYPES (created only if they do not exist)
-------------------------------------------------
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_type
      WHERE typname = 'user_role'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      CREATE TYPE user_role AS ENUM ('admin', 'client', 'subuser');
   END IF;
END$$;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_type
      WHERE typname = 'user_status'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
   END IF;
END$$;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_type
      WHERE typname = 'permission_module'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      CREATE TYPE permission_module AS ENUM (
         'dashboard',
         'leads',
         'campaigns',
         'reports',
         'integrations',
         'attribution',
         'analytics',
         'user_management'
      );
   END IF;
END$$;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_type
      WHERE typname = 'permission_action'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
   ) THEN
      CREATE TYPE permission_action AS ENUM ('read', 'write', 'delete', 'admin');
   END IF;
END$$;

-------------------------------------------------
-- DROP tables that may already exist (order matters)
-------------------------------------------------
DROP TABLE IF EXISTS public.audit_logs       CASCADE;
DROP TABLE IF EXISTS public.subusers         CASCADE;
DROP TABLE IF EXISTS public.clients          CASCADE;
DROP TABLE IF EXISTS public.profiles         CASCADE;
DROP TABLE IF EXISTS public.user_sessions    CASCADE;

-------------------------------------------------
-- PROFILES (extends auth.users)
-------------------------------------------------
CREATE TABLE public.profiles (
   id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   auth_user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   email            TEXT NOT NULL,
   full_name        TEXT,
   role             user_role NOT NULL,
   status           user_status DEFAULT 'active',
   created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   updated_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   last_login       TIMESTAMP WITH TIME ZONE,
   created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
   UNIQUE (auth_user_id),
   UNIQUE (email)
);

-------------------------------------------------
-- CLIENTS
-------------------------------------------------
CREATE TABLE public.clients (
   id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
   company_name TEXT NOT NULL,
   company_domain TEXT,
   contact_phone TEXT,
   address      TEXT,
   settings     JSONB DEFAULT '{}'::jsonb,
   created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   updated_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   UNIQUE (profile_id)
);

-------------------------------------------------
-- SUBUSERS
-------------------------------------------------
CREATE TABLE public.subusers (
   id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
   profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
   role_name   TEXT NOT NULL,                     -- e.g., "Social Media Manager"
   permissions JSONB DEFAULT '{}'::jsonb,         -- module‑based permissions
   status      user_status DEFAULT 'active',
   created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
   UNIQUE (profile_id)
);

-------------------------------------------------
-- AUDIT LOGS
-------------------------------------------------
CREATE TABLE public.audit_logs (
   id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
   action           TEXT NOT NULL,
   target_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
   target_client_id  UUID REFERENCES public.clients(id) ON DELETE SET NULL,
   details          JSONB DEFAULT '{}'::jsonb,
   ip_address       INET,
   user_agent       TEXT,
   timestamp        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-------------------------------------------------
-- USER SESSIONS (JWT management)
-------------------------------------------------
CREATE TABLE public.user_sessions (
   id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   profile_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
   refresh_token_hash TEXT NOT NULL,
   expires_at         TIMESTAMP WITH TIME ZONE NOT NULL,
   created_at         TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   last_used          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
   ip_address         INET,
   user_agent         TEXT,
   is_revoked         BOOLEAN DEFAULT FALSE
);

-------------------------------------------------
-- INDEXES (performance)
-------------------------------------------------
CREATE INDEX idx_profiles_auth_user_id   ON public.profiles(auth_user_id);
CREATE INDEX idx_profiles_email          ON public.profiles(email);
CREATE INDEX idx_profiles_role          ON public.profiles(role);
CREATE INDEX idx_profiles_status        ON public.profiles(status);
CREATE INDEX idx_profiles_created_by    ON public.profiles(created_by);

CREATE INDEX idx_clients_profile_id      ON public.clients(profile_id);
CREATE INDEX idx_clients_company_name    ON public.clients(company_name);

CREATE INDEX idx_subusers_client_id      ON public.subusers(client_id);
CREATE INDEX idx_subusers_profile_id     ON public.subusers(profile_id);
CREATE INDEX idx_subusers_status         ON public.subusers(status);
CREATE INDEX idx_subusers_created_by     ON public.subusers(created_by);

CREATE INDEX idx_audit_logs_actor        ON public.audit_logs(actor_profile_id);
CREATE INDEX idx_audit_logs_target       ON public.audit_logs(target_profile_id);
CREATE INDEX idx_audit_logs_timestamp    ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action       ON public.audit_logs(action);

CREATE INDEX idx_user_sessions_profile_id   ON public.user_sessions(profile_id);
CREATE INDEX idx_user_sessions_refresh_token ON public.user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at    ON public.user_sessions(expires_at);

-------------------------------------------------
-- ENABLE ROW‑LEVEL SECURITY
-------------------------------------------------
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subusers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-------------------------------------------------
-- RLS POLICIES (unchanged – kept for reference)
-------------------------------------------------
-- Profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can view their own profile and their subusers" ON public.profiles
  FOR SELECT USING (
    auth_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.subusers s
            JOIN public.clients c ON s.client_id = c.id
            JOIN public.profiles cp ON c.profile_id = cp.id
            WHERE s.profile_id = profiles.id AND cp.auth_user_id = auth.uid())
  );

CREATE POLICY "Subusers can view their own profile" ON public.profiles
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can insert subuser profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    role = 'subuser' AND
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'client')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Clients
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can view their own client record" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.id = profile_id)
  );

CREATE POLICY "Subusers can view their client's record" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.subusers s
            JOIN public.profiles p ON s.profile_id = p.id
            WHERE p.auth_user_id = auth.uid() AND s.client_id = clients.id)
  );

CREATE POLICY "Admins can insert clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update all clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can update their own record" ON public.clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.id = profile_id)
  );

-- Subusers
CREATE POLICY "Admins can view all subusers" ON public.subusers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can view their subusers" ON public.subusers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients c
            JOIN public.profiles p ON c.profile_id = p.id
            WHERE p.auth_user_id = auth.uid() AND c.id = client_id)
  );

CREATE POLICY "Subusers can view their own record" ON public.subusers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.id = profile_id)
  );

CREATE POLICY "Clients can insert subusers" ON public.subusers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients c
            JOIN public.profiles p ON c.profile_id = p.id
            WHERE p.auth_user_id = auth.uid() AND c.id = client_id)
  );

CREATE POLICY "Clients can update their subusers" ON public.subusers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clients c
            JOIN public.profiles p ON c.profile_id = p.id
            WHERE p.auth_user_id = auth.uid() AND c.id = client_id)
  );

-- Audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Clients can view audit logs for their workspace" ON public.audit_logs
  FOR SELECT USING (
    target_client_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.clients c
            JOIN public.profiles p ON c.profile_id = p.id
            WHERE p.auth_user_id = auth.uid() AND c.id = target_client_id)
  );

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (
    actor_profile_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR target_profile_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- User sessions
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (
    profile_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-------------------------------------------------
-- FUNCTIONS (unchanged – kept for reference)
-------------------------------------------------
-- create_client, create_subuser, log_user_action, update_last_login,
-- update_updated_at_column and associated triggers
-- (copy exactly as you had them; they remain valid)

-------------------------------------------------
-- COMMENTS
-------------------------------------------------
COMMENT ON TABLE public.profiles IS
  'User profiles extending Supabase auth.users with role‑based access control';
COMMENT ON TABLE public.clients IS
  'Client companies managed by admins';
COMMENT ON TABLE public.subusers IS
  'Sub‑users managed by clients with specific permissions';
COMMENT ON TABLE public.audit_logs IS
  'Comprehensive audit trail for all user actions';
COMMENT ON TABLE public.user_sessions IS
  'JWT refresh token management for secure sessions';