import { useMemo } from "react";
import { MetaAdsResponse, CampaignData } from "@/hooks/useMetaAdsData";
import { LeadsData } from "@/hooks/useLeadsData";

export interface FunnelStage {
  name: string;
  value: number;
  fill: string;
  conversionRate?: number;
  previousStage?: string;
}

export interface ConversionRates {
  impressionToReach: number;
  reachToClick: number;
  clickToLead: number;
  leadToSale: number;
  overallConversion: number;
  surveyRate: number;
  qualificationRate: number;
  hotLeadRate: number;
}

export interface FunnelMetrics {
  acquisitionFunnel: FunnelStage[];
  qualificationFunnel: FunnelStage[];
  conversionRates: ConversionRates;
}

// Cores do funil de aquisição
const ACQUISITION_COLORS = [
  "hsl(221, 83%, 53%)",  // Impressões - Azul
  "hsl(217, 91%, 60%)",  // Alcance - Azul claro
  "hsl(142, 71%, 45%)",  // Cliques - Verde
  "hsl(48, 96%, 53%)",   // Leads - Amarelo
  "hsl(142, 76%, 36%)",  // Vendas - Verde escuro
];

// Cores do funil de qualificação
const QUALIFICATION_COLORS = [
  "hsl(220, 13%, 69%)",  // Total - Cinza
  "hsl(217, 91%, 60%)",  // Com Pesquisa - Azul
  "hsl(48, 96%, 53%)",   // Qualificados - Amarelo
  "hsl(142, 76%, 36%)",  // Hot - Verde
];

// Calcula taxa de conversão entre dois valores
function getConversionRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current / previous) * 100;
}

// Calcula funil de aquisição a partir de dados de anúncios
function calculateAcquisitionFunnel(
  totals: { impressions: number; reach: number; clicks: number; leads: number; sales?: number },
  campaigns?: CampaignData[]
): FunnelStage[] {
  const impressions = totals.impressions || 0;
  const reach = totals.reach || 0;
  const clicks = totals.clicks || 0;
  const leads = totals.leads || 0;
  
  // Calcular vendas a partir das campanhas se não tiver no totals
  let sales = totals.sales || 0;
  if (!sales && campaigns) {
    sales = campaigns.reduce((sum, c) => sum + (c.sales || 0), 0);
  }

  return [
    {
      name: "Impressões",
      value: impressions,
      fill: ACQUISITION_COLORS[0],
      conversionRate: 100,
    },
    {
      name: "Alcance",
      value: reach,
      fill: ACQUISITION_COLORS[1],
      conversionRate: getConversionRate(reach, impressions),
      previousStage: "Impressões",
    },
    {
      name: "Cliques",
      value: clicks,
      fill: ACQUISITION_COLORS[2],
      conversionRate: getConversionRate(clicks, reach),
      previousStage: "Alcance",
    },
    {
      name: "Leads",
      value: leads,
      fill: ACQUISITION_COLORS[3],
      conversionRate: getConversionRate(leads, clicks),
      previousStage: "Cliques",
    },
    {
      name: "Vendas",
      value: sales,
      fill: ACQUISITION_COLORS[4],
      conversionRate: getConversionRate(sales, leads),
      previousStage: "Leads",
    },
  ];
}

// Calcula funil de qualificação a partir de dados de leads
function calculateQualificationFunnel(
  kpis: LeadsData["kpis"] | null,
  qualifiedCount?: number
): FunnelStage[] {
  if (!kpis) {
    return [
      { name: "Total", value: 0, fill: QUALIFICATION_COLORS[0], conversionRate: 100 },
      { name: "Com Pesquisa", value: 0, fill: QUALIFICATION_COLORS[1], conversionRate: 0 },
      { name: "Qualificados", value: 0, fill: QUALIFICATION_COLORS[2], conversionRate: 0 },
      { name: "Hot Leads", value: 0, fill: QUALIFICATION_COLORS[3], conversionRate: 0 },
    ];
  }

  const total = kpis.total || 0;
  const withSurvey = kpis.withSurvey || 0;
  // Qualified = leads com score >= 60 (A + B)
  // Se não informado, estima como hotLeadsCount * 2 (aproximação)
  const qualified = qualifiedCount ?? Math.round(kpis.hotLeadsCount * 2);
  const hotLeads = kpis.hotLeadsCount || 0;

  return [
    {
      name: "Total",
      value: total,
      fill: QUALIFICATION_COLORS[0],
      conversionRate: 100,
    },
    {
      name: "Com Pesquisa",
      value: withSurvey,
      fill: QUALIFICATION_COLORS[1],
      conversionRate: getConversionRate(withSurvey, total),
      previousStage: "Total",
    },
    {
      name: "Qualificados (A+B)",
      value: qualified,
      fill: QUALIFICATION_COLORS[2],
      conversionRate: getConversionRate(qualified, withSurvey),
      previousStage: "Com Pesquisa",
    },
    {
      name: "Hot Leads (A)",
      value: hotLeads,
      fill: QUALIFICATION_COLORS[3],
      conversionRate: getConversionRate(hotLeads, qualified),
      previousStage: "Qualificados",
    },
  ];
}

// Calcula taxas de conversão
function calculateConversionRates(
  adsData: { impressions: number; reach: number; clicks: number; leads: number; sales?: number } | null,
  leadsKpis: LeadsData["kpis"] | null,
  qualifiedCount?: number
): ConversionRates {
  const impressions = adsData?.impressions || 0;
  const reach = adsData?.reach || 0;
  const clicks = adsData?.clicks || 0;
  const leads = adsData?.leads || 0;
  const sales = adsData?.sales || 0;

  const total = leadsKpis?.total || 0;
  const withSurvey = leadsKpis?.withSurvey || 0;
  const qualified = qualifiedCount ?? Math.round((leadsKpis?.hotLeadsCount || 0) * 2);
  const hotLeads = leadsKpis?.hotLeadsCount || 0;

  return {
    impressionToReach: getConversionRate(reach, impressions),
    reachToClick: getConversionRate(clicks, reach),
    clickToLead: getConversionRate(leads, clicks),
    leadToSale: getConversionRate(sales, leads),
    overallConversion: getConversionRate(sales, impressions),
    surveyRate: getConversionRate(withSurvey, total),
    qualificationRate: getConversionRate(qualified, withSurvey),
    hotLeadRate: getConversionRate(hotLeads, total),
  };
}

// Hook principal
export function useFunnelData(
  adsData: MetaAdsResponse | null,
  leadsData: LeadsData | null,
  qualifiedCount?: number
): FunnelMetrics {
  return useMemo(() => {
    const totals = adsData?.totals || { impressions: 0, reach: 0, clicks: 0, leads: 0, sales: 0 };
    
    return {
      acquisitionFunnel: calculateAcquisitionFunnel(totals, adsData?.campaigns),
      qualificationFunnel: calculateQualificationFunnel(leadsData?.kpis || null, qualifiedCount),
      conversionRates: calculateConversionRates(totals, leadsData?.kpis || null, qualifiedCount),
    };
  }, [adsData, leadsData, qualifiedCount]);
}

// Hook específico para funil de aquisição (apenas dados de ads)
export function useAcquisitionFunnel(
  totals: { impressions: number; reach: number; clicks: number; leads: number; sales?: number } | null,
  campaigns?: CampaignData[]
): FunnelStage[] {
  return useMemo(() => {
    if (!totals) {
      return calculateAcquisitionFunnel({ impressions: 0, reach: 0, clicks: 0, leads: 0, sales: 0 });
    }
    return calculateAcquisitionFunnel(totals, campaigns);
  }, [totals, campaigns]);
}

// Hook específico para funil de qualificação (apenas dados de leads)
export function useQualificationFunnel(kpis: LeadsData["kpis"] | null, qualifiedCount?: number): FunnelStage[] {
  return useMemo(() => calculateQualificationFunnel(kpis, qualifiedCount), [kpis, qualifiedCount]);
}

export { ACQUISITION_COLORS, QUALIFICATION_COLORS, getConversionRate };
