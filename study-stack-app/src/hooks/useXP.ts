import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useXP = () => {
  const { user } = useAuth();
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const XP_PER_LEVEL = 100;

  const fetchXP = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setXP(data.total_xp);
      setLevel(data.level);
    } else {
      // Create record if doesn't exist
      await supabase.from("user_xp").insert({ user_id: user.id, total_xp: 0, level: 1 });
      setXP(0);
      setLevel(1);
    }
    setLoading(false);
  };

  const addXP = async (amount: number) => {
    if (!user) return;

    const newXP = xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

    const { error } = await supabase
      .from("user_xp")
      .update({ 
        total_xp: newXP, 
        level: newLevel,
        updated_at: new Date().toISOString() 
      })
      .eq("user_id", user.id);

    if (!error) {
      setXP(newXP);
      setLevel(newLevel);
    }
  };

  useEffect(() => {
    fetchXP();
  }, [user]);

  return { xp, level, progress: (xp % XP_PER_LEVEL), nextLevelXP: XP_PER_LEVEL, addXP, loading };
};
