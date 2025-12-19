import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Target,
  TrendingDown,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { AlertHistorySection } from "@/components/AlertHistorySection";

interface AlertConfiguration {
  id: string;
  project_id: string | null;
  metric_type: string;
  threshold_value: number;
  comparison_operator: string;
  is_active: boolean;
  notification_channels: string[];
  created_at: string;
}

const metricTypes = [
  { value: "cpl", label: "CPL (Custo por Lead)", icon: DollarSign, unit: "R$", unitPosition: "prefix" },
  { value: "ctr", label: "CTR (Taxa de Cliques)", icon: TrendingDown, unit: "%", unitPosition: "suffix" },
  { value: "spend", label: "Investimento Total", icon: DollarSign, unit: "R$", unitPosition: "prefix" },
  { value: "leads_progress", label: "Progresso de Leads", icon: Target, unit: "%", unitPosition: "suffix" },
];

const operators = [
  { value: "greater_than", label: "Maior que" },
  { value: "less_than", label: "Menor que" },
  { value: "equals", label: "Igual a" },
];

const getMetricUnit = (metricType: string) => {
  const metric = metricTypes.find((m) => m.value === metricType);
  return { unit: metric?.unit || "", position: metric?.unitPosition || "suffix" };
};

export function AlertsTab() {
  const { projects, activeProject, setActiveProject } = useProjects();
  const [alerts, setAlerts] = useState<AlertConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editing state
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState({
    metric_type: "",
    threshold_value: 0,
    comparison_operator: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // New alert form
  const [newAlert, setNewAlert] = useState({
    metric_type: "cpl",
    threshold_value: 50,
    comparison_operator: "greater_than",
    is_active: true,
  });

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data as AlertConfiguration[]) || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Erro ao carregar alertas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async () => {
    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("alert_configurations").insert([{
        project_id: activeProject?.id || null,
        metric_type: newAlert.metric_type,
        threshold_value: newAlert.threshold_value,
        comparison_operator: newAlert.comparison_operator,
        is_active: newAlert.is_active,
        created_by: session.session.user.id,
      }]);

      if (error) throw error;

      toast.success("Alerta criado com sucesso");
      fetchAlerts();
      setNewAlert({
        metric_type: "cpl",
        threshold_value: 50,
        comparison_operator: "greater_than",
        is_active: true,
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Erro ao criar alerta");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("alert_configurations")
        .update({ is_active: isActive })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_active: isActive } : a))
      );
      toast.success(isActive ? "Alerta ativado" : "Alerta desativado");
    } catch (error) {
      console.error("Error toggling alert:", error);
      toast.error("Erro ao atualizar alerta");
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alert_configurations")
        .delete()
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerta excluído");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Erro ao excluir alerta");
    }
  };

  const startEditing = (alert: AlertConfiguration) => {
    setEditingAlertId(alert.id);
    setEditingValues({
      metric_type: alert.metric_type,
      threshold_value: alert.threshold_value,
      comparison_operator: alert.comparison_operator,
    });
  };

  const cancelEditing = () => {
    setEditingAlertId(null);
    setEditingValues({
      metric_type: "",
      threshold_value: 0,
      comparison_operator: "",
    });
  };

  const updateAlert = async () => {
    if (!editingAlertId) return;
    
    if (editingValues.threshold_value < 0) {
      toast.error("O valor limite não pode ser negativo");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("alert_configurations")
        .update({
          metric_type: editingValues.metric_type,
          threshold_value: editingValues.threshold_value,
          comparison_operator: editingValues.comparison_operator,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingAlertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === editingAlertId
            ? {
                ...a,
                metric_type: editingValues.metric_type,
                threshold_value: editingValues.threshold_value,
                comparison_operator: editingValues.comparison_operator,
              }
            : a
        )
      );
      toast.success("Alerta atualizado");
      cancelEditing();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Erro ao atualizar alerta");
    } finally {
      setIsUpdating(false);
    }
  };

  const getMetricIcon = (metricType: string) => {
    const metric = metricTypes.find((m) => m.value === metricType);
    return metric?.icon || AlertTriangle;
  };

  const getMetricLabel = (metricType: string) => {
    const metric = metricTypes.find((m) => m.value === metricType);
    return metric?.label || metricType;
  };

  const getOperatorLabel = (operator: string) => {
    const op = operators.find((o) => o.value === operator);
    return op?.label || operator;
  };

  return (
    <div className="space-y-6">
      {/* Create New Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select
                value={activeProject?.id || "all"}
                onValueChange={(v) => {
                  const project = projects.find((p) => p.id === v);
                  setActiveProject(project || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Métrica</Label>
              <Select
                value={newAlert.metric_type}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({ ...prev, metric_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condição</Label>
              <Select
                value={newAlert.comparison_operator}
                onValueChange={(v) =>
                  setNewAlert((prev) => ({ ...prev, comparison_operator: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Limite</Label>
              <div className="relative">
                {getMetricUnit(newAlert.metric_type).position === "prefix" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {getMetricUnit(newAlert.metric_type).unit}
                  </span>
                )}
                <Input
                  type="number"
                  value={newAlert.threshold_value}
                  onChange={(e) =>
                    setNewAlert((prev) => ({
                      ...prev,
                      threshold_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={
                    getMetricUnit(newAlert.metric_type).position === "prefix"
                      ? "pl-9"
                      : "pr-8"
                  }
                />
                {getMetricUnit(newAlert.metric_type).position === "suffix" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {getMetricUnit(newAlert.metric_type).unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={newAlert.is_active}
                onCheckedChange={(v) =>
                  setNewAlert((prev) => ({ ...prev, is_active: v }))
                }
              />
              <Label>Ativar imediatamente</Label>
            </div>
            <Button onClick={createAlert} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Criar Alerta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Configurados
              {alerts.length > 0 && (
                <Badge variant="secondary">{alerts.length}</Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAlerts}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-[40%] mb-2" />
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum alerta configurado</p>
              <p className="text-xs mt-1">
                Crie alertas para ser notificado sobre métricas importantes
              </p>
            </div>
          )}

          {!isLoading && alerts.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {alerts.map((alert) => {
                  const Icon = getMetricIcon(alert.metric_type);
                  const isEditing = editingAlertId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        alert.is_active
                          ? "bg-card"
                          : "bg-muted/30 opacity-60"
                      }`}
                    >
                      {isEditing ? (
                        // Edit mode
                        <>
                          <div className="flex-1 grid gap-2 sm:grid-cols-3">
                            <Select
                              value={editingValues.metric_type}
                              onValueChange={(v) =>
                                setEditingValues((prev) => ({ ...prev, metric_type: v }))
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {metricTypes.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={editingValues.comparison_operator}
                              onValueChange={(v) =>
                                setEditingValues((prev) => ({ ...prev, comparison_operator: v }))
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operators.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="relative">
                              {getMetricUnit(editingValues.metric_type).position === "prefix" && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  {getMetricUnit(editingValues.metric_type).unit}
                                </span>
                              )}
                              <Input
                                type="number"
                                value={editingValues.threshold_value}
                                onChange={(e) =>
                                  setEditingValues((prev) => ({
                                    ...prev,
                                    threshold_value: parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className={`h-9 ${
                                  getMetricUnit(editingValues.metric_type).position === "prefix"
                                    ? "pl-9"
                                    : "pr-7"
                                }`}
                              />
                              {getMetricUnit(editingValues.metric_type).position === "suffix" && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  {getMetricUnit(editingValues.metric_type).unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={updateAlert}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={cancelEditing}
                              disabled={isUpdating}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        // View mode
                        <>
                          <div className="p-2 rounded-md bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-sm">
                                {getMetricLabel(alert.metric_type)}
                              </span>
                              <Badge
                                variant={alert.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {alert.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getOperatorLabel(alert.comparison_operator)}{" "}
                              <span className="font-medium">
                                {alert.metric_type === "cpl" || alert.metric_type === "spend"
                                  ? `R$ ${alert.threshold_value.toFixed(2)}`
                                  : alert.metric_type === "ctr" || alert.metric_type === "leads_progress"
                                  ? `${alert.threshold_value}%`
                                  : alert.threshold_value}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={alert.is_active}
                              onCheckedChange={(v) => toggleAlert(alert.id, v)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditing(alert)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAlert(alert.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Alert History Section */}
      <AlertHistorySection />
    </div>
  );
}
