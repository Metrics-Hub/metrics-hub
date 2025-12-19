import { useMemo } from "react";
import { CampaignData } from "@/hooks/useMetaAdsData";
import { CampaignObjective } from "@/components/ObjectiveFilter";
import { getObjectiveConfig, ObjectiveMetricConfig, objectiveGroups } from "@/lib/objective-metrics";

export interface ObjectiveBreakdown {
  objective: CampaignObjective;
  spend: number;
  campaigns: number;
  percentage: number;
}

export interface DominantObjectiveResult {
  dominantObjective: CampaignObjective | null;
  dominantConfig: ObjectiveMetricConfig;
  isMixed: boolean;
  breakdown: ObjectiveBreakdown[];
  totalSpend: number;
  hasLeadsCampaigns: boolean;
  hasAwarenessCampaigns: boolean;
  hasTrafficCampaigns: boolean;
}

export function useDominantObjective(campaigns: CampaignData[]): DominantObjectiveResult {
  return useMemo(() => {
    if (!campaigns.length) {
      return {
        dominantObjective: null,
        dominantConfig: getObjectiveConfig('OUTCOME_LEADS'),
        isMixed: false,
        breakdown: [],
        totalSpend: 0,
        hasLeadsCampaigns: false,
        hasAwarenessCampaigns: false,
        hasTrafficCampaigns: false,
      };
    }

    // Calculate spend by objective
    const spendByObjective: Record<string, { spend: number; campaigns: number }> = {};
    let totalSpend = 0;

    for (const campaign of campaigns) {
      const objective = campaign.objective || 'UNKNOWN';
      if (!spendByObjective[objective]) {
        spendByObjective[objective] = { spend: 0, campaigns: 0 };
      }
      spendByObjective[objective].spend += campaign.spend;
      spendByObjective[objective].campaigns += 1;
      totalSpend += campaign.spend;
    }

    // Create breakdown sorted by spend
    const breakdown: ObjectiveBreakdown[] = Object.entries(spendByObjective)
      .map(([objective, data]) => ({
        objective: objective as CampaignObjective,
        spend: data.spend,
        campaigns: data.campaigns,
        percentage: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend);

    const dominant = breakdown[0];
    const dominantObjective = dominant?.objective || null;

    // Check if mixed (second objective has >30% of dominant spend)
    const isMixed = breakdown.length > 1 && 
      dominant && 
      breakdown[1].spend / dominant.spend > 0.3;

    // Check for campaign type presence
    const objectivesPresent = Object.keys(spendByObjective);
    const hasLeadsCampaigns = objectivesPresent.some(o => objectiveGroups.leads.includes(o));
    const hasAwarenessCampaigns = objectivesPresent.some(o => objectiveGroups.awareness.includes(o));
    const hasTrafficCampaigns = objectivesPresent.some(o => objectiveGroups.traffic.includes(o));

    return {
      dominantObjective,
      dominantConfig: getObjectiveConfig(dominantObjective || 'OUTCOME_LEADS'),
      isMixed,
      breakdown,
      totalSpend,
      hasLeadsCampaigns,
      hasAwarenessCampaigns,
      hasTrafficCampaigns,
    };
  }, [campaigns]);
}
