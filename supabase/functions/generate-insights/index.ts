import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightsRequest {
  data: {
    leads: number;
    spend: number;
    cpl: number;
    impressions: number;
    clicks: number;
    ctr: number;
    reach: number;
    cpm: number;
    goal: number;
    period: string;
    previousPeriod?: {
      leads: number;
      spend: number;
      cpl: number;
      ctr: number;
    };
    dailyData?: Array<{
      date: string;
      leads: number;
      spend: number;
      cpl: number;
    }>;
    topCampaigns?: Array<{
      name: string;
      leads: number;
      spend: number;
      cpl: number;
      ctr: number;
    }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { data }: InsightsRequest = await req.json();
    console.log("Generating insights for data:", JSON.stringify(data).substring(0, 200));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um analista de marketing digital especializado em Meta Ads e geração de leads.
Sua tarefa é analisar dados de campanhas e identificar:
1. ANOMALIAS: variações incomuns em métricas (CPL muito alto/baixo, quedas bruscas de CTR, etc)
2. TENDÊNCIAS: padrões que indicam melhora ou piora de performance
3. OPORTUNIDADES: ações que podem melhorar resultados
4. ALERTAS: situações que requerem atenção imediata

Responda em formato JSON estruturado com arrays de insights.
Cada insight deve ter: type (anomaly|trend|opportunity|alert), severity (low|medium|high|critical), title (curto), description (detalhada), metric (se aplicável), recommendation (ação sugerida).
Limite a 5-7 insights mais relevantes.`;

    const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    
    let contextData = `Período: ${data.period}
Métricas atuais:
- Leads: ${data.leads} (meta: ${data.goal}, progresso: ${((data.leads / data.goal) * 100).toFixed(1)}%)
- Investimento: ${formatCurrency(data.spend)}
- CPL: ${formatCurrency(data.cpl)}
- CTR: ${data.ctr.toFixed(2)}%
- Impressões: ${data.impressions.toLocaleString("pt-BR")}
- Alcance: ${data.reach.toLocaleString("pt-BR")}
- CPM: ${formatCurrency(data.cpm)}
- Cliques: ${data.clicks.toLocaleString("pt-BR")}`;

    if (data.previousPeriod) {
      const cplChange = data.previousPeriod.cpl > 0 
        ? ((data.cpl - data.previousPeriod.cpl) / data.previousPeriod.cpl * 100).toFixed(1)
        : "N/A";
      const leadsChange = data.previousPeriod.leads > 0
        ? ((data.leads - data.previousPeriod.leads) / data.previousPeriod.leads * 100).toFixed(1)
        : "N/A";

      contextData += `

Comparação com período anterior:
- Leads: ${data.previousPeriod.leads} → ${data.leads} (${leadsChange}%)
- CPL: ${formatCurrency(data.previousPeriod.cpl)} → ${formatCurrency(data.cpl)} (${cplChange}%)
- CTR: ${data.previousPeriod.ctr.toFixed(2)}% → ${data.ctr.toFixed(2)}%`;
    }

    if (data.dailyData && data.dailyData.length > 0) {
      const recentDays = data.dailyData.slice(-7);
      contextData += `

Dados dos últimos ${recentDays.length} dias:
${recentDays.map(d => `- ${d.date}: ${d.leads} leads, CPL ${formatCurrency(d.cpl)}`).join("\n")}`;
    }

    if (data.topCampaigns && data.topCampaigns.length > 0) {
      contextData += `

Top campanhas:
${data.topCampaigns.slice(0, 5).map((c, i) => 
  `${i + 1}. ${c.name}: ${c.leads} leads, CPL ${formatCurrency(c.cpl)}, CTR ${c.ctr.toFixed(2)}%`
).join("\n")}`;
    }

    const userPrompt = `Analise os seguintes dados de campanhas Meta Ads e retorne insights em JSON:

${contextData}

Retorne um JSON válido no formato:
{
  "insights": [
    {
      "type": "anomaly|trend|opportunity|alert",
      "severity": "low|medium|high|critical",
      "title": "Título curto",
      "description": "Descrição detalhada",
      "metric": "nome da métrica afetada",
      "recommendation": "Ação sugerida"
    }
  ],
  "summary": "Resumo executivo em 2-3 frases"
}`;

    console.log("Calling Lovable AI for insights...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      console.error("Failed to parse JSON:", content);
      // Return a fallback response
      insights = {
        insights: [],
        summary: "Não foi possível gerar insights automaticamente. Tente novamente."
      };
    }

    console.log("Insights generated successfully:", insights.insights?.length || 0, "insights");

    return new Response(
      JSON.stringify(insights),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
