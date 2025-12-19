import { useState, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, subDays } from 'date-fns';
import { withRetry } from '@/lib/retry-utils';
import { useAuth } from '@/hooks/useAuth';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  tag: string;
  utmSource: string;
  utmCampaign: string;
  createdAt: string;
  region: string;
  gender: string;
  age: string;
  income: string;
  leadScoring: string;
}

export interface LeadsKPIs {
  total: number;
  today: number;
  thisWeek: number;
  organic: number;
  paid: number;
  withSurvey: number;
  surveyRate: number;
  topSource: string;
  avgScore: number;
  hotLeadsCount: number;
  hotLeadsRate: number;
}

export interface Distribution {
  name: string;
  value: number;
  color?: string;
}

export interface ScoreBySource {
  name: string;
  alto: number;
  medio: number;
  baixo: number;
  desqualificado: number;
  total: number;
}

export interface LeadsDistributions {
  gender: Distribution[];
  age: Distribution[];
  region: Distribution[];
  utmSource: Distribution[];
  income: Distribution[];
  objection: Distribution[];
  socialNetwork: Distribution[];
  creditLimit: Distribution[];
  experience: Distribution[];
  followTime: Distribution[];
  leadScoring: Distribution[];
  calculatedScoring: Distribution[];
  maritalStatus: Distribution[];
  profession: Distribution[];
  scoreByAdSet: ScoreBySource[];
  scoreByAd: ScoreBySource[];
}

export interface TimelinePoint {
  date: string;
  leads: number;
}

export interface LeadsData {
  leads: Lead[];
  totalCount: number;
  kpis: LeadsKPIs;
  distributions: LeadsDistributions;
  timeline: TimelinePoint[];
  sparklineData: number[];
}

export interface ComparisonData {
  total: number | null;
  organic: number | null;
  withSurvey: number | null;
  surveyRate: number | null;
}

// Cache stores only aggregated data (KPIs, distributions, timeline) to avoid QuotaExceededError
// The full leads array is NOT cached as it can be very large
interface CacheableLeadsData {
  totalCount: number;
  kpis: LeadsKPIs;
  distributions: LeadsDistributions;
  timeline: TimelinePoint[];
  sparklineData: number[];
}

interface CacheEntry {
  data: CacheableLeadsData;
  timestamp: number;
  dateFrom: string;
  dateTo: string;
}

const CACHE_KEY = 'leadsData_cache_v2'; // Changed key to invalidate old large cache
const COMPARISON_CACHE_KEY = 'leadsData_comparison_cache_v2';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Clean up old cache keys to free space
function cleanupOldCache(): void {
  try {
    localStorage.removeItem('leadsData_cache');
    localStorage.removeItem('leadsData_comparison_cache');
  } catch {
    // Ignore errors during cleanup
  }
}

function loadFromCache(cacheKey: string, dateFrom: string, dateTo: string): CacheableLeadsData | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    const isSameDateRange = entry.dateFrom === dateFrom && entry.dateTo === dateTo;
    
    if (isExpired || !isSameDateRange) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return entry.data;
  } catch {
    localStorage.removeItem(cacheKey);
    return null;
  }
}

function saveToCache(cacheKey: string, data: LeadsData, dateFrom: string, dateTo: string): void {
  try {
    // Only save aggregated data, NOT the leads array
    const cacheableData: CacheableLeadsData = {
      totalCount: data.totalCount,
      kpis: data.kpis,
      distributions: data.distributions,
      timeline: data.timeline,
      sparklineData: data.sparklineData,
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
      console.warn(`Cache entry too large (${sizeKB.toFixed(1)}KB), skipping save`);
      return;
    }
    
    localStorage.setItem(cacheKey, serialized);
    console.log(`[LeadsCache] Saved ${sizeKB.toFixed(1)}KB to ${cacheKey}`);
  } catch (error) {
    // Handle QuotaExceededError gracefully
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded, clearing old cache');
      cleanupOldCache();
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(COMPARISON_CACHE_KEY);
    } else {
      console.warn('Failed to save leads data to cache:', error);
    }
  }
}

function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function useLeadsData(dateRange: DateRange | undefined, integrationId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<LeadsData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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

  const fetchLeads = useCallback(async (forceRefresh = false) => {
    // Skip fetch if user is not authenticated
    if (!user) {
      console.log('User not authenticated, skipping leads fetch');
      return;
    }

    const dateFrom = dateRange?.from?.toISOString().split('T')[0] || null;
    const dateTo = dateRange?.to?.toISOString().split('T')[0] || null;
    
    if (!dateFrom || !dateTo || !dateRange?.from || !dateRange?.to) return;

    console.log(`Fetching leads, integrationId: ${currentIntegrationId || 'default'}`);

    // Calculate previous period
    const periodDays = differenceInDays(dateRange.to, dateRange.from) + 1;
    const prevTo = subDays(dateRange.from, 1);
    const prevFrom = subDays(prevTo, periodDays - 1);
    const prevDateFrom = prevFrom.toISOString().split('T')[0];
    const prevDateTo = prevTo.toISOString().split('T')[0];
    
    // Check cache first (unless forcing refresh)
    // Note: Cache only stores aggregated data, NOT the full leads array
    if (!forceRefresh) {
      const cached = loadFromCache(CACHE_KEY, dateFrom, dateTo);
      const cachedComparison = loadFromCache(COMPARISON_CACHE_KEY, prevDateFrom, prevDateTo);
      
      if (cached) {
        console.log('[LeadsCache] Using cached aggregated data (leads array will be empty)');
        // Reconstruct full LeadsData with empty leads array
        const cachedLeadsData: LeadsData = {
          leads: [], // Not cached to save space
          ...cached,
        };
        setData(cachedLeadsData);
        setLastUpdated(new Date());
        
        if (cachedComparison) {
          setComparisonData({
            total: calculateChange(cached.kpis.total, cachedComparison.kpis.total),
            organic: calculateChange(cached.kpis.organic, cachedComparison.kpis.organic),
            withSurvey: calculateChange(cached.kpis.withSurvey, cachedComparison.kpis.withSurvey),
            surveyRate: calculateChange(cached.kpis.surveyRate, cachedComparison.kpis.surveyRate),
          });
        }
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching leads data from ${dateFrom} to ${dateTo}`);
      console.log(`Fetching comparison data from ${prevDateFrom} to ${prevDateTo}`);
      
      // Fetch both periods in parallel with retry
      const [currentResponse, previousResponse] = await Promise.all([
        withRetry(() => supabase.functions.invoke('google-sheets-leads', {
          body: { dateFrom, dateTo, integrationId: currentIntegrationId },
        }), { maxAttempts: 3, initialDelay: 1000 }),
        withRetry(() => supabase.functions.invoke('google-sheets-leads', {
          body: { dateFrom: prevDateFrom, dateTo: prevDateTo, integrationId: currentIntegrationId },
        }), { maxAttempts: 3, initialDelay: 1000 }),
      ]);
      
      if (currentResponse.error) {
        throw new Error(currentResponse.error.message || 'Failed to fetch leads data');
      }
      
      // The edge function returns data directly, not wrapped in {success, data}
      const responseData = currentResponse.data;
      
      if (responseData?.error) {
        throw new Error(responseData.error || 'Unknown error occurred');
      }
      
      // Map the response to our LeadsData interface
      const leadsData: LeadsData = {
        leads: responseData.leads || [],
        totalCount: responseData.kpis?.totalLeads || 0,
        kpis: {
          total: responseData.kpis?.totalLeads || 0,
          today: responseData.kpis?.leadsToday || 0,
          thisWeek: responseData.kpis?.leadsThisWeek || 0,
          organic: responseData.kpis?.organicLeads || 0,
          paid: responseData.kpis?.paidLeads || 0,
          withSurvey: responseData.kpis?.leadsWithSurvey || 0,
          surveyRate: responseData.kpis?.surveyRate || 0,
          topSource: responseData.kpis?.topSource || 'N/A',
          avgScore: responseData.kpis?.averageScore || 0,
          hotLeadsCount: responseData.kpis?.hotLeadsCount || 0,
          hotLeadsRate: responseData.kpis?.hotLeadsPercentage || 0,
        },
        distributions: {
          gender: responseData.distributions?.gender || [],
          age: responseData.distributions?.age || [],
          region: responseData.distributions?.region || [],
          utmSource: responseData.distributions?.utmSource || [],
          income: responseData.distributions?.income || [],
          objection: responseData.distributions?.objection || [],
          socialNetwork: responseData.distributions?.socialNetwork || [],
          creditLimit: responseData.distributions?.creditLimit || [],
          experience: responseData.distributions?.experience || [],
          followTime: responseData.distributions?.followTime || [],
          leadScoring: responseData.distributions?.leadScoring || [],
          calculatedScoring: responseData.distributions?.scoreDistribution || [],
          maritalStatus: responseData.distributions?.maritalStatus || [],
          profession: responseData.distributions?.profession || [],
          scoreByAdSet: responseData.scoreByMedium || [],
          scoreByAd: responseData.scoreByContent || [],
        },
        timeline: responseData.timeline || [],
        sparklineData: (responseData.timeline || []).map((t: TimelinePoint) => t.leads),
      };
      
      // Save current period to cache
      saveToCache(CACHE_KEY, leadsData, dateFrom, dateTo);
      setData(leadsData);
      setLastUpdated(new Date());
      
      // Debug logging for empty data scenarios
      console.log(`[LeadsData] Loaded ${leadsData.totalCount} leads for current period`);
      console.log(`[LeadsData] Timeline points: ${leadsData.timeline.length}`);
      console.log(`[LeadsData] KPIs:`, {
        total: leadsData.kpis.total,
        hotLeads: leadsData.kpis.hotLeadsCount,
        withSurvey: leadsData.kpis.withSurvey,
        avgScore: leadsData.kpis.avgScore,
      });
      
      // Warn about empty timeline
      if (leadsData.timeline.length === 0) {
        console.warn(`[LeadsData] Timeline is empty - Origem dos Leads chart will show empty state`);
      }
      
      // Warn about low qualification data
      if (leadsData.kpis.hotLeadsCount === 0 && leadsData.kpis.withSurvey === 0) {
        console.warn(`[LeadsData] No qualification data - Funil de Qualificação may show empty state`);
      }
      
      // Log distributions status
      const distKeys = Object.keys(leadsData.distributions) as (keyof typeof leadsData.distributions)[];
      const emptyDists = distKeys.filter(key => {
        const dist = leadsData.distributions[key];
        return !dist || (Array.isArray(dist) && dist.length === 0);
      });
      if (emptyDists.length > 0) {
        console.warn(`[LeadsData] Empty distributions: ${emptyDists.join(', ')}`);
      }
      
      // Process comparison data if available
      const prevResponseData = previousResponse.data;
      if (prevResponseData && !prevResponseData.error && prevResponseData.kpis) {
        const prevData: LeadsData = {
          leads: prevResponseData.leads || [],
          totalCount: prevResponseData.kpis?.totalLeads || 0,
          kpis: {
            total: prevResponseData.kpis?.totalLeads || 0,
            today: prevResponseData.kpis?.leadsToday || 0,
            thisWeek: prevResponseData.kpis?.leadsThisWeek || 0,
            organic: prevResponseData.kpis?.organicLeads || 0,
            paid: prevResponseData.kpis?.paidLeads || 0,
            withSurvey: prevResponseData.kpis?.leadsWithSurvey || 0,
            surveyRate: prevResponseData.kpis?.surveyRate || 0,
            topSource: prevResponseData.kpis?.topSource || 'N/A',
            avgScore: prevResponseData.kpis?.averageScore || 0,
            hotLeadsCount: prevResponseData.kpis?.hotLeadsCount || 0,
            hotLeadsRate: prevResponseData.kpis?.hotLeadsPercentage || 0,
          },
          distributions: {
            gender: [], age: [], region: [], utmSource: [], income: [],
            objection: [], socialNetwork: [], creditLimit: [], experience: [],
            followTime: [], leadScoring: [], calculatedScoring: [],
            maritalStatus: [], profession: [], scoreByAdSet: [], scoreByAd: [],
          },
          timeline: [],
          sparklineData: [],
        };
        saveToCache(COMPARISON_CACHE_KEY, prevData, prevDateFrom, prevDateTo);
        
        console.log(`Loaded ${prevData.totalCount} leads for comparison period`);
        
        setComparisonData({
          total: calculateChange(leadsData.kpis.total, prevData.kpis.total),
          organic: calculateChange(leadsData.kpis.organic, prevData.kpis.organic),
          withSurvey: calculateChange(leadsData.kpis.withSurvey, prevData.kpis.withSurvey),
          surveyRate: calculateChange(leadsData.kpis.surveyRate, prevData.kpis.surveyRate),
        });
      } else {
        console.warn('Could not fetch comparison data:', previousResponse.error);
        setComparisonData(null);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados de leads';
      console.error('Error fetching leads:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, currentIntegrationId, user]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(COMPARISON_CACHE_KEY);
    console.log('Leads cache cleared');
  }, []);

  // Auto-fetch when date range, integration, or user changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to && user) {
      fetchLeads(false);
    }
  }, [dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), currentIntegrationId, user]);

  return {
    data,
    comparisonData,
    isLoading,
    error,
    lastUpdated,
    fetchLeads,
    clearCache,
  };
}
