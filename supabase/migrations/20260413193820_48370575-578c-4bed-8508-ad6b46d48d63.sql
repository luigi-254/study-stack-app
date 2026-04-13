
-- Drop the old authenticated-only policy for published notes
DROP POLICY IF EXISTS "Published notes viewable by authenticated" ON public.notes;

-- Allow everyone to view published notes (public access)
CREATE POLICY "Published notes viewable by everyone"
ON public.notes FOR SELECT
TO public
USING (is_published = true);
