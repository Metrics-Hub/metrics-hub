import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Json } from "@/integrations/supabase/types";

interface DateRangeFilter {
  from: string | null;
  to: string | null;
}

interface LeadsFilters {
  dateRange: DateRangeFilter;
  searchTerm: string;
  showComparison: boolean;
  selectedTags: string[];
  selectedRegions: string[];
  selectedUtmSources: string[];
}

const DEFAULT_FILTERS: LeadsFilters = {
  dateRange: { from: null, to: null },
  searchTerm: "",
  showComparison: false,
  selectedTags: [],
  selectedRegions: [],
  selectedUtmSources: [],
};

const PAGE_KEY = "leads";
const DEBOUNCE_MS = 500;

export function useLeadsFilters() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<LeadsFilters>(DEFAULT_FILTERS);
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
          console.error("Error loading leads filters:", error);
          return;
        }

        if (data?.filters) {
          const savedFilters = data.filters as unknown as LeadsFilters;
          setFilters({
            dateRange: savedFilters.dateRange || DEFAULT_FILTERS.dateRange,
            searchTerm: savedFilters.searchTerm || DEFAULT_FILTERS.searchTerm,
            showComparison: savedFilters.showComparison ?? DEFAULT_FILTERS.showComparison,
            selectedTags: savedFilters.selectedTags || DEFAULT_FILTERS.selectedTags,
            selectedRegions: savedFilters.selectedRegions || DEFAULT_FILTERS.selectedRegions,
            selectedUtmSources: savedFilters.selectedUtmSources || DEFAULT_FILTERS.selectedUtmSources,
          });
        }
      } catch (err) {
        console.error("Error loading leads filters:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFilters();
  }, [user]);

  // Save filters to database
  const saveFilters = useCallback(
    async (newFilters: LeadsFilters) => {
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

          if (error) console.error("Error updating leads filters:", error);
        } else {
          // Insert new record
          const { error } = await supabase
            .from("user_filters")
            .insert([{
              user_id: user.id,
              page_key: PAGE_KEY,
              filters: filtersJson,
            }]);

          if (error) console.error("Error inserting leads filters:", error);
        }
      } catch (err) {
        console.error("Error saving leads filters:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  // Debounced save function
  const debouncedSave = useCallback(
    (newFilters: LeadsFilters) => {
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
    (updates: Partial<LeadsFilters>) => {
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
