import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
  id: string;
  type: "cpl_high" | "cpl_low" | "ctr_low" | "budget_high" | "goal_behind" | "goal_ahead";
  severity: "warning" | "critical" | "success";
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

interface SmartAlertsProps {
  currentCPL: number;
  maxCPL: number;
  currentCTR: number;
  currentSpend: number;
  budgetLimit: number;
  currentLeads: number;
  expectedLeads: number;
  goalLeads: number;
}

const alertConfig = {
  cpl_high: {
    icon: DollarSign,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  cpl_low: {
    icon: DollarSign,
    color: "text-emerald-600 dark:text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    border: "border-emerald-300 dark:border-emerald-500/30",
  },
  ctr_low: {
    icon: TrendingDown,
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-500/10",
    border: "border-amber-300 dark:border-amber-500/30",
  },
  budget_high: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  goal_behind: {
    icon: Target,
    color: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-500/10",
    border: "border-amber-300 dark:border-amber-500/30",
  },
  goal_ahead: {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    border: "border-emerald-300 dark:border-emerald-500/30",
  },
};

export function SmartAlerts({
  currentCPL,
  maxCPL,
  currentCTR,
  currentSpend,
  budgetLimit,
  currentLeads,
  expectedLeads,
  goalLeads,
}: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasMoreContent = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollIndicator(hasMoreContent && !isAtBottom);
    }
  }, []);


  useEffect(() => {
    const newAlerts: Alert[] = [];

    // CPL Alert - High
    if (maxCPL > 0 && currentCPL > maxCPL) {
      const percentOver = ((currentCPL - maxCPL) / maxCPL * 100).toFixed(0);
      newAlerts.push({
        id: "cpl_high",
        type: "cpl_high",
        severity: currentCPL > maxCPL * 1.5 ? "critical" : "warning",
        title: "CPL acima do limite",
        message: `CPL atual (R$ ${currentCPL.toFixed(2)}) está ${percentOver}% acima do máximo configurado (R$ ${maxCPL.toFixed(2)})`,
        value: currentCPL,
        threshold: maxCPL,
        timestamp: new Date(),
      });
    }

    // CPL Alert - Low (good)
    if (maxCPL > 0 && currentCPL < maxCPL * 0.7 && currentCPL > 0) {
      newAlerts.push({
        id: "cpl_low",
        type: "cpl_low",
        severity: "success",
        title: "CPL excelente!",
        message: `CPL atual (R$ ${currentCPL.toFixed(2)}) está 30% abaixo do limite. Considere escalar os anúncios.`,
        value: currentCPL,
        threshold: maxCPL,
        timestamp: new Date(),
      });
    }

    // CTR Alert - Low
    if (currentCTR < 1.0 && currentCTR > 0) {
      newAlerts.push({
        id: "ctr_low",
        type: "ctr_low",
        severity: "warning",
        title: "CTR baixo",
        message: `CTR de ${currentCTR.toFixed(2)}% está abaixo do ideal (1%). Revise os criativos.`,
        value: currentCTR,
        threshold: 1.0,
        timestamp: new Date(),
      });
    }

    // Budget Alert
    if (budgetLimit > 0 && currentSpend > budgetLimit * 0.9) {
      const percentUsed = (currentSpend / budgetLimit * 100).toFixed(0);
      newAlerts.push({
        id: "budget_high",
        type: "budget_high",
        severity: currentSpend >= budgetLimit ? "critical" : "warning",
        title: currentSpend >= budgetLimit ? "Orçamento esgotado" : "Orçamento quase esgotado",
        message: `${percentUsed}% do orçamento mensal utilizado (R$ ${currentSpend.toFixed(2)} de R$ ${budgetLimit.toFixed(2)})`,
        value: currentSpend,
        threshold: budgetLimit,
        timestamp: new Date(),
      });
    }

    // Goal Progress Alert - Behind
    if (expectedLeads > 0 && currentLeads < expectedLeads * 0.75) {
      const percentBehind = ((1 - currentLeads / expectedLeads) * 100).toFixed(0);
      newAlerts.push({
        id: "goal_behind",
        type: "goal_behind",
        severity: currentLeads < expectedLeads * 0.5 ? "critical" : "warning",
        title: "Meta em risco",
        message: `${percentBehind}% abaixo do esperado para este ponto do mês. Necessário acelerar para atingir ${goalLeads} leads.`,
        value: currentLeads,
        threshold: expectedLeads,
        timestamp: new Date(),
      });
    }

    // Goal Progress Alert - Ahead
    if (expectedLeads > 0 && currentLeads > expectedLeads * 1.2) {
      newAlerts.push({
        id: "goal_ahead",
        type: "goal_ahead",
        severity: "success",
        title: "Meta superando expectativas!",
        message: `${currentLeads} leads gerados, 20% acima do esperado (${Math.round(expectedLeads)}). Continue assim!`,
        value: currentLeads,
        threshold: expectedLeads,
        timestamp: new Date(),
      });
    }

    setAlerts(newAlerts);
  }, [currentCPL, maxCPL, currentCTR, currentSpend, budgetLimit, currentLeads, expectedLeads, goalLeads]);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  useEffect(() => {
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [visibleAlerts.length, checkScrollPosition]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set([...prev, id]));
  };

  const clearDismissed = () => {
    setDismissedAlerts(new Set());
  };

  if (visibleAlerts.length === 0 && alerts.length === 0) {
    return null;
  }

  return (
    <Card variant="glass" className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Alertas Inteligentes
            {visibleAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {visibleAlerts.length}
              </Badge>
            )}
          </CardTitle>
          {dismissedAlerts.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearDismissed}>
              Mostrar todos
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-3 md:p-6">
        {visibleAlerts.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground py-4">
            <BellOff className="h-5 w-5" />
            <span className="text-sm">Todos os alertas foram dispensados</span>
          </div>
        ) : (
          <div className="relative">
            <ScrollArea 
              className="max-h-[400px] pr-2"
              onScrollCapture={checkScrollPosition}
              ref={scrollRef}
            >
              <AnimatePresence mode="popLayout">
                <div className="space-y-3 pb-4">
                  {visibleAlerts.map((alert) => {
                    const config = alertConfig[alert.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md ${config.bg}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{alert.title}</span>
                              <Badge
                                variant={
                                  alert.severity === "critical"
                                    ? "destructive"
                                    : alert.severity === "success"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {alert.severity === "critical"
                                  ? "Crítico"
                                  : alert.severity === "success"
                                  ? "Positivo"
                                  : "Atenção"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {alert.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </ScrollArea>
            
            <AnimatePresence>
              {showScrollIndicator && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none flex items-end justify-center pb-1"
                  style={{
                    background: 'linear-gradient(to top, hsl(var(--card)) 0%, transparent 100%)'
                  }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
