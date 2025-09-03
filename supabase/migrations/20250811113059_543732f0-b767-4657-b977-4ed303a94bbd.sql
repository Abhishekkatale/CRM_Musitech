-----------------------------------------------------------------
-- 1️⃣  Table definition
-----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_ref   text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-----------------------------------------------------------------
-- 2️⃣  Enable Row‑Level Security (RLS)
-----------------------------------------------------------------
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------------------
-- 3️⃣  Re‑create policies (drop‑if‑exists first)
-----------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read lead comments"   ON public.lead_comments;
DROP POLICY IF EXISTS "Anyone can insert lead comments" ON public.lead_comments;
DROP POLICY IF EXISTS "Anyone can update lead comments" ON public.lead_comments;
DROP POLICY IF EXISTS "Anyone can delete lead comments" ON public.lead_comments;

-- READ – anyone (anon or authenticated) may SELECT
CREATE POLICY "Anyone can read lead comments"
  ON public.lead_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT – anyone may INSERT
CREATE POLICY "Anyone can insert lead comments"
  ON public.lead_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- UPDATE – anyone may UPDATE (UPDATE policies need only USING)
CREATE POLICY "Anyone can update lead comments"
  ON public.lead_comments
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- DELETE – anyone may DELETE
CREATE POLICY "Anyone can delete lead comments"
  ON public.lead_comments
  FOR DELETE
  TO anon, authenticated
  USING (true);

-----------------------------------------------------------------
-- 4️⃣  Realtime configuration
-----------------------------------------------------------------
ALTER TABLE public.lead_comments REPLICA IDENTITY FULL;

-----------------------------------------------------------------
-- 5️⃣  Add table to the Supabase realtime publication – idempotently
-----------------------------------------------------------------
DO $$
BEGIN
  -- If the table is NOT already part of the publication, add it.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication          p
    JOIN pg_publication_rel      pr ON p.oid = pr.prpubid
    JOIN pg_class                c  ON pr.prrelid = c.oid
    JOIN pg_namespace            n  ON c.relnamespace = n.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'lead_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.lead_comments;
  END IF;
END $$;