import { BarChart3 } from "lucide-react";
import { RankingTable, RankingItem } from "@/components/RankingTable";
import { MinLeadsSelector } from "@/components/MinLeadsSelector";
import { ObjectiveMetricConfig, MetricType, METRICS } from "@/lib/objective-metrics";
import { useMemo } from "react";

interface RankingsSectionProps {
  minLeadsThreshold: number;
  onMinLeadsChange: (value: number) => void;
  topAdsetsByCPL: RankingItem[];
  topAdsetsByCTR: RankingItem[];
  topAdsByCPL: RankingItem[];
  topAdsByCTR: RankingItem[];
  totalAdsetsForCPL: number;
  totalAdsetsForCTR: number;
  totalAdsForCPL: number;
  totalAdsForCTR: number;
  isLoading: boolean;
  // Adaptive props
  objectiveConfig?: ObjectiveMetricConfig;
  // Pre-calculated adaptive rankings
  adaptiveAdsetRankings?: {
    primary: RankingItem[];
    secondary: RankingItem[];
    primaryTotal: number;
    secondaryTotal: number;
  };
  adaptiveAdRankings?: {
    primary: RankingItem[];
    secondary: RankingItem[];
    primaryTotal: number;
    secondaryTotal: number;
  };
}

export function RankingsSection({
  minLeadsThreshold,
  onMinLeadsChange,
  topAdsetsByCPL,
  topAdsetsByCTR,
  topAdsByCPL,
  topAdsByCTR,
  totalAdsetsForCPL,
  totalAdsetsForCTR,
  totalAdsForCPL,
  totalAdsForCTR,
  isLoading,
  objectiveConfig,
  adaptiveAdsetRankings,
  adaptiveAdRankings,
}: RankingsSectionProps) {
  // Get ranking metrics from config or use defaults
  const rankingMetrics = objectiveConfig?.rankingMetrics || [METRICS.cpl, METRICS.ctr];
  const primaryMetric = rankingMetrics[0];
  const secondaryMetric = rankingMetrics[1];

  // Build dynamic titles based on objective
  const buildRankingTitle = (metric: typeof METRICS.cpl, type: "adset" | "ad", isHigher: boolean) => {
    const typeLabel = type === "adset" ? "Conjuntos" : "Criativos";
    const direction = isHigher ? "Maior" : "Menor";
    return `Top 5 ${typeLabel} - ${direction} ${metric.label}`;
  };

  const buildRankingSubtitle = (metric: typeof METRICS.cpl, isHigher: boolean) => {
    const description = isHigher 
      ? `com melhor ${metric.label.toLowerCase()}` 
      : `com ${metric.label.toLowerCase()} mais eficiente`;
    return `${description} (mín. ${minLeadsThreshold} leads)`;
  };

  // Use adaptive rankings if provided, otherwise fall back to default CPL/CTR rankings
  const adsetPrimaryRankings = adaptiveAdsetRankings?.primary || topAdsetsByCPL;
  const adsetSecondaryRankings = adaptiveAdsetRankings?.secondary || topAdsetsByCTR;
  const adPrimaryRankings = adaptiveAdRankings?.primary || topAdsByCPL;
  const adSecondaryRankings = adaptiveAdRankings?.secondary || topAdsByCTR;

  const adsetPrimaryTotal = adaptiveAdsetRankings?.primaryTotal ?? totalAdsetsForCPL;
  const adsetSecondaryTotal = adaptiveAdsetRankings?.secondaryTotal ?? totalAdsetsForCTR;
  const adPrimaryTotal = adaptiveAdRankings?.primaryTotal ?? totalAdsForCPL;
  const adSecondaryTotal = adaptiveAdRankings?.secondaryTotal ?? totalAdsForCTR;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "650ms" }}>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Análise de Performance</h2>
        </div>
        <MinLeadsSelector
          value={minLeadsThreshold}
          onChange={onMinLeadsChange}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankingTable
          title={buildRankingTitle(primaryMetric, "adset", primaryMetric.sortOrder === 'desc')}
          subtitle={buildRankingSubtitle(primaryMetric, primaryMetric.sortOrder === 'desc')}
          data={adsetPrimaryRankings}
          metricLabel={primaryMetric.shortLabel}
          metricFormat={primaryMetric.format === 'currency' ? 'currency' : primaryMetric.format === 'percent' ? 'percent' : 'number'}
          loading={isLoading}
          delay={700}
          sortOrder={primaryMetric.sortOrder}
          totalAvailable={adsetPrimaryTotal}
          minThreshold={minLeadsThreshold}
        />
        <RankingTable
          title={buildRankingTitle(secondaryMetric, "adset", secondaryMetric.sortOrder === 'desc')}
          subtitle={buildRankingSubtitle(secondaryMetric, secondaryMetric.sortOrder === 'desc')}
          data={adsetSecondaryRankings}
          metricLabel={secondaryMetric.shortLabel}
          metricFormat={secondaryMetric.format === 'currency' ? 'currency' : secondaryMetric.format === 'percent' ? 'percent' : 'number'}
          loading={isLoading}
          delay={750}
          sortOrder={secondaryMetric.sortOrder}
          totalAvailable={adsetSecondaryTotal}
          minThreshold={minLeadsThreshold}
        />
        <RankingTable
          title={buildRankingTitle(primaryMetric, "ad", primaryMetric.sortOrder === 'desc')}
          subtitle={buildRankingSubtitle(primaryMetric, primaryMetric.sortOrder === 'desc')}
          data={adPrimaryRankings}
          metricLabel={primaryMetric.shortLabel}
          metricFormat={primaryMetric.format === 'currency' ? 'currency' : primaryMetric.format === 'percent' ? 'percent' : 'number'}
          loading={isLoading}
          delay={800}
          sortOrder={primaryMetric.sortOrder}
          totalAvailable={adPrimaryTotal}
          minThreshold={minLeadsThreshold}
        />
        <RankingTable
          title={buildRankingTitle(secondaryMetric, "ad", secondaryMetric.sortOrder === 'desc')}
          subtitle={buildRankingSubtitle(secondaryMetric, secondaryMetric.sortOrder === 'desc')}
          data={adSecondaryRankings}
          metricLabel={secondaryMetric.shortLabel}
          metricFormat={secondaryMetric.format === 'currency' ? 'currency' : secondaryMetric.format === 'percent' ? 'percent' : 'number'}
          loading={isLoading}
          delay={850}
          sortOrder={secondaryMetric.sortOrder}
          totalAvailable={adSecondaryTotal}
          minThreshold={minLeadsThreshold}
        />
      </div>
    </section>
  );
}
