import { Target, MousePointer, Eye, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { useProgressStatus, CampaignPeriod } from "@/hooks/useProgressStatus";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricType, METRICS } from "@/lib/objective-metrics";

interface GoalCardProps {
  currentValue: number;
  goal: number;
  metricType: MetricType;
  thresholds: {
    danger: number;
    warning: number;
    success: number;
  };
  alertsEnabled: boolean;
  loading: boolean;
  formatValue: (value: number) => string;
  campaignPeriod?: CampaignPeriod;
  customLabel?: string;
}

const metricIcons: Partial<Record<MetricType, React.ReactNode>> = {
  leads: <Target className="h-4 w-4" />,
  clicks: <MousePointer className="h-4 w-4" />,
  impressions: <Eye className="h-4 w-4" />,
  reach: <Eye className="h-4 w-4" />,
  conversions: <TrendingUp className="h-4 w-4" />,
};

const metricLabels: Partial<Record<MetricType, string>> = {
  leads: "Meta de Leads",
  clicks: "Meta de Cliques",
  impressions: "Meta de Impressões",
  reach: "Meta de Alcance",
  conversions: "Meta de Conversões",
};

export function GoalCard({
  currentValue,
  goal,
  metricType,
  thresholds,
  alertsEnabled,
  loading,
  formatValue,
  campaignPeriod,
  customLabel,
}: GoalCardProps) {
  const progressResult = useProgressStatus(
    currentValue,
    goal,
    { thresholds, campaignPeriod },
    "monthly"
  );

  // Calculate expected value for comparison
  const expectedValue = Math.round(goal * (progressResult.expectedPercent / 100));
  const valueDiff = currentValue - expectedValue;
  const isAhead = valueDiff >= 0;

  // Build period info for tooltip
  const isCustomPeriod = campaignPeriod?.useCurrentMonth === false && campaignPeriod.startDate && campaignPeriod.endDate;
  
  const getPeriodLabel = () => {
    if (isCustomPeriod) {
      const start = format(parseISO(campaignPeriod.startDate!), "dd/MM", { locale: ptBR });
      const end = format(parseISO(campaignPeriod.endDate!), "dd/MM", { locale: ptBR });
      return `${start} - ${end}`;
    }
    return null;
  };

  const getPeriodInfo = () => {
    if (isCustomPeriod) {
      return `Período: ${getPeriodLabel()}`;
    }
    return `Mês atual`;
  };

  const metricLabel = METRICS[metricType]?.label || 'unidades';
  const tooltipText = `${getPeriodInfo()} • Dia ${progressResult.daysElapsed}/${progressResult.totalDays} • Esperado: ${formatValue(expectedValue)} ${metricLabel.toLowerCase()} (${progressResult.expectedPercent.toFixed(0)}%) • Diferença: ${isAhead ? "+" : ""}${formatValue(valueDiff)}`;

  // Build status label with comparison info
  const statusLabel = alertsEnabled && goal > 0
    ? `${progressResult.label} • ${isAhead ? "+" : ""}${formatValue(valueDiff)} vs esperado`
    : progressResult.label;

  const title = customLabel || metricLabels[metricType] || "Meta";
  const icon = metricIcons[metricType] || <Target className="h-4 w-4" />;

  return (
    <div className="animate-fade-in h-full" style={{ animationDelay: "500ms" }}>
      <KPICard
        title={title}
        value={`${formatValue(currentValue)} / ${formatValue(goal)}`}
        icon={icon}
        loading={loading}
        tooltip={tooltipText}
        progress={{
          current: currentValue,
          target: goal,
        }}
        progressStatus={alertsEnabled ? {
          status: progressResult.status,
          label: statusLabel,
          expectedPercent: progressResult.expectedPercent,
        } : undefined}
      />
    </div>
  );
}
