import { useMemo } from "react";
import { getDaysInMonth, getDate, getDay, differenceInDays, parseISO, isAfter, isBefore, startOfDay } from "date-fns";

export type ProgressStatus = "danger" | "warning" | "success" | "neutral";

interface CampaignPeriod {
  startDate: string | null;
  endDate: string | null;
  useCurrentMonth?: boolean;
}

interface ProgressStatusConfig {
  thresholds: {
    danger: number;
    warning: number;
    success: number;
  };
  campaignPeriod?: CampaignPeriod;
}

interface ProgressResult {
  status: ProgressStatus;
  progressPercent: number;
  expectedPercent: number;
  progressRatio: number;
  label: string;
  color: string;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
}

const DEFAULT_THRESHOLDS = {
  danger: 50,
  warning: 75,
  success: 100,
};

// Calculate expected progress based on campaign period or default period type
function calculateExpectedProgress(
  periodType: "monthly" | "weekly" | "daily",
  campaignPeriod?: CampaignPeriod
): { expectedProgress: number; daysElapsed: number; totalDays: number; daysRemaining: number } {
  const now = startOfDay(new Date());
  
  // If custom campaign period is defined
  if (campaignPeriod && 
      campaignPeriod.useCurrentMonth === false && 
      campaignPeriod.startDate && 
      campaignPeriod.endDate) {
    const startDate = startOfDay(parseISO(campaignPeriod.startDate));
    const endDate = startOfDay(parseISO(campaignPeriod.endDate));
    
    const totalDays = differenceInDays(endDate, startDate) + 1;
    
    // If we're before the campaign started
    if (isBefore(now, startDate)) {
      return { expectedProgress: 0, daysElapsed: 0, totalDays, daysRemaining: totalDays };
    }
    
    // If we're after the campaign ended
    if (isAfter(now, endDate)) {
      return { expectedProgress: 1, daysElapsed: totalDays, totalDays, daysRemaining: 0 };
    }
    
    // We're within the campaign period
    const daysElapsed = differenceInDays(now, startDate) + 1;
    const daysRemaining = totalDays - daysElapsed;
    const expectedProgress = daysElapsed / totalDays;
    
    return { expectedProgress, daysElapsed, totalDays, daysRemaining };
  }
  
  // Default behavior based on period type
  if (periodType === "monthly") {
    const daysInMonth = getDaysInMonth(now);
    const currentDay = getDate(now);
    return { 
      expectedProgress: currentDay / daysInMonth, 
      daysElapsed: currentDay, 
      totalDays: daysInMonth,
      daysRemaining: daysInMonth - currentDay
    };
  } else if (periodType === "weekly") {
    const dayOfWeek = getDay(now);
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    return { 
      expectedProgress: adjustedDay / 7, 
      daysElapsed: adjustedDay, 
      totalDays: 7,
      daysRemaining: 7 - adjustedDay
    };
  } else if (periodType === "daily") {
    const currentHour = new Date().getHours();
    return { 
      expectedProgress: currentHour / 24, 
      daysElapsed: 1, 
      totalDays: 1,
      daysRemaining: 0
    };
  }
  
  return { expectedProgress: 1, daysElapsed: 1, totalDays: 1, daysRemaining: 0 };
}

export function useProgressStatus(
  current: number,
  target: number,
  config?: ProgressStatusConfig,
  periodType: "monthly" | "weekly" | "daily" = "monthly"
): ProgressResult {
  return useMemo(() => {
    const thresholds = config?.thresholds || DEFAULT_THRESHOLDS;
    const { expectedProgress, daysElapsed, totalDays, daysRemaining } = calculateExpectedProgress(
      periodType, 
      config?.campaignPeriod
    );

    // Calculate actual progress
    const actualProgress = target > 0 ? current / target : 0;
    const progressPercent = actualProgress * 100;
    const expectedPercent = expectedProgress * 100;
    
    // Calculate ratio of actual vs expected
    const progressRatio = expectedProgress > 0 
      ? (actualProgress / expectedProgress) * 100 
      : actualProgress * 100;

    // Determine status based on thresholds
    let status: ProgressStatus = "neutral";
    let label = "Sem meta";
    let color = "hsl(var(--muted))";

    if (target > 0) {
      if (progressRatio < thresholds.danger) {
        status = "danger";
        label = "Crítico";
        color = "hsl(var(--destructive))";
      } else if (progressRatio < thresholds.warning) {
        status = "warning";
        label = "Atenção";
        color = "hsl(var(--warning))";
      } else {
        status = "success";
        label = "No caminho";
        color = "hsl(var(--success))";
      }
    }

    return {
      status,
      progressPercent: Math.min(progressPercent, 100),
      expectedPercent: Math.min(expectedPercent, 100),
      progressRatio,
      label,
      color,
      daysElapsed,
      totalDays,
      daysRemaining,
    };
  }, [current, target, config, periodType]);
}

// Helper function for getting status without hook (for edge cases)
export function getProgressStatus(
  current: number,
  target: number,
  thresholds = DEFAULT_THRESHOLDS,
  periodType: "monthly" | "weekly" | "daily" = "monthly",
  campaignPeriod?: CampaignPeriod
): ProgressResult {
  const { expectedProgress, daysElapsed, totalDays, daysRemaining } = calculateExpectedProgress(
    periodType,
    campaignPeriod
  );

  const actualProgress = target > 0 ? current / target : 0;
  const progressPercent = actualProgress * 100;
  const expectedPercent = expectedProgress * 100;
  const progressRatio = expectedProgress > 0 
    ? (actualProgress / expectedProgress) * 100 
    : actualProgress * 100;

  let status: ProgressStatus = "neutral";
  let label = "Sem meta";
  let color = "hsl(var(--muted))";

  if (target > 0) {
    if (progressRatio < thresholds.danger) {
      status = "danger";
      label = "Crítico";
      color = "hsl(var(--destructive))";
    } else if (progressRatio < thresholds.warning) {
      status = "warning";
      label = "Atenção";
      color = "hsl(var(--warning))";
    } else {
      status = "success";
      label = "No caminho";
      color = "hsl(var(--success))";
    }
  }

  return {
    status,
    progressPercent: Math.min(progressPercent, 100),
    expectedPercent: Math.min(expectedPercent, 100),
    progressRatio,
    label,
    color,
    daysElapsed,
    totalDays,
    daysRemaining,
  };
}

export type { CampaignPeriod };
