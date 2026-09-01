CREATE TABLE public.study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_notes_target integer NOT NULL DEFAULT 3,
  weekly_minutes_target integer NOT NULL DEFAULT 180,
  preferred_days text[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  session_start time NOT NULL DEFAULT '18:00',
  session_end time NOT NULL DEFAULT '20:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_goals TO authenticated;
GRANT ALL ON public.study_goals TO service_role;

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study goals" ON public.study_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study goals" ON public.study_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study goals" ON public.study_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own study goals" ON public.study_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_study_goals_updated_at BEFORE UPDATE ON public.study_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();