
-- Add new columns to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_top_pick BOOLEAN DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create Storage bucket for thumbnails if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-thumbnails', 'note-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnails
CREATE POLICY "Anyone can view thumbnails" ON storage.objects 
FOR SELECT USING (bucket_id = 'note-thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'note-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own thumbnails" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'note-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own thumbnails" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'note-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
