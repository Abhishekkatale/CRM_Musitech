-- 0) Safety: ensure auth.users can be read for role checks (auth.users is special in Supabase)
-- 1) Temporarily disable RLS on profiles so we can drop/recreate policies safely
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2) Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their own profile and their subusers" ON public.profiles;
DROP POLICY IF EXISTS "Subusers can view their own profile" ON public.profiles;

-- 3) Create a safe SECURITY DEFINER helper to map auth.uid() -> profile id or role if needed.
-- This function reads auth.users (safe) and avoids querying public.profiles to prevent recursion.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT raw_user_meta_data ->> 'role'
  FROM auth.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Important: revoke execute from anon/authenticated to avoid misuse
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon, authenticated;

-- 4) Recreate policies for profiles using only auth.uid(), auth.users, or the helper above.
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    (public.get_current_user_role() = 'admin')
    OR EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (u.raw_user_meta_data ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Subusers can view their own profile" ON public.profiles
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
  );

-- For clients viewing subusers: avoid joining to profiles inside the policy.
-- Instead, check whether the requesting user is the owner of the client via a helper function,
-- or check a subusers -> client link where client.profile_id is compared to auth.uid() via auth.users.
-- We'll create a helper that verifies "is_requesting_user_owner_of_client(client_id)".
CREATE OR REPLACE FUNCTION public.is_requesting_user_owner_of_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients c
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE c.id = p_client_id::uuid
      AND p.auth_user_id = auth.uid()
  );
$$;
-- Revoke execute from anon/authenticated to prevent RLS bypass for other roles
REVOKE EXECUTE ON FUNCTION public.is_requesting_user_owner_of_client(uuid) FROM anon, authenticated;

-- Now create the client-oriented profile policy using the helper which is SECURITY DEFINER.
CREATE POLICY "Clients can view their own profile and their subusers" ON public.profiles
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.subusers s
      WHERE s.profile_id = profiles.id
        AND public.is_requesting_user_owner_of_client(s.client_id)
    )
  );

-- 5) Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;