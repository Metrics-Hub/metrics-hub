import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const PAGE_KEY = "preferences";
const STORAGE_KEY = "launx-theme";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(getSystemTheme);
  const hasLoadedFromDb = useRef(false);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = getSystemTheme();
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.classList.add(theme);
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newTheme = e.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Load theme from Supabase when user logs in
  useEffect(() => {
    if (!user || hasLoadedFromDb.current) return;

    const loadThemeFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from("user_filters")
          .select("filters")
          .eq("user_id", user.id)
          .eq("page_key", PAGE_KEY)
          .maybeSingle();

        if (error) {
          console.error("Error loading theme preference:", error);
          return;
        }

        if (data?.filters) {
          const prefs = data.filters as { theme?: Theme };
          if (prefs.theme && prefs.theme !== theme) {
            setThemeState(prefs.theme);
            localStorage.setItem(storageKey, prefs.theme);
          }
        }
        hasLoadedFromDb.current = true;
      } catch (err) {
        console.error("Failed to load theme from database:", err);
      }
    };

    loadThemeFromDb();
  }, [user, theme, storageKey]);

  // Reset flag when user logs out
  useEffect(() => {
    if (!user) {
      hasLoadedFromDb.current = false;
    }
  }, [user]);

  // Save theme to Supabase
  const saveThemeToDb = useCallback(
    async (newTheme: Theme) => {
      if (!user) return;

      try {
        const { data: existing } = await supabase
          .from("user_filters")
          .select("id")
          .eq("user_id", user.id)
          .eq("page_key", PAGE_KEY)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("user_filters")
            .update({ filters: { theme: newTheme }, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("user_filters")
            .insert({
              user_id: user.id,
              page_key: PAGE_KEY,
              filters: { theme: newTheme },
            });
        }
      } catch (err) {
        console.error("Failed to save theme to database:", err);
      }
    },
    [user]
  );

  // Set theme (localStorage + Supabase)
  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
      saveThemeToDb(newTheme);
    },
    [storageKey, saveThemeToDb]
  );

  const value = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
