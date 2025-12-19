import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConversionRates } from "@/hooks/useFunnelData";
import { cardAnimation } from "@/lib/design-tokens";
import {
  MousePointerClick,
  Users,
  Target,
  ShoppingCart,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionKPICardsProps {
  rates: ConversionRates;
  loading?: boolean;
  delay?: number;
}

interface KPIItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  tooltip: string;
  color: string;
  format?: "percent" | "decimal";
}

function formatRate(value: number, format: "percent" | "decimal" = "percent"): string {
  if (format === "decimal") {
    return value.toFixed(4);
  }
  return `${value.toFixed(2)}%`;
}

function getStatusColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return "text-success";
  if (value >= thresholds.warning) return "text-warning";
  return "text-muted-foreground";
}

export function ConversionKPICards({
  rates,
  loading = false,
  delay = 0,
}: ConversionKPICardsProps) {
  const kpis: KPIItem[] = [
    {
      label: "CTR (Clique)",
      value: rates.reachToClick,
      icon: <MousePointerClick className="h-4 w-4" />,
      tooltip: "Taxa de cliques sobre alcance",
      color: getStatusColor(rates.reachToClick, { good: 2, warning: 1 }),
    },
    {
      label: "Conv. Lead",
      value: rates.clickToLead,
      icon: <Users className="h-4 w-4" />,
      tooltip: "Taxa de conversão de cliques em leads",
      color: getStatusColor(rates.clickToLead, { good: 10, warning: 5 }),
    },
    {
      label: "Conv. Venda",
      value: rates.leadToSale,
      icon: <ShoppingCart className="h-4 w-4" />,
      tooltip: "Taxa de conversão de leads em vendas",
      color: getStatusColor(rates.leadToSale, { good: 5, warning: 2 }),
    },
    {
      label: "Conv. Total",
      value: rates.overallConversion,
      icon: <TrendingUp className="h-4 w-4" />,
      tooltip: "Taxa de conversão geral (impressões → vendas)",
      color: getStatusColor(rates.overallConversion, { good: 0.1, warning: 0.05 }),
      format: "decimal",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi, index) => (
        <motion.div key={kpi.label} {...cardAnimation(delay + index * 50)} className="cursor-pointer h-full">
          <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {kpi.icon}
                  <span className="text-xs">{kpi.label}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={cn("text-2xl font-bold mt-2", kpi.color)}>
                {formatRate(kpi.value, kpi.format)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
