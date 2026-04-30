import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStudyStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("study_streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setStreak(data.current_streak);
    }
    setLoading(false);
  };

  const recordActivity = async (type: 'note_view' | 'quiz_complete' | 'flashcard_review') => {
    if (!user) return;
    
    // 1. Record in study_activity
    await supabase.from("study_activity").insert({
      user_id: user.id,
      activity_type: type,
      xp_earned: type === 'note_view' ? 5 : 20
    });

    // 2. Update streak (Simplified logic: increment if last_study_date was yesterday)
    const today = new Date().toISOString().split('T')[0];
    const { data: currentStreak } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!currentStreak) {
      await supabase.from("study_streaks").insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_study_date: today,
        total_study_days: 1
      });
      setStreak(1);
    } else {
      const lastDate = currentStreak.last_study_date;
      if (lastDate === today) return; // Already updated today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastDate === yesterdayStr) {
        newStreak = currentStreak.current_streak + 1;
      }

      await supabase.from("study_streaks").update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, currentStreak.longest_streak),
        last_study_date: today,
        total_study_days: currentStreak.total_study_days + 1,
        updated_at: new Date().toISOString()
      }).eq("user_id", user.id);
      
      setStreak(newStreak);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [user]);

  return { streak, loading, recordActivity };
};
