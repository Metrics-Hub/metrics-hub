import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Trash2,
  Facebook,
  FileSpreadsheet,
  Users,
  FolderOpen
} from 'lucide-react';
import { useSyncConfig, SyncLog } from '@/hooks/useSyncConfig';
import { useProjects } from '@/hooks/useProjects';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const integrationTypeConfig = {
  meta_ads: { 
    label: 'Meta Ads', 
    icon: Facebook, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  google_ads_sheets: { 
    label: 'Google Ads', 
    icon: GoogleIcon, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  google_sheets_leads: { 
    label: 'Google Sheets', 
    icon: FileSpreadsheet, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
};

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: Clock },
  running: { label: 'Executando', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: Loader2 },
  success: { label: 'Sucesso', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  failed: { label: 'Falha', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export function SyncConfigTab() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Pass projectId to hook for filtered data
  const selectedProjectId = projectFilter === 'all' ? null : projectFilter;
  const { config, logs, status, loading, syncing, updateConfig, triggerManualSync, clearLogs } = useSyncConfig(selectedProjectId);

  if (loading || projectsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (typeFilter !== 'all' && log.integration_type !== typeFilter) return false;
    return true;
  });

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId.slice(0, 8);
  };

  const getProjectColor = (projectId: string | null) => {
    if (!projectId) return undefined;
    const project = projects.find(p => p.id === projectId);
    return project?.color;
  };

  const handleSyncProject = () => {
    if (projectFilter !== 'all') {
      triggerManualSync(projectFilter);
    } else {
      triggerManualSync();
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Sincronização por Projeto
            </CardTitle>
            <CardDescription>
              Filtre e sincronize dados por projeto específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        Todos os Projetos
                      </div>
                    </SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ background: project.color || '#6b7280' }} 
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleSyncProject}
                disabled={syncing}
                variant={projectFilter !== 'all' ? 'default' : 'outline'}
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {projectFilter !== 'all' ? 'Sincronizar Projeto' : 'Sincronizar Todos'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Configuração de Sincronização
            </CardTitle>
            <CardDescription>
              Configure a sincronização automática das integrações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sincronização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Atualiza dados automaticamente no intervalo configurado
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => updateConfig({ enabled })}
              />
            </div>

            {/* Interval */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Intervalo de Sincronização</Label>
                <p className="text-sm text-muted-foreground">
                  Frequência de atualização automática
                </p>
              </div>
              <Select
                value={config.intervalHours.toString()}
                onValueChange={(value) => updateConfig({ intervalHours: parseInt(value) })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Integration Toggles */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base">Integrações a Sincronizar</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Meta Ads</span>
                  </div>
                  <Switch
                    checked={config.syncMetaAds}
                    onCheckedChange={(syncMetaAds) => updateConfig({ syncMetaAds })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GoogleIcon />
                    <span className="text-sm">Google Ads (Planilhas)</span>
                  </div>
                  <Switch
                    checked={config.syncGoogleAdsSheets}
                    onCheckedChange={(syncGoogleAdsSheets) => updateConfig({ syncGoogleAdsSheets })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Google Sheets (Leads)</span>
                  </div>
                  <Switch
                    checked={config.syncGoogleSheetsLeads}
                    onCheckedChange={(syncGoogleSheetsLeads) => updateConfig({ syncGoogleSheetsLeads })}
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base">Notificações</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm">Notificar em caso de falha</span>
                    <p className="text-xs text-muted-foreground">Cria alerta quando sincronização falhar</p>
                  </div>
                  <Switch
                    checked={config.notifyOnFailure}
                    onCheckedChange={(notifyOnFailure) => updateConfig({ notifyOnFailure })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm">Tentar novamente em falha</span>
                    <p className="text-xs text-muted-foreground">Máximo de {config.maxRetries} tentativas</p>
                  </div>
                  <Switch
                    checked={config.retryOnFailure}
                    onCheckedChange={(retryOnFailure) => updateConfig({ retryOnFailure })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Status da Sincronização
              {projectFilter !== 'all' && (
                <Badge variant="secondary" className="ml-2">
                  {getProjectName(projectFilter)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(status).map(([type, data]) => {
                const typeConfig = integrationTypeConfig[type as keyof typeof integrationTypeConfig];
                const Icon = typeConfig.icon;
                const StatusIcon = data.status === 'success' 
                  ? CheckCircle 
                  : data.status === 'failed' 
                    ? XCircle 
                    : AlertTriangle;
                const statusColor = data.status === 'success' 
                  ? 'text-emerald-500' 
                  : data.status === 'failed' 
                    ? 'text-destructive' 
                    : 'text-muted-foreground';

                return (
                  <div
                    key={type}
                    className={`p-4 rounded-lg border ${typeConfig.bgColor}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                      <span className="font-medium text-sm">{typeConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                      <span className="text-xs text-muted-foreground">
                        {data.lastSync 
                          ? formatDistanceToNow(new Date(data.lastSync), { addSuffix: true, locale: ptBR })
                          : 'Nunca sincronizado'
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logs Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Histórico de Sincronização</span>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="meta_ads">Meta Ads</SelectItem>
                    <SelectItem value="google_ads_sheets">Google Ads</SelectItem>
                    <SelectItem value="google_sheets_leads">Leads</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="failed">Falha</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearLogs(30)}
                  className="h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Limpar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Integração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum registro de sincronização encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const typeConfig = integrationTypeConfig[log.integration_type as keyof typeof integrationTypeConfig];
                      const statusCfg = statusConfig[log.status];
                      const StatusIcon = statusCfg.icon;
                      const TypeIcon = typeConfig?.icon || FileSpreadsheet;
                      const projectColor = getProjectColor(log.project_id);

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {format(new Date(log.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {projectColor && (
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ background: projectColor }} 
                                />
                              )}
                              <span className="text-xs truncate max-w-[100px]">
                                {getProjectName(log.project_id)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className={`h-3.5 w-3.5 ${typeConfig?.color || ''}`} />
                              <span className="text-xs">{typeConfig?.label || log.integration_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium max-w-[150px] truncate">
                            {log.integration_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${log.status === 'running' ? 'animate-spin' : ''}`} />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {log.records_processed}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatDuration(log.duration_ms)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {log.triggered_by === 'manual' ? 'Manual' : 'Cron'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
