import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// Period Goals
interface PeriodGoals {
  campaignPeriod: {
    startDate: string | null;  // ISO date string or null for auto (current month)
    endDate: string | null;
    useCurrentMonth: boolean;
  };
  monthly: {
    leads: number;
    spend: number;
    cpl: number;
  };
  weekly: {
    leads: number;
    enabled: boolean;
  };
  daily: {
    leads: number;
    enabled: boolean;
  };
}

// Progress Alerts
interface ProgressAlerts {
  enabled: boolean;
  thresholds: {
    danger: number;
    warning: number;
    success: number;
  };
  notifications: {
    inApp: boolean;
    daily: boolean;
    weekly: boolean;
  };
}

// App Preferences
interface AppPreferences {
  cacheDuration: number; // minutes
  timezone: string;
  currencyPrefix: string;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
}

// Section Visibility
export interface SectionVisibility {
  smartAlerts: boolean;
  aiInsights: boolean;
  charts: boolean;
  funnel: boolean;
  rankings: boolean;
  adsTable: boolean;
}

export interface AppSettings {
  leadGoal: number;
  periodGoals: PeriodGoals;
  progressAlerts: ProgressAlerts;
  appPreferences: AppPreferences;
  sectionVisibility: SectionVisibility;
}

const DEFAULT_PERIOD_GOALS: PeriodGoals = {
  campaignPeriod: {
    startDate: null,
    endDate: null,
    useCurrentMonth: true,
  },
  monthly: {
    leads: 500,
    spend: 10000,
    cpl: 50,
  },
  weekly: {
    leads: 125,
    enabled: false,
  },
  daily: {
    leads: 20,
    enabled: false,
  },
};

const DEFAULT_PROGRESS_ALERTS: ProgressAlerts = {
  enabled: true,
  thresholds: {
    danger: 50,
    warning: 75,
    success: 100,
  },
  notifications: {
    inApp: true,
    daily: false,
    weekly: false,
  },
};

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  cacheDuration: 10,
  timezone: "America/Sao_Paulo",
  currencyPrefix: "R$",
  weekStartsOn: 1,
};

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  smartAlerts: true,
  aiInsights: true,
  charts: true,
  funnel: true,
  rankings: true,
  adsTable: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  leadGoal: 500,
  periodGoals: DEFAULT_PERIOD_GOALS,
  progressAlerts: DEFAULT_PROGRESS_ALERTS,
  appPreferences: DEFAULT_APP_PREFERENCES,
  sectionVisibility: DEFAULT_SECTION_VISIBILITY,
};

// Helper function to safely parse JSON value
function parseJsonValue<T>(value: Json, defaultValue: T): T {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return { ...defaultValue, ...value } as T;
  }
  return defaultValue;
}

export function useAppSettings(projectId?: string | null) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // Fetch global settings (progress_alerts, app_preferences, section_visibility)
      const { data: globalData, error: globalError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["lead_goal", "progress_alerts", "app_preferences", "section_visibility"]);

      if (globalError) {
        console.error("Error fetching global settings:", globalError);
      }

      const newSettings = { ...DEFAULT_SETTINGS };
      
      globalData?.forEach((setting) => {
        if (setting.key === "lead_goal" && typeof setting.value === "number") {
          newSettings.leadGoal = setting.value;
          newSettings.periodGoals.monthly.leads = setting.value;
        }
        if (setting.key === "progress_alerts") {
          newSettings.progressAlerts = parseJsonValue(setting.value, DEFAULT_PROGRESS_ALERTS);
        }
        if (setting.key === "app_preferences") {
          newSettings.appPreferences = parseJsonValue(setting.value, DEFAULT_APP_PREFERENCES);
        }
        if (setting.key === "section_visibility") {
          newSettings.sectionVisibility = parseJsonValue(setting.value, DEFAULT_SECTION_VISIBILITY);
        }
      });

      // Fetch project-specific settings (period_goals) if projectId provided
      if (projectId) {
        const { data: projectData, error: projectError } = await supabase
          .from("project_settings")
          .select("key, value")
          .eq("project_id", projectId)
          .eq("key", "period_goals")
          .maybeSingle();

        if (projectError) {
          console.error("Error fetching project settings:", projectError);
        }

        if (projectData) {
          newSettings.periodGoals = parseJsonValue(projectData.value, DEFAULT_PERIOD_GOALS);
          newSettings.leadGoal = newSettings.periodGoals.monthly.leads;
        }
      }

      setSettings(newSettings);
    } catch (err) {
      console.error("Error fetching app settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadGoal = async (newGoal: number) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return false;
    }

    try {
      // Update period_goals in project_settings
      const updatedGoals = {
        ...settings.periodGoals,
        monthly: { ...settings.periodGoals.monthly, leads: newGoal }
      };

      const { error } = await supabase
        .from("project_settings")
        .upsert(
          { project_id: projectId, key: "period_goals", value: updatedGoals as unknown as Json },
          { onConflict: "project_id,key" }
        );

      if (error) throw error;

      setSettings((prev) => ({ 
        ...prev, 
        leadGoal: newGoal,
        periodGoals: updatedGoals
      }));
      toast.success("Meta de leads atualizada com sucesso");
      return true;
    } catch (err) {
      console.error("Error updating lead goal:", err);
      toast.error("Erro ao atualizar meta de leads");
      return false;
    }
  };

  const updatePeriodGoals = async (goals: PeriodGoals) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return false;
    }

    try {
      const { error } = await supabase
        .from("project_settings")
        .upsert(
          { project_id: projectId, key: "period_goals", value: goals as unknown as Json },
          { onConflict: "project_id,key" }
        );

      if (error) throw error;

      setSettings((prev) => ({ 
        ...prev, 
        leadGoal: goals.monthly.leads,
        periodGoals: goals 
      }));
      toast.success("Metas por período atualizadas com sucesso");
      return true;
    } catch (err) {
      console.error("Error updating period goals:", err);
      toast.error("Erro ao atualizar metas por período");
      return false;
    }
  };

  const updateProgressAlerts = async (alerts: ProgressAlerts) => {
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "progress_alerts", value: alerts as unknown as Json },
          { onConflict: "key" }
        );

      if (error) throw error;

      setSettings((prev) => ({ ...prev, progressAlerts: alerts }));
      toast.success("Alertas de progresso atualizados com sucesso");
      return true;
    } catch (err) {
      console.error("Error updating progress alerts:", err);
      toast.error("Erro ao atualizar alertas de progresso");
      return false;
    }
  };

  const updateAppPreferences = async (preferences: AppPreferences) => {
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "app_preferences", value: preferences as unknown as Json },
          { onConflict: "key" }
        );

      if (error) throw error;

      setSettings((prev) => ({ ...prev, appPreferences: preferences }));
      toast.success("Preferências atualizadas com sucesso");
      return true;
    } catch (err) {
      console.error("Error updating app preferences:", err);
      toast.error("Erro ao atualizar preferências");
      return false;
    }
  };

  const updateSectionVisibility = async (visibility: SectionVisibility) => {
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "section_visibility", value: visibility as unknown as Json },
          { onConflict: "key" }
        );

      if (error) throw error;

      setSettings((prev) => ({ ...prev, sectionVisibility: visibility }));
      toast.success("Visibilidade das seções atualizada");
      return true;
    } catch (err) {
      console.error("Error updating section visibility:", err);
      toast.error("Erro ao atualizar visibilidade das seções");
      return false;
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSettings();
  }, [projectId]);

  return {
    settings,
    loading,
    updateLeadGoal,
    updatePeriodGoals,
    updateProgressAlerts,
    updateAppPreferences,
    updateSectionVisibility,
    refetch: fetchSettings,
  };
}

export type { PeriodGoals, ProgressAlerts, AppPreferences };
