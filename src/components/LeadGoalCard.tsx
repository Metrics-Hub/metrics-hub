import { Target } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { useProgressStatus, CampaignPeriod } from "@/hooks/useProgressStatus";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadGoalCardProps {
  leads: number;
  goal: number;
  thresholds: {
    danger: number;
    warning: number;
    success: number;
  };
  alertsEnabled: boolean;
  loading: boolean;
  formatNumber: (value: number) => string;
  campaignPeriod?: CampaignPeriod;
}

export function LeadGoalCard({
  leads,
  goal,
  thresholds,
  alertsEnabled,
  loading,
  formatNumber,
  campaignPeriod,
}: LeadGoalCardProps) {
  const progressResult = useProgressStatus(
    leads,
    goal,
    { thresholds, campaignPeriod },
    "monthly"
  );

  // Calculate expected leads for comparison
  const expectedLeads = Math.round(goal * (progressResult.expectedPercent / 100));
  const leadsDiff = leads - expectedLeads;
  const isAhead = leadsDiff >= 0;

  // Build period info for tooltip and title
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

  const tooltipText = `${getPeriodInfo()} • Dia ${progressResult.daysElapsed}/${progressResult.totalDays} • Esperado: ${formatNumber(expectedLeads)} leads (${progressResult.expectedPercent.toFixed(0)}%) • Diferença: ${isAhead ? "+" : ""}${formatNumber(leadsDiff)} leads`;

  // Build status label with comparison info
  const statusLabel = alertsEnabled && goal > 0
    ? `${progressResult.label} • ${isAhead ? "+" : ""}${formatNumber(leadsDiff)} vs esperado`
    : progressResult.label;

  return (
    <div className="animate-fade-in h-full" style={{ animationDelay: "500ms" }}>
      <KPICard
        title="Meta de Leads"
        value={`${formatNumber(leads)} / ${formatNumber(goal)}`}
        icon={<Target className="h-4 w-4" />}
        loading={loading}
        tooltip={tooltipText}
        progress={{
          current: leads,
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
