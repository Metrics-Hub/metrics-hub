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

interface GoogleAdsRequest {
  dateFrom: string;
  dateTo: string;
  activeOnly?: boolean;
  integrationId?: string;
}

interface CsvRow {
  campaign_name?: string;
  campaign_id?: string;
  campaign_status?: string;
  campaign_type?: string;
  adgroup_name?: string;
  adgroup_id?: string;
  adgroup_status?: string;
  ad_name?: string;
  ad_id?: string;
  ad_status?: string;
  date?: string;
  impressions?: string;
  clicks?: string;
  cost?: string;
  conversions?: string;
  [key: string]: string | undefined;
}

async function getIntegrationUrl(integrationId: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('google_ads_sheets_integrations')
    .select('csv_url')
    .eq('id', integrationId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching integration:', error);
    throw new Error('Failed to fetch integration');
  }

  if (!data) {
    throw new Error('Integration not found or inactive');
  }

  return data.csv_url;
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header - handle both comma and semicolon separators
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  console.log('CSV Headers:', headers);
  
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

function normalizeStatus(status: string): string {
  const s = status?.toUpperCase() || '';
  if (s === 'ENABLED' || s === 'ACTIVE' || s === 'ATIVO' || s === 'HABILITADO') return 'ACTIVE';
  if (s === 'PAUSED' || s === 'PAUSADO' || s === 'PAUSADA') return 'PAUSED';
  if (s === 'REMOVED' || s === 'DELETED' || s === 'REMOVIDO') return 'DELETED';
  return 'PAUSED';
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  // Handle Brazilian number format (1.234,56) and standard format (1,234.56)
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function isInDateRange(dateStr: string, dateFrom: string, dateTo: string): boolean {
  if (!dateStr) return true; // If no date, include by default
  
  // Try to parse date in various formats
  let date: Date;
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    date = new Date(dateStr);
  }
  // Try DD/MM/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    date = new Date(`${year}-${month}-${day}`);
  }
  // Try MM/DD/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    date = new Date(dateStr);
  }
  else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return true;
  
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  
  return date >= from && date <= to;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return authResult.error;
    }
    console.log('Request authenticated for user:', authResult.userId);

    const { dateFrom, dateTo, activeOnly = false, integrationId }: GoogleAdsRequest = await req.json();

    if (!dateFrom || !dateTo) {
      throw new Error('dateFrom and dateTo are required');
    }

    if (!integrationId) {
      throw new Error('integrationId is required for Google Ads Sheets');
    }

    console.log(`Starting Google Ads Sheets fetch from ${dateFrom} to ${dateTo}, integrationId: ${integrationId}`);

    // Get CSV URL from database
    const csvUrl = await getIntegrationUrl(integrationId);
    console.log('Fetching CSV from:', csvUrl.substring(0, 50) + '...');

    // Fetch CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`CSV fetched, size: ${csvText.length} bytes`);

    // Parse CSV
    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows from CSV`);

    // Filter by date range
    const filteredRows = rows.filter(row => {
      const dateField = row.date || row.data || row.day || '';
      return isInDateRange(dateField, dateFrom, dateTo);
    });
    console.log(`${filteredRows.length} rows after date filter`);

    // Build hierarchical structure: Campaigns > Ad Sets > Ads
    const campaignsMap = new Map<string, any>();
    const adsetsMap = new Map<string, any>();
    const adsMap = new Map<string, any>();
    const dailyData = new Map<string, any>();

    for (const row of filteredRows) {
      // Get identifiers - try multiple column name variations
      const campaignId = row.campaign_id || row.campanha_id || row.id_campanha || `campaign_${row.campaign_name || row.campanha || 'unknown'}`;
      const campaignName = row.campaign_name || row.campanha || row.campaign || 'Campanha';
      const campaignStatus = row.campaign_status || row.status_campanha || 'ENABLED';
      const campaignType = row.campaign_type || row.tipo_campanha || row.objective || 'SEARCH';

      const adsetId = row.adgroup_id || row.conjunto_id || row.ad_group_id || `adset_${row.adgroup_name || row.conjunto || 'unknown'}`;
      const adsetName = row.adgroup_name || row.conjunto || row.ad_group || 'Conjunto';
      const adsetStatus = row.adgroup_status || row.status_conjunto || campaignStatus;

      const adId = row.ad_id || row.anuncio_id || `ad_${row.ad_name || row.anuncio || 'unknown'}`;
      const adName = row.ad_name || row.anuncio || row.ad || 'Anúncio';
      const adStatus = row.ad_status || row.status_anuncio || adsetStatus;

      // Metrics
      const impressions = parseNumber(row.impressions || row.impressoes || row.impr);
      const clicks = parseNumber(row.clicks || row.cliques);
      const cost = parseNumber(row.cost || row.custo || row.spend || row.gasto);
      const conversions = parseNumber(row.conversions || row.conversoes || row.leads);
      const sales = parseNumber(row.sales || row.vendas || row.purchases || row.compras || '0');

      // Calculate derived metrics
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? cost / clicks : 0;
      const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
      const cpl = conversions > 0 ? cost / conversions : 0;
      const cps = sales > 0 ? cost / sales : 0;

      // Accumulate ad data
      if (!adsMap.has(adId)) {
        adsMap.set(adId, {
          id: adId,
          name: adName,
          status: normalizeStatus(adStatus),
          adsetId,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          leads: 0,
          sales: 0,
        });
      }
      const ad = adsMap.get(adId)!;
      ad.impressions += impressions;
      ad.clicks += clicks;
      ad.spend += cost;
      ad.leads += conversions;
      ad.sales += sales;

      // Accumulate adset data
      if (!adsetsMap.has(adsetId)) {
        adsetsMap.set(adsetId, {
          id: adsetId,
          name: adsetName,
          status: normalizeStatus(adsetStatus),
          campaignId,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          leads: 0,
          sales: 0,
          ads: [],
        });
      }
      const adset = adsetsMap.get(adsetId)!;
      adset.impressions += impressions;
      adset.clicks += clicks;
      adset.spend += cost;
      adset.leads += conversions;
      adset.sales += sales;

      // Accumulate campaign data
      if (!campaignsMap.has(campaignId)) {
        campaignsMap.set(campaignId, {
          id: campaignId,
          name: campaignName,
          status: normalizeStatus(campaignStatus),
          objective: campaignType,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          leads: 0,
          sales: 0,
          adsets: [],
        });
      }
      const campaign = campaignsMap.get(campaignId)!;
      campaign.impressions += impressions;
      campaign.clicks += clicks;
      campaign.spend += cost;
      campaign.leads += conversions;
      campaign.sales += sales;

      // Accumulate daily data for sparklines
      const dateKey = row.date || row.data || row.day || dateFrom;
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          leads: 0,
          sales: 0,
        });
      }
      const day = dailyData.get(dateKey)!;
      day.impressions += impressions;
      day.clicks += clicks;
      day.spend += cost;
      day.leads += conversions;
      day.sales += sales;
    }

    // Build hierarchical structure and calculate derived metrics
    for (const ad of adsMap.values()) {
      ad.ctr = ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0;
      ad.cpc = ad.clicks > 0 ? parseFloat((ad.spend / ad.clicks).toFixed(2)) : 0;
      ad.cpm = ad.impressions > 0 ? parseFloat(((ad.spend / ad.impressions) * 1000).toFixed(2)) : 0;
      ad.cpl = ad.leads > 0 ? parseFloat((ad.spend / ad.leads).toFixed(2)) : 0;
      ad.cps = ad.sales > 0 ? parseFloat((ad.spend / ad.sales).toFixed(2)) : 0;
      ad.spend = parseFloat(ad.spend.toFixed(2));
      
      const adset = adsetsMap.get(ad.adsetId);
      if (adset) {
        adset.ads.push(ad);
      }
    }

    for (const adset of adsetsMap.values()) {
      adset.ctr = adset.impressions > 0 ? parseFloat(((adset.clicks / adset.impressions) * 100).toFixed(2)) : 0;
      adset.cpc = adset.clicks > 0 ? parseFloat((adset.spend / adset.clicks).toFixed(2)) : 0;
      adset.cpm = adset.impressions > 0 ? parseFloat(((adset.spend / adset.impressions) * 1000).toFixed(2)) : 0;
      adset.cpl = adset.leads > 0 ? parseFloat((adset.spend / adset.leads).toFixed(2)) : 0;
      adset.cps = adset.sales > 0 ? parseFloat((adset.spend / adset.sales).toFixed(2)) : 0;
      adset.spend = parseFloat(adset.spend.toFixed(2));
      
      const campaign = campaignsMap.get(adset.campaignId);
      if (campaign) {
        campaign.adsets.push(adset);
      }
    }

    // Finalize campaigns
    let campaigns = Array.from(campaignsMap.values()).map(campaign => {
      campaign.ctr = campaign.impressions > 0 ? parseFloat(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0;
      campaign.cpc = campaign.clicks > 0 ? parseFloat((campaign.spend / campaign.clicks).toFixed(2)) : 0;
      campaign.cpm = campaign.impressions > 0 ? parseFloat(((campaign.spend / campaign.impressions) * 1000).toFixed(2)) : 0;
      campaign.cpl = campaign.leads > 0 ? parseFloat((campaign.spend / campaign.leads).toFixed(2)) : 0;
      campaign.cps = campaign.sales > 0 ? parseFloat((campaign.spend / campaign.sales).toFixed(2)) : 0;
      campaign.spend = parseFloat(campaign.spend.toFixed(2));
      return campaign;
    });

    // Filter by status if needed
    if (activeOnly) {
      campaigns = campaigns.filter(c => c.status === 'ACTIVE');
    }

    // Calculate totals
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

    // Prepare sparkline data
    const sparklineData = Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log(`Successfully processed ${campaigns.length} campaigns from Google Ads Sheets`);

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
    console.error('Error in google-ads-sheets function:', error);
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
