import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncConfig {
  enabled: boolean;
  intervalHours: number;
  retryOnFailure: boolean;
  maxRetries: number;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
  syncMetaAds: boolean;
  syncGoogleAdsSheets: boolean;
  syncGoogleSheetsLeads: boolean;
}

interface SyncResult {
  integration_type: string;
  integration_id: string;
  integration_name: string;
  project_id: string | null;
  status: 'success' | 'failed';
  error_message?: string;
  records_processed: number;
  duration_ms: number;
}

const defaultSyncConfig: SyncConfig = {
  enabled: true,
  intervalHours: 1,
  retryOnFailure: true,
  maxRetries: 3,
  notifyOnFailure: true,
  notifyOnSuccess: false,
  syncMetaAds: true,
  syncGoogleAdsSheets: true,
  syncGoogleSheetsLeads: true,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let triggeredBy = 'cron';
    let forceSync = false;
    let projectIdFilter: string | null = null;
    
    try {
      const body = await req.json();
      triggeredBy = body.triggered_by || 'cron';
      forceSync = body.force || false;
      projectIdFilter = body.project_id || null;
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log(`Sync triggered by: ${triggeredBy}, force: ${forceSync}, project_id: ${projectIdFilter || 'all'}`);

    // Fetch sync configuration
    const { data: configData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sync_config')
      .maybeSingle();

    const syncConfig: SyncConfig = configData?.value 
      ? { ...defaultSyncConfig, ...configData.value }
      : defaultSyncConfig;

    // Check if sync is enabled (unless forced)
    if (!syncConfig.enabled && !forceSync) {
      console.log('Sync is disabled and not forced, skipping');
      return new Response(
        JSON.stringify({ message: 'Sync is disabled', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SyncResult[] = [];

    // Sync Meta Ads integrations
    if (syncConfig.syncMetaAds) {
      let metaQuery = supabase
        .from('meta_ads_integrations')
        .select('*')
        .eq('is_active', true);
      
      if (projectIdFilter) {
        metaQuery = metaQuery.eq('project_id', projectIdFilter);
      }

      const { data: metaIntegrations } = await metaQuery;

      if (metaIntegrations && metaIntegrations.length > 0) {
        for (const integration of metaIntegrations) {
          const result = await syncMetaAdsIntegration(supabase, supabaseUrl, integration, triggeredBy);
          results.push(result);
        }
      }
    }

    // Sync Google Ads Sheets integrations
    if (syncConfig.syncGoogleAdsSheets) {
      let googleAdsQuery = supabase
        .from('google_ads_sheets_integrations')
        .select('*')
        .eq('is_active', true);
      
      if (projectIdFilter) {
        googleAdsQuery = googleAdsQuery.eq('project_id', projectIdFilter);
      }

      const { data: googleAdsIntegrations } = await googleAdsQuery;

      if (googleAdsIntegrations && googleAdsIntegrations.length > 0) {
        for (const integration of googleAdsIntegrations) {
          const result = await syncGoogleAdsSheetsIntegration(supabase, supabaseUrl, integration, triggeredBy);
          results.push(result);
        }
      }
    }

    // Sync Google Sheets Leads integrations
    if (syncConfig.syncGoogleSheetsLeads) {
      let sheetsQuery = supabase
        .from('google_sheets_integrations')
        .select('*')
        .eq('is_active', true);
      
      if (projectIdFilter) {
        sheetsQuery = sheetsQuery.eq('project_id', projectIdFilter);
      }

      const { data: sheetsIntegrations } = await sheetsQuery;

      if (sheetsIntegrations && sheetsIntegrations.length > 0) {
        for (const integration of sheetsIntegrations) {
          const result = await syncGoogleSheetsLeadsIntegration(supabase, supabaseUrl, integration, triggeredBy);
          results.push(result);
        }
      }
    }

    // Create failure alerts if configured
    if (syncConfig.notifyOnFailure) {
      const failedSyncs = results.filter(r => r.status === 'failed');
      for (const failed of failedSyncs) {
        await createFailureAlert(supabase, failed);
      }
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };

    console.log(`Sync completed: ${summary.success} success, ${summary.failed} failed`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function syncMetaAdsIntegration(
  supabase: any,
  supabaseUrl: string,
  integration: any,
  triggeredBy: string
): Promise<SyncResult> {
  const startTime = Date.now();
  
  // Create initial log entry
  const { data: logEntry } = await supabase
    .from('sync_logs')
    .insert({
      integration_type: 'meta_ads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'running',
      triggered_by: triggeredBy,
    })
    .select()
    .single();

  try {
    // Call meta-ads-insights function to validate connection
    const response = await fetch(`${supabaseUrl}/functions/v1/meta-ads-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        integrationId: integration.id,
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        syncCheck: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const recordsProcessed = data.campaigns?.length || 0;
    const duration = Date.now() - startTime;

    // Update integration last_sync_at
    await supabase
      .from('meta_ads_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    // Update log entry
    await supabase
      .from('sync_logs')
      .update({
        status: 'success',
        records_processed: recordsProcessed,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id);

    console.log(`Meta Ads sync success: ${integration.name} - ${recordsProcessed} campaigns`);

    return {
      integration_type: 'meta_ads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'success',
      records_processed: recordsProcessed,
      duration_ms: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update log entry with failure
    if (logEntry?.id) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    console.error(`Meta Ads sync failed: ${integration.name} - ${errorMessage}`);

    return {
      integration_type: 'meta_ads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'failed',
      error_message: errorMessage,
      records_processed: 0,
      duration_ms: duration,
    };
  }
}

async function syncGoogleAdsSheetsIntegration(
  supabase: any,
  supabaseUrl: string,
  integration: any,
  triggeredBy: string
): Promise<SyncResult> {
  const startTime = Date.now();
  
  const { data: logEntry } = await supabase
    .from('sync_logs')
    .insert({
      integration_type: 'google_ads_sheets',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'running',
      triggered_by: triggeredBy,
    })
    .select()
    .single();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-ads-sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        integrationId: integration.id,
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        syncCheck: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const recordsProcessed = data.campaigns?.length || 0;
    const duration = Date.now() - startTime;

    await supabase
      .from('google_ads_sheets_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    await supabase
      .from('sync_logs')
      .update({
        status: 'success',
        records_processed: recordsProcessed,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id);

    console.log(`Google Ads Sheets sync success: ${integration.name} - ${recordsProcessed} campaigns`);

    return {
      integration_type: 'google_ads_sheets',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'success',
      records_processed: recordsProcessed,
      duration_ms: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (logEntry?.id) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    console.error(`Google Ads Sheets sync failed: ${integration.name} - ${errorMessage}`);

    return {
      integration_type: 'google_ads_sheets',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'failed',
      error_message: errorMessage,
      records_processed: 0,
      duration_ms: duration,
    };
  }
}

async function syncGoogleSheetsLeadsIntegration(
  supabase: any,
  supabaseUrl: string,
  integration: any,
  triggeredBy: string
): Promise<SyncResult> {
  const startTime = Date.now();
  
  const { data: logEntry } = await supabase
    .from('sync_logs')
    .insert({
      integration_type: 'google_sheets_leads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'running',
      triggered_by: triggeredBy,
    })
    .select()
    .single();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-sheets-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        integrationId: integration.id,
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        syncCheck: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const recordsProcessed = data.leads?.length || 0;
    const duration = Date.now() - startTime;

    await supabase
      .from('google_sheets_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    await supabase
      .from('sync_logs')
      .update({
        status: 'success',
        records_processed: recordsProcessed,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id);

    console.log(`Google Sheets Leads sync success: ${integration.name} - ${recordsProcessed} leads`);

    return {
      integration_type: 'google_sheets_leads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'success',
      records_processed: recordsProcessed,
      duration_ms: duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (logEntry?.id) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    console.error(`Google Sheets Leads sync failed: ${integration.name} - ${errorMessage}`);

    return {
      integration_type: 'google_sheets_leads',
      integration_id: integration.id,
      integration_name: integration.name,
      project_id: integration.project_id,
      status: 'failed',
      error_message: errorMessage,
      records_processed: 0,
      duration_ms: duration,
    };
  }
}

async function createFailureAlert(supabase: any, result: SyncResult): Promise<void> {
  const integrationTypeLabel = {
    'meta_ads': 'Meta Ads',
    'google_ads_sheets': 'Google Ads',
    'google_sheets_leads': 'Google Sheets Leads',
  }[result.integration_type] || result.integration_type;

  await supabase
    .from('alert_history')
    .insert({
      alert_config_id: null,
      message: `Falha na sincronização de ${integrationTypeLabel}: ${result.integration_name}. Erro: ${result.error_message}`,
      metric_value: 0,
      threshold_value: 0,
      is_read: false,
    });

  console.log(`Created failure alert for ${result.integration_name}`);
}
