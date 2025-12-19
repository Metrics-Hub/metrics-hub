import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { withRetry } from "@/lib/retry-utils";
import { validateAdsInsightsParams, validateDateRange } from "@/lib/edge-function-validators";
import { useAuth } from "@/hooks/useAuth";
import { 
  InsightData, 
  CampaignData, 
  SparklineDataPoint, 
  MetaAdsResponse,
  ComparisonData,
  calculatePercentChange 
} from "./useMetaAdsData";

// Re-export types for convenience
export type { InsightData, CampaignData, SparklineDataPoint, MetaAdsResponse, ComparisonData };
export { calculatePercentChange };

const CACHE_KEY = "google_ads_cache_v2";
const COMPARISON_CACHE_KEY = "google_ads_comparison_cache_v2";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache stores only aggregated data (totals, sparklineData) to avoid QuotaExceededError
// The campaigns array is NOT cached as it can be very large
interface CacheableAdsData {
  totals: InsightData;
  sparklineData: SparklineDataPoint[];
  dateFrom: string;
  dateTo: string;
}

interface CacheEntry {
  data: CacheableAdsData;
  timestamp: number;
  dateFrom: string;
  dateTo: string;
}

// Clean up old cache keys to free space
function cleanupOldCache(): void {
  try {
    localStorage.removeItem("google_ads_cache");
    localStorage.removeItem("google_ads_comparison_cache");
  } catch {
    // Ignore errors during cleanup
  }
}

function getCachedData(key: string, dateFrom: string, dateTo: string): CacheableAdsData | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    const isSamePeriod = entry.dateFrom === dateFrom && entry.dateTo === dateTo;

    if (isExpired || !isSamePeriod) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedData(key: string, data: MetaAdsResponse, dateFrom: string, dateTo: string) {
  try {
    // Only save aggregated data, NOT the campaigns array
    const cacheableData: CacheableAdsData = {
      totals: data.totals,
      sparklineData: data.sparklineData,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    };
    
    const entry: CacheEntry = {
      data: cacheableData,
      timestamp: Date.now(),
      dateFrom,
      dateTo,
    };
    
    const serialized = JSON.stringify(entry);
    
    // Check size before saving (rough estimate: 1 char ≈ 2 bytes in UTF-16)
    const sizeKB = (serialized.length * 2) / 1024;
    if (sizeKB > 500) {
      console.warn(`[GoogleAdsCache] Entry too large (${sizeKB.toFixed(1)}KB), skipping save`);
      return;
    }
    
    localStorage.setItem(key, serialized);
    console.log(`[GoogleAdsCache] Saved ${sizeKB.toFixed(1)}KB to ${key}`);
  } catch (error) {
    // Handle QuotaExceededError gracefully
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded, clearing old cache");
      cleanupOldCache();
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(COMPARISON_CACHE_KEY);
    } else {
      console.error("Error caching data:", error);
    }
  }
}

function transformCampaigns(rawCampaigns: any[]): CampaignData[] {
  return rawCampaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective || '',
    impressions: campaign.impressions || 0,
    reach: campaign.reach || 0,
    clicks: campaign.clicks || 0,
    ctr: campaign.ctr || 0,
    spend: campaign.spend || 0,
    cpc: campaign.cpc || 0,
    cpm: campaign.cpm || 0,
    leads: campaign.leads || 0,
    cpl: campaign.cpl || 0,
    sales: campaign.sales || 0,
    cps: campaign.cps || 0,
    adsets: (campaign.adsets || []).map((adset: any) => ({
      id: adset.id,
      name: adset.name,
      status: adset.status,
      impressions: adset.impressions || 0,
      reach: adset.reach || 0,
      clicks: adset.clicks || 0,
      ctr: adset.ctr || 0,
      spend: adset.spend || 0,
      cpc: adset.cpc || 0,
      cpm: adset.cpm || 0,
      leads: adset.leads || 0,
      cpl: adset.cpl || 0,
      sales: adset.sales || 0,
      cps: adset.cps || 0,
      ads: (adset.ads || []).map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        impressions: ad.impressions || 0,
        reach: ad.reach || 0,
        clicks: ad.clicks || 0,
        ctr: ad.ctr || 0,
        spend: ad.spend || 0,
        cpc: ad.cpc || 0,
        cpm: ad.cpm || 0,
        leads: ad.leads || 0,
        cpl: ad.cpl || 0,
        sales: ad.sales || 0,
        cps: ad.cps || 0,
      })),
    })),
  }));
}

async function fetchPeriodData(dateFrom: string, dateTo: string, integrationId?: string): Promise<MetaAdsResponse> {
  // Validate params before making the request
  const validatedParams = validateAdsInsightsParams({
    dateFrom,
    dateTo,
    activeOnly: false,
    integrationId,
  });

  return withRetry(async () => {
    // Use google-ads-sheets for Google Ads data via spreadsheet
    const { data: responseData, error: functionError } = await supabase.functions.invoke(
      "google-ads-sheets",
      {
        body: validatedParams,
      }
    );

    if (functionError) {
      throw new Error(functionError.message);
    }

    if (!responseData?.success) {
      throw new Error(responseData?.error || "Failed to fetch Google Ads data");
    }

    return {
      campaigns: transformCampaigns(responseData.data.campaigns),
      totals: responseData.data.totals,
      sparklineData: responseData.data.sparklineData,
      dateFrom: responseData.data.dateFrom,
      dateTo: responseData.data.dateTo,
    };
  }, { maxAttempts: 3, initialDelay: 1000 });
}

export function useGoogleAdsData(integrationId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<MetaAdsResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentIntegrationId, setCurrentIntegrationId] = useState<string | undefined>(integrationId);

  // Clear data when integration changes
  useEffect(() => {
    if (integrationId !== currentIntegrationId) {
      setCurrentIntegrationId(integrationId);
      setData(null);
      setComparisonData(null);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(COMPARISON_CACHE_KEY);
    }
  }, [integrationId, currentIntegrationId]);

  const fetchData = useCallback(async (
    dateRange: DateRange | undefined, 
    forceRefresh = false,
    withComparison = false
  ) => {
    // Skip fetch if user is not authenticated
    if (!user) {
      console.log('User not authenticated, skipping Google Ads fetch');
      return;
    }

    // Validate date range first
    const validatedDates = validateDateRange(dateRange?.from, dateRange?.to);
    if (!validatedDates) {
      console.warn("Invalid date range for Google Ads, skipping fetch");
      return;
    }

    // Skip fetch if no valid integration ID is configured
    if (!currentIntegrationId) {
      console.log("No Google Ads integration configured, skipping fetch");
      return;
    }

    const { dateFrom, dateTo } = validatedDates;

    // Calculate previous period
    const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
    const prevTo = subDays(dateRange.from, 1);
    const prevFrom = subDays(prevTo, daysDiff - 1);
    const prevDateFrom = format(prevFrom, "yyyy-MM-dd");
    const prevDateTo = format(prevTo, "yyyy-MM-dd");

    // Check cache first (unless forcing refresh)
    // Note: Cache only stores aggregated data (totals, sparklineData), NOT campaigns
    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEY, dateFrom, dateTo);
      if (cached) {
        console.log("[GoogleAdsCache] Using cached aggregated data (campaigns array will be empty)");
        // Reconstruct full MetaAdsResponse with empty campaigns array
        const cachedAdsData: MetaAdsResponse = {
          campaigns: [], // Not cached to save space
          totals: cached.totals,
          sparklineData: cached.sparklineData,
          dateFrom: cached.dateFrom,
          dateTo: cached.dateTo,
        };
        setData(cachedAdsData);
        
        if (withComparison) {
          const cachedComparison = getCachedData(COMPARISON_CACHE_KEY, prevDateFrom, prevDateTo);
          if (cachedComparison) {
            setComparisonData({
              campaigns: [], // Not cached
              totals: cachedComparison.totals,
              sparklineData: cachedComparison.sparklineData,
            });
            return;
          }
        } else {
          setComparisonData(null);
          return;
        }
      }
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 500);

    try {
      console.log(`Fetching Google Ads data from ${dateFrom} to ${dateTo}, integrationId: ${currentIntegrationId || 'default'}`);
      
      // Fetch current period
      const currentData = await fetchPeriodData(dateFrom, dateTo, currentIntegrationId);
      setData(currentData);
      setCachedData(CACHE_KEY, currentData, dateFrom, dateTo);

      // Fetch comparison period if enabled
      if (withComparison) {
        console.log(`Fetching comparison data from ${prevDateFrom} to ${prevDateTo}`);
        try {
          const prevData = await fetchPeriodData(prevDateFrom, prevDateTo, currentIntegrationId);
          setComparisonData({
            campaigns: prevData.campaigns,
            totals: prevData.totals,
            sparklineData: prevData.sparklineData,
          });
          setCachedData(COMPARISON_CACHE_KEY, prevData, prevDateFrom, prevDateTo);
        } catch (compErr) {
          console.error("Error fetching comparison data:", compErr);
          setComparisonData(null);
        }
      } else {
        setComparisonData(null);
      }

      toast.success("Dados do Google Ads atualizados!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Error fetching Google Ads data:", errorMessage);
      setError(errorMessage);
      toast.error(`Erro ao buscar dados: ${errorMessage}`);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }
  }, [currentIntegrationId, user]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(COMPARISON_CACHE_KEY);
    console.log("Google Ads cache cleared");
    toast.success("Cache limpo com sucesso");
  }, []);

  return {
    data,
    comparisonData,
    isLoading,
    error,
    progress,
    fetchData,
    clearCache,
  };
}
