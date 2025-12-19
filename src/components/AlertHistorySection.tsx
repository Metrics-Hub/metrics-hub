import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Check,
  CheckCheck,
  Bell,
  DollarSign,
  Target,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface AlertHistoryItem {
  id: string;
  alert_config_id: string;
  metric_value: number;
  threshold_value: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

const metricIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cpl: DollarSign,
  ctr: TrendingDown,
  spend: DollarSign,
  leads_progress: Target,
};

export function AlertHistorySection() {
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data as AlertHistoryItem[]) || []);
    } catch (error) {
      console.error("Error fetching alert history:", error);
      toast.error("Erro ao carregar histórico de alertas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alert_history")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setHistory((prev) =>
        prev.map((h) => (h.id === id ? { ...h, is_read: true } : h))
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = history.filter((h) => !h.is_read).map((h) => h.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("alert_history")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;

      setHistory((prev) => prev.map((h) => ({ ...h, is_read: true })));
      toast.success("Todos os alertas marcados como lidos");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Erro ao marcar alertas como lidos");
    }
  };

  const unreadCount = history.filter((h) => !h.is_read).length;

  return (
    <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Histórico de Alertas
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} não lidos</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todos como lidos
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-3 md:p-6">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[60%] mb-2" />
                  <Skeleton className="h-3 w-[40%]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && history.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum alerta disparado ainda</p>
            <p className="text-xs mt-1">
              Os alertas aparecerão aqui quando as condições forem satisfeitas
            </p>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <ScrollArea className="h-[400px]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-2 pr-4">
                {history.map((item, index) => {
                  const Icon = metricIcons.cpl || AlertTriangle;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        item.is_read
                          ? "bg-muted/30 opacity-70"
                          : "bg-card hover:bg-muted/50"
                      }`}
                      onClick={() => !item.is_read && markAsRead(item.id)}
                    >
                      <div
                        className={`p-2 rounded-md ${
                          item.is_read ? "bg-muted" : "bg-primary/10"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            item.is_read ? "text-muted-foreground" : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            item.is_read ? "text-muted-foreground" : "font-medium"
                          }`}
                        >
                          {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!item.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                      {item.is_read && (
                        <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
