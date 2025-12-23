import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { DateRange } from "react-day-picker";
import { subDays, format, getDaysInMonth, getDate, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, RotateCcw, GitMerge } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AdsTable } from "@/components/AdsTable";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSourceLoadingProgress } from "@/components/MultiSourceLoadingProgress";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useMetaAdsData, CampaignData, calculatePercentChange, MetaAdsResponse } from "@/hooks/useMetaAdsData";
import { useGoogleAdsData } from "@/hooks/useGoogleAdsData";
import { CampaignStatus } from "@/components/StatusFilter";
import { CampaignObjective } from "@/components/ObjectiveFilter";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useProjects } from "@/hooks/useProjects";
import { useIntegrations } from "@/hooks/useIntegrations";
import { NoIntegrationAlert } from "@/components/NoIntegrationAlert";
import { KPISection, ChartsSection, RankingsSection } from "@/components/dashboard";
import { MetricConfig, PerformanceData } from "@/components/PerformanceChart";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { SmartAlerts } from "@/components/SmartAlerts";
import { useAlertChecker } from "@/hooks/useAlertChecker";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { DataSourceSelector } from "@/components/DataSourceSelector";
import { cn } from "@/lib/utils";
import { useDominantObjective } from "@/hooks/useDominantObjective";
import { SalesFunnelChart } from "@/components/charts";
import { useAcquisitionFunnel, getConversionRate } from "@/hooks/useFunnelData";
import { ConversionKPICards } from "@/components/ConversionKPICards";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";


export default function Index() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isAdmin } = useAdminCheck();
  const { user } = useAuth();

  const { filters, updateFilters, resetFilters, isLoading: filtersLoading } = usePersistedFilters();
  const dataSources = filters.dataSources || ["meta"];

  // Update document title based on data sources
  useEffect(() => {
    const hasMeta = dataSources.includes("meta");
    const hasGoogle = dataSources.includes("google");

    let title = "Dashboard - Launx Metrics";
    if (hasMeta && hasGoogle) {
      title = "Dashboard Combinado - Launx Metrics";
    } else if (hasMeta) {
      title = "Dashboard Meta Ads - Launx Metrics";
    } else if (hasGoogle) {
      title = "Dashboard Google Ads - Launx Metrics";
    }

    document.title = title;

    return () => {
      document.title = "Launx Metrics";
    };
  }, [dataSources]);
  const { projects, activeProject, setActiveProject, isLoading: projectsLoading } = useProjects();
  const { metaAdsIntegrations, googleAdsSheetsIntegrations } = useIntegrations(activeProject?.id || null);

  // Get first active integration for each platform
  const activeMetaIntegration = useMemo(() => {
    return metaAdsIntegrations.find(i => i.is_active) || metaAdsIntegrations[0] || null;
  }, [metaAdsIntegrations]);

  const activeGoogleAdsIntegration = useMemo(() => {
    return googleAdsSheetsIntegrations.find(i => i.is_active) || googleAdsSheetsIntegrations[0] || null;
  }, [googleAdsSheetsIntegrations]);

  // Determine which integrations to use based on data sources selection
  const shouldFetchMeta = dataSources.includes("meta");
  const shouldFetchGoogle = dataSources.includes("google");

  const {
    data: metaData,
    comparisonData: metaComparisonData,
    isLoading: metaLoading,
    progress: metaProgress,
    fetchData: fetchMetaData,
    clearCache: clearMetaCache
  } = useMetaAdsData(shouldFetchMeta ? activeMetaIntegration?.id : undefined);

  const {
    data: googleData,
    comparisonData: googleComparisonData,
    isLoading: googleLoading,
    progress: googleProgress,
    fetchData: fetchGoogleData,
    clearCache: clearGoogleCache
  } = useGoogleAdsData(shouldFetchGoogle ? activeGoogleAdsIntegration?.id : undefined);

  // Combined loading state
  const isLoading = (shouldFetchMeta && metaLoading) || (shouldFetchGoogle && googleLoading);
  const progress = Math.max(metaProgress, googleProgress);

  // Combine data from selected sources
  const data = useMemo((): MetaAdsResponse | null => {
    const hasMeta = dataSources.includes("meta");
    const hasGoogle = dataSources.includes("google");

    // Single source
    if (hasMeta && !hasGoogle) return metaData;
    if (hasGoogle && !hasMeta) return googleData;

    // Combine both sources
    if (!metaData && !googleData) return null;

    const metaCampaigns = metaData?.campaigns || [];
    const googleCampaigns = googleData?.campaigns || [];

    // Combine campaigns - platform identified by visual badge in table
    const combinedCampaigns = [...metaCampaigns, ...googleCampaigns];

    // Combine totals
    const metaTotals = metaData?.totals || { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpm: 0, cpl: 0, sales: 0, cps: 0 };
    const googleTotals = googleData?.totals || { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpm: 0, cpl: 0, sales: 0, cps: 0 };

    const combinedRaw = {
      spend: metaTotals.spend + googleTotals.spend,
      impressions: metaTotals.impressions + googleTotals.impressions,
      reach: metaTotals.reach + googleTotals.reach,
      clicks: metaTotals.clicks + googleTotals.clicks,
      leads: metaTotals.leads + googleTotals.leads,
      sales: (metaTotals.sales || 0) + (googleTotals.sales || 0),
    };

    const combinedTotals = {
      ...combinedRaw,
      ctr: combinedRaw.impressions > 0 ? (combinedRaw.clicks / combinedRaw.impressions) * 100 : 0,
      cpc: combinedRaw.clicks > 0 ? combinedRaw.spend / combinedRaw.clicks : 0,
      cpm: combinedRaw.impressions > 0 ? (combinedRaw.spend / combinedRaw.impressions) * 1000 : 0,
      cpl: combinedRaw.leads > 0 ? combinedRaw.spend / combinedRaw.leads : 0,
      cps: combinedRaw.sales > 0 ? combinedRaw.spend / combinedRaw.sales : 0,
    };

    // Combine sparkline data by date
    const metaSparkline = metaData?.sparklineData || [];
    const googleSparkline = googleData?.sparklineData || [];
    const sparklineMap = new Map<string, any>();

    [...metaSparkline, ...googleSparkline].forEach(point => {
      const existing = sparklineMap.get(point.date);
      if (existing) {
        sparklineMap.set(point.date, {
          date: point.date,
          impressions: existing.impressions + point.impressions,
          reach: existing.reach + point.reach,
          clicks: existing.clicks + point.clicks,
          spend: existing.spend + point.spend,
          leads: existing.leads + point.leads,
          sales: (existing.sales || 0) + (point.sales || 0),
        });
      } else {
        sparklineMap.set(point.date, { ...point });
      }
    });

    const combinedSparkline = Array.from(sparklineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      campaigns: combinedCampaigns,
      totals: combinedTotals,
      sparklineData: combinedSparkline,
      dateFrom: metaData?.dateFrom || googleData?.dateFrom || "",
      dateTo: metaData?.dateTo || googleData?.dateTo || "",
    };
  }, [dataSources, metaData, googleData]);

  // Similar combination for comparison data
  const comparisonData = useMemo(() => {
    const hasMeta = dataSources.includes("meta");
    const hasGoogle = dataSources.includes("google");

    if (hasMeta && !hasGoogle) return metaComparisonData;
    if (hasGoogle && !hasMeta) return googleComparisonData;

    if (!metaComparisonData && !googleComparisonData) return null;

    const metaCampaigns = metaComparisonData?.campaigns || [];
    const googleCampaigns = googleComparisonData?.campaigns || [];
    const combinedCampaigns = [...metaCampaigns, ...googleCampaigns];

    const metaTotals = metaComparisonData?.totals || { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpm: 0, cpl: 0, sales: 0, cps: 0 };
    const googleTotals = googleComparisonData?.totals || { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpm: 0, cpl: 0, sales: 0, cps: 0 };

    const combinedRaw = {
      spend: metaTotals.spend + googleTotals.spend,
      impressions: metaTotals.impressions + googleTotals.impressions,
      reach: metaTotals.reach + googleTotals.reach,
      clicks: metaTotals.clicks + googleTotals.clicks,
      leads: metaTotals.leads + googleTotals.leads,
      sales: (metaTotals.sales || 0) + (googleTotals.sales || 0),
    };

    return {
      campaigns: combinedCampaigns,
      totals: {
        ...combinedRaw,
        ctr: combinedRaw.impressions > 0 ? (combinedRaw.clicks / combinedRaw.impressions) * 100 : 0,
        cpc: combinedRaw.clicks > 0 ? combinedRaw.spend / combinedRaw.clicks : 0,
        cpm: combinedRaw.impressions > 0 ? (combinedRaw.spend / combinedRaw.impressions) * 1000 : 0,
        cpl: combinedRaw.leads > 0 ? combinedRaw.spend / combinedRaw.leads : 0,
        cps: combinedRaw.sales > 0 ? combinedRaw.spend / combinedRaw.sales : 0,
      },
      sparklineData: [...(metaComparisonData?.sparklineData || []), ...(googleComparisonData?.sparklineData || [])],
    };
  }, [dataSources, metaComparisonData, googleComparisonData]);

  const { settings: appSettings, updateSectionVisibility } = useAppSettings(activeProject?.id);
  const sectionVisibility = appSettings.sectionVisibility;

  // Convert persisted date strings to DateRange object with stable defaults
  const dateRange: DateRange | undefined = useMemo(() => {
    if (filters.dateRange.from || filters.dateRange.to) {
      return {
        from: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
        to: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
      };
    }
    // Default to last 30 days if no persisted date
    return {
      from: subDays(new Date(), 30),
      to: new Date(),
    };
  }, [filters.dateRange.from, filters.dateRange.to]);

  const comparisonEnabled = filters.comparisonEnabled;

  // Create stable date range key to prevent unnecessary re-fetches
  const dateRangeKey = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
    }
    return null;
  }, [dateRange?.from, dateRange?.to]);

  // Track previous date range key to detect actual changes
  const prevDateRangeKeyRef = useRef<string | null>(null);

  // Update date range and persist
  const setDateRange = useCallback((range: DateRange | undefined) => {
    updateFilters({
      dateRange: {
        from: range?.from?.toISOString() || null,
        to: range?.to?.toISOString() || null,
      },
    });
  }, [updateFilters]);

  // Update comparison and persist
  const setComparisonEnabled = useCallback((enabled: boolean) => {
    updateFilters({ comparisonEnabled: enabled });
  }, [updateFilters]);

  // Fetch data when date range key, comparison mode, integration, or user changes
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!filtersLoading && dateRangeKey && user) {
      // Clear cache if date range actually changed
      if (prevDateRangeKeyRef.current && prevDateRangeKeyRef.current !== dateRangeKey) {
        logger.debug('Date range changed, clearing cache:', prevDateRangeKeyRef.current, '->', dateRangeKey);
        localStorage.removeItem('meta_ads_cache');
        localStorage.removeItem('meta_ads_comparison_cache');
        localStorage.removeItem('google_ads_cache');
        localStorage.removeItem('google_ads_comparison_cache');
      }
      prevDateRangeKeyRef.current = dateRangeKey;

      // Fetch from appropriate sources
      if (shouldFetchMeta && activeMetaIntegration?.id) {
        fetchMetaData(dateRange, false, comparisonEnabled);
      }
      if (shouldFetchGoogle && activeGoogleAdsIntegration?.id) {
        fetchGoogleData(dateRange, false, comparisonEnabled);
      }
    }
  }, [dateRangeKey, comparisonEnabled, filtersLoading, fetchMetaData, fetchGoogleData, dateRange, activeMetaIntegration?.id, activeGoogleAdsIntegration?.id, shouldFetchMeta, shouldFetchGoogle, user]);

  const handleRefresh = useCallback(() => {
    if (shouldFetchMeta) {
      clearMetaCache();
      if (activeMetaIntegration?.id) {
        fetchMetaData(dateRange, true, comparisonEnabled);
      }
    }
    if (shouldFetchGoogle) {
      clearGoogleCache();
      if (activeGoogleAdsIntegration?.id) {
        fetchGoogleData(dateRange, true, comparisonEnabled);
      }
    }
    setLastUpdated(new Date());
  }, [clearMetaCache, clearGoogleCache, fetchMetaData, fetchGoogleData, dateRange, comparisonEnabled, shouldFetchMeta, shouldFetchGoogle, activeMetaIntegration?.id, activeGoogleAdsIntegration?.id]);

  const handlePullToRefresh = useCallback(async () => {
    handleRefresh();
  }, [handleRefresh]);

  const handleReset = () => {
    resetFilters();
  };

  // Filter campaigns by selected statuses, objectives and search query
  const filterCampaigns = useCallback((campaigns: CampaignData[] | undefined) => {
    if (!campaigns) return [];

    const query = filters.searchQuery.toLowerCase().trim();

    return campaigns
      .filter((campaign) =>
        (filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(campaign.status as CampaignStatus)) &&
        (filters.selectedObjectives.length === 0 || filters.selectedObjectives.includes(campaign.objective as CampaignObjective))
      )
      .map((campaign): CampaignData | null => {
        // Check if campaign name matches
        const campaignMatches = campaign.name.toLowerCase().includes(query);

        // Filter adsets that match or have ads that match
        const filteredAdsets = campaign.adsets
          .map((adset) => {
            const adsetMatches = adset.name.toLowerCase().includes(query);
            const filteredAds = adset.ads.filter((ad) =>
              ad.name.toLowerCase().includes(query)
            );

            // Include adset if it matches, any ad matches, or no search query
            if (!query || adsetMatches || filteredAds.length > 0) {
              return {
                ...adset,
                ads: !query ? adset.ads : (adsetMatches ? adset.ads : filteredAds),
              };
            }
            return null;
          })
          .filter((adset): adset is NonNullable<typeof adset> => adset !== null);

        // Include campaign if it matches, any adset/ad matches, or no search query
        if (!query || campaignMatches || filteredAdsets.length > 0) {
          return {
            ...campaign,
            adsets: !query ? campaign.adsets : (campaignMatches ? campaign.adsets : filteredAdsets),
          };
        }
        return null;
      })
      .filter((campaign): campaign is CampaignData => campaign !== null);
  }, [filters.selectedStatuses, filters.selectedObjectives, filters.searchQuery]);

  const filteredCampaigns = useMemo(() => filterCampaigns(data?.campaigns), [filterCampaigns, data?.campaigns]);

  // Apply same filters to comparison campaigns
  const filteredComparisonCampaigns = useMemo(() => filterCampaigns(comparisonData?.campaigns), [filterCampaigns, comparisonData?.campaigns]);

  // Calculate totals from filtered campaigns
  const calculateTotals = (campaigns: CampaignData[]) => {
    if (campaigns.length === 0) {
      return {
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        leads: 0,
        cpl: 0,
      };
    }

    const totals = campaigns.reduce(
      (acc, campaign) => ({
        spend: acc.spend + campaign.spend,
        impressions: acc.impressions + campaign.impressions,
        reach: acc.reach + campaign.reach,
        clicks: acc.clicks + campaign.clicks,
        leads: acc.leads + campaign.leads,
      }),
      { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0 }
    );

    return {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
    };
  };

  const filteredTotals = useMemo(() => calculateTotals(filteredCampaigns), [filteredCampaigns]);

  // Calculate comparison totals from filtered comparison campaigns (consistent filtering)
  const filteredComparisonTotals = useMemo(() => calculateTotals(filteredComparisonCampaigns), [filteredComparisonCampaigns]);

  // Calculate totals only from LEADS campaigns for investment report
  // Includes both Meta (OUTCOME_LEADS) and Google Ads equivalents (SEARCH, PERFORMANCE_MAX)
  const leadsCampaignsTotals = useMemo(() => {
    const leadsObjectives = ['OUTCOME_LEADS', 'SEARCH', 'PERFORMANCE_MAX'];
    const leadsCampaigns = filteredCampaigns.filter(
      campaign => leadsObjectives.includes(campaign.objective)
    );
    return calculateTotals(leadsCampaigns);
  }, [filteredCampaigns]);

  // Transform sparkline data for KPI cards
  const sparklineArrays = useMemo(() => {
    if (!data?.sparklineData) return {};

    return {
      spend: data.sparklineData.map((d) => d.spend),
      impressions: data.sparklineData.map((d) => d.impressions),
      reach: data.sparklineData.map((d) => d.reach),
      clicks: data.sparklineData.map((d) => d.clicks),
      leads: data.sparklineData.map((d) => d.leads),
      // Calculated metrics from daily data
      ctr: data.sparklineData.map((d) => d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0),
      cpc: data.sparklineData.map((d) => d.clicks > 0 ? d.spend / d.clicks : 0),
      cpm: data.sparklineData.map((d) => d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0),
      cpl: data.sparklineData.map((d) => d.leads > 0 ? d.spend / d.leads : 0),
    };
  }, [data?.sparklineData]);

  // Metrics configuration by objective (includes both Meta and Google Ads objectives)
  const metricsByObjective: Record<string, { metric1: MetricConfig; metric2: MetricConfig }> = {
    // Meta Ads objectives
    OUTCOME_LEADS: {
      metric1: { key: "leads", label: "Leads", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "cpl", label: "CPL", color: "hsl(var(--chart-2))", format: "currency" },
    },
    OUTCOME_TRAFFIC: {
      metric1: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "ctr", label: "CTR", color: "hsl(var(--chart-2))", format: "percent" },
    },
    OUTCOME_AWARENESS: {
      metric1: { key: "impressions", label: "Impressões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "reach", label: "Alcance", color: "hsl(var(--chart-2))", format: "number" },
    },
    OUTCOME_ENGAGEMENT: {
      metric1: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "impressions", label: "Impressões", color: "hsl(var(--chart-2))", format: "number" },
    },
    OUTCOME_SALES: {
      metric1: { key: "leads", label: "Conversões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "spend", label: "Investimento", color: "hsl(var(--chart-2))", format: "currency" },
    },
    OUTCOME_APP_PROMOTION: {
      metric1: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "cpc", label: "CPC", color: "hsl(var(--chart-2))", format: "currency" },
    },
    // Google Ads campaign types
    SEARCH: {
      metric1: { key: "leads", label: "Conversões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "cpl", label: "CPA", color: "hsl(var(--chart-2))", format: "currency" },
    },
    DISPLAY: {
      metric1: { key: "impressions", label: "Impressões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-2))", format: "number" },
    },
    VIDEO: {
      metric1: { key: "impressions", label: "Visualizações", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "reach", label: "Alcance", color: "hsl(var(--chart-2))", format: "number" },
    },
    SHOPPING: {
      metric1: { key: "leads", label: "Conversões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "spend", label: "Investimento", color: "hsl(var(--chart-2))", format: "currency" },
    },
    PERFORMANCE_MAX: {
      metric1: { key: "leads", label: "Conversões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "cpl", label: "CPA", color: "hsl(var(--chart-2))", format: "currency" },
    },
    DISCOVERY: {
      metric1: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "ctr", label: "CTR", color: "hsl(var(--chart-2))", format: "percent" },
    },
    LOCAL: {
      metric1: { key: "clicks", label: "Cliques", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "impressions", label: "Impressões", color: "hsl(var(--chart-2))", format: "number" },
    },
    SMART: {
      metric1: { key: "leads", label: "Conversões", color: "hsl(var(--chart-1))", format: "number" },
      metric2: { key: "spend", label: "Investimento", color: "hsl(var(--chart-2))", format: "currency" },
    },
  };

  // Detect dominant objective using hook
  const {
    dominantObjective,
    dominantConfig: objectiveConfig,
    breakdown: objectiveBreakdown,
    isMixed: hasMultipleObjectives,
  } = useDominantObjective(filteredCampaigns);

  const chartMetrics = metricsByObjective[dominantObjective] || metricsByObjective["OUTCOME_TRAFFIC"];

  // Transform data for performance chart with dynamic metrics
  const chartData = useMemo((): PerformanceData[] => {
    if (!filteredCampaigns.length) return [];

    const adsetData: PerformanceData[] = [];

    for (const campaign of filteredCampaigns) {
      for (const adset of campaign.adsets) {
        const ctr = adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0;
        const cpc = adset.clicks > 0 ? adset.spend / adset.clicks : 0;
        const cpl = adset.leads > 0 ? adset.spend / adset.leads : 0;

        adsetData.push({
          name: adset.name.length > 20 ? adset.name.substring(0, 20) + "..." : adset.name,
          clicks: adset.clicks,
          impressions: adset.impressions,
          reach: adset.reach,
          spend: adset.spend,
          leads: adset.leads,
          ctr,
          cpc,
          cpl,
        });
      }
    }

    // Sort by primary metric
    const primaryKey = chartMetrics.metric1.key;
    return adsetData
      .sort((a, b) => (b[primaryKey] as number) - (a[primaryKey] as number))
      .slice(0, 10);
  }, [filteredCampaigns, chartMetrics.metric1.key]);

  // Min leads threshold from persisted filters
  const minLeadsThreshold = filters.minLeadsThreshold ?? 5;

  // Top 5 Conjuntos - Menor CPL (mínimo de leads para relevância estatística)
  const topAdsetsByCPL = useMemo(() => {
    const adsets = filteredCampaigns.flatMap(c =>
      c.adsets.filter(a => a.leads >= minLeadsThreshold)
    );
    return adsets
      .sort((a, b) => a.cpl - b.cpl)
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        mainValue: a.cpl,
        secondaryLabel: "Leads",
        secondaryValue: a.leads,
        tertiaryLabel: "Invest",
        tertiaryValue: a.spend,
      }));
  }, [filteredCampaigns, minLeadsThreshold]);

  // Total adsets available for CPL ranking
  const totalAdsetsForCPL = useMemo(() => {
    return filteredCampaigns.flatMap(c =>
      c.adsets.filter(a => a.leads >= minLeadsThreshold)
    ).length;
  }, [filteredCampaigns, minLeadsThreshold]);

  // Top 5 Conjuntos - Maior CTR (mínimo de leads para relevância estatística)
  const topAdsetsByCTR = useMemo(() => {
    const adsets = filteredCampaigns.flatMap(c =>
      c.adsets.filter(a => a.leads >= minLeadsThreshold)
    );
    return adsets
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        mainValue: a.ctr,
        secondaryLabel: "Cliques",
        secondaryValue: a.clicks,
        tertiaryLabel: "Invest",
        tertiaryValue: a.spend,
      }));
  }, [filteredCampaigns, minLeadsThreshold]);

  // Total adsets available for CTR ranking
  const totalAdsetsForCTR = useMemo(() => {
    return filteredCampaigns.flatMap(c =>
      c.adsets.filter(a => a.leads >= minLeadsThreshold)
    ).length;
  }, [filteredCampaigns, minLeadsThreshold]);

  // Top 5 Criativos - Menor CPL (mínimo de leads para relevância estatística)
  const topAdsByCPL = useMemo(() => {
    const ads = filteredCampaigns.flatMap(c =>
      c.adsets.flatMap(a => a.ads.filter(ad => ad.leads >= minLeadsThreshold))
    );
    return ads
      .sort((a, b) => a.cpl - b.cpl)
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        mainValue: a.cpl,
        secondaryLabel: "Leads",
        secondaryValue: a.leads,
        tertiaryLabel: "Invest",
        tertiaryValue: a.spend,
      }));
  }, [filteredCampaigns, minLeadsThreshold]);

  // Total ads available for CPL ranking
  const totalAdsForCPL = useMemo(() => {
    return filteredCampaigns.flatMap(c =>
      c.adsets.flatMap(a => a.ads.filter(ad => ad.leads >= minLeadsThreshold))
    ).length;
  }, [filteredCampaigns, minLeadsThreshold]);

  // Top 5 Criativos - Maior CTR (mínimo de leads para relevância estatística)
  const topAdsByCTR = useMemo(() => {
    const ads = filteredCampaigns.flatMap(c =>
      c.adsets.flatMap(a => a.ads.filter(ad => ad.leads >= minLeadsThreshold))
    );
    return ads
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        mainValue: a.ctr,
        secondaryLabel: "Cliques",
        secondaryValue: a.clicks,
        tertiaryLabel: "Invest",
        tertiaryValue: a.spend,
      }));
  }, [filteredCampaigns, minLeadsThreshold]);

  // Total ads available for CTR ranking
  const totalAdsForCTR = useMemo(() => {
    return filteredCampaigns.flatMap(c =>
      c.adsets.flatMap(a => a.ads.filter(ad => ad.leads >= minLeadsThreshold))
    ).length;
  }, [filteredCampaigns, minLeadsThreshold]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const activeFiltersCount =
    (filters.selectedStatuses.length < 2 ? 2 - filters.selectedStatuses.length : 0) +
    (filters.selectedObjectives.length < 6 ? 6 - filters.selectedObjectives.length : 0) +
    (filters.searchQuery ? 1 : 0) +
    (comparisonEnabled ? 1 : 0);

  // Calculate comparison percentages using consistently filtered data
  const changes = useMemo(() => {
    if (!comparisonEnabled || !comparisonData || filteredComparisonCampaigns.length === 0) return null;

    return {
      spend: calculatePercentChange(filteredTotals.spend, filteredComparisonTotals.spend),
      impressions: calculatePercentChange(filteredTotals.impressions, filteredComparisonTotals.impressions),
      reach: calculatePercentChange(filteredTotals.reach, filteredComparisonTotals.reach),
      clicks: calculatePercentChange(filteredTotals.clicks, filteredComparisonTotals.clicks),
      ctr: calculatePercentChange(filteredTotals.ctr, filteredComparisonTotals.ctr),
      cpc: calculatePercentChange(filteredTotals.cpc, filteredComparisonTotals.cpc),
      cpm: calculatePercentChange(filteredTotals.cpm, filteredComparisonTotals.cpm),
      leads: calculatePercentChange(filteredTotals.leads, filteredComparisonTotals.leads),
      cpl: calculatePercentChange(filteredTotals.cpl, filteredComparisonTotals.cpl),
    };
  }, [comparisonEnabled, comparisonData, filteredTotals, filteredComparisonTotals, filteredComparisonCampaigns.length]);

  // Prepare campaign period for charts (ensure useCurrentMonth has a default)
  const campaignPeriodForCharts = useMemo(() => {
    if (!appSettings.periodGoals.campaignPeriod) return undefined;
    return {
      ...appSettings.periodGoals.campaignPeriod,
      useCurrentMonth: appSettings.periodGoals.campaignPeriod.useCurrentMonth ?? true,
    };
  }, [appSettings.periodGoals.campaignPeriod]);

  // Calculate expected leads for current point in month
  const expectedLeadsForAlerts = useMemo(() => {
    const today = new Date();
    const currentDay = getDate(today);
    const daysInMonth = getDaysInMonth(today);
    const monthlyGoal = appSettings.periodGoals.monthly.leads || 0;
    return (monthlyGoal / daysInMonth) * currentDay;
  }, [appSettings.periodGoals.monthly.leads]);

  // Prepare metrics for alert checker
  const alertMetrics = useMemo(() => ({
    cpl: leadsCampaignsTotals.cpl,
    ctr: filteredTotals.ctr,
    spend: leadsCampaignsTotals.spend,
    leads: filteredTotals.leads,
    expectedLeads: expectedLeadsForAlerts,
    goalLeads: appSettings.periodGoals.monthly.leads || 0,
    maxCPL: appSettings.periodGoals.monthly.cpl || 0,
    budgetLimit: appSettings.periodGoals.monthly.spend || 0,
  }), [
    leadsCampaignsTotals.cpl,
    leadsCampaignsTotals.spend,
    filteredTotals.ctr,
    filteredTotals.leads,
    expectedLeadsForAlerts,
    appSettings.periodGoals.monthly,
  ]);

  // Hook to check and trigger alerts automatically
  useAlertChecker(alertMetrics, activeProject?.id || null);

  // Acquisition funnel data
  const acquisitionFunnelData = useAcquisitionFunnel(filteredTotals, filteredCampaigns);

  // Conversion rates for KPIs
  const conversionRates = useMemo(() => ({
    impressionToReach: getConversionRate(filteredTotals.reach, filteredTotals.impressions),
    reachToClick: getConversionRate(filteredTotals.clicks, filteredTotals.reach),
    clickToLead: getConversionRate(filteredTotals.leads, filteredTotals.clicks),
    leadToSale: 0,
    overallConversion: getConversionRate(filteredTotals.leads, filteredTotals.impressions),
    surveyRate: 0,
    qualificationRate: 0,
    hotLeadRate: 0,
  }), [filteredTotals]);

  // Prepare data for AI Insights panel
  const aiInsightsData = useMemo(() => ({
    leads: filteredTotals.leads,
    spend: leadsCampaignsTotals.spend,
    cpl: leadsCampaignsTotals.cpl,
    impressions: filteredTotals.impressions,
    clicks: filteredTotals.clicks,
    ctr: filteredTotals.ctr,
    reach: filteredTotals.reach,
    cpm: filteredTotals.cpm,
    goal: appSettings.periodGoals.monthly.leads || 0,
    period: dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
      : "Período atual",
    previousPeriod: comparisonData && filteredComparisonTotals ? {
      leads: filteredComparisonTotals.leads,
      spend: filteredComparisonTotals.spend,
      cpl: filteredComparisonTotals.cpl,
      ctr: filteredComparisonTotals.ctr,
    } : undefined,
    dailyData: data?.sparklineData?.map(d => ({
      date: d.date,
      leads: d.leads,
      spend: d.spend,
      cpl: d.leads > 0 ? d.spend / d.leads : 0,
    })),
    topCampaigns: filteredCampaigns.slice(0, 5).map(c => ({
      name: c.name,
      leads: c.leads,
      spend: c.spend,
      cpl: c.cpl,
      ctr: c.ctr,
    })),
  }), [
    filteredTotals,
    leadsCampaignsTotals,
    appSettings.periodGoals.monthly.leads,
    dateRange,
    comparisonData,
    filteredComparisonTotals,
    data?.sparklineData,
    filteredCampaigns,
  ]);

  return (
    <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          projectsLoading={projectsLoading}
          dataSources={dataSources}
          hasMetaAds={metaAdsIntegrations.length > 0}
          hasGoogleAds={googleAdsSheetsIntegrations.length > 0}
          sectionVisibility={sectionVisibility}
          onSectionVisibilityChange={updateSectionVisibility}
        />

        {/* Controls Bar - Data Source, Refresh, DatePicker */}
        <div className="sticky top-14 md:top-16 z-40 w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="w-full px-4 py-2 md:py-3">
            {/* Mobile: Stacked layout */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* Row 1: Data Source + Refresh */}
              <div className="flex items-center justify-between gap-2">
                {(metaAdsIntegrations.length > 0 && googleAdsSheetsIntegrations.length > 0) && (
                  <DataSourceSelector
                    value={dataSources}
                    onChange={(value) => updateFilters({ dataSources: value })}
                    hasMetaAds={metaAdsIntegrations.length > 0}
                    hasGoogleAds={googleAdsSheetsIntegrations.length > 0}
                    compact
                  />
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                      className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-8 w-8 hover:border-primary/50"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>
              </div>
              {/* Row 2: DatePicker full width */}
              <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
              {/* Left: Data Source Selector */}
              <div className="flex items-center gap-3">
                {(metaAdsIntegrations.length > 0 && googleAdsSheetsIntegrations.length > 0) && (
                  <DataSourceSelector
                    value={dataSources}
                    onChange={(value) => updateFilters({ dataSources: value })}
                    hasMetaAds={metaAdsIntegrations.length > 0}
                    hasGoogleAds={googleAdsSheetsIntegrations.length > 0}
                  />
                )}
              </div>

              {/* Right: Reset, Refresh, DatePicker */}
              <div className="flex items-center gap-2 ml-auto">
                {activeFiltersCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">Resetar</span>
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0">
                          {activeFiltersCount}
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limpar todos os filtros ativos</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="gap-2 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      <span className="hidden sm:inline">Atualizar</span>
                      {lastUpdated && (
                        <span className="text-muted-foreground text-xs hidden lg:inline">
                          {formatDistanceToNow(lastUpdated, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Atualizar dados do servidor (limpa cache)</p>
                  </TooltipContent>
                </Tooltip>

                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Progress - Multi-source or single source */}
        {(shouldFetchMeta && shouldFetchGoogle) ? (
          <MultiSourceLoadingProgress
            isMetaLoading={metaLoading}
            isGoogleLoading={googleLoading}
            metaProgress={metaProgress}
            googleProgress={googleProgress}
            dataSources={dataSources}
          />
        ) : (
          isLoading && progress > 0 && (
            <Progress value={progress} className="h-1 rounded-none" />
          )
        )}

        <main className="w-full px-4 py-6 space-y-6">

          {/* No Integration Alert */}
          {!isLoading && activeProject && shouldFetchMeta && !activeMetaIntegration && (
            <NoIntegrationAlert
              projectName={activeProject.name}
              integrationType="Meta Ads"
            />
          )}
          {!isLoading && activeProject && shouldFetchGoogle && !activeGoogleAdsIntegration && (
            <NoIntegrationAlert
              projectName={activeProject.name}
              integrationType="Google Ads"
            />
          )}

          {/* KPI Section */}
          <KPISection
            totals={filteredTotals}
            changes={changes}
            sparklineArrays={sparklineArrays}
            comparisonEnabled={comparisonEnabled}
            onComparisonChange={setComparisonEnabled}
            isLoading={isLoading}
            goalSettings={{
              monthlyGoal: appSettings.periodGoals.monthly.leads,
              thresholds: appSettings.progressAlerts.thresholds,
              alertsEnabled: appSettings.progressAlerts.enabled && appSettings.progressAlerts.notifications.inApp,
              campaignPeriod: appSettings.periodGoals.campaignPeriod,
            }}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            datePeriod={dateRange?.from && dateRange?.to ? `${dateRange.from.toLocaleDateString("pt-BR")} - ${dateRange.to.toLocaleDateString("pt-BR")}` : "Período atual"}
            topAdSets={topAdsetsByCPL.slice(0, 5).map(a => ({ name: a.name, cpl: a.mainValue, leads: a.secondaryValue }))}
            topCreatives={topAdsByCTR.slice(0, 5).map(a => ({ name: a.name, ctr: a.mainValue, clicks: a.secondaryValue }))}
            objectiveConfig={objectiveConfig}
            objectiveBreakdown={objectiveBreakdown}
            dominantObjective={dominantObjective}
          />

          {/* Smart Alerts - Admin only + toggle */}
          {isAdmin && sectionVisibility.smartAlerts && filteredTotals.leads > 0 && (
            <>
              <div className="h-px bg-border/50" />
              <SmartAlerts
                currentCPL={alertMetrics.cpl}
                maxCPL={alertMetrics.maxCPL}
                currentCTR={alertMetrics.ctr}
                currentSpend={alertMetrics.spend}
                budgetLimit={alertMetrics.budgetLimit}
                currentLeads={alertMetrics.leads}
                expectedLeads={alertMetrics.expectedLeads}
                goalLeads={alertMetrics.goalLeads}
              />
            </>
          )}

          {/* AI Insights - Admin only + toggle */}
          {isAdmin && sectionVisibility.aiInsights && filteredTotals.leads > 0 && (
            <>
              <div className="h-px bg-border/50" />
              <AIInsightsPanel data={aiInsightsData} />
            </>
          )}

          {/* Charts Section */}
          {sectionVisibility.charts && (
            <>
              <div className="h-px bg-border/50" />
              <ChartsSection
                sparklineData={data?.sparklineData || []}
                chartData={chartData}
                chartMetrics={chartMetrics}
                isLoading={isLoading}
                projectName={activeProject?.name}
                goalSettings={{
                  monthlyGoal: appSettings.periodGoals.monthly.leads,
                  campaignPeriod: campaignPeriodForCharts,
                }}
                leadsCampaignsTotals={leadsCampaignsTotals}
                filteredTotals={filteredTotals}
                leadsChange={changes?.leads}
                spendChange={changes?.spend}
                cplChange={changes?.cpl}
                activeCampaigns={filteredCampaigns.filter(c => c.status === 'ACTIVE').length}
                dataSources={dataSources}
                dateFrom={data?.dateFrom}
                dateTo={data?.dateTo}
              />
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Funnel Section */}
          {sectionVisibility.funnel && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GitMerge className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Funil de Conversão</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <SalesFunnelChart
                    title="Pipeline de Aquisição"
                    icon={<GitMerge className="h-4 w-4 text-primary" />}
                    data={acquisitionFunnelData}
                    height={280}
                    showConversionRates
                    loading={isLoading}
                    delay={0}
                  />
                </div>
                <ConversionKPICards
                  rates={conversionRates}
                  loading={isLoading}
                  delay={0}
                />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Rankings Section */}
          {sectionVisibility.rankings && (
            <RankingsSection
              minLeadsThreshold={minLeadsThreshold}
              onMinLeadsChange={(value) => updateFilters({ minLeadsThreshold: value })}
              topAdsetsByCPL={topAdsetsByCPL}
              topAdsetsByCTR={topAdsetsByCTR}
              topAdsByCPL={topAdsByCPL}
              topAdsByCTR={topAdsByCTR}
              totalAdsetsForCPL={totalAdsetsForCPL}
              totalAdsetsForCTR={totalAdsetsForCTR}
              totalAdsForCPL={totalAdsForCPL}
              totalAdsForCTR={totalAdsForCTR}
              isLoading={isLoading}
            />
          )}

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Ads Table */}
          {sectionVisibility.adsTable && (
            <AdsTable
              campaigns={filteredCampaigns}
              loading={isLoading}
              searchQuery={filters.searchQuery}
              onSearchChange={(value) => updateFilters({ searchQuery: value })}
              selectedStatuses={filters.selectedStatuses}
              onStatusChange={(statuses) => updateFilters({ selectedStatuses: statuses })}
              selectedObjectives={filters.selectedObjectives}
              onObjectiveChange={(objectives) => updateFilters({ selectedObjectives: objectives })}
              onClearFilters={resetFilters}
              dataSources={dataSources}
            />
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}
