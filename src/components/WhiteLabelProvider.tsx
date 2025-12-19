import { useEffect, createContext, useContext, ReactNode, useMemo } from "react";
import { useWhiteLabel, WhiteLabelSettings, FONT_OPTIONS } from "@/hooks/useWhiteLabel";

interface WhiteLabelContextValue {
  settings: WhiteLabelSettings;
  loading: boolean;
  updateSettings: (settings: Partial<WhiteLabelSettings>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  applyTemplate: (templateId: string) => Promise<boolean>;
  exportSettings: () => string;
  importSettings: (jsonString: string) => Promise<boolean>;
}

const WhiteLabelContext = createContext<WhiteLabelContextValue | null>(null);

export function useWhiteLabelContext() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error("useWhiteLabelContext must be used within WhiteLabelProvider");
  }
  return context;
}

interface WhiteLabelProviderProps {
  children: ReactNode;
}

// Convert HSL string to hex for meta tags
function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#3b82f6";
  
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function WhiteLabelProvider({ children }: WhiteLabelProviderProps) {
  const { 
    settings, 
    loading, 
    updateSettings, 
    resetToDefaults, 
    applyTemplate,
    exportSettings,
    importSettings 
  } = useWhiteLabel();

  // Apply CSS custom properties for brand colors + theme-safe overrides
  useEffect(() => {
    const root = document.documentElement;

    // Clean up legacy overrides (older versions set these directly and they break light/dark switching)
    const legacyVars = [
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--border",
    ];
    legacyVars.forEach((v) => root.style.removeProperty(v));

    // Brand colors (apply to both themes)
    root.style.setProperty("--primary", settings.primaryColor);
    root.style.setProperty("--success", settings.successColor);
    root.style.setProperty("--warning", settings.warningColor);
    root.style.setProperty("--danger", settings.dangerColor);
    root.style.setProperty("--destructive", settings.dangerColor);

    // Theme-safe overrides: apply these ONLY to dark theme via index.css var() mapping
    root.style.setProperty("--wl-background-dark", settings.backgroundColor);
    root.style.setProperty("--wl-foreground-dark", settings.foregroundColor);
    root.style.setProperty("--wl-card-dark", settings.cardColor);
    root.style.setProperty("--wl-card-foreground-dark", settings.cardForegroundColor);
    root.style.setProperty("--wl-muted-dark", settings.mutedColor);
    root.style.setProperty("--wl-muted-foreground-dark", settings.mutedForegroundColor);
    root.style.setProperty("--wl-accent-dark", settings.accentColor);
    root.style.setProperty("--wl-accent-foreground-dark", settings.accentForegroundColor);
    root.style.setProperty("--wl-border-dark", settings.borderColor);

    return () => {
      // Cleanup - reset to CSS defaults
      const vars = [
        // Brand
        "--primary",
        "--success",
        "--warning",
        "--danger",
        "--destructive",

        // Dark overrides
        "--wl-background-dark",
        "--wl-foreground-dark",
        "--wl-card-dark",
        "--wl-card-foreground-dark",
        "--wl-muted-dark",
        "--wl-muted-foreground-dark",
        "--wl-accent-dark",
        "--wl-accent-foreground-dark",
        "--wl-border-dark",
      ];
      vars.forEach((v) => root.style.removeProperty(v));
    };
  }, [settings]);

  // Apply font family
  useEffect(() => {
    const root = document.documentElement;
    
    // Find font URL from options or use custom
    let fontUrl: string | null = null;
    if (settings.fontFamily === "custom" && settings.customFontUrl) {
      fontUrl = settings.customFontUrl;
    } else {
      const fontOption = FONT_OPTIONS.find(f => f.value === settings.fontFamily);
      fontUrl = fontOption?.url || null;
    }

    // Remove old font link if exists
    const oldFontLink = document.getElementById("white-label-font");
    if (oldFontLink) {
      oldFontLink.remove();
    }

    // Add new font link
    if (fontUrl) {
      const link = document.createElement("link");
      link.id = "white-label-font";
      link.rel = "stylesheet";
      link.href = fontUrl;
      document.head.appendChild(link);
    }

    // Apply font family
    const fontFamily = settings.fontFamily === "custom" ? "var(--font-custom)" : settings.fontFamily;
    root.style.setProperty("--font-sans", `${fontFamily}, ui-sans-serif, system-ui, sans-serif`);

    return () => {
      root.style.removeProperty("--font-sans");
      const fontLink = document.getElementById("white-label-font");
      if (fontLink) fontLink.remove();
    };
  }, [settings.fontFamily, settings.customFontUrl]);

  // Update document title
  useEffect(() => {
    const baseTitle = settings.appName || "Launx Metrics";
    document.title = baseTitle;

    return () => {
      document.title = "Launx Metrics";
    };
  }, [settings.appName]);

  // Update favicon
  useEffect(() => {
    if (settings.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings.faviconUrl]);

  // Update theme-color meta tag
  useEffect(() => {
    const themeColorHex = hslToHex(settings.pwaThemeColor || settings.primaryColor);
    let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.name = "theme-color";
      document.head.appendChild(metaTheme);
    }
    metaTheme.content = themeColorHex;
  }, [settings.pwaThemeColor, settings.primaryColor]);

  // Update apple-mobile-web-app-title and apple-touch-icon
  useEffect(() => {
    let metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (!metaTitle) {
      metaTitle = document.createElement("meta");
      metaTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(metaTitle);
    }
    metaTitle.content = settings.appName || "Launx Metrics";

    // Update apple-touch-icon if custom PWA icon is set
    if (settings.pwaIconUrl) {
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = settings.pwaIconUrl;
    }
  }, [settings.appName, settings.pwaIconUrl]);

  const contextValue = useMemo(() => ({
    settings,
    loading,
    updateSettings,
    resetToDefaults,
    applyTemplate,
    exportSettings,
    importSettings,
  }), [settings, loading, updateSettings, resetToDefaults, applyTemplate, exportSettings, importSettings]);

  return (
    <WhiteLabelContext.Provider value={contextValue}>
      {children}
    </WhiteLabelContext.Provider>
  );
}
