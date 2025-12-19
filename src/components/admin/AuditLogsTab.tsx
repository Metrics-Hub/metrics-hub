import React, { useMemo } from "react";
import { Loader2, History, RefreshCw, Clock, User, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLogs";
import { useLoginHistory, LoginHistoryEntry } from "@/hooks/useLoginHistory";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    create: "Criou",
    update: "Atualizou",
    delete: "Removeu",
    login: "Login",
    logout: "Logout",
    role_change: "Alterou role",
    settings_update: "Alterou configuração",
  };
  return labels[action] || action;
};

const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (action) {
    case "delete":
      return "destructive";
    case "create":
      return "default";
    case "update":
    case "role_change":
    case "settings_update":
      return "secondary";
    default:
      return "outline";
  }
};

const getEntityLabel = (entityType: string) => {
  const labels: Record<string, string> = {
    user: "Usuário",
    role: "Role",
    settings: "Configuração",
    lead_goal: "Meta de Leads",
  };
  return labels[entityType] || entityType;
};

interface AuditLogItemProps {
  log: AuditLog;
  getUserEmail: (userId: string | null) => string;
}

const AuditLogItem = React.forwardRef<HTMLDivElement, AuditLogItemProps>(
  ({ log, getUserEmail }, ref) => (
    <div ref={ref} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getActionVariant(log.action)}>
            {getActionLabel(log.action)}
          </Badge>
          <span className="text-sm font-medium">
            {getEntityLabel(log.entity_type)}
          </span>
          {log.entity_id && (
            <span className="text-xs text-muted-foreground truncate">
              #{log.entity_id.slice(0, 8)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          por {getUserEmail(log.user_id)}
        </p>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
        </div>
      </div>
    </div>
  )
);
AuditLogItem.displayName = "AuditLogItem";

interface LoginHistoryItemProps {
  entry: LoginHistoryEntry;
}

const LoginHistoryItem = React.forwardRef<HTMLDivElement, LoginHistoryItemProps>(
  ({ entry }, ref) => (
    <div ref={ref} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className={`p-2 rounded-full ${entry.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{entry.user_email || "Usuário"}</span>
          <Badge variant={entry.success ? "default" : "destructive"}>
            {entry.success ? "Sucesso" : "Falha"}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(entry.login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </div>
    </div>
  )
);
LoginHistoryItem.displayName = "LoginHistoryItem";

export function AuditLogsTab() {
  const { logs, loading: logsLoading, refetch: refetchLogs } = useAuditLogs();
  const { history, loading: historyLoading, refetch: refetchHistory } = useLoginHistory();
  const { allUsers } = useAdminUsers();

  // Create user_id -> email lookup map
  const userEmailMap = useMemo(() => {
    const map = new Map<string, string>();
    allUsers.forEach(user => {
      map.set(user.id, user.email);
    });
    return map;
  }, [allUsers]);

  // Helper function to get email from user_id
  const getUserEmail = (userId: string | null): string => {
    if (!userId) return "Sistema";
    return userEmailMap.get(userId) || `Usuário ${userId.slice(0, 8)}...`;
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Logs e Auditoria</CardTitle>
              <CardDescription>
                Histórico de ações e acessos ao sistema
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchLogs();
              refetchHistory();
            }}
            disabled={logsLoading || historyLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(logsLoading || historyLoading) ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions">Ações</TabsTrigger>
            <TabsTrigger value="logins">Histórico de Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="actions" className="mt-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma ação registrada ainda</p>
                <p className="text-sm">As ações administrativas aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {logs.map((log) => (
                    <AuditLogItem key={log.id} log={log} getUserEmail={getUserEmail} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="logins" className="mt-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum login registrado ainda</p>
                <p className="text-sm">O histórico de logins aparecerá aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {history.map((entry) => (
                    <LoginHistoryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
