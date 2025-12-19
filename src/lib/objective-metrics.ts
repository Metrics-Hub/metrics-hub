import { CampaignObjective } from "@/components/ObjectiveFilter";
import { Target, MousePointer, Eye, Users, DollarSign, TrendingUp, ShoppingCart, Play } from "lucide-react";
import { LucideIcon } from "lucide-react";

export type MetricType = 
  | 'leads' | 'cpl' | 'reach' | 'impressions' | 'cpm' 
  | 'clicks' | 'cpc' | 'ctr' | 'conversions' | 'roas' 
  | 'spend' | 'videoViews';

export interface MetricConfig {
  key: MetricType;
  label: string;
  shortLabel: string;
  format: 'currency' | 'number' | 'percent';
  icon: LucideIcon;
  sortOrder: 'asc' | 'desc'; // For rankings: asc = lower is better (CPL), desc = higher is better (CTR)
}

export interface ObjectiveMetricConfig {
  primaryMetric: MetricConfig;
  secondaryMetric: MetricConfig;
  goalMetric: MetricType;
  goalLabel: string;
  rankingMetrics: [MetricConfig, MetricConfig]; // [primary ranking, secondary ranking]
  kpiPriority: MetricType[]; // Order of KPI relevance
  description: string;
}

// Centralized metric definitions
export const METRICS: Record<MetricType, MetricConfig> = {
  leads: { key: 'leads', label: 'Leads', shortLabel: 'Leads', format: 'number', icon: Target, sortOrder: 'desc' },
  cpl: { key: 'cpl', label: 'CPL', shortLabel: 'CPL', format: 'currency', icon: DollarSign, sortOrder: 'asc' },
  clicks: { key: 'clicks', label: 'Cliques', shortLabel: 'Cliques', format: 'number', icon: MousePointer, sortOrder: 'desc' },
  cpc: { key: 'cpc', label: 'CPC', shortLabel: 'CPC', format: 'currency', icon: DollarSign, sortOrder: 'asc' },
  ctr: { key: 'ctr', label: 'CTR', shortLabel: 'CTR', format: 'percent', icon: TrendingUp, sortOrder: 'desc' },
  impressions: { key: 'impressions', label: 'Impressões', shortLabel: 'Impr.', format: 'number', icon: Eye, sortOrder: 'desc' },
  reach: { key: 'reach', label: 'Alcance', shortLabel: 'Alcance', format: 'number', icon: Users, sortOrder: 'desc' },
  cpm: { key: 'cpm', label: 'CPM', shortLabel: 'CPM', format: 'currency', icon: DollarSign, sortOrder: 'asc' },
  spend: { key: 'spend', label: 'Investimento', shortLabel: 'Invest.', format: 'currency', icon: DollarSign, sortOrder: 'desc' },
  conversions: { key: 'conversions', label: 'Conversões', shortLabel: 'Conv.', format: 'number', icon: ShoppingCart, sortOrder: 'desc' },
  roas: { key: 'roas', label: 'ROAS', shortLabel: 'ROAS', format: 'number', icon: TrendingUp, sortOrder: 'desc' },
  videoViews: { key: 'videoViews', label: 'Views', shortLabel: 'Views', format: 'number', icon: Play, sortOrder: 'desc' },
};

// Config by campaign objective
export const objectiveMetricsConfig: Partial<Record<CampaignObjective, ObjectiveMetricConfig>> = {
  // === META ADS OBJECTIVES ===
  
  // Lead Generation - focus on CPL and lead count
  OUTCOME_LEADS: {
    primaryMetric: METRICS.leads,
    secondaryMetric: METRICS.cpl,
    goalMetric: 'leads',
    goalLabel: 'Meta de Leads',
    rankingMetrics: [METRICS.cpl, METRICS.ctr],
    kpiPriority: ['leads', 'cpl', 'spend', 'ctr', 'cpc', 'clicks', 'impressions', 'reach', 'cpm'],
    description: 'Campanhas focadas em geração de leads',
  },
  
  // Traffic - focus on clicks and CPC
  OUTCOME_TRAFFIC: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Cliques',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'cpc', 'ctr', 'spend', 'impressions', 'reach', 'cpm', 'leads', 'cpl'],
    description: 'Campanhas focadas em tráfego',
  },
  
  // Awareness - focus on reach and CPM
  OUTCOME_AWARENESS: {
    primaryMetric: METRICS.reach,
    secondaryMetric: METRICS.cpm,
    goalMetric: 'impressions',
    goalLabel: 'Meta de Impressões',
    rankingMetrics: [METRICS.cpm, METRICS.ctr],
    kpiPriority: ['reach', 'impressions', 'cpm', 'spend', 'ctr', 'clicks', 'cpc', 'leads', 'cpl'],
    description: 'Campanhas de reconhecimento de marca',
  },
  
  // Engagement
  OUTCOME_ENGAGEMENT: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.ctr,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Engajamento',
    rankingMetrics: [METRICS.ctr, METRICS.cpc],
    kpiPriority: ['clicks', 'ctr', 'impressions', 'reach', 'cpc', 'spend', 'cpm', 'leads', 'cpl'],
    description: 'Campanhas de engajamento',
  },
  
  // Sales
  OUTCOME_SALES: {
    primaryMetric: METRICS.conversions,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'conversions',
    goalLabel: 'Meta de Vendas',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['leads', 'cpl', 'spend', 'ctr', 'clicks', 'cpc', 'impressions', 'reach', 'cpm'],
    description: 'Campanhas de vendas',
  },
  
  // App Promotion
  OUTCOME_APP_PROMOTION: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Instalações',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'cpc', 'ctr', 'spend', 'impressions', 'reach', 'cpm', 'leads', 'cpl'],
    description: 'Campanhas de promoção de app',
  },
  
  // === GOOGLE ADS OBJECTIVES ===
  
  // Search - focus on clicks and CPC (similar to leads for intent)
  SEARCH: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Cliques',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'leads', 'cpc', 'cpl', 'ctr', 'spend', 'impressions', 'cpm', 'reach'],
    description: 'Campanhas de Pesquisa Google',
  },
  
  // Display - focus on impressions and CPM (awareness)
  DISPLAY: {
    primaryMetric: METRICS.impressions,
    secondaryMetric: METRICS.cpm,
    goalMetric: 'impressions',
    goalLabel: 'Meta de Impressões',
    rankingMetrics: [METRICS.cpm, METRICS.ctr],
    kpiPriority: ['impressions', 'reach', 'cpm', 'clicks', 'ctr', 'spend', 'cpc', 'leads', 'cpl'],
    description: 'Campanhas de Display',
  },
  
  // Video - focus on views and CPM
  VIDEO: {
    primaryMetric: METRICS.impressions,
    secondaryMetric: METRICS.cpm,
    goalMetric: 'impressions',
    goalLabel: 'Meta de Views',
    rankingMetrics: [METRICS.cpm, METRICS.ctr],
    kpiPriority: ['impressions', 'reach', 'cpm', 'clicks', 'ctr', 'spend', 'cpc', 'leads', 'cpl'],
    description: 'Campanhas de Vídeo',
  },
  
  // Shopping - focus on conversions and ROAS
  SHOPPING: {
    primaryMetric: METRICS.leads,
    secondaryMetric: METRICS.cpl,
    goalMetric: 'leads',
    goalLabel: 'Meta de Vendas',
    rankingMetrics: [METRICS.cpl, METRICS.ctr],
    kpiPriority: ['leads', 'cpl', 'spend', 'clicks', 'ctr', 'cpc', 'impressions', 'cpm', 'reach'],
    description: 'Campanhas de Shopping',
  },
  
  // Performance Max - balanced focus (leads + awareness)
  PERFORMANCE_MAX: {
    primaryMetric: METRICS.leads,
    secondaryMetric: METRICS.cpl,
    goalMetric: 'leads',
    goalLabel: 'Meta de Conversões',
    rankingMetrics: [METRICS.cpl, METRICS.ctr],
    kpiPriority: ['leads', 'cpl', 'clicks', 'cpc', 'ctr', 'spend', 'impressions', 'reach', 'cpm'],
    description: 'Campanhas Performance Max',
  },
  
  // Discovery
  DISCOVERY: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Cliques',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'cpc', 'ctr', 'impressions', 'reach', 'spend', 'cpm', 'leads', 'cpl'],
    description: 'Campanhas Discovery',
  },
  
  // Local
  LOCAL: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Visitas',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'cpc', 'ctr', 'impressions', 'spend', 'reach', 'cpm', 'leads', 'cpl'],
    description: 'Campanhas Locais',
  },
  
  // Smart
  SMART: {
    primaryMetric: METRICS.clicks,
    secondaryMetric: METRICS.cpc,
    goalMetric: 'clicks',
    goalLabel: 'Meta de Conversões',
    rankingMetrics: [METRICS.cpc, METRICS.ctr],
    kpiPriority: ['clicks', 'leads', 'cpc', 'cpl', 'ctr', 'spend', 'impressions', 'cpm', 'reach'],
    description: 'Campanhas Smart',
  },
};

// Default config for unknown objectives
export const defaultObjectiveConfig: ObjectiveMetricConfig = {
  primaryMetric: METRICS.clicks,
  secondaryMetric: METRICS.cpc,
  goalMetric: 'clicks',
  goalLabel: 'Meta',
  rankingMetrics: [METRICS.cpc, METRICS.ctr],
  kpiPriority: ['spend', 'clicks', 'impressions', 'reach', 'ctr', 'cpc', 'cpm', 'leads', 'cpl'],
  description: 'Campanhas',
};

// Get config for an objective
export function getObjectiveConfig(objective: CampaignObjective | string): ObjectiveMetricConfig {
  return objectiveMetricsConfig[objective as CampaignObjective] || defaultObjectiveConfig;
}

// Group objectives by type for display
export const objectiveGroups = {
  leads: ['OUTCOME_LEADS', 'SEARCH', 'PERFORMANCE_MAX', 'SHOPPING', 'SMART'],
  traffic: ['OUTCOME_TRAFFIC', 'DISCOVERY', 'LOCAL'],
  awareness: ['OUTCOME_AWARENESS', 'DISPLAY', 'VIDEO'],
  engagement: ['OUTCOME_ENGAGEMENT', 'OUTCOME_APP_PROMOTION'],
  sales: ['OUTCOME_SALES'],
};

// Check if objective is leads-focused (for investment calculations)
export function isLeadsFocusedObjective(objective: CampaignObjective | string): boolean {
  return objectiveGroups.leads.includes(objective);
}
