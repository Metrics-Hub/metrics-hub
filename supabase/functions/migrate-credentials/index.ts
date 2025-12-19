import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user to verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current secrets
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    const metaAdAccountId = Deno.env.get('META_AD_ACCOUNT_ID');
    const googleSheetsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUSIHV3_Xi1XMce7kQSGpdpUJFkq34iJYymVBYsiPZwtV_xv5B8tr7asdMb6bV5fuyCrAViBS5Y0DV/pub?gid=495067603&single=true&output=csv";

    if (!metaAccessToken || !metaAdAccountId) {
      return new Response(JSON.stringify({ error: 'Meta Ads secrets not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if default project already exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('name', 'Projeto Padrão')
      .maybeSingle();

    if (existingProject) {
      return new Response(JSON.stringify({ 
        error: 'Projeto Padrão já existe',
        project_id: existingProject.id 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create default project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Projeto Padrão',
        description: 'Projeto migrado automaticamente com as credenciais originais',
        color: '#2563eb',
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return new Response(JSON.stringify({ error: 'Failed to create project', details: projectError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Created project:', project.id);

    // Create Meta Ads integration
    const { data: metaIntegration, error: metaError } = await supabase
      .from('meta_ads_integrations')
      .insert({
        project_id: project.id,
        name: 'Conta Principal',
        access_token: metaAccessToken,
        ad_account_id: metaAdAccountId,
        is_active: true,
      })
      .select()
      .single();

    if (metaError) {
      console.error('Error creating Meta Ads integration:', metaError);
      // Rollback project
      await supabase.from('projects').delete().eq('id', project.id);
      return new Response(JSON.stringify({ error: 'Failed to create Meta Ads integration', details: metaError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Created Meta Ads integration:', metaIntegration.id);

    // Create Google Sheets integration
    const { data: sheetsIntegration, error: sheetsError } = await supabase
      .from('google_sheets_integrations')
      .insert({
        project_id: project.id,
        name: 'Leads Principal',
        csv_url: googleSheetsUrl,
        is_active: true,
      })
      .select()
      .single();

    if (sheetsError) {
      console.error('Error creating Google Sheets integration:', sheetsError);
      // Don't rollback, Meta Ads was already created successfully
    } else {
      console.log('Created Google Sheets integration:', sheetsIntegration.id);
    }

    // Create audit log
    await supabase.functions.invoke('create-audit-log', {
      body: {
        action: 'MIGRATE_CREDENTIALS',
        entity_type: 'project',
        entity_id: project.id,
        new_value: {
          project_name: project.name,
          meta_ads_integration: metaIntegration?.id,
          google_sheets_integration: sheetsIntegration?.id,
        },
      },
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Credenciais migradas com sucesso!',
      project: {
        id: project.id,
        name: project.name,
      },
      integrations: {
        meta_ads: metaIntegration ? { id: metaIntegration.id, name: metaIntegration.name } : null,
        google_sheets: sheetsIntegration ? { id: sheetsIntegration.id, name: sheetsIntegration.name } : null,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
