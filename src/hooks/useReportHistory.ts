import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface ReportHistoryItem {
  id: string;
  user_id: string;
  user_email: string | null;
  report_type: string;
  report_content: string;
  report_data: Json | null;
  created_at: string;
}

export function useReportHistory() {
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("report_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports((data as ReportHistoryItem[]) || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Erro ao carregar histórico de relatórios");
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async (
    reportType: string,
    reportContent: string,
    reportData?: Record<string, unknown>
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("report_history").insert([{
        user_id: session.session.user.id,
        user_email: session.session.user.email,
        report_type: reportType,
        report_content: reportContent,
        report_data: (reportData || null) as Json,
      }]);

      if (error) throw error;

      toast.success("Relatório salvo no histórico");
      fetchReports();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Erro ao salvar relatório");
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("report_history")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success("Relatório excluído");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erro ao excluir relatório");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    isLoading,
    saveReport,
    deleteReport,
    refetch: fetchReports,
  };
}
