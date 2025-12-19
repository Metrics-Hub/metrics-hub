import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  reportType: "daily" | "weekly" | "performance" | "leads";
  data: {
    leads: number;
    spend: number;
    cpl: number;
    impressions: number;
    clicks: number;
    ctr: number;
    goal: number;
    period: string;
    topAdSets?: Array<{ name: string; cpl: number; leads: number }>;
    topCreatives?: Array<{ name: string; ctr: number; clicks: number }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract token and verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { reportType, data }: ReportRequest = await req.json();
    console.log("Generating report:", reportType, data);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context based on report type
    let systemPrompt = `Você é um analista de marketing digital especializado em Meta Ads. 
Gere relatórios executivos em português brasileiro, concisos e profissionais.
Use linguagem clara e direta. Inclua insights acionáveis quando relevante.
Formate valores monetários como R$ X.XXX,XX e porcentagens com 2 casas decimais.`;

    let userPrompt = "";
    
    const progressPercent = data.goal > 0 ? ((data.leads / data.goal) * 100).toFixed(1) : "0";
    const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    switch (reportType) {
      case "daily":
        userPrompt = `Gere um relatório diário resumido de campanhas Meta Ads:

**Dados do dia (${data.period}):**
- Leads gerados: ${data.leads}
- Meta mensal: ${data.goal} leads (${progressPercent}% atingido)
- Investimento: ${formatCurrency(data.spend)}
- CPL médio: ${formatCurrency(data.cpl)}
- Impressões: ${data.impressions.toLocaleString("pt-BR")}
- Cliques: ${data.clicks.toLocaleString("pt-BR")}
- CTR: ${data.ctr.toFixed(2)}%

Inclua: resumo executivo, análise de performance, e recomendação principal.`;
        break;

      case "weekly":
        userPrompt = `Gere um relatório semanal de campanhas Meta Ads:

**Dados da semana (${data.period}):**
- Leads gerados: ${data.leads}
- Meta mensal: ${data.goal} leads (${progressPercent}% atingido)
- Investimento total: ${formatCurrency(data.spend)}
- CPL médio: ${formatCurrency(data.cpl)}
- Impressões: ${data.impressions.toLocaleString("pt-BR")}
- Cliques: ${data.clicks.toLocaleString("pt-BR")}
- CTR: ${data.ctr.toFixed(2)}%

Inclua: resumo executivo, tendências observadas, pontos de atenção, e recomendações para a próxima semana.`;
        break;

      case "performance":
        const topSetsText = data.topAdSets?.map((s, i) => 
          `${i + 1}. ${s.name}: CPL ${formatCurrency(s.cpl)}, ${s.leads} leads`
        ).join("\n") || "Dados não disponíveis";

        const topCreativesText = data.topCreatives?.map((c, i) => 
          `${i + 1}. ${c.name}: CTR ${c.ctr.toFixed(2)}%, ${c.clicks} cliques`
        ).join("\n") || "Dados não disponíveis";

        userPrompt = `Gere uma análise de performance das campanhas Meta Ads:

**Período: ${data.period}**

**Métricas gerais:**
- Leads: ${data.leads} | Meta: ${data.goal} (${progressPercent}%)
- Investimento: ${formatCurrency(data.spend)}
- CPL: ${formatCurrency(data.cpl)}
- CTR: ${data.ctr.toFixed(2)}%

**Top 5 Conjuntos por CPL:**
${topSetsText}

**Top 5 Criativos por CTR:**
${topCreativesText}

Analise o desempenho, identifique padrões, e sugira otimizações específicas.`;
        break;

      case "leads":
        userPrompt = `Gere um relatório de geração de leads:

**Período: ${data.period}**
- Leads gerados: ${data.leads}
- Meta: ${data.goal} leads
- Progresso: ${progressPercent}%
- Investimento: ${formatCurrency(data.spend)}
- CPL médio: ${formatCurrency(data.cpl)}

Analise o ritmo de geração de leads, projete se a meta será atingida, e sugira ações para melhorar os resultados.`;
        break;
    }

    console.log("Calling Lovable AI gateway...");

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const reportContent = aiResponse.choices?.[0]?.message?.content;

    if (!reportContent) {
      throw new Error("No content in AI response");
    }

    console.log("Report generated successfully");

    return new Response(
      JSON.stringify({ report: reportContent, reportType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
