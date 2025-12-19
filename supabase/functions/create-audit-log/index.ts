import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      userId, 
      action, 
      entityType, 
      entityId, 
      oldValue, 
      newValue,
      userAgent,
      ipAddress 
    } = await req.json();

    if (!action || !entityType) {
      return new Response(
        JSON.stringify({ error: 'Action and entityType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert audit log
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_value: oldValue || null,
        new_value: newValue || null,
        user_agent: userAgent || null,
        ip_address: ipAddress || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating audit log:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Audit log created: ${action} on ${entityType} by user ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-audit-log:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
