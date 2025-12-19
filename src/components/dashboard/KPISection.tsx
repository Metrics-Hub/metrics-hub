import { DollarSign, Eye, Users, MousePointer, Percent, Target, BarChart3 } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { ComparisonToggle } from "@/components/ComparisonToggle";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { AIReportGenerator } from "@/components/AIReportGenerator";
import { CampaignPeriod } from "@/hooks/useProgressStatus";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ObjectiveMetricConfig, MetricType, METRICS } from "@/lib/objective-metrics";
import { ObjectiveSummary } from "@/components/dashboard/ObjectiveSummary";
import { ObjectiveBreakdown } from "@/hooks/useDominantObjective";

interface KPISectionProps {
  totals: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    leads: number;
    cpl: number;
  };
  changes: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    leads: number;
    cpl: number;
  } | null;
  sparklineArrays: {
    spend?: number[];
    impressions?: number[];
    reach?: number[];
    clicks?: number[];
    leads?: number[];
    ctr?: number[];
    cpc?: number[];
    cpm?: number[];
    cpl?: number[];
  };
  comparisonEnabled: boolean;
  onComparisonChange: (enabled: boolean) => void;
  isLoading: boolean;
  goalSettings: {
    monthlyGoal: number;
    thresholds: { danger: number; warning: number; success: number };
    alertsEnabled: boolean;
    campaignPeriod?: CampaignPeriod;
  };
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  datePeriod?: string;
  topAdSets?: Array<{ name: string; cpl: number; leads: number }>;
  topCreatives?: Array<{ name: string; ctr: number; clicks: number }>;
  // New adaptive props
  objectiveConfig?: ObjectiveMetricConfig;
  objectiveBreakdown?: ObjectiveBreakdown[];
  dominantObjective?: string | null;
}

// KPI definitions for rendering
const kpiDefinitions: Record<MetricType, {
  title: string;
  getValueFormatted: (totals: KPISectionProps['totals'], formatCurrency: (v: number) => string, formatNumber: (v: number) => string) => string;
  getChange: (changes: KPISectionProps['changes']) => number | undefined;
  icon: React.ReactNode;
  tooltip: string;
  sparklineKey: keyof KPISectionProps['sparklineArrays'];
  formatSparkline: (formatCurrency: (v: number) => string, formatNumber: (v: number) => string) => (v: number) => string;
}> = {
  spend: {
    title: "Total Investido",
    getValueFormatted: (t, fc) => fc(t.spend),
    getChange: (c) => c?.spend,
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "Valor total gasto em anúncios no período selecionado",
    sparklineKey: 'spend',
    formatSparkline: (fc) => fc,
  },
  impressions: {
    title: "Impressões",
    getValueFormatted: (t, _fc, fn) => fn(t.impressions),
    getChange: (c) => c?.impressions,
    icon: <Eye className="h-4 w-4" />,
    tooltip: "Número de vezes que seus anúncios foram exibidos na tela",
    sparklineKey: 'impressions',
    formatSparkline: (_fc, fn) => fn,
  },
  reach: {
    title: "Alcance",
    getValueFormatted: (t, _fc, fn) => fn(t.reach),
    getChange: (c) => c?.reach,
    icon: <Users className="h-4 w-4" />,
    tooltip: "Número de pessoas únicas que viram seus anúncios",
    sparklineKey: 'reach',
    formatSparkline: (_fc, fn) => fn,
  },
  clicks: {
    title: "Cliques",
    getValueFormatted: (t, _fc, fn) => fn(t.clicks),
    getChange: (c) => c?.clicks,
    icon: <MousePointer className="h-4 w-4" />,
    tooltip: "Total de cliques em links dos seus anúncios",
    sparklineKey: 'clicks',
    formatSparkline: (_fc, fn) => fn,
  },
  ctr: {
    title: "CTR",
    getValueFormatted: (t) => `${t.ctr.toFixed(2)}%`,
    getChange: (c) => c?.ctr,
    icon: <Percent className="h-4 w-4" />,
    tooltip: "Taxa de cliques: porcentagem de pessoas que clicaram após ver o anúncio",
    sparklineKey: 'ctr',
    formatSparkline: () => (v) => `${v.toFixed(2)}%`,
  },
  cpc: {
    title: "CPC",
    getValueFormatted: (t, fc) => fc(t.cpc),
    getChange: (c) => c?.cpc,
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "Custo por clique: valor médio pago por cada clique no anúncio",
    sparklineKey: 'cpc',
    formatSparkline: (fc) => fc,
  },
  cpm: {
    title: "CPM",
    getValueFormatted: (t, fc) => fc(t.cpm),
    getChange: (c) => c?.cpm,
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "Custo por mil impressões: valor pago a cada 1.000 exibições",
    sparklineKey: 'cpm',
    formatSparkline: (fc) => fc,
  },
  leads: {
    title: "Leads",
    getValueFormatted: (t, _fc, fn) => fn(t.leads),
    getChange: (c) => c?.leads,
    icon: <Target className="h-4 w-4" />,
    tooltip: "Total de leads gerados através dos anúncios",
    sparklineKey: 'leads',
    formatSparkline: (_fc, fn) => fn,
  },
  cpl: {
    title: "CPL",
    getValueFormatted: (t, fc) => fc(t.cpl),
    getChange: (c) => c?.cpl,
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "Custo por lead: valor médio gasto para adquirir cada lead",
    sparklineKey: 'cpl',
    formatSparkline: (fc) => fc,
  },
  // Placeholders for metrics without sparkline data
  conversions: {
    title: "Conversões",
    getValueFormatted: (t, _fc, fn) => fn(t.leads), // Use leads as proxy
    getChange: (c) => c?.leads,
    icon: <Target className="h-4 w-4" />,
    tooltip: "Total de conversões",
    sparklineKey: 'leads',
    formatSparkline: (_fc, fn) => fn,
  },
  roas: {
    title: "ROAS",
    getValueFormatted: () => "-",
    getChange: () => undefined,
    icon: <DollarSign className="h-4 w-4" />,
    tooltip: "Retorno sobre investimento em anúncios",
    sparklineKey: 'spend',
    formatSparkline: () => (v) => v.toFixed(2),
  },
  videoViews: {
    title: "Visualizações",
    getValueFormatted: (t, _fc, fn) => fn(t.impressions),
    getChange: (c) => c?.impressions,
    icon: <Eye className="h-4 w-4" />,
    tooltip: "Total de visualizações de vídeo",
    sparklineKey: 'impressions',
    formatSparkline: (_fc, fn) => fn,
  },
};

// Default KPI order
const defaultKPIOrder: MetricType[] = ['spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm', 'leads', 'cpl'];

export function KPISection({
  totals,
  changes,
  sparklineArrays,
  comparisonEnabled,
  onComparisonChange,
  isLoading,
  goalSettings,
  formatCurrency,
  formatNumber,
  datePeriod = "Período atual",
  topAdSets,
  topCreatives,
  objectiveConfig: objConfig,
  objectiveBreakdown,
  dominantObjective,
}: KPISectionProps) {
  const { isAdmin } = useAdminCheck();

  const reportData = {
    leads: totals.leads,
    spend: totals.spend,
    cpl: totals.cpl,
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr: totals.ctr,
    goal: goalSettings.monthlyGoal,
    period: datePeriod,
    topAdSets,
    topCreatives,
  };

  // Determine KPI order based on objective config
  const kpiOrder = objConfig?.kpiPriority || defaultKPIOrder;
  
  // Filter to only show first 9 KPIs (leave space for goal card)
  const visibleKPIs = kpiOrder.slice(0, 9).filter((metric) => kpiDefinitions[metric]);

  // Determine goal metric and value based on objective
  const goalMetric = objConfig?.goalMetric || 'leads';
  const goalValue = totals[goalMetric as keyof typeof totals] ?? totals.leads;
  const goalLabel = objConfig?.goalLabel || 'Meta de Leads';

  return (
    <>
      {/* KPI Section Header */}
      <div className="flex items-center justify-between animate-fade-in flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Métricas
          </h2>
          {/* Objective summary badges */}
          {objectiveBreakdown && objectiveBreakdown.length > 1 && (
            <ObjectiveSummary
              breakdown={objectiveBreakdown}
              totalSpend={totals.spend}
              formatCurrency={formatCurrency}
              dominantObjective={dominantObjective || null}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <AIReportGenerator data={reportData} />}
          <ComparisonToggle 
            enabled={comparisonEnabled} 
            onChange={onComparisonChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* KPI Cards - Responsive: 2 cols mobile, 5 cols desktop */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
        {visibleKPIs.map((metric, index) => {
          const def = kpiDefinitions[metric];
          if (!def) return null;
          
          return (
            <div 
              key={metric} 
              className="animate-fade-in h-full" 
              style={{ animationDelay: `${50 + index * 50}ms` }}
            >
              <KPICard
                title={def.title}
                value={def.getValueFormatted(totals, formatCurrency, formatNumber)}
                change={def.getChange(changes)}
                changeLabel="vs período anterior"
                icon={def.icon}
                sparklineData={sparklineArrays[def.sparklineKey]}
                formatSparklineValue={def.formatSparkline(formatCurrency, formatNumber)}
                loading={isLoading}
                tooltip={def.tooltip}
              />
            </div>
          );
        })}
        
        {/* Goal Card - adaptive to objective */}
        <GoalCard
          currentValue={goalValue}
          goal={goalSettings.monthlyGoal}
          metricType={goalMetric as MetricType}
          thresholds={goalSettings.thresholds}
          alertsEnabled={goalSettings.alertsEnabled}
          loading={isLoading}
          formatValue={formatNumber}
          campaignPeriod={goalSettings.campaignPeriod}
          customLabel={goalLabel}
        />
      </section>
    </>
  );
}
