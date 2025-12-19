import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RankingItem {
  name: string;
  mainValue: number;
  secondaryLabel: string;
  secondaryValue: number;
  tertiaryLabel: string;
  tertiaryValue: number;
}

interface RankingTableProps {
  title: string;
  subtitle: string;
  data: RankingItem[];
  metricLabel: string;
  metricFormat: "currency" | "percent" | "number";
  loading?: boolean;
  delay?: number;
  sortOrder?: "asc" | "desc";
  totalAvailable?: number;
  minThreshold?: number;
}

const formatValue = (value: number, format: "currency" | "percent" | "number"): string => {
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString("pt-BR");
};

const RankingSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg">
        <Trophy className="h-4 w-4" />
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-400 to-zinc-500 dark:from-slate-300 dark:to-slate-400 text-white shadow">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  if (position === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
      {position}
    </div>
  );
};

export function RankingTable({
  title,
  subtitle,
  data,
  metricLabel,
  metricFormat,
  loading = false,
  delay = 0,
  sortOrder = "asc",
  totalAvailable,
  minThreshold,
}: RankingTableProps) {
  const Icon = sortOrder === "asc" ? TrendingDown : TrendingUp;
  const showPartialIndicator = totalAvailable !== undefined && totalAvailable > 0 && totalAvailable < 10;
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      className="cursor-pointer h-full"
    >
      <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6">
          {loading ? (
            <RankingSkeleton />
          ) : data.length === 0 ? (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                Nenhum item com pelo menos {minThreshold ?? 5} leads.
                <br />
                <span className="text-muted-foreground">Tente reduzir o limite mínimo de leads.</span>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {showPartialIndicator && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 rounded-md bg-muted/50">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Mostrando {totalAvailable} de {totalAvailable} itens disponíveis</span>
                </div>
              )}
              {data.map((item, index) => (
                <motion.div
                  key={`${item.name}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (delay + index * 50) / 1000 }}
                  className="group flex items-center gap-2 md:gap-3 rounded-lg p-1.5 md:p-2 transition-colors hover:bg-muted/50"
                >
                  <PositionBadge position={index + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs md:text-sm font-medium" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {item.secondaryLabel}: {formatValue(item.secondaryValue, "number")}
                      {!isMobile && <> · {item.tertiaryLabel}: {formatValue(item.tertiaryValue, "currency")}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-xs md:text-sm text-primary">
                      {formatValue(item.mainValue, metricFormat)}
                    </span>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{metricLabel}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
