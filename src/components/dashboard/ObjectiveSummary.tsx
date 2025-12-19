import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, MousePointer, Eye, Info } from "lucide-react";
import { ObjectiveBreakdown } from "@/hooks/useDominantObjective";
import { objectiveGroups } from "@/lib/objective-metrics";
import { cn } from "@/lib/utils";

interface ObjectiveSummaryProps {
  breakdown: ObjectiveBreakdown[];
  totalSpend: number;
  formatCurrency: (value: number) => string;
  dominantObjective: string | null;
}

// Group objectives into categories for summary display - with light/dark theme support
const categoryConfig = {
  leads: { 
    label: "Captação", 
    icon: Target, 
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-100 border-purple-300 dark:bg-purple-500/10 dark:border-purple-500/30",
  },
  traffic: { 
    label: "Tráfego", 
    icon: MousePointer, 
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-100 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30",
  },
  awareness: { 
    label: "Alcance", 
    icon: Eye, 
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-100 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30",
  },
  engagement: { 
    label: "Engajamento", 
    icon: MousePointer, 
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-100 border-green-300 dark:bg-green-500/10 dark:border-green-500/30",
  },
  sales: { 
    label: "Vendas", 
    icon: Target, 
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  },
};

export function ObjectiveSummary({ 
  breakdown, 
  totalSpend, 
  formatCurrency,
  dominantObjective,
}: ObjectiveSummaryProps) {
  // Group breakdown by category
  const categorySummary = useMemo(() => {
    const summary: Record<string, { spend: number; campaigns: number; objectives: string[] }> = {};
    
    for (const item of breakdown) {
      // Find which category this objective belongs to
      let category = 'other';
      for (const [cat, objectives] of Object.entries(objectiveGroups)) {
        if (objectives.includes(item.objective)) {
          category = cat;
          break;
        }
      }
      
      if (!summary[category]) {
        summary[category] = { spend: 0, campaigns: 0, objectives: [] };
      }
      summary[category].spend += item.spend;
      summary[category].campaigns += item.campaigns;
      summary[category].objectives.push(item.objective);
    }
    
    return Object.entries(summary)
      .filter(([key]) => categoryConfig[key as keyof typeof categoryConfig])
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
        config: categoryConfig[category as keyof typeof categoryConfig],
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [breakdown, totalSpend]);

  if (categorySummary.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
            <Info className="h-3 w-3" />
            <span>Distribuição:</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>Distribuição do investimento por tipo de campanha. O dashboard adapta métricas baseado no objetivo dominante.</p>
        </TooltipContent>
      </Tooltip>
      
      {categorySummary.map(({ category, spend, campaigns, percentage, config }) => {
        const Icon = config.icon;
        const isDominant = dominantObjective && objectiveGroups[category as keyof typeof objectiveGroups]?.includes(dominantObjective);
        
        return (
          <Tooltip key={category}>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs gap-1.5 transition-all cursor-default",
                  config.bgClass,
                  isDominant && "ring-1 ring-offset-1 ring-primary/50"
                )}
              >
                <Icon className={cn("h-3 w-3", config.colorClass)} />
                <span>{config.label}</span>
                <span className="opacity-70">{percentage.toFixed(0)}%</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs space-y-1">
                <p className="font-medium">{config.label}</p>
                <p>{campaigns} campanha{campaigns !== 1 ? 's' : ''}</p>
                <p>{formatCurrency(spend)} investidos</p>
                <p>{percentage.toFixed(1)}% do total</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
