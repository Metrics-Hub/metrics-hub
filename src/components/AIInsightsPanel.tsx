import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Insight {
  type: "anomaly" | "trend" | "opportunity" | "alert";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
}

interface InsightsData {
  insights: Insight[];
  summary: string;
}

interface InsightsRequest {
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
}

interface AIInsightsPanelProps {
  data: InsightsRequest;
}

const typeConfig = {
  anomaly: {
    icon: AlertTriangle,
    label: "Anomalia",
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-500/10",
  },
  trend: {
    icon: TrendingUp,
    label: "Tendência",
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-500/10",
  },
  opportunity: {
    icon: Target,
    label: "Oportunidade",
    color: "text-emerald-600 dark:text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
  },
  alert: {
    icon: AlertTriangle,
    label: "Alerta",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

const severityConfig = {
  low: { variant: "secondary" as const, label: "Baixa" },
  medium: { variant: "default" as const, label: "Média" },
  high: { variant: "destructive" as const, label: "Alta" },
  critical: { variant: "destructive" as const, label: "Crítica" },
};

export function AIInsightsPanel({ data }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const generateInsights = async () => {
    setIsLoading(true);
    setInsights(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Sessão não encontrada");
      }

      const response = await supabase.functions.invoke("generate-insights", {
        body: { data },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao gerar insights");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setInsights(response.data);
      toast.success("Insights gerados com sucesso!");
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar insights");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Insights Automáticos (IA)
          </CardTitle>
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                {insights ? "Atualizar" : "Gerar Insights"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-3 md:p-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-4 w-[60%] mb-2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[80%] mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-4">
            {insights.summary && (
              <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                {insights.summary}
              </p>
            )}

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>{insights.insights.length} insights encontrados</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ScrollArea className="h-[400px] mt-3">
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3 pr-4">
                      {insights.insights.map((insight, index) => {
                        const config = typeConfig[insight.type];
                        const Icon = config.icon;
                        const isExpanded = expandedInsight === index;

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${config.bg}`}
                            onClick={() => setExpandedInsight(isExpanded ? null : index)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-md ${config.bg}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-sm">
                                    {insight.title}
                                  </span>
                                  <Badge
                                    variant={severityConfig[insight.severity].variant}
                                    className="text-xs"
                                  >
                                    {severityConfig[insight.severity].label}
                                  </Badge>
                                  {insight.metric && (
                                    <Badge variant="outline" className="text-xs">
                                      {insight.metric}
                                    </Badge>
                                  )}
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {insight.description}
                                      </p>
                                      {insight.recommendation && (
                                        <div className="mt-2 p-2 rounded bg-background/50">
                                          <span className="text-xs font-medium text-primary">
                                            Recomendação:
                                          </span>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {insight.recommendation}
                                          </p>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {!isExpanded && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {insight.description}
                                  </p>
                                )}
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {!insights && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Clique em "Gerar Insights" para a IA analisar seus dados
            </p>
            <p className="text-xs mt-1">
              Detectamos anomalias, tendências e oportunidades automaticamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
