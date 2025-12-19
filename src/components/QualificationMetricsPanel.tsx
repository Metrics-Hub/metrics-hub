import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cardAnimation } from "@/lib/design-tokens";
import {
  ClipboardList,
  Users,
  Star,
  Flame,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QualificationMetricsPanelProps {
  totalLeads: number;
  withSurvey: number;
  qualified: number;
  hotLeads: number;
  surveyRate: number;
  qualificationRate: number;
  hotLeadRate: number;
  loading?: boolean;
  delay?: number;
}

interface MetricRow {
  label: string;
  value: number;
  total: number;
  rate: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function getQualityBadge(rate: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (rate >= 30) return { label: "Excelente", variant: "default" };
  if (rate >= 20) return { label: "Bom", variant: "secondary" };
  if (rate >= 10) return { label: "Regular", variant: "outline" };
  return { label: "Baixo", variant: "destructive" };
}

export function QualificationMetricsPanel({
  totalLeads,
  withSurvey,
  qualified,
  hotLeads,
  surveyRate,
  qualificationRate,
  hotLeadRate,
  loading = false,
  delay = 0,
}: QualificationMetricsPanelProps) {
  const metrics: MetricRow[] = [
    {
      label: "Taxa de Pesquisa",
      value: withSurvey,
      total: totalLeads,
      rate: surveyRate,
      icon: <ClipboardList className="h-4 w-4" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500",
    },
    {
      label: "Taxa de Qualificação",
      value: qualified,
      total: withSurvey,
      rate: qualificationRate,
      icon: <Star className="h-4 w-4" />,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500",
    },
    {
      label: "Taxa de Hot Leads",
      value: hotLeads,
      total: totalLeads,
      rate: hotLeadRate,
      icon: <Flame className="h-4 w-4" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500",
    },
  ];

  const badge = getQualityBadge(hotLeadRate);

  if (loading) {
    return (
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div {...cardAnimation(delay)} className="cursor-pointer h-full">
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Métricas de Qualificação
            </CardTitle>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6 space-y-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-2", metric.color)}>
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <span className="text-sm font-bold">
                  {metric.rate.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full transition-all", metric.bgColor)}
                  style={{ width: `${Math.min(metric.rate, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {metric.value.toLocaleString("pt-BR")} de {metric.total.toLocaleString("pt-BR")}
                </span>
                {metric.rate >= 20 ? (
                  <span className="flex items-center gap-1 text-success">
                    <TrendingUp className="h-3 w-3" />
                    Acima da média
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingDown className="h-3 w-3" />
                    Abaixo da média
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Resumo */}
          <div className="pt-3 border-t border-border/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalLeads.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {qualified.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Qualificados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {hotLeads.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
