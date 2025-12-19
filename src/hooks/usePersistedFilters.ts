import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { CampaignStatus } from "@/components/StatusFilter";
import { CampaignObjective } from "@/components/ObjectiveFilter";
import { DataSources } from "@/components/DataSourceSelector";
import { Json } from "@/integrations/supabase/types";

interface DateRangeFilter {
  from: string | null;
  to: string | null;
}

interface DashboardFilters {
  selectedStatuses: CampaignStatus[];
  selectedObjectives: CampaignObjective[];
  searchQuery: string;
  minLeadsThreshold: number;
  dateRange: DateRangeFilter;
  comparisonEnabled: boolean;
  dataSources: DataSources;
}

const DEFAULT_FILTERS: DashboardFilters = {
  selectedStatuses: ["ACTIVE", "PAUSED", "IN_PROCESS", "WITH_ISSUES", "CAMPAIGN_PAUSED"],
  selectedObjectives: [
    // Meta Ads objectives
    "OUTCOME_LEADS", "OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", 
    "OUTCOME_ENGAGEMENT", "OUTCOME_SALES", "OUTCOME_APP_PROMOTION",
    // Google Ads campaign types
    "SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "PERFORMANCE_MAX", "DISCOVERY", "LOCAL", "SMART"
  ],
  searchQuery: "",
  minLeadsThreshold: 5,
  dateRange: { from: null, to: null },
  comparisonEnabled: false,
  dataSources: ["meta"],
};

const PAGE_KEY = "dashboard";
const DEBOUNCE_MS = 500;

export function usePersistedFilters() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load filters from database
  useEffect(() => {
    async function loadFilters() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_filters")
          .select("filters")
          .eq("user_id", user.id)
          .eq("page_key", PAGE_KEY)
          .maybeSingle();

        if (error) {
          console.error("Error loading filters:", error);
          return;
        }

        if (data?.filters) {
          const savedFilters = data.filters as unknown as DashboardFilters;
          // Handle migration from old dataSource (string) to new dataSources (array)
          let dataSources = savedFilters.dataSources;
          if (!dataSources && (savedFilters as any).dataSource) {
            const oldSource = (savedFilters as any).dataSource;
            dataSources = oldSource === "all" ? ["meta", "google"] : [oldSource];
          }
          setFilters({
            selectedStatuses: savedFilters.selectedStatuses || DEFAULT_FILTERS.selectedStatuses,
            selectedObjectives: savedFilters.selectedObjectives || DEFAULT_FILTERS.selectedObjectives,
            searchQuery: savedFilters.searchQuery || DEFAULT_FILTERS.searchQuery,
            minLeadsThreshold: savedFilters.minLeadsThreshold ?? DEFAULT_FILTERS.minLeadsThreshold,
            dateRange: savedFilters.dateRange || DEFAULT_FILTERS.dateRange,
            comparisonEnabled: savedFilters.comparisonEnabled ?? DEFAULT_FILTERS.comparisonEnabled,
            dataSources: dataSources || DEFAULT_FILTERS.dataSources,
          });
        }
      } catch (err) {
        console.error("Error loading filters:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFilters();
  }, [user]);

  // Save filters to database
  const saveFilters = useCallback(
    async (newFilters: DashboardFilters) => {
      if (!user) return;

      setIsSaving(true);
      try {
        // First check if record exists
        const { data: existing } = await supabase
          .from("user_filters")
          .select("id")
          .eq("user_id", user.id)
          .eq("page_key", PAGE_KEY)
          .maybeSingle();

        const filtersJson = JSON.parse(JSON.stringify(newFilters)) as Json;

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from("user_filters")
            .update({ filters: filtersJson })
            .eq("id", existing.id);

          if (error) console.error("Error updating filters:", error);
        } else {
          // Insert new record
          const { error } = await supabase
            .from("user_filters")
            .insert([{
              user_id: user.id,
              page_key: PAGE_KEY,
              filters: filtersJson,
            }]);

          if (error) console.error("Error inserting filters:", error);
        }
      } catch (err) {
        console.error("Error saving filters:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  // Debounced save function
  const debouncedSave = useCallback(
    (newFilters: DashboardFilters) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        saveFilters(newFilters);
      }, DEBOUNCE_MS);
    },
    [saveFilters]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Update filters and persist with debounce
  const updateFilters = useCallback(
    (updates: Partial<DashboardFilters>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...updates };
        debouncedSave(newFilters);
        return newFilters;
      });
    },
    [debouncedSave]
  );

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    saveFilters(DEFAULT_FILTERS);
  }, [saveFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    isLoading,
    isSaving,
  };
}
