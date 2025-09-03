--------------------------------------------------------------------
-- 1️⃣  Table definition (create if missing)
--------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_ref   text NOT NULL,               -- frontend lead id (FK can be added later)
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------
-- 2️⃣  Enable Row‑Level Security
--------------------------------------------------------------------
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------
-- 3️⃣  Policies – drop & recreate (idempotent)
--------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read lead comments"   ON public.lead_comments;
CREATE POLICY "Anyone can read lead comments"
  ON public.lead_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert lead comments" ON public.lead_comments;
CREATE POLICY "Anyone can insert lead comments"
  ON public.lead_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update lead comments" ON public.lead_comments;
CREATE POLICY "Anyone can update lead comments"
  ON public.lead_comments
  FOR UPDATE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can delete lead comments" ON public.lead_comments;
CREATE POLICY "Anyone can delete lead comments"
  ON public.lead_comments
  FOR DELETE
  TO anon, authenticated
  USING (true);

--------------------------------------------------------------------
-- 4️⃣  Realtime configuration
--------------------------------------------------------------------
ALTER TABLE public.lead_comments REPLICA IDENTITY FULL;

-- Add to Supabase Realtime publication only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c        ON pr.prrelid = c.oid
    JOIN pg_namespace n    ON c.relnamespace = n.oid
    WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
      AND n.nspname = 'public'
      AND c.relname = 'lead_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_comments;
  END IF;
END
$$;