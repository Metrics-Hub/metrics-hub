import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates user JWT or service role key (server-to-server)
async function authenticateRequest(req: Request): Promise<{ userId: string; isServiceRole: boolean; error?: never } | { userId?: never; isServiceRole?: never; error: Response }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    return {
      error: new Response(
        JSON.stringify({ error: 'Authorization required. Please log in to access this data.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Extract token from header
  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Check if this is a service role call (server-to-server from sync-data)
  if (serviceRoleKey && token === serviceRoleKey) {
    console.log('Service role authentication - server-to-server call');
    return { userId: 'service-role', isServiceRole: true };
  }

  // Otherwise, validate as user JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication failed:', error?.message);
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired session. Please log in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  console.log('Authenticated user:', user.email);
  return { userId: user.id, isServiceRole: false };
}

// Fallback to env variables for backward compatibility
const DEFAULT_META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
const DEFAULT_META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');
const API_VERSION = 'v24.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface MetaAdsRequest {
  dateFrom: string;
  dateTo: string;
  activeOnly?: boolean;
  integrationId?: string;
}

interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
}

async function getCredentials(integrationId?: string): Promise<MetaCredentials> {
  if (!integrationId) {
    // Fallback to environment variables
    if (!DEFAULT_META_ACCESS_TOKEN || !DEFAULT_META_AD_ACCOUNT_ID) {
      throw new Error('Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID environment variables');
    }
    return {
      accessToken: DEFAULT_META_ACCESS_TOKEN,
      adAccountId: DEFAULT_META_AD_ACCOUNT_ID,
    };
  }

  // Fetch from database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('meta_ads_integrations')
    .select('access_token, ad_account_id')
    .eq('id', integrationId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching integration:', error);
    throw new Error('Failed to fetch integration credentials');
  }

  if (!data) {
    throw new Error('Integration not found or inactive');
  }

  return {
    accessToken: data.access_token,
    adAccountId: data.ad_account_id,
  };
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching (attempt ${attempt}): ${url.substring(0, 100)}...`);
      const response = await fetch(url);
      
      if (response.status === 429 || response.status === 400) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        
        // Check if it's a rate limit error
        if (errorData?.error?.code === 17 || errorData?.error?.code === 4) {
          const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
        
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Meta API error: ${response.status} - ${errorText}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Meta API error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Error occurred. Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
}

// Optimized: Fetch all campaigns with insights in a single request using nested fields
async function fetchCampaignsWithInsights(accountId: string, dateFrom: string, dateTo: string, activeOnly: boolean, accessToken: string) {
  const timeRange = JSON.stringify({ since: dateFrom, until: dateTo });
  const statusFilter = activeOnly ? '&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]' : '';
  
  // Fetch campaigns with nested insights in ONE request - includes effective_status
  const campaignsUrl = `${BASE_URL}/${accountId}/campaigns?fields=id,name,status,effective_status,objective,insights.time_range(${timeRange}){impressions,reach,clicks,spend,ctr,cpc,cpm,actions,cost_per_action_type}&limit=500${statusFilter}&access_token=${accessToken}`;
  
  console.log('Fetching all campaigns with insights...');
  const campaignsResponse = await fetchWithRetry(campaignsUrl);
  
  return campaignsResponse.data || [];
}

// Optimized: Fetch all adsets with insights in a single request
async function fetchAdsetsWithInsights(accountId: string, dateFrom: string, dateTo: string, activeOnly: boolean, accessToken: string) {
  const timeRange = JSON.stringify({ since: dateFrom, until: dateTo });
  const statusFilter = activeOnly ? '&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]' : '';
  
  // Includes effective_status for proper status display
  const adsetsUrl = `${BASE_URL}/${accountId}/adsets?fields=id,name,status,effective_status,campaign_id,insights.time_range(${timeRange}){impressions,reach,clicks,spend,ctr,cpc,cpm,actions,cost_per_action_type}&limit=500${statusFilter}&access_token=${accessToken}`;
  
  console.log('Fetching all adsets with insights...');
  const adsetsResponse = await fetchWithRetry(adsetsUrl);
  
  return adsetsResponse.data || [];
}

// Optimized: Fetch all ads with insights in a single request
async function fetchAdsWithInsights(accountId: string, dateFrom: string, dateTo: string, activeOnly: boolean, accessToken: string) {
  const timeRange = JSON.stringify({ since: dateFrom, until: dateTo });
  const statusFilter = activeOnly ? '&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]' : '';
  
  // Includes effective_status for proper status display
  const adsUrl = `${BASE_URL}/${accountId}/ads?fields=id,name,status,effective_status,adset_id,insights.time_range(${timeRange}){impressions,reach,clicks,spend,ctr,cpc,cpm,actions,cost_per_action_type}&limit=500${statusFilter}&access_token=${accessToken}`;
  
  console.log('Fetching all ads with insights...');
  const adsResponse = await fetchWithRetry(adsUrl);
  
  return adsResponse.data || [];
}

// Fetch account-level daily insights for sparklines
async function fetchAccountDailyInsights(accountId: string, dateFrom: string, dateTo: string, accessToken: string) {
  const dailyUrl = `${BASE_URL}/${accountId}/insights?fields=impressions,reach,clicks,spend,actions&time_range={"since":"${dateFrom}","until":"${dateTo}"}&time_increment=1&access_token=${accessToken}`;
  
  console.log('Fetching daily account insights...');
  try {
    const response = await fetchWithRetry(dailyUrl);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching daily insights:', error);
    return [];
  }
}

function parseInsightsFromNested(entity: any) {
  const insights = entity.insights?.data?.[0];
  
  if (!insights) {
    return {
      impressions: 0,
      reach: 0,
      clicks: 0,
      spend: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      leads: 0,
      cpl: 0,
      sales: 0,
      cps: 0,
    };
  }

  const impressions = parseInt(insights.impressions || '0');
  const reach = parseInt(insights.reach || '0');
  const clicks = parseInt(insights.clicks || '0');
  const spend = parseFloat(insights.spend || '0');
  
  // Extract leads from actions
  let leads = 0;
  let sales = 0;
  if (insights.actions) {
    const leadAction = insights.actions.find((a: any) => 
      a.action_type === 'lead' || 
      a.action_type === 'onsite_conversion.lead_grouped' ||
      a.action_type === 'offsite_conversion.fb_pixel_lead'
    );
    if (leadAction) {
      leads = parseInt(leadAction.value || '0');
    }
    
    // Extract sales/purchases from actions
    const purchaseAction = insights.actions.find((a: any) => 
      a.action_type === 'purchase' || 
      a.action_type === 'omni_purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    if (purchaseAction) {
      sales = parseInt(purchaseAction.value || '0');
    }
  }

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpl = leads > 0 ? spend / leads : 0;
  const cps = sales > 0 ? spend / sales : 0;

  return {
    impressions,
    reach,
    clicks,
    spend: parseFloat(spend.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    cpm: parseFloat(cpm.toFixed(2)),
    leads,
    cpl: parseFloat(cpl.toFixed(2)),
    sales,
    cps: parseFloat(cps.toFixed(2)),
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request - user must be logged in
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return authResult.error;
    }
    console.log('Request authenticated for user:', authResult.userId);

    const { dateFrom, dateTo, activeOnly = true, integrationId }: MetaAdsRequest = await req.json();

    if (!dateFrom || !dateTo) {
      throw new Error('dateFrom and dateTo are required');
    }

    // Get credentials (from database if integrationId provided, otherwise from env)
    const credentials = await getCredentials(integrationId);
    const { accessToken, adAccountId } = credentials;

    const accountId = adAccountId.startsWith('act_') 
      ? adAccountId 
      : `act_${adAccountId}`;

    console.log(`Starting optimized Meta Ads fetch from ${dateFrom} to ${dateTo}, activeOnly: ${activeOnly}, integrationId: ${integrationId || 'default'}`);

    // Fetch all data in parallel with only 4 API calls total (instead of hundreds)
    const [campaignsRaw, adsetsRaw, adsRaw, dailyInsights] = await Promise.all([
      fetchCampaignsWithInsights(accountId, dateFrom, dateTo, activeOnly, accessToken),
      fetchAdsetsWithInsights(accountId, dateFrom, dateTo, activeOnly, accessToken),
      fetchAdsWithInsights(accountId, dateFrom, dateTo, activeOnly, accessToken),
      fetchAccountDailyInsights(accountId, dateFrom, dateTo, accessToken),
    ]);

    console.log(`Fetched ${campaignsRaw.length} campaigns, ${adsetsRaw.length} adsets, ${adsRaw.length} ads`);

    // Create lookup maps for efficient data organization
    const adsByAdset = new Map<string, any[]>();
    for (const ad of adsRaw) {
      const adsetId = ad.adset_id;
      if (!adsByAdset.has(adsetId)) {
        adsByAdset.set(adsetId, []);
      }
      adsByAdset.get(adsetId)!.push({
        id: ad.id,
        name: ad.name,
        status: ad.effective_status || ad.status, // Use effective_status as primary
        ...parseInsightsFromNested(ad),
      });
    }

    const adsetsByCampaign = new Map<string, any[]>();
    for (const adset of adsetsRaw) {
      const campaignId = adset.campaign_id;
      if (!adsetsByCampaign.has(campaignId)) {
        adsetsByCampaign.set(campaignId, []);
      }
      adsetsByCampaign.get(campaignId)!.push({
        id: adset.id,
        name: adset.name,
        status: adset.effective_status || adset.status, // Use effective_status as primary
        ...parseInsightsFromNested(adset),
        ads: adsByAdset.get(adset.id) || [],
      });
    }

    // Build final campaign structure
    const campaigns = campaignsRaw.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.effective_status || campaign.status, // Use effective_status as primary
      objective: campaign.objective,
      ...parseInsightsFromNested(campaign),
      adsets: adsetsByCampaign.get(campaign.id) || [],
    }));

    // Calculate totals from campaigns
    const totals = {
      impressions: 0,
      reach: 0,
      clicks: 0,
      spend: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      leads: 0,
      cpl: 0,
      sales: 0,
      cps: 0,
    };

    for (const campaign of campaigns) {
      totals.impressions += campaign.impressions;
      totals.reach += campaign.reach;
      totals.clicks += campaign.clicks;
      totals.spend += campaign.spend;
      totals.leads += campaign.leads;
      totals.sales += campaign.sales || 0;
    }

    totals.ctr = totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0;
    totals.cpc = totals.clicks > 0 ? parseFloat((totals.spend / totals.clicks).toFixed(2)) : 0;
    totals.cpm = totals.impressions > 0 ? parseFloat(((totals.spend / totals.impressions) * 1000).toFixed(2)) : 0;
    totals.cpl = totals.leads > 0 ? parseFloat((totals.spend / totals.leads).toFixed(2)) : 0;
    totals.cps = totals.sales > 0 ? parseFloat((totals.spend / totals.sales).toFixed(2)) : 0;

    // Parse daily insights for sparklines
    const sparklineData = dailyInsights.map((day: any) => {
      let leads = 0;
      let sales = 0;
      if (day.actions) {
        const leadAction = day.actions.find((a: any) => 
          a.action_type === 'lead' || 
          a.action_type === 'onsite_conversion.lead_grouped' ||
          a.action_type === 'offsite_conversion.fb_pixel_lead'
        );
        if (leadAction) {
          leads = parseInt(leadAction.value || '0');
        }
        
        const purchaseAction = day.actions.find((a: any) => 
          a.action_type === 'purchase' || 
          a.action_type === 'omni_purchase' ||
          a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        if (purchaseAction) {
          sales = parseInt(purchaseAction.value || '0');
        }
      }
      
      return {
        date: day.date_start,
        impressions: parseInt(day.impressions || '0'),
        reach: parseInt(day.reach || '0'),
        clicks: parseInt(day.clicks || '0'),
        spend: parseFloat(day.spend || '0'),
        leads,
        sales,
      };
    });

    console.log(`Successfully processed data for ${campaigns.length} campaigns with only 4 API calls!`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          campaigns,
          totals,
          sparklineData,
          dateFrom,
          dateTo,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in meta-ads-insights function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
