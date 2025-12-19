import { useState, useEffect, useMemo } from "react";
import { Loader2, Target, Save, Settings, Bell, Calendar, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle, FolderOpen, Calculator, RefreshCw, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getDaysInMonth, getDay, startOfMonth, endOfMonth, addDays, getWeeksInMonth, format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AppSettings, PeriodGoals, ProgressAlerts, AppPreferences } from "@/hooks/useAppSettings";
import type { Project } from "@/hooks/useProjects";

// Calculate business days (Mon-Fri) in a period
function getBusinessDaysInPeriod(startDate: Date, endDate: Date): number {
  let businessDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = getDay(currentDate);
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return businessDays;
}

// Calculate total days in period
function getTotalDaysInPeriod(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1;
}

// Calculate weeks in period
function getWeeksInPeriod(startDate: Date, endDate: Date): number {
  const totalDays = getTotalDaysInPeriod(startDate, endDate);
  return Math.ceil(totalDays / 7);
}

interface SettingsTabProps {
  settings: AppSettings;
  loading: boolean;
  projects?: Project[];
  activeProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  onUpdateLeadGoal: (goal: number) => Promise<boolean>;
  onUpdatePeriodGoals?: (goals: PeriodGoals) => Promise<boolean>;
  onUpdateProgressAlerts?: (alerts: ProgressAlerts) => Promise<boolean>;
  onUpdateAppPreferences?: (prefs: AppPreferences) => Promise<boolean>;
}

export function SettingsTab({ 
  settings, 
  loading, 
  projects,
  activeProject,
  onSelectProject,
  onUpdateLeadGoal,
  onUpdatePeriodGoals,
  onUpdateProgressAlerts,
  onUpdateAppPreferences 
}: SettingsTabProps) {
  // Period Goals State
  const [periodGoals, setPeriodGoals] = useState<PeriodGoals>(settings.periodGoals);
  const [savingGoals, setSavingGoals] = useState(false);

  // Progress Alerts State
  const [progressAlerts, setProgressAlerts] = useState<ProgressAlerts>(settings.progressAlerts);
  const [savingAlerts, setSavingAlerts] = useState(false);

  // App Preferences State
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(settings.appPreferences);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Sync state when settings load
  useEffect(() => {
    setPeriodGoals(settings.periodGoals);
    setProgressAlerts(settings.progressAlerts);
    setAppPreferences(settings.appPreferences);
  }, [settings]);

  const handleSaveGoals = async () => {
    if (!onUpdatePeriodGoals) return;
    setSavingGoals(true);
    await onUpdatePeriodGoals(periodGoals);
    setSavingGoals(false);
  };

  const handleSaveAlerts = async () => {
    if (!onUpdateProgressAlerts) return;
    setSavingAlerts(true);
    await onUpdateProgressAlerts(progressAlerts);
    setSavingAlerts(false);
  };

  const handleSavePreferences = async () => {
    if (!onUpdateAppPreferences) return;
    setSavingPreferences(true);
    await onUpdateAppPreferences(appPreferences);
    setSavingPreferences(false);
  };

  const hasGoalsChanged = JSON.stringify(periodGoals) !== JSON.stringify(settings.periodGoals);
  const hasAlertsChanged = JSON.stringify(progressAlerts) !== JSON.stringify(settings.progressAlerts);
  const hasPreferencesChanged = JSON.stringify(appPreferences) !== JSON.stringify(settings.appPreferences);

  // Calculate suggested weekly/daily goals based on campaign period
  const calculatedGoals = useMemo(() => {
    const monthlyLeads = periodGoals.monthly.leads;
    
    // Determine period dates
    let startDate: Date;
    let endDate: Date;
    
    if (!periodGoals.campaignPeriod?.useCurrentMonth && 
        periodGoals.campaignPeriod?.startDate && 
        periodGoals.campaignPeriod?.endDate) {
      startDate = parseISO(periodGoals.campaignPeriod.startDate);
      endDate = parseISO(periodGoals.campaignPeriod.endDate);
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }
    
    const weeksInPeriod = getWeeksInPeriod(startDate, endDate);
    const businessDays = getBusinessDaysInPeriod(startDate, endDate);
    const calendarDays = getTotalDaysInPeriod(startDate, endDate);
    
    return {
      weekly: Math.ceil(monthlyLeads / weeksInPeriod),
      dailyBusinessDays: Math.ceil(monthlyLeads / businessDays),
      dailyCalendarDays: Math.ceil(monthlyLeads / calendarDays),
      weeksInPeriod,
      businessDays,
      calendarDays,
      startDate,
      endDate,
    };
  }, [periodGoals.monthly.leads, periodGoals.campaignPeriod, appPreferences.weekStartsOn]);

  // Auto-calculate weekly goal
  const handleAutoCalculateWeekly = () => {
    setPeriodGoals(prev => ({
      ...prev,
      weekly: { ...prev.weekly, leads: calculatedGoals.weekly, enabled: true }
    }));
  };

  // Auto-calculate daily goal (using business days)
  const handleAutoCalculateDaily = (useBusinessDays: boolean = true) => {
    setPeriodGoals(prev => ({
      ...prev,
      daily: { 
        ...prev.daily, 
        leads: useBusinessDays ? calculatedGoals.dailyBusinessDays : calculatedGoals.dailyCalendarDays,
        enabled: true 
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selector for Period Goals */}
      {projects && projects.length > 0 && (
        <Card variant="glass" className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Projeto Selecionado</CardTitle>
                <CardDescription>
                  As metas por período são configuradas por projeto
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant={activeProject?.id === project.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectProject?.(project)}
                  className="gap-2"
                >
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: project.color || "#2563eb" }}
                  />
                  {project.name}
                </Button>
              ))}
            </div>
            {activeProject && (
              <p className="mt-3 text-sm text-muted-foreground">
                Configurando metas para: <Badge variant="outline" className="ml-1">{activeProject.name}</Badge>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Period Goals Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Metas por Período</CardTitle>
              <CardDescription>
                Configure metas mensais, semanais e diárias {activeProject ? `para ${activeProject.name}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Period Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Período de Captação</h4>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usar mês atual automaticamente</Label>
                <p className="text-xs text-muted-foreground">
                  {periodGoals.campaignPeriod?.useCurrentMonth !== false 
                    ? "Calculando baseado no mês corrente" 
                    : "Usando período personalizado"}
                </p>
              </div>
              <Switch
                checked={periodGoals.campaignPeriod?.useCurrentMonth !== false}
                onCheckedChange={(checked) => setPeriodGoals(prev => ({
                  ...prev,
                  campaignPeriod: { 
                    ...prev.campaignPeriod, 
                    useCurrentMonth: checked,
                    startDate: checked ? null : prev.campaignPeriod?.startDate || format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                    endDate: checked ? null : prev.campaignPeriod?.endDate || format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                  }
                }))}
              />
            </div>
            
            {periodGoals.campaignPeriod?.useCurrentMonth === false && (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodGoals.campaignPeriod?.startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {periodGoals.campaignPeriod?.startDate 
                            ? format(parseISO(periodGoals.campaignPeriod.startDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={periodGoals.campaignPeriod?.startDate ? parseISO(periodGoals.campaignPeriod.startDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const endDate = periodGoals.campaignPeriod?.endDate;
                              // If end date exists and new start is after end, also update end date
                              const newEndDate = endDate && date > parseISO(endDate) 
                                ? format(date, 'yyyy-MM-dd') 
                                : endDate;
                              
                              setPeriodGoals(prev => ({
                                ...prev,
                                campaignPeriod: { 
                                  ...prev.campaignPeriod, 
                                  startDate: format(date, 'yyyy-MM-dd'),
                                  endDate: newEndDate || prev.campaignPeriod?.endDate,
                                  useCurrentMonth: false
                                }
                              }));
                            }
                          }}
                          disabled={(date) => {
                            const endDate = periodGoals.campaignPeriod?.endDate;
                            if (endDate) {
                              return date > parseISO(endDate);
                            }
                            return false;
                          }}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data de Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodGoals.campaignPeriod?.endDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {periodGoals.campaignPeriod?.endDate 
                            ? format(parseISO(periodGoals.campaignPeriod.endDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={periodGoals.campaignPeriod?.endDate ? parseISO(periodGoals.campaignPeriod.endDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setPeriodGoals(prev => ({
                                ...prev,
                                campaignPeriod: { 
                                  ...prev.campaignPeriod, 
                                  endDate: format(date, 'yyyy-MM-dd'),
                                  useCurrentMonth: false
                                }
                              }));
                            }
                          }}
                          disabled={(date) => {
                            const startDate = periodGoals.campaignPeriod?.startDate;
                            if (startDate) {
                              return date < parseISO(startDate);
                            }
                            return false;
                          }}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Validation warning */}
                {periodGoals.campaignPeriod?.startDate && 
                 periodGoals.campaignPeriod?.endDate && 
                 parseISO(periodGoals.campaignPeriod.startDate) > parseISO(periodGoals.campaignPeriod.endDate) && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>A data de início não pode ser posterior à data de fim</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Period Info Badge */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                📅 {calculatedGoals.calendarDays} dias
              </Badge>
              <Badge variant="secondary" className="text-xs">
                💼 {calculatedGoals.businessDays} dias úteis
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📆 {calculatedGoals.weeksInPeriod} semanas
              </Badge>
              {periodGoals.campaignPeriod?.useCurrentMonth === false && (
                <Badge variant="outline" className="text-xs">
                  {format(calculatedGoals.startDate, "dd/MM", { locale: ptBR })} - {format(calculatedGoals.endDate, "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Monthly Goals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Metas do Período</h4>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="monthlyLeads">Meta de Leads</Label>
                <Input
                  id="monthlyLeads"
                  type="number"
                  min={1}
                  value={periodGoals.monthly.leads}
                  onChange={(e) => setPeriodGoals(prev => ({
                    ...prev,
                    monthly: { ...prev.monthly, leads: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlySpend">Investimento (R$)</Label>
                <Input
                  id="monthlySpend"
                  type="number"
                  min={0}
                  value={periodGoals.monthly.spend}
                  onChange={(e) => setPeriodGoals(prev => ({
                    ...prev,
                    monthly: { ...prev.monthly, spend: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyCpl">CPL Máximo (R$)</Label>
                <Input
                  id="monthlyCpl"
                  type="number"
                  min={0}
                  step={0.01}
                  value={periodGoals.monthly.cpl}
                  onChange={(e) => setPeriodGoals(prev => ({
                    ...prev,
                    monthly: { ...prev.monthly, cpl: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Weekly Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Meta Semanal</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs">
                        {calculatedGoals.weeksInPeriod} semanas
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>O período possui {calculatedGoals.weeksInPeriod} semanas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={periodGoals.weekly.enabled}
                onCheckedChange={(checked) => setPeriodGoals(prev => ({
                  ...prev,
                  weekly: { ...prev.weekly, enabled: checked }
                }))}
              />
            </div>
            {periodGoals.weekly.enabled && (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1 max-w-xs space-y-1.5">
                    <Label htmlFor="weeklyLeads">Leads por Semana</Label>
                    <Input
                      id="weeklyLeads"
                      type="number"
                      min={1}
                      value={periodGoals.weekly.leads}
                      onChange={(e) => setPeriodGoals(prev => ({
                        ...prev,
                        weekly: { ...prev.weekly, leads: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleAutoCalculateWeekly}
                          className="gap-1.5"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          Auto
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Calcular automaticamente: {periodGoals.monthly.leads} ÷ {calculatedGoals.weeksInPeriod} = {calculatedGoals.weekly} leads/semana</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {periodGoals.weekly.leads !== calculatedGoals.weekly && (
                  <p className="text-xs text-muted-foreground">
                    Sugestão: {calculatedGoals.weekly} leads/semana ({periodGoals.monthly.leads} ÷ {calculatedGoals.weeksInPeriod} semanas)
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Daily Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Meta Diária</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs">
                        {calculatedGoals.businessDays} dias úteis
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>O mês atual possui {calculatedGoals.businessDays} dias úteis (seg-sex) e {calculatedGoals.calendarDays} dias totais</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={periodGoals.daily.enabled}
                onCheckedChange={(checked) => setPeriodGoals(prev => ({
                  ...prev,
                  daily: { ...prev.daily, enabled: checked }
                }))}
              />
            </div>
            {periodGoals.daily.enabled && (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1 max-w-xs space-y-1.5">
                    <Label htmlFor="dailyLeads">Leads por Dia</Label>
                    <Input
                      id="dailyLeads"
                      type="number"
                      min={1}
                      value={periodGoals.daily.leads}
                      onChange={(e) => setPeriodGoals(prev => ({
                        ...prev,
                        daily: { ...prev.daily, leads: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAutoCalculateDaily(true)}
                            className="gap-1.5"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            Úteis
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dias úteis: {periodGoals.monthly.leads} ÷ {calculatedGoals.businessDays} = {calculatedGoals.dailyBusinessDays} leads/dia</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAutoCalculateDaily(false)}
                            className="gap-1.5"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Todos
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Todos os dias: {periodGoals.monthly.leads} ÷ {calculatedGoals.calendarDays} = {calculatedGoals.dailyCalendarDays} leads/dia</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sugestão: {calculatedGoals.dailyBusinessDays} leads/dia útil ou {calculatedGoals.dailyCalendarDays} leads/dia (todos)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveGoals}
              disabled={savingGoals || !hasGoalsChanged}
              className="gap-2"
            >
              {savingGoals ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Metas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Alerts Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Alertas de Progresso</CardTitle>
                <CardDescription>
                  Configure indicadores visuais baseados no progresso
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={progressAlerts.enabled}
              onCheckedChange={(checked) => setProgressAlerts(prev => ({
                ...prev,
                enabled: checked
              }))}
            />
          </div>
        </CardHeader>
        {progressAlerts.enabled && (
          <CardContent className="space-y-6">
            {/* Thresholds */}
            <div className="space-y-4">
              <h4 className="font-medium">Níveis de Alerta</h4>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span className="text-sm">Crítico (abaixo de)</span>
                    </div>
                    <span className="text-sm font-medium">{progressAlerts.thresholds.danger}%</span>
                  </div>
                  <Slider
                    value={[progressAlerts.thresholds.danger]}
                    onValueChange={([value]) => setProgressAlerts(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, danger: value }
                    }))}
                    min={10}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <span className="text-sm">Atenção (abaixo de)</span>
                    </div>
                    <span className="text-sm font-medium">{progressAlerts.thresholds.warning}%</span>
                  </div>
                  <Slider
                    value={[progressAlerts.thresholds.warning]}
                    onValueChange={([value]) => setProgressAlerts(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, warning: value }
                    }))}
                    min={progressAlerts.thresholds.danger + 5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-4 pt-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>&lt; {progressAlerts.thresholds.danger}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>{progressAlerts.thresholds.danger}-{progressAlerts.thresholds.warning}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>&gt; {progressAlerts.thresholds.warning}%</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium">Notificações</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifInApp">Indicadores no Dashboard</Label>
                  <Switch
                    id="notifInApp"
                    checked={progressAlerts.notifications.inApp}
                    onCheckedChange={(checked) => setProgressAlerts(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, inApp: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifDaily">Resumo Diário</Label>
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  </div>
                  <Switch
                    id="notifDaily"
                    checked={progressAlerts.notifications.daily}
                    onCheckedChange={(checked) => setProgressAlerts(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, daily: checked }
                    }))}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifWeekly">Resumo Semanal</Label>
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  </div>
                  <Switch
                    id="notifWeekly"
                    checked={progressAlerts.notifications.weekly}
                    onCheckedChange={(checked) => setProgressAlerts(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, weekly: checked }
                    }))}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveAlerts}
                disabled={savingAlerts || !hasAlertsChanged}
                className="gap-2"
              >
                {savingAlerts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Alertas
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* App Preferences Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Configurações gerais do sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cacheDuration">Duração do Cache</Label>
              <Select
                value={appPreferences.cacheDuration.toString()}
                onValueChange={(value) => setAppPreferences(prev => ({
                  ...prev,
                  cacheDuration: parseInt(value)
                }))}
              >
                <SelectTrigger id="cacheDuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={appPreferences.timezone}
                onValueChange={(value) => setAppPreferences(prev => ({
                  ...prev,
                  timezone: value
                }))}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                  <SelectItem value="America/Recife">Recife (BRT)</SelectItem>
                  <SelectItem value="America/Fortaleza">Fortaleza (BRT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencyPrefix">Moeda</Label>
              <Select
                value={appPreferences.currencyPrefix}
                onValueChange={(value) => setAppPreferences(prev => ({
                  ...prev,
                  currencyPrefix: value
                }))}
              >
                <SelectTrigger id="currencyPrefix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R$">Real (R$)</SelectItem>
                  <SelectItem value="$">Dólar ($)</SelectItem>
                  <SelectItem value="€">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekStartsOn">Início da Semana</Label>
              <Select
                value={appPreferences.weekStartsOn.toString()}
                onValueChange={(value) => setAppPreferences(prev => ({
                  ...prev,
                  weekStartsOn: parseInt(value) as 0 | 1
                }))}
              >
                <SelectTrigger id="weekStartsOn">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Domingo</SelectItem>
                  <SelectItem value="1">Segunda-feira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSavePreferences}
              disabled={savingPreferences || !hasPreferencesChanged}
              className="gap-2"
            >
              {savingPreferences ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Preferências
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
