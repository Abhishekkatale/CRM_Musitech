-------------------------------------------------
-- 1️⃣  Create the table only if it does not exist
-------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider           TEXT NOT NULL,
    access_token       TEXT NOT NULL,
    refresh_token      TEXT,
    expires_at         TIMESTAMPTZ,
    provider_specific_id TEXT,                -- e.g. Facebook Ad Account ID
    created_at         TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, provider)
);

-------------------------------------------------
-- 2️⃣  Enable Row‑Level Security (safe to repeat)
-------------------------------------------------
ALTER TABLE public.user_credentials
    ENABLE ROW LEVEL SECURITY;

-------------------------------------------------
-- 3️⃣  (Re)create the policy safely
-------------------------------------------------
-- Drop the existing policy if it is already present
DROP POLICY IF EXISTS "Allow users to manage their own credentials"
    ON public.user_credentials;

-- Create the policy that restricts access to a user’s own rows
CREATE POLICY "Allow users to manage their own credentials"
    ON public.user_credentials
    FOR ALL
    TO authenticated, anon          -- apply to the Supabase roles you need
    USING ( (SELECT auth.uid()) = user_id )
    WITH CHECK ( (SELECT auth.uid()) = user_id );