import { useMemo, useState } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useResponsiveChartConfig } from "@/hooks/useResponsiveChartConfig";
import { useWhiteLabelContext } from "@/components/WhiteLabelProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Share2 } from "lucide-react";
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  ComposedChart,
  Legend
} from "recharts";
import { getDaysInMonth, getDate, format, parseISO, startOfMonth, endOfMonth, addDays, differenceInDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { WhatsAppShareDialog } from "./WhatsAppShareDialog";
import { CampaignPeriod } from "@/lib/whatsapp-report-formatter";
interface SparklineData {
  date: string;
  leads: number;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
}

interface GoalProjectionChartProps {
  sparklineData: SparklineData[];
  monthlyGoal: number;
  loading?: boolean;
  projectName?: string;
  totalSpend?: number;
  averageCPL?: number;
  campaignPeriod?: CampaignPeriod;
  // Media metrics
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  // Comparison data
  leadsChange?: number;
  spendChange?: number;
  cplChange?: number;
  // Campaign info
  activeCampaigns?: number;
  dataSources?: string[];
  // Report period
  dateFrom?: string;
  dateTo?: string;
}

interface ChartData {
  day: number;
  date: string;
  actual?: number;
  accumulated?: number;
  expected: number;
  projected?: number;
  optimistic?: number;
  pessimistic?: number;
  confidenceBand?: [number, number];
}

// Calculate standard deviation
function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return mean * 0.3; // Default to 30% if not enough data
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

export function GoalProjectionChart({ 
  sparklineData, 
  monthlyGoal, 
  loading = false,
  projectName,
  totalSpend,
  averageCPL,
  campaignPeriod,
  impressions,
  reach,
  clicks,
  ctr,
  cpc,
  cpm,
  leadsChange,
  spendChange,
  cplChange,
  activeCampaigns,
  dataSources,
  dateFrom,
  dateTo,
}: GoalProjectionChartProps) {
  const [showScenarios, setShowScenarios] = useState(true);
  const { isAdmin } = useAdminCheck();
  const chartConfig = useResponsiveChartConfig();
  const { settings: whiteLabelSettings } = useWhiteLabelContext();
  const chartData = useMemo(() => {
    const now = new Date();
    
    // Determine period bounds based on campaignPeriod
    let periodStart: Date;
    let periodEnd: Date;
    const useCustomPeriod = campaignPeriod && !campaignPeriod.useCurrentMonth && 
                            campaignPeriod.startDate && campaignPeriod.endDate;
    
    if (useCustomPeriod) {
      periodStart = parseISO(campaignPeriod.startDate!);
      periodEnd = parseISO(campaignPeriod.endDate!);
    } else {
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
    }
    
    const totalDays = differenceInDays(periodEnd, periodStart) + 1;
    const daysElapsed = Math.max(0, Math.min(differenceInDays(now, periodStart) + 1, totalDays));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    // Calculate daily expected rate
    const dailyExpected = monthlyGoal / totalDays;

    // Build accumulated leads from sparkline data within the period
    const leadsPerDayIndex: Record<number, number> = {};
    sparklineData.forEach(item => {
      try {
        const date = parseISO(item.date);
        // Only count days within the period
        if (isWithinInterval(date, { start: periodStart, end: periodEnd })) {
          const dayIndex = differenceInDays(date, periodStart) + 1;
          leadsPerDayIndex[dayIndex] = (leadsPerDayIndex[dayIndex] || 0) + item.leads;
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Get daily values array for statistics
    const dailyValues = Object.values(leadsPerDayIndex);
    
    // Calculate total leads so far
    const totalLeads = dailyValues.reduce((sum, leads) => sum + leads, 0);
    
    // Calculate days with data
    const daysWithData = dailyValues.length || 1;
    
    // Calculate average daily rate (only from days with actual data)
    const averageDailyRate = totalLeads / daysWithData;
    
    // Calculate standard deviation for confidence bands
    const stdDev = calculateStdDev(dailyValues, averageDailyRate);
    
    // Optimistic rate (mean + 1 std dev, but cap at reasonable maximum)
    const optimisticRate = Math.min(averageDailyRate + stdDev, averageDailyRate * 1.5);
    
    // Pessimistic rate (mean - 1 std dev, but floor at 0)
    const pessimisticRate = Math.max(averageDailyRate - stdDev, averageDailyRate * 0.5, 0);

    // Build chart data for each day in the period
    const data: ChartData[] = [];
    let accumulated = 0;

    for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
      const dayDate = addDays(periodStart, dayIndex - 1);
      const dateStr = format(dayDate, "dd/MM", { locale: ptBR });
      
      const expected = Math.round(dailyExpected * dayIndex);
      
      if (dayIndex <= daysElapsed) {
        // Historical data
        const dayLeads = leadsPerDayIndex[dayIndex] || 0;
        accumulated += dayLeads;
        
        data.push({
          day: dayIndex,
          date: dateStr,
          actual: dayLeads,
          accumulated,
          expected,
          projected: dayIndex === daysElapsed ? accumulated : undefined,
          optimistic: dayIndex === daysElapsed ? accumulated : undefined,
          pessimistic: dayIndex === daysElapsed ? accumulated : undefined,
        });
      } else {
        // Future projections
        const daysFromCurrent = dayIndex - daysElapsed;
        const projectedAccumulated = Math.round(accumulated + (averageDailyRate * daysFromCurrent));
        const optimisticAccumulated = Math.round(accumulated + (optimisticRate * daysFromCurrent));
        const pessimisticAccumulated = Math.round(accumulated + (pessimisticRate * daysFromCurrent));
        
        data.push({
          day: dayIndex,
          date: dateStr,
          expected,
          projected: projectedAccumulated,
          optimistic: optimisticAccumulated,
          pessimistic: pessimisticAccumulated,
          confidenceBand: [pessimisticAccumulated, optimisticAccumulated],
        });
      }
    }

    // Calculate projected totals
    const projectedTotal = Math.round(totalLeads + (averageDailyRate * daysRemaining));
    const optimisticTotal = Math.round(totalLeads + (optimisticRate * daysRemaining));
    const pessimisticTotal = Math.round(totalLeads + (pessimisticRate * daysRemaining));
    
    // Generate period label for reports
    const periodLabel = useCustomPeriod
      ? `${format(periodStart, "dd/MM/yyyy", { locale: ptBR })} a ${format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}`
      : format(now, "MMMM/yyyy", { locale: ptBR });

    return {
      data,
      totalLeads,
      averageDailyRate,
      stdDev,
      projectedTotal,
      optimisticTotal,
      pessimisticTotal,
      optimisticRate,
      pessimisticRate,
      currentDay: daysElapsed,
      daysInMonth: totalDays,
      daysRemaining,
      totalDays,
      daysElapsed,
      periodLabel,
      useCustomPeriod,
    };
  }, [sparklineData, monthlyGoal, campaignPeriod]);

  const projectionStatus = useMemo(() => {
    const { projectedTotal, optimisticTotal, pessimisticTotal } = chartData;
    
    // Check if goal is achievable in any scenario
    const goalAchievableInOptimistic = optimisticTotal >= monthlyGoal;
    const goalAchievableInProjected = projectedTotal >= monthlyGoal;
    const goalAchievableInPessimistic = pessimisticTotal >= monthlyGoal;
    
    if (goalAchievableInPessimistic) {
      return { 
        status: "success" as const, 
        label: "Meta garantida", 
        icon: CheckCircle,
        color: "text-success",
        description: "Mesmo no cenário pessimista"
      };
    } else if (goalAchievableInProjected) {
      return { 
        status: "success" as const, 
        label: "Meta provável", 
        icon: CheckCircle,
        color: "text-success",
        description: "No ritmo atual"
      };
    } else if (goalAchievableInOptimistic) {
      return { 
        status: "warning" as const, 
        label: "Meta possível", 
        icon: TrendingUp,
        color: "text-warning",
        description: "Apenas no cenário otimista"
      };
    } else {
      return { 
        status: "danger" as const, 
        label: "Meta improvável", 
        icon: AlertTriangle,
        color: "text-destructive",
        description: "Mesmo no cenário otimista"
      };
    }
  }, [chartData, monthlyGoal]);

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6">
          <Skeleton className={`w-full ${chartConfig.isMobile ? 'h-[220px]' : 'h-[300px]'}`} />
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = projectionStatus.icon;
  const maxValue = Math.max(
    monthlyGoal * 1.1, 
    chartData.optimisticTotal * 1.1,
    chartData.projectedTotal * 1.1
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium truncate">
                  Projeção de Meta
                  {chartData.useCustomPeriod && !chartConfig.isMobile && (
                    <span className="text-muted-foreground font-normal ml-2 text-sm">
                      ({chartData.periodLabel})
                    </span>
                  )}
                </CardTitle>
                {!chartConfig.isMobile && (
                  <CardDescription className="text-xs">
                    Progresso e projeção para atingir {formatNumber(monthlyGoal)} leads
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Switch
                  id="show-scenarios"
                  checked={showScenarios}
                  onCheckedChange={setShowScenarios}
                  className="scale-75 md:scale-90"
                />
                <Label htmlFor="show-scenarios" className="text-[10px] md:text-xs text-muted-foreground cursor-pointer">
                  Cenários
                </Label>
              </div>
              <Badge variant="outline" className={`${projectionStatus.color} text-[10px] md:text-xs px-1.5 md:px-2`}>
                <StatusIcon className="h-3 w-3 md:h-3.5 md:w-3.5 mr-0.5 md:mr-1" />
                {chartConfig.isMobile ? projectionStatus.label.split(' ')[0] : projectionStatus.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-2 md:pt-4">
          {/* Stats Summary - 2x2 on mobile, 5 cols on desktop */}
          <div className={`grid ${chartConfig.statsGridCols} gap-2 md:gap-3 mb-3 md:mb-4 text-xs md:text-sm`}>
            <div className="space-y-0.5 md:space-y-1 p-2 md:p-0 bg-muted/30 md:bg-transparent rounded-md">
              <p className="text-muted-foreground text-[10px] md:text-xs">Atual</p>
              <p className="font-semibold text-sm md:text-base">{formatNumber(chartData.totalLeads)}</p>
            </div>
            {showScenarios && (
              <div className="space-y-0.5 md:space-y-1 p-2 md:p-0 bg-muted/30 md:bg-transparent rounded-md">
                <p className="text-muted-foreground text-[10px] md:text-xs">Pessimista</p>
                <p className="font-semibold text-orange-500 text-sm md:text-base">{formatNumber(chartData.pessimisticTotal)}</p>
              </div>
            )}
            <div className="space-y-0.5 md:space-y-1 p-2 md:p-0 bg-muted/30 md:bg-transparent rounded-md">
              <p className="text-muted-foreground text-[10px] md:text-xs">Projetado</p>
              <p className={`font-semibold ${projectionStatus.color} text-sm md:text-base`}>
                {formatNumber(chartData.projectedTotal)}
              </p>
            </div>
            {showScenarios && (
              <div className="space-y-0.5 md:space-y-1 p-2 md:p-0 bg-muted/30 md:bg-transparent rounded-md">
                <p className="text-muted-foreground text-[10px] md:text-xs">Otimista</p>
                <p className="font-semibold text-emerald-500 text-sm md:text-base">{formatNumber(chartData.optimisticTotal)}</p>
              </div>
            )}
            <div className="space-y-0.5 md:space-y-1 p-2 md:p-0 bg-muted/30 md:bg-transparent rounded-md col-span-2 md:col-span-1">
              <p className="text-muted-foreground text-[10px] md:text-xs">Média/dia</p>
              <p className="font-semibold text-sm md:text-base">{chartData.averageDailyRate.toFixed(1)}</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: chartConfig.projectionHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData.data}
                margin={chartConfig.chartMargin}
              >
                <defs>
                  <linearGradient id="confidenceBandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: chartConfig.axisFontSize, fill: "hsl(var(--muted-foreground))" }}
                  interval={chartConfig.axisInterval}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: chartConfig.axisFontSize, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={formatNumber}
                  domain={[0, maxValue]}
                  width={chartConfig.yAxisWidth}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      accumulated: "Acumulado",
                      expected: "Esperado",
                      projected: "Projetado",
                      optimistic: "Otimista",
                      pessimistic: "Pessimista",
                    };
                    return [formatNumber(value), labels[name] || name];
                  }}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                {!chartConfig.isMobile && (
                  <Legend 
                    verticalAlign="top"
                    height={32}
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        accumulated: "Acumulado",
                        expected: "Esperado",
                        projected: "Projetado",
                        optimistic: "Otimista",
                        pessimistic: "Pessimista",
                      };
                      return labels[value] || value;
                    }}
                  />
                )}
                
                {/* Goal reference line */}
                <ReferenceLine 
                  y={monthlyGoal} 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Meta: ${formatNumber(monthlyGoal)}`, 
                    position: "right",
                    fill: "hsl(var(--success))",
                    fontSize: 10
                  }}
                />

                {/* Current day reference */}
                <ReferenceLine 
                  x={format(new Date(), "dd/MM", { locale: ptBR })}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                
                {/* Confidence band (area between pessimistic and optimistic) */}
                {showScenarios && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="optimistic"
                      stroke="none"
                      fill="url(#confidenceBandGradient)"
                      fillOpacity={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="pessimistic"
                      stroke="none"
                      fill="hsl(var(--background))"
                      fillOpacity={1}
                    />
                  </>
                )}

                {/* Expected line (linear) */}
                <Line
                  type="linear"
                  dataKey="expected"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />

                {/* Pessimistic line */}
                {showScenarios && (
                  <Line
                    type="monotone"
                    dataKey="pessimistic"
                    stroke="hsl(25, 95%, 53%)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: chartConfig.activeDotRadius, fill: "hsl(25, 95%, 53%)" }}
                  />
                )}

                {/* Optimistic line */}
                {showScenarios && (
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    stroke="hsl(160, 84%, 39%)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: chartConfig.activeDotRadius, fill: "hsl(160, 84%, 39%)" }}
                  />
                )}
                
                {/* Accumulated (actual) */}
                <Line
                  type="monotone"
                  dataKey="accumulated"
                  stroke="hsl(var(--primary))"
                  strokeWidth={chartConfig.isMobile ? 2 : 2.5}
                  dot={false}
                  activeDot={{ r: chartConfig.activeDotRadius, fill: "hsl(var(--primary))" }}
                />
                
                {/* Projected line (main) */}
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="hsl(var(--primary))"
                  strokeDasharray="8 4"
                  strokeWidth={chartConfig.isMobile ? 1.5 : 2}
                  dot={false}
                  activeDot={{ r: chartConfig.activeDotRadius, fill: "hsl(var(--primary))", strokeDasharray: "0" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Footer info */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border text-[10px] md:text-xs text-muted-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span>
                Necessário: <strong>{Math.max(0, Math.ceil((monthlyGoal - chartData.totalLeads) / Math.max(1, chartData.daysRemaining)))}</strong> leads/dia
              </span>
              <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
                <span className="text-[10px] md:text-xs">
                  Dia {chartData.currentDay}/{chartData.daysInMonth} • {chartData.daysRemaining} restantes
                </span>
                {isAdmin && (
                  <WhatsAppShareDialog
                    appName={whiteLabelSettings.appName}
                    projectName={projectName}
                    currentLeads={chartData.totalLeads}
                    monthlyGoal={monthlyGoal}
                    progressPercent={(chartData.totalLeads / monthlyGoal) * 100}
                    projectedLeads={chartData.projectedTotal}
                    projectionStatus={projectionStatus.status}
                    totalSpend={totalSpend}
                    averageCPL={averageCPL}
                    averageDailyRate={chartData.averageDailyRate}
                    daysRemaining={chartData.daysRemaining}
                    daysElapsed={chartData.daysElapsed}
                    totalDays={chartData.totalDays}
                    pessimisticTotal={chartData.pessimisticTotal}
                    optimisticTotal={chartData.optimisticTotal}
                    campaignPeriod={campaignPeriod}
                    periodLabel={chartData.periodLabel}
                    impressions={impressions}
                    reach={reach}
                    clicks={clicks}
                    ctr={ctr}
                    cpc={cpc}
                    cpm={cpm}
                    leadsChange={leadsChange}
                    spendChange={spendChange}
                    cplChange={cplChange}
                    activeCampaigns={activeCampaigns}
                    dataSources={dataSources}
                    conversionRate={clicks && clicks > 0 ? (chartData.totalLeads / clicks) * 100 : undefined}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    defaultReportType="projection"
                    trigger={
                      <Button variant="outline" size="sm" className="h-6 md:h-7 gap-1 md:gap-1.5 text-[10px] md:text-xs px-2">
                        <Share2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        {!chartConfig.isMobile && "Compartilhar"}
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            {showScenarios && !chartConfig.isMobile && (
              <p className="mt-2 text-[10px] md:text-[11px]">
                Cenários baseados na variação histórica (±{chartData.stdDev.toFixed(1)} leads/dia de desvio padrão)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
