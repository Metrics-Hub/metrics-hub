import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  user_email: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
}

export function useLoginHistory(limit = 50) {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .order("login_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setHistory((data as LoginHistoryEntry[]) || []);
    } catch (err) {
      console.error("Error fetching login history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [limit]);

  return { history, loading, refetch: fetchHistory };
}
