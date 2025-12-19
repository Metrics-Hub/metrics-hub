import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WhiteLabelSettings {
  // Brand Identity
  appName: string;
  appTagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  hideLogoIcon: boolean;

  // Main Colors
  primaryColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;

  // Extended Colors
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForegroundColor: string;
  mutedColor: string;
  mutedForegroundColor: string;
  accentColor: string;
  accentForegroundColor: string;
  borderColor: string;

  // Typography
  fontFamily: string;
  customFontUrl: string | null;

  // Theme
  defaultTheme: "light" | "dark" | "system";

  // PWA
  pwaIconUrl: string | null;
  pwaThemeColor: string;
  pwaBackgroundColor: string;
}

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
  { value: "Roboto", label: "Roboto", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" },
  { value: "Poppins", label: "Poppins", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" },
  { value: "Open Sans", label: "Open Sans", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" },
  { value: "Montserrat", label: "Montserrat", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" },
  { value: "Nunito", label: "Nunito", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" },
  { value: "Lato", label: "Lato", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" },
  { value: "custom", label: "Fonte Personalizada", url: null },
];

export const WHITE_LABEL_TEMPLATES = [
  {
    id: "default",
    name: "Padrão Launx",
    description: "Tema azul corporativo padrão",
    settings: {
      primaryColor: "217 91% 60%",
      successColor: "142 71% 45%",
      warningColor: "38 92% 50%",
      dangerColor: "0 84% 60%",
      backgroundColor: "240 10% 3.9%",
      foregroundColor: "0 0% 98%",
      cardColor: "240 10% 3.9%",
      cardForegroundColor: "0 0% 98%",
      mutedColor: "240 3.7% 15.9%",
      mutedForegroundColor: "240 5% 64.9%",
      accentColor: "240 3.7% 15.9%",
      accentForegroundColor: "0 0% 98%",
      borderColor: "240 3.7% 15.9%",
      fontFamily: "Inter",
      pwaThemeColor: "217 91% 60%",
      pwaBackgroundColor: "240 10% 3.9%",
    },
  },
  {
    id: "modern-green",
    name: "Verde Moderno",
    description: "Tema verde elegante e moderno",
    settings: {
      primaryColor: "142 76% 36%",
      successColor: "142 71% 45%",
      warningColor: "38 92% 50%",
      dangerColor: "0 84% 60%",
      backgroundColor: "150 10% 4%",
      foregroundColor: "150 10% 98%",
      cardColor: "150 10% 6%",
      cardForegroundColor: "150 10% 98%",
      mutedColor: "150 5% 15%",
      mutedForegroundColor: "150 5% 65%",
      accentColor: "150 5% 15%",
      accentForegroundColor: "150 10% 98%",
      borderColor: "150 5% 18%",
      fontFamily: "Poppins",
      pwaThemeColor: "142 76% 36%",
      pwaBackgroundColor: "150 10% 4%",
    },
  },
  {
    id: "corporate-purple",
    name: "Roxo Corporativo",
    description: "Tema roxo sofisticado",
    settings: {
      primaryColor: "262 83% 58%",
      successColor: "142 71% 45%",
      warningColor: "38 92% 50%",
      dangerColor: "0 84% 60%",
      backgroundColor: "270 10% 4%",
      foregroundColor: "270 10% 98%",
      cardColor: "270 10% 6%",
      cardForegroundColor: "270 10% 98%",
      mutedColor: "270 5% 15%",
      mutedForegroundColor: "270 5% 65%",
      accentColor: "270 5% 15%",
      accentForegroundColor: "270 10% 98%",
      borderColor: "270 5% 18%",
      fontFamily: "Montserrat",
      pwaThemeColor: "262 83% 58%",
      pwaBackgroundColor: "270 10% 4%",
    },
  },
  {
    id: "warm-orange",
    name: "Laranja Vibrante",
    description: "Tema laranja energético",
    settings: {
      primaryColor: "25 95% 53%",
      successColor: "142 71% 45%",
      warningColor: "45 93% 47%",
      dangerColor: "0 84% 60%",
      backgroundColor: "20 10% 4%",
      foregroundColor: "20 10% 98%",
      cardColor: "20 10% 6%",
      cardForegroundColor: "20 10% 98%",
      mutedColor: "20 5% 15%",
      mutedForegroundColor: "20 5% 65%",
      accentColor: "20 5% 15%",
      accentForegroundColor: "20 10% 98%",
      borderColor: "20 5% 18%",
      fontFamily: "Nunito",
      pwaThemeColor: "25 95% 53%",
      pwaBackgroundColor: "20 10% 4%",
    },
  },
  {
    id: "minimal-gray",
    name: "Minimalista",
    description: "Tema cinza clean e minimalista",
    settings: {
      primaryColor: "220 9% 46%",
      successColor: "142 71% 45%",
      warningColor: "38 92% 50%",
      dangerColor: "0 84% 60%",
      backgroundColor: "0 0% 3.9%",
      foregroundColor: "0 0% 98%",
      cardColor: "0 0% 6%",
      cardForegroundColor: "0 0% 98%",
      mutedColor: "0 0% 15%",
      mutedForegroundColor: "0 0% 65%",
      accentColor: "0 0% 15%",
      accentForegroundColor: "0 0% 98%",
      borderColor: "0 0% 18%",
      fontFamily: "Inter",
      pwaThemeColor: "220 9% 46%",
      pwaBackgroundColor: "0 0% 3.9%",
    },
  },
];

export const DEFAULT_WHITE_LABEL: WhiteLabelSettings = {
  appName: "Metrics Hubibi",
  appTagline: "Dashboard de análise de Meta Ads e Leads",
  logoUrl: null,
  faviconUrl: null,
  hideLogoIcon: false,

  primaryColor: "217 91% 60%",
  successColor: "142 71% 45%",
  warningColor: "38 92% 50%",
  dangerColor: "0 84% 60%",

  backgroundColor: "240 10% 3.9%",
  foregroundColor: "0 0% 98%",
  cardColor: "240 10% 3.9%",
  cardForegroundColor: "0 0% 98%",
  mutedColor: "240 3.7% 15.9%",
  mutedForegroundColor: "240 5% 64.9%",
  accentColor: "240 3.7% 15.9%",
  accentForegroundColor: "0 0% 98%",
  borderColor: "240 3.7% 15.9%",

  fontFamily: "Inter",
  customFontUrl: null,

  defaultTheme: "system",

  pwaIconUrl: null,
  pwaThemeColor: "217 91% 60%",
  pwaBackgroundColor: "240 10% 3.9%",
};

const CACHE_KEY = "white_label_settings";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedSettings {
  settings: WhiteLabelSettings;
  timestamp: number;
}

function getCachedSettings(): WhiteLabelSettings | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedSettings = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.settings;
      }
    }
  } catch (e) {
    console.error("Error reading cached white label settings:", e);
  }
  return null;
}

function setCachedSettings(settings: WhiteLabelSettings): void {
  try {
    const cached: CachedSettings = { settings, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.error("Error caching white label settings:", e);
  }
}

export function useWhiteLabel() {
  const [settings, setSettings] = useState<WhiteLabelSettings>(() => {
    const cached = getCachedSettings();
    return cached || DEFAULT_WHITE_LABEL;
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "white_label")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const parsed = { ...DEFAULT_WHITE_LABEL, ...(data.value as object) };
        setSettings(parsed);
        setCachedSettings(parsed);
      } else {
        setSettings(DEFAULT_WHITE_LABEL);
        setCachedSettings(DEFAULT_WHITE_LABEL);
      }
    } catch (error) {
      console.error("Error fetching white label settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<WhiteLabelSettings>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings };

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "white_label",
          value: merged,
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;

      setSettings(merged);
      setCachedSettings(merged);

      toast({
        title: "Configurações salvas",
        description: "As configurações de white label foram atualizadas.",
      });

      return true;
    } catch (error) {
      console.error("Error updating white label settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      return false;
    }
  }, [settings, toast]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return updateSettings(DEFAULT_WHITE_LABEL);
  }, [updateSettings]);

  const applyTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    const template = WHITE_LABEL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return false;
    return updateSettings(template.settings);
  }, [updateSettings]);

  const exportSettings = useCallback((): string => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      const merged = { ...DEFAULT_WHITE_LABEL, ...parsed };
      return updateSettings(merged);
    } catch (error) {
      console.error("Error importing settings:", error);
      toast({
        title: "Erro ao importar",
        description: "O arquivo JSON é inválido.",
        variant: "destructive",
      });
      return false;
    }
  }, [updateSettings, toast]);

  return {
    settings,
    loading,
    updateSettings,
    resetToDefaults,
    applyTemplate,
    exportSettings,
    importSettings,
    refetch: fetchSettings,
    defaults: DEFAULT_WHITE_LABEL,
    templates: WHITE_LABEL_TEMPLATES,
    fontOptions: FONT_OPTIONS,
  };
}
