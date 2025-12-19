import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "./useNotifications";
import { useAdminCheck } from "./useAdminCheck";

interface AlertConfiguration {
  id: string;
  project_id: string | null;
  metric_type: string;
  threshold_value: number;
  comparison_operator: string;
  is_active: boolean;
  notification_channels: string[];
}

interface MetricsData {
  cpl: number;
  ctr: number;
  spend: number;
  leads: number;
  expectedLeads: number;
  goalLeads: number;
  maxCPL: number;
  budgetLimit: number;
}

interface TriggeredAlert {
  alertConfigId: string;
  metricType: string;
  metricValue: number;
  thresholdValue: number;
  message: string;
}

const ALERT_COOLDOWN_HOURS = 24;

export function useAlertChecker(metrics: MetricsData, projectId: string | null) {
  const { isAdmin } = useAdminCheck();
  const { isGranted, notifyCPLAlert, notifyLeadGoalAlert, notifyBudgetAlert } = useNotifications();
  const [alertConfigs, setAlertConfigs] = useState<AlertConfiguration[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const lastCheckRef = useRef<Record<string, number>>({});

  // Fetch alert configurations
  useEffect(() => {
    const fetchAlertConfigs = async () => {
      try {
        let query = supabase
          .from("alert_configurations")
          .select("*")
          .eq("is_active", true);

        if (projectId) {
          query = query.or(`project_id.eq.${projectId},project_id.is.null`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setAlertConfigs((data as AlertConfiguration[]) || []);
      } catch (error) {
        console.error("Error fetching alert configurations:", error);
      }
    };

    fetchAlertConfigs();
  }, [projectId]);

  // Check if alert was recently triggered
  const wasRecentlyTriggered = useCallback((alertId: string): boolean => {
    const lastTriggered = lastCheckRef.current[alertId];
    if (!lastTriggered) return false;

    const hoursSinceLastTrigger = (Date.now() - lastTriggered) / (1000 * 60 * 60);
    return hoursSinceLastTrigger < ALERT_COOLDOWN_HOURS;
  }, []);

  // Evaluate a single alert condition
  const evaluateCondition = useCallback(
    (config: AlertConfiguration, currentValue: number): boolean => {
      switch (config.comparison_operator) {
        case "greater_than":
          return currentValue > config.threshold_value;
        case "less_than":
          return currentValue < config.threshold_value;
        case "equals":
          return currentValue === config.threshold_value;
        default:
          return false;
      }
    },
    []
  );

  // Get metric value by type
  const getMetricValue = useCallback(
    (metricType: string): number => {
      switch (metricType) {
        case "cpl":
          return metrics.cpl;
        case "ctr":
          return metrics.ctr;
        case "spend":
          return metrics.spend;
        case "leads_progress":
          return metrics.expectedLeads > 0
            ? (metrics.leads / metrics.expectedLeads) * 100
            : 0;
        default:
          return 0;
      }
    },
    [metrics]
  );

  // Generate alert message
  const generateMessage = useCallback(
    (config: AlertConfiguration, currentValue: number): string => {
      const operatorText =
        config.comparison_operator === "greater_than"
          ? "acima de"
          : config.comparison_operator === "less_than"
          ? "abaixo de"
          : "igual a";

      switch (config.metric_type) {
        case "cpl":
          return `CPL atual (R$ ${currentValue.toFixed(2)}) ${operatorText} R$ ${config.threshold_value.toFixed(2)}`;
        case "ctr":
          return `CTR atual (${currentValue.toFixed(2)}%) ${operatorText} ${config.threshold_value}%`;
        case "spend":
          return `Investimento (R$ ${currentValue.toFixed(2)}) ${operatorText} R$ ${config.threshold_value.toFixed(2)}`;
        case "leads_progress":
          return `Progresso de leads (${currentValue.toFixed(0)}%) ${operatorText} ${config.threshold_value}%`;
        default:
          return `Métrica ${config.metric_type} = ${currentValue}`;
      }
    },
    []
  );

  // Save triggered alert to history
  const saveAlertHistory = useCallback(
    async (alert: TriggeredAlert) => {
      try {
        const { error } = await supabase.from("alert_history").insert([
          {
            alert_config_id: alert.alertConfigId,
            metric_value: alert.metricValue,
            threshold_value: alert.thresholdValue,
            message: alert.message,
            is_read: false,
          },
        ]);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving alert history:", error);
      }
    },
    []
  );

  // Send browser notification
  const sendBrowserNotification = useCallback(
    (config: AlertConfiguration, currentValue: number) => {
      if (!isGranted) return;

      switch (config.metric_type) {
        case "cpl":
          notifyCPLAlert(currentValue, config.threshold_value);
          break;
        case "leads_progress":
          const daysRemaining = 30 - new Date().getDate();
          notifyLeadGoalAlert(metrics.leads, metrics.goalLeads, daysRemaining);
          break;
        case "spend":
          notifyBudgetAlert(currentValue, config.threshold_value);
          break;
      }
    },
    [isGranted, notifyCPLAlert, notifyLeadGoalAlert, notifyBudgetAlert, metrics.leads, metrics.goalLeads]
  );

  // Check all alerts
  const checkAlerts = useCallback(() => {
    if (!isAdmin) return;

    const newTriggeredAlerts: TriggeredAlert[] = [];

    for (const config of alertConfigs) {
      if (wasRecentlyTriggered(config.id)) continue;

      const currentValue = getMetricValue(config.metric_type);
      const isTriggered = evaluateCondition(config, currentValue);

      if (isTriggered) {
        const alert: TriggeredAlert = {
          alertConfigId: config.id,
          metricType: config.metric_type,
          metricValue: currentValue,
          thresholdValue: config.threshold_value,
          message: generateMessage(config, currentValue),
        };

        newTriggeredAlerts.push(alert);
        lastCheckRef.current[config.id] = Date.now();

        // Save to history and send notification
        saveAlertHistory(alert);
        
        if (config.notification_channels?.includes("browser") || isGranted) {
          sendBrowserNotification(config, currentValue);
        }
      }
    }

    if (newTriggeredAlerts.length > 0) {
      setTriggeredAlerts((prev) => [...prev, ...newTriggeredAlerts]);
    }
  }, [
    isAdmin,
    alertConfigs,
    wasRecentlyTriggered,
    getMetricValue,
    evaluateCondition,
    generateMessage,
    saveAlertHistory,
    sendBrowserNotification,
    isGranted,
  ]);

  // Check alerts when metrics change
  useEffect(() => {
    if (
      metrics.cpl > 0 ||
      metrics.ctr > 0 ||
      metrics.spend > 0 ||
      metrics.leads > 0
    ) {
      checkAlerts();
    }
  }, [metrics.cpl, metrics.ctr, metrics.spend, metrics.leads, checkAlerts]);

  return {
    triggeredAlerts,
    alertConfigs,
    checkAlerts,
  };
}
