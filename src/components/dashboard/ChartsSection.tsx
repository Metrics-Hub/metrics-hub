import { GoalProjectionChart } from "@/components/GoalProjectionChart";
import { TimelineChart } from "@/components/TimelineChart";
import { EfficiencyTrendChart } from "@/components/EfficiencyTrendChart";
import { PerformanceChart, MetricConfig, PerformanceData } from "@/components/PerformanceChart";
import { SparklineDataPoint } from "@/hooks/useMetaAdsData";
import { CampaignPeriod } from "@/lib/whatsapp-report-formatter";

interface ChartsSectionProps {
  sparklineData: SparklineDataPoint[];
  chartData: PerformanceData[];
  chartMetrics: {
    metric1: MetricConfig;
    metric2: MetricConfig;
  };
  isLoading: boolean;
  projectName?: string;
  goalSettings: {
    monthlyGoal: number;
    campaignPeriod?: CampaignPeriod;
  };
  leadsCampaignsTotals: {
    spend: number;
    cpl: number;
  };
  // Media metrics for WhatsApp reports
  filteredTotals?: {
    impressions: number;
    reach: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
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

export function ChartsSection({
  sparklineData,
  chartData,
  chartMetrics,
  isLoading,
  projectName,
  goalSettings,
  leadsCampaignsTotals,
  filteredTotals,
  leadsChange,
  spendChange,
  cplChange,
  activeCampaigns,
  dataSources,
  dateFrom,
  dateTo,
}: ChartsSectionProps) {
  return (
    <>
      {/* Goal Projection Chart */}
      <section className="animate-fade-in" style={{ animationDelay: "525ms" }}>
        <GoalProjectionChart 
          sparklineData={sparklineData} 
          monthlyGoal={goalSettings.monthlyGoal}
          loading={isLoading}
          projectName={projectName}
          totalSpend={leadsCampaignsTotals.spend}
          averageCPL={leadsCampaignsTotals.cpl}
          campaignPeriod={goalSettings.campaignPeriod}
          impressions={filteredTotals?.impressions}
          reach={filteredTotals?.reach}
          clicks={filteredTotals?.clicks}
          ctr={filteredTotals?.ctr}
          cpc={filteredTotals?.cpc}
          cpm={filteredTotals?.cpm}
          leadsChange={leadsChange}
          spendChange={spendChange}
          cplChange={cplChange}
          activeCampaigns={activeCampaigns}
          dataSources={dataSources}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </section>

      {/* Timeline Chart */}
      <section className="animate-fade-in" style={{ animationDelay: "550ms" }}>
        <TimelineChart data={sparklineData} loading={isLoading} />
      </section>

      {/* Efficiency Trend Chart */}
      <section className="animate-fade-in" style={{ animationDelay: "575ms" }}>
        <EfficiencyTrendChart data={sparklineData} loading={isLoading} />
      </section>

      {/* Performance Chart */}
      <section className="animate-fade-in" style={{ animationDelay: "600ms" }}>
        <PerformanceChart 
          data={chartData} 
          loading={isLoading}
          metric1={chartMetrics.metric1}
          metric2={chartMetrics.metric2}
        />
      </section>
    </>
  );
}
