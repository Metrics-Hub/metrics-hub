import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/manifest+json",
};

interface WhiteLabelSettings {
  appName?: string;
  primaryColor?: string;
  pwaIconUrl?: string | null;
  pwaThemeColor?: string;
  pwaBackgroundColor?: string;
}

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
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch white label settings
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "white_label")
      .maybeSingle();

    if (error) {
      console.error("Error fetching white label settings:", error);
    }

    const settings: WhiteLabelSettings = data?.value || {};
    
    // Default values
    const appName = settings.appName || "Launx Metrics";
    const shortName = appName.length > 12 ? appName.substring(0, 12) : appName;
    const themeColor = hslToHex(settings.pwaThemeColor || settings.primaryColor || "217 91% 60%");
    const backgroundColor = hslToHex(settings.pwaBackgroundColor || "240 10% 3.9%");
    
    // Build icons array
    const defaultIcons = [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
    ];

    // If custom PWA icon is set, use it for all sizes
    let icons = defaultIcons;
    if (settings.pwaIconUrl) {
      icons = [
        { src: settings.pwaIconUrl, sizes: "72x72", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "96x96", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "128x128", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "144x144", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "152x152", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "192x192", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "384x384", type: "image/png", purpose: "maskable any" },
        { src: settings.pwaIconUrl, sizes: "512x512", type: "image/png", purpose: "maskable any" },
      ];
    }

    const manifest = {
      name: appName,
      short_name: shortName,
      description: `Dashboard de métricas - ${appName}`,
      start_url: "/",
      display: "standalone",
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: "portrait-primary",
      icons,
      categories: ["business", "productivity"],
      screenshots: [],
      related_applications: [],
      prefer_related_applications: false,
    };

    console.log(`Generated PWA manifest for: ${appName}, theme: ${themeColor}`);

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error generating PWA manifest:", error);
    
    // Return default manifest on error
    const defaultManifest = {
      name: "Launx Metrics",
      short_name: "Launx",
      description: "Dashboard de métricas Meta Ads e Leads",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0a0b",
      theme_color: "#2563eb",
      orientation: "portrait-primary",
      icons: [
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
        { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
      ],
    };

    return new Response(JSON.stringify(defaultManifest, null, 2), {
      headers: corsHeaders,
    });
  }
});
