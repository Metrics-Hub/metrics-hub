import { ReactNode, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChartCard } from "@/components/ui/chart-card";
import { SkeletonChart } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHART_STYLES } from "@/lib/design-tokens";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Hash, Percent, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScoreCategory {
  name: string;
  value: number;
  color: string;
}

interface StackedBarData {
  name: string;
  categories: ScoreCategory[];
  total: number;
}

interface StackedBarChartProps {
  title: string;
  icon?: ReactNode;
  data: StackedBarData[];
  height?: number;
  loading?: boolean;
  delay?: number;
  labelWidth?: number;
  maxLabelChars?: number;
  maxItems?: number;
}

// Score category colors (matching lead scoring colors)
const SCORE_COLORS = {
  alto: "hsl(142, 76%, 36%)",      // Green - Hot Lead
  medio: "hsl(48, 96%, 53%)",      // Yellow - Warm
  baixo: "hsl(25, 95%, 53%)",      // Orange - Lukewarm
  desqualificado: "hsl(220, 9%, 46%)", // Neutral gray - Cold (works in both themes)
};

// Legend items
const LEGEND_ITEMS = [
  { name: "Alto", color: SCORE_COLORS.alto },
  { name: "Médio", color: SCORE_COLORS.medio },
  { name: "Baixo", color: SCORE_COLORS.baixo },
  { name: "Desqualificado", color: SCORE_COLORS.desqualificado },
];

type SortMode = 'total' | 'quality';

function SortToggle({ sortBy, onSortChange }: { sortBy: SortMode; onSortChange: (value: SortMode) => void }) {
  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={sortBy} 
        onValueChange={(value) => value && onSortChange(value as SortMode)}
        size="sm"
        className="h-7"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="total" aria-label="Ordenar por total" className="h-7 px-2">
              <Hash className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom" style={CHART_STYLES.tooltip.contentStyle}>
            <p className="text-xs">Ordenar por total de leads</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="quality" aria-label="Ordenar por qualidade" className="h-7 px-2">
              <Percent className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom" style={CHART_STYLES.tooltip.contentStyle}>
            <p className="text-xs">Ordenar por % de leads qualificados</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}

export function StackedBarChart({
  title,
  data,
  height = 250,
  loading = false,
  delay = 0,
  labelWidth = 120,
  maxLabelChars = 20,
}: StackedBarChartProps) {
  const [sortBy, setSortBy] = useState<SortMode>('total');
  const isMobile = useIsMobile();
  
  // Responsive adjustments
  const effectiveLabelWidth = isMobile ? Math.min(labelWidth, 90) : labelWidth;
  const effectiveMaxChars = isMobile ? Math.min(maxLabelChars, 14) : maxLabelChars;
  const effectiveHeight = isMobile ? Math.min(height, 220) : height;

  // Sort by selected mode (show all items, no limit)
  const processedData = useMemo(() => {
    // Calculate quality percentage (% of qualified leads: Alto + Médio)
    const getQualityPercentage = (item: StackedBarData): number => {
      const alto = item.categories.find(c => c.name === 'Alto')?.value || 0;
      const medio = item.categories.find(c => c.name === 'Médio')?.value || 0;
      const qualificados = alto + medio;
      return item.total > 0 ? (qualificados / item.total) * 100 : 0;
    };

    return [...data].sort((a, b) => {
      if (sortBy === 'quality') {
        return getQualityPercentage(b) - getQualityPercentage(a);
      }
      return b.total - a.total;
    });
  }, [data, sortBy]);

  // Truncate label if too long
  const truncateLabel = (label: string): string => {
    if (label.length <= effectiveMaxChars) return label;
    return label.slice(0, effectiveMaxChars - 3) + "...";
  };

  if (!data || data.length === 0) {
    return (
      <ChartCard
        title={title}
        icon={BarChart3}
        delay={delay}
        loading={loading}
        loadingSkeleton={<SkeletonChart />}
        headerAction={<SortToggle sortBy={sortBy} onSortChange={setSortBy} />}
        contentClassName="flex items-center justify-center"
      >
        <div style={{ height: effectiveHeight }} className="flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Sem dados disponíveis</span>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={title}
      icon={BarChart3}
      delay={delay}
      loading={loading}
      loadingSkeleton={<SkeletonChart />}
      headerAction={<SortToggle sortBy={sortBy} onSortChange={setSortBy} />}
      contentClassName="flex flex-col"
    >
      <div style={{ height: effectiveHeight + 20 }} className="flex flex-col">
        <ScrollArea className="flex-1 pr-2 md:pr-3" style={{ maxHeight: effectiveHeight - 40 }}>
          <div className="space-y-2.5">
            {processedData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                {/* Label */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className="text-[10px] md:text-xs text-muted-foreground truncate shrink-0 text-right"
                        style={{ width: effectiveLabelWidth }}
                      >
                        {truncateLabel(item.name)}
                      </span>
                    </TooltipTrigger>
                    {item.name.length > effectiveMaxChars && (
                      <TooltipContent side="left" style={CHART_STYLES.tooltip.contentStyle}>
                        <p className="text-xs">{item.name}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                {/* Stacked Bar - Normalized categories */}
                <div className="flex-1 flex h-6 rounded-sm overflow-hidden bg-muted/30">
                  {(() => {
                    // Normalize categories to ensure all 4 exist
                    const normalizedCategories = LEGEND_ITEMS.map(legend => {
                      const existing = item.categories.find(c => c.name === legend.name);
                      return {
                        name: legend.name,
                        value: existing?.value || 0,
                        color: legend.color,
                      };
                    });

                    return normalizedCategories.map((category, catIndex) => {
                      const percentage = item.total > 0 
                        ? (category.value / item.total) * 100 
                        : 0;
                      
                      // Skip rendering if 0, but use flex-grow for proper sizing
                      if (category.value === 0) return null;

                      return (
                        <TooltipProvider key={category.name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ flex: 0 }}
                                animate={{ flex: category.value }}
                                transition={{ 
                                  duration: 0.5, 
                                  delay: (delay / 1000) + (index * 0.05) + (catIndex * 0.02) 
                                }}
                                className="h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                                style={{ backgroundColor: category.color }}
                              >
                                {percentage >= 12 && (
                                  <span className="text-[10px] font-medium text-white drop-shadow-sm">
                                    {Math.round(percentage)}%
                                  </span>
                                )}
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              style={CHART_STYLES.tooltip.contentStyle}
                            >
                              <div className="text-xs space-y-1">
                                <p className="font-medium">{item.name}</p>
                                <p>
                                  <span style={{ color: category.color }}>●</span>{" "}
                                  {category.name}: {category.value} ({percentage.toFixed(1)}%)
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    });
                  })()}
                </div>

                {/* Total count */}
                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Legend - always visible outside scroll */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-border/50 shrink-0">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.name} className="flex items-center gap-1">
              <div 
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] md:text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// Export score colors for reuse
export { SCORE_COLORS };
