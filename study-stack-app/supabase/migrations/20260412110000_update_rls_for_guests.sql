
-- Update notes policy to allow anonymous users to view published notes
DROP POLICY IF EXISTS "Published notes viewable by authenticated" ON public.notes;
CREATE POLICY "Published notes viewable by everyone" ON public.notes FOR SELECT USING (is_published = true);
