import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleAdsCredentials {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

interface GoogleAdsRequest {
  dateFrom: string;
  dateTo: string;
  activeOnly?: boolean;
  integrationId?: string;
}

// Authenticate request and return user info
async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })};
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return { error: new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })};
  }

  console.log(`Authenticated user: ${user.email}`);
  return { userId: user.id, supabaseClient };
}

// Get access token using refresh token
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token error:", error);
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch credentials from database
async function getCredentials(integrationId?: string): Promise<GoogleAdsCredentials | null> {
  if (!integrationId) {
    console.log("No integrationId provided, Google Ads requires integration credentials");
    return null;
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data, error } = await supabaseAdmin
    .from("google_ads_integrations")
    .select("developer_token, client_id, client_secret, refresh_token, customer_id, login_customer_id")
    .eq("id", integrationId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Error fetching Google Ads credentials:", error);
    return null;
  }

  return {
    developerToken: data.developer_token,
    clientId: data.client_id,
    clientSecret: data.client_secret,
    refreshToken: data.refresh_token,
    customerId: data.customer_id.replace(/-/g, ""), // Remove dashes from customer ID
    loginCustomerId: data.login_customer_id?.replace(/-/g, ""),
  };
}

// Execute Google Ads API query
async function executeGoogleAdsQuery(
  accessToken: string,
  credentials: GoogleAdsCredentials,
  query: string
): Promise<any[]> {
  const customerId = credentials.customerId;
  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${accessToken}`,
    "developer-token": credentials.developerToken,
    "Content-Type": "application/json",
  };

  if (credentials.loginCustomerId) {
    headers["login-customer-id"] = credentials.loginCustomerId;
  }

  console.log(`Executing Google Ads query for customer ${customerId}`);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Ads API error:", errorText);
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const results: any[] = [];
  const jsonResponse = await response.json();
  
  // Google Ads searchStream returns an array of result batches
  if (Array.isArray(jsonResponse)) {
    for (const batch of jsonResponse) {
      if (batch.results) {
        results.push(...batch.results);
      }
    }
  }

  return results;
}

// Fetch campaigns with metrics
async function fetchCampaigns(
  accessToken: string,
  credentials: GoogleAdsCredentials,
  dateFrom: string,
  dateTo: string,
  activeOnly: boolean
): Promise<any[]> {
  const statusFilter = activeOnly 
    ? "AND campaign.status = 'ENABLED'" 
    : "AND campaign.status IN ('ENABLED', 'PAUSED')";

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      ${statusFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  return executeGoogleAdsQuery(accessToken, credentials, query);
}

// Fetch ad groups with metrics
async function fetchAdGroups(
  accessToken: string,
  credentials: GoogleAdsCredentials,
  dateFrom: string,
  dateTo: string,
  activeOnly: boolean
): Promise<any[]> {
  const statusFilter = activeOnly 
    ? "AND ad_group.status = 'ENABLED'" 
    : "AND ad_group.status IN ('ENABLED', 'PAUSED')";

  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.campaign,
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM ad_group
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      ${statusFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  return executeGoogleAdsQuery(accessToken, credentials, query);
}

// Fetch ads with metrics
async function fetchAds(
  accessToken: string,
  credentials: GoogleAdsCredentials,
  dateFrom: string,
  dateTo: string,
  activeOnly: boolean
): Promise<any[]> {
  const statusFilter = activeOnly 
    ? "AND ad_group_ad.status = 'ENABLED'" 
    : "AND ad_group_ad.status IN ('ENABLED', 'PAUSED')";

  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.ad_group,
      ad_group.id,
      ad_group.campaign,
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      ${statusFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  return executeGoogleAdsQuery(accessToken, credentials, query);
}

// Fetch daily account insights for sparklines
async function fetchDailyInsights(
  accessToken: string,
  credentials: GoogleAdsCredentials,
  dateFrom: string,
  dateTo: string
): Promise<any[]> {
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY segments.date ASC
  `;

  return executeGoogleAdsQuery(accessToken, credentials, query);
}

// Map Google Ads status to standard status
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "ENABLED": "ACTIVE",
    "PAUSED": "PAUSED",
    "REMOVED": "DELETED",
  };
  return statusMap[status] || status;
}

// Map Google Ads channel type to objective
function mapObjective(channelType: string): string {
  const objectiveMap: Record<string, string> = {
    "SEARCH": "OUTCOME_LEADS",
    "DISPLAY": "OUTCOME_AWARENESS",
    "SHOPPING": "OUTCOME_SALES",
    "VIDEO": "OUTCOME_AWARENESS",
    "MULTI_CHANNEL": "OUTCOME_LEADS",
    "LOCAL": "OUTCOME_TRAFFIC",
    "SMART": "OUTCOME_LEADS",
    "PERFORMANCE_MAX": "OUTCOME_LEADS",
    "LOCAL_SERVICES": "OUTCOME_LEADS",
    "DISCOVERY": "OUTCOME_ENGAGEMENT",
    "TRAVEL": "OUTCOME_SALES",
  };
  return objectiveMap[channelType] || "OUTCOME_LEADS";
}

// Convert micros to currency
function microsToCurrency(micros: number): number {
  return (micros || 0) / 1_000_000;
}

// Process and structure the data
function processData(
  campaigns: any[],
  adGroups: any[],
  ads: any[],
  dailyInsights: any[]
) {
  // Build campaign map
  const campaignMap = new Map<string, any>();
  
  for (const row of campaigns) {
    const id = row.campaign?.id;
    if (!id) continue;
    
    const spend = microsToCurrency(row.metrics?.costMicros || 0);
    const impressions = row.metrics?.impressions || 0;
    const clicks = row.metrics?.clicks || 0;
    const conversions = row.metrics?.conversions || 0;
    
    campaignMap.set(id, {
      id,
      name: row.campaign?.name || "Unknown Campaign",
      status: mapStatus(row.campaign?.status || "PAUSED"),
      objective: mapObjective(row.campaign?.advertisingChannelType || "SEARCH"),
      spend,
      impressions,
      clicks,
      reach: impressions, // Google Ads doesn't have reach, use impressions
      ctr: (row.metrics?.ctr || 0) * 100,
      cpc: microsToCurrency(row.metrics?.averageCpc || 0),
      cpm: microsToCurrency(row.metrics?.averageCpm || 0),
      leads: Math.round(conversions),
      cpl: conversions > 0 ? spend / conversions : 0,
      adsets: [],
    });
  }

  // Build ad group map and link to campaigns
  const adGroupMap = new Map<string, any>();
  
  for (const row of adGroups) {
    const id = row.adGroup?.id;
    const campaignId = row.campaign?.id;
    if (!id || !campaignId) continue;
    
    const spend = microsToCurrency(row.metrics?.costMicros || 0);
    const impressions = row.metrics?.impressions || 0;
    const clicks = row.metrics?.clicks || 0;
    const conversions = row.metrics?.conversions || 0;
    
    const adGroup = {
      id,
      name: row.adGroup?.name || "Unknown Ad Group",
      status: mapStatus(row.adGroup?.status || "PAUSED"),
      spend,
      impressions,
      clicks,
      reach: impressions,
      ctr: (row.metrics?.ctr || 0) * 100,
      cpc: microsToCurrency(row.metrics?.averageCpc || 0),
      cpm: microsToCurrency(row.metrics?.averageCpm || 0),
      leads: Math.round(conversions),
      cpl: conversions > 0 ? spend / conversions : 0,
      ads: [],
    };
    
    adGroupMap.set(id, adGroup);
    
    const campaign = campaignMap.get(campaignId);
    if (campaign) {
      campaign.adsets.push(adGroup);
    }
  }

  // Link ads to ad groups
  for (const row of ads) {
    const adGroupId = row.adGroup?.id;
    if (!adGroupId) continue;
    
    const spend = microsToCurrency(row.metrics?.costMicros || 0);
    const impressions = row.metrics?.impressions || 0;
    const clicks = row.metrics?.clicks || 0;
    const conversions = row.metrics?.conversions || 0;
    
    const ad = {
      id: row.adGroupAd?.ad?.id || `ad_${Math.random()}`,
      name: row.adGroupAd?.ad?.name || "Unknown Ad",
      status: mapStatus(row.adGroupAd?.status || "PAUSED"),
      spend,
      impressions,
      clicks,
      reach: impressions,
      ctr: (row.metrics?.ctr || 0) * 100,
      cpc: microsToCurrency(row.metrics?.averageCpc || 0),
      cpm: microsToCurrency(row.metrics?.averageCpm || 0),
      leads: Math.round(conversions),
      cpl: conversions > 0 ? spend / conversions : 0,
    };
    
    const adGroup = adGroupMap.get(adGroupId);
    if (adGroup) {
      adGroup.ads.push(ad);
    }
  }

  // Calculate totals
  const campaignsArray = Array.from(campaignMap.values());
  const totals = campaignsArray.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      reach: acc.reach + c.reach,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
    }),
    { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;

  // Process sparkline data
  const sparklineData = dailyInsights.map((row) => ({
    date: row.segments?.date || "",
    impressions: row.metrics?.impressions || 0,
    reach: row.metrics?.impressions || 0,
    clicks: row.metrics?.clicks || 0,
    spend: microsToCurrency(row.metrics?.costMicros || 0),
    leads: Math.round(row.metrics?.conversions || 0),
  }));

  return {
    campaigns: campaignsArray,
    totals: {
      ...totals,
      ctr,
      cpc,
      cpm,
      cpl,
    },
    sparklineData,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate request
    const auth = await authenticateRequest(req);
    if (auth.error) return auth.error;

    console.log(`Request authenticated for user: ${auth.userId}`);

    // Parse request body
    const { dateFrom, dateTo, activeOnly = false, integrationId } = await req.json() as GoogleAdsRequest;

    if (!dateFrom || !dateTo) {
      return new Response(
        JSON.stringify({ success: false, error: "dateFrom and dateTo are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get credentials
    const credentials = await getCredentials(integrationId);
    if (!credentials) {
      return new Response(
        JSON.stringify({ success: false, error: "Google Ads integration not found or not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting Google Ads fetch from ${dateFrom} to ${dateTo}, activeOnly: ${activeOnly}`);

    // Get access token
    const accessToken = await getAccessToken(credentials);

    // Fetch all data in parallel
    const [campaigns, adGroups, ads, dailyInsights] = await Promise.all([
      fetchCampaigns(accessToken, credentials, dateFrom, dateTo, activeOnly),
      fetchAdGroups(accessToken, credentials, dateFrom, dateTo, activeOnly),
      fetchAds(accessToken, credentials, dateFrom, dateTo, activeOnly),
      fetchDailyInsights(accessToken, credentials, dateFrom, dateTo),
    ]);

    console.log(`Fetched ${campaigns.length} campaigns, ${adGroups.length} ad groups, ${ads.length} ads`);

    // Process and structure data
    const processedData = processData(campaigns, adGroups, ads, dailyInsights);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...processedData,
          dateFrom,
          dateTo,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in google-ads-insights function:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
