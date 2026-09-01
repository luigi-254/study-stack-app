import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudyGoals {
  weekly_notes_target: number;
  weekly_minutes_target: number;
  preferred_days: string[];
  session_start: string;
  session_end: string;
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DEFAULT_GOALS: StudyGoals = {
  weekly_notes_target: 3,
  weekly_minutes_target: 180,
  preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  session_start: "18:00",
  session_end: "20:00",
};

const startOfWeek = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useStudyGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<StudyGoals | null>(null);
  const [weeklyCompleted, setWeeklyCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: row }, { data: progress }] = await Promise.all([
        supabase
          .from("study_goals")
          .select("weekly_notes_target, weekly_minutes_target, preferred_days, session_start, session_end")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_note_progress")
          .select("note_id, completed, updated_at")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", startOfWeek().toISOString()),
      ]);

      setGoals(row ? (row as StudyGoals) : null);
      setWeeklyCompleted((progress ?? []).length);
    } catch (e) {
      console.error("Study goals fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveGoals = async (next: StudyGoals) => {
    if (!user) return { error: new Error("Not signed in") };
    const { error } = await supabase
      .from("study_goals")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (!error) setGoals(next);
    return { error };
  };

  const target = goals?.weekly_notes_target ?? DEFAULT_GOALS.weekly_notes_target;
  const goalPercent = target ? Math.min(100, Math.round((weeklyCompleted / target) * 100)) : 0;

  return { goals, weeklyCompleted, goalPercent, loading, saveGoals, reload: load };
};
