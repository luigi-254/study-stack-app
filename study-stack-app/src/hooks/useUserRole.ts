import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id ?? null;
    
    // Skip if we already checked this user
    if (userId === lastCheckedUserId.current) return;
    
    lastCheckedUserId.current = userId;
    setLoading(true);
    setIsAdmin(false);

    const checkRole = async () => {
      if (!userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      // Only update if this is still the current user
      if (lastCheckedUserId.current === userId) {
        setIsAdmin(!!data && !error);
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return { isAdmin, loading };
};
