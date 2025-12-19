import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ReportType = "daily" | "weekly" | "summary" | "projection" | "alert" | "executive";

export interface CampaignPeriod {
  startDate: string | null;
  endDate: string | null;
  useCurrentMonth: boolean;
}

export interface ReportData {
  appName?: string;
  projectName?: string;
  currentLeads: number;
  monthlyGoal: number;
  progressPercent: number;
  projectedLeads: number;
  projectionStatus: "success" | "warning" | "danger";
  totalSpend?: number;
  averageCPL?: number;
  averageDailyRate?: number;
  daysRemaining?: number;
  daysElapsed?: number;
  totalDays?: number;
  pessimisticTotal?: number;
  optimisticTotal?: number;
  dateRange?: { from: Date; to: Date };
  campaignPeriod?: CampaignPeriod;
  periodLabel?: string;
  
  // Media metrics
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  
  // Sales metrics
  sales?: number;
  cps?: number;
  
  // Period comparison (% change)
  leadsChange?: number;
  spendChange?: number;
  cplChange?: number;
  
  // Campaign info
  activeCampaigns?: number;
  dataSources?: string[];
  conversionRate?: number; // clicks → leads %
  
  // Report period
  dateFrom?: string;
  dateTo?: string;
}

// Emojis gerados em runtime via String.fromCodePoint() para garantir
// compatibilidade independente do encoding do arquivo fonte
const EMOJI = {
  chart: String.fromCodePoint(0x1F4CA),           // 📊
  chartUp: String.fromCodePoint(0x1F4C8),         // 📈
  chartDown: String.fromCodePoint(0x1F4C9),       // 📉
  calendar: String.fromCodePoint(0x1F4C5),        // 📅
  target: String.fromCodePoint(0x1F3AF),          // 🎯
  money: String.fromCodePoint(0x1F4B0),           // 💰
  clock: String.fromCodePoint(0x23F0),            // ⏰
  warning: String.fromCodePoint(0x26A0, 0xFE0F),  // ⚠️
  check: String.fromCodePoint(0x2705),            // ✅
  alert: String.fromCodePoint(0x1F6A8),           // 🚨
  redCircle: String.fromCodePoint(0x1F534),       // 🔴
  yellowCircle: String.fromCodePoint(0x1F7E1),    // 🟡
  greenCircle: String.fromCodePoint(0x1F7E2),     // 🟢
  eye: String.fromCodePoint(0x1F441, 0xFE0F),     // 👁️
  mobile: String.fromCodePoint(0x1F4F1),          // 📱
  arrowUp: String.fromCodePoint(0x2B06, 0xFE0F),  // ⬆️
  arrowDown: String.fromCodePoint(0x2B07, 0xFE0F),// ⬇️
  fire: String.fromCodePoint(0x1F525),            // 🔥
  rocket: String.fromCodePoint(0x1F680),          // 🚀
  briefcase: String.fromCodePoint(0x1F4BC),       // 💼
};

const STATUS_EMOJI: Record<string, string> = {
  success: EMOJI.check,
  warning: EMOJI.warning,
  danger: EMOJI.alert,
};

const STATUS_LABEL: Record<string, string> = {
  success: "Meta garantida",
  warning: "Atenção",
  danger: "Meta em risco",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChange(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return "";
  const arrow = value >= 0 ? EMOJI.arrowUp : EMOJI.arrowDown;
  const sign = value >= 0 ? "+" : "";
  return `${arrow} ${sign}${value.toFixed(1)}%`;
}

function getDataSourcesLabel(dataSources?: string[]): string {
  if (!dataSources || dataSources.length === 0) return "";
  const labels = dataSources.map(s => {
    if (s === "meta") return "Meta Ads";
    if (s === "google") return "Google Ads";
    return s;
  });
  return labels.join(", ");
}

function formatPeriodLine(data: ReportData, today: string): string {
  if (data.dateFrom && data.dateTo && data.dateFrom !== data.dateTo) {
    return `${EMOJI.calendar} Período: ${data.dateFrom} a ${data.dateTo}`;
  }
  return `${EMOJI.calendar} ${today}`;
}

export function formatWhatsAppReport(type: ReportType, data: ReportData): string {
  const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  const projectLine = data.projectName ? `*${EMOJI.target} Projeto: ${data.projectName}*\n\n` : "";
  
  switch (type) {
    case "daily":
      return formatDailyReport(data, today, projectLine);
    case "weekly":
      return formatWeeklyReport(data, today, projectLine);
    case "summary":
      return formatSummaryReport(data, today, projectLine);
    case "projection":
      return formatProjectionReport(data, today, projectLine);
    case "alert":
      return formatAlertReport(data, today, projectLine);
    case "executive":
      return formatExecutiveReport(data, today, projectLine);
    default:
      return formatSummaryReport(data, today, projectLine);
  }
}

function formatDailyReport(data: ReportData, today: string, projectLine: string): string {
  const remaining = Math.max(0, data.monthlyGoal - data.currentLeads);
  const statusEmoji = STATUS_EMOJI[data.projectionStatus];
  const statusLabel = STATUS_LABEL[data.projectionStatus];
  const appName = data.appName || "Launx Metrics";
  const sourcesLabel = getDataSourcesLabel(data.dataSources);
  
  let report = `${EMOJI.chart} *Relatório Diário - ${appName}*\n${formatPeriodLine(data, today)}\n\n${projectLine}`;
  
  if (sourcesLabel) {
    report += `${EMOJI.mobile} Fontes: ${sourcesLabel}\n\n`;
  }
  
  // Leads section
  report += `*${EMOJI.chartUp} Leads*\n`;
  report += `├ Acumulado: ${formatNumber(data.currentLeads)}/${formatNumber(data.monthlyGoal)} (${formatPercent(data.progressPercent)})\n`;
  report += `├ Projeção: ${formatNumber(data.projectedLeads)} leads\n`;
  if (data.leadsChange !== undefined && !isNaN(data.leadsChange)) {
    report += `├ Variação: ${formatChange(data.leadsChange)} vs período anterior\n`;
  }
  report += `└ Faltam: ${formatNumber(remaining)} leads`;

  // Investment section
  if (data.totalSpend !== undefined) {
    report += `\n\n*${EMOJI.money} Investimento*\n├ Total: ${formatCurrency(data.totalSpend)}`;
    
    if (data.averageCPL !== undefined && data.averageCPL > 0) {
      report += `\n├ CPL médio: ${formatCurrency(data.averageCPL)}`;
      if (data.cplChange !== undefined && !isNaN(data.cplChange)) {
        const cplIndicator = data.cplChange <= 0 ? " (melhorando)" : " (piorando)";
        report += `\n├ Variação CPL: ${formatChange(data.cplChange)}${cplIndicator}`;
      }
    }
    
    if (data.cpc !== undefined && data.cpc > 0) {
      report += `\n├ CPC: ${formatCurrency(data.cpc)}`;
    }
    
    if (data.cpm !== undefined && data.cpm > 0) {
      report += `\n└ CPM: ${formatCurrency(data.cpm)}`;
    }
  }

  // Media metrics section
  if (data.impressions !== undefined || data.reach !== undefined || data.clicks !== undefined) {
    report += `\n\n*${EMOJI.eye} Alcance & Engajamento*`;
    
    if (data.impressions !== undefined) {
      report += `\n├ Impressões: ${formatNumber(data.impressions)}`;
    }
    if (data.reach !== undefined) {
      report += `\n├ Alcance: ${formatNumber(data.reach)}`;
    }
    if (data.clicks !== undefined) {
      report += `\n├ Cliques: ${formatNumber(data.clicks)}`;
    }
    if (data.ctr !== undefined && data.ctr > 0) {
      report += `\n├ CTR: ${formatPercent(data.ctr)}`;
    }
    if (data.conversionRate !== undefined && data.conversionRate > 0) {
      report += `\n└ Conversão: ${formatPercent(data.conversionRate)} (cliques→leads)`;
    }
  }

  report += `\n\n*${EMOJI.chartUp} Status: ${statusEmoji} ${statusLabel}*`;

  return report;
}

function formatWeeklyReport(data: ReportData, today: string, projectLine: string): string {
  const remaining = Math.max(0, data.monthlyGoal - data.currentLeads);
  const statusEmoji = STATUS_EMOJI[data.projectionStatus];
  const statusLabel = STATUS_LABEL[data.projectionStatus];
  const appName = data.appName || "Launx Metrics";
  const sourcesLabel = getDataSourcesLabel(data.dataSources);
  
  let report = `${EMOJI.chart} *Resumo Semanal - ${appName}*\n${formatPeriodLine(data, today)}\n\n${projectLine}`;
  
  report += `*${EMOJI.target} Meta do Período: ${formatNumber(data.monthlyGoal)} leads*\n`;
  
  if (sourcesLabel) {
    report += `${EMOJI.mobile} Fontes: ${sourcesLabel}\n`;
  }
  
  // Progress section
  report += `\n*Progresso*\n`;
  report += `├ Leads atuais: ${formatNumber(data.currentLeads)}`;
  if (data.leadsChange !== undefined && !isNaN(data.leadsChange)) {
    report += ` (${formatChange(data.leadsChange)} vs semana anterior)`;
  }
  report += `\n├ Progresso: ${formatPercent(data.progressPercent)}`;
  report += `\n├ Faltam: ${formatNumber(remaining)} leads`;
  report += `\n└ Projeção: ${formatNumber(data.projectedLeads)} leads`;

  // Metrics section
  if (data.averageDailyRate !== undefined) {
    report += `\n\n*${EMOJI.chart} Métricas da Semana*`;
    report += `\n├ Média diária: ${data.averageDailyRate.toFixed(1)} leads`;
    
    if (data.activeCampaigns !== undefined && data.activeCampaigns > 0) {
      report += `\n├ Campanhas ativas: ${data.activeCampaigns}`;
    }
    
    if (data.daysRemaining !== undefined) {
      const needPerDay = remaining / Math.max(1, data.daysRemaining);
      report += `\n├ Dias restantes: ${data.daysRemaining}`;
      report += `\n└ Necessário/dia: ${needPerDay.toFixed(1)}`;
    }
  }

  // Investment section
  if (data.totalSpend !== undefined) {
    report += `\n\n*${EMOJI.money} Investimento*`;
    report += `\n├ Total: ${formatCurrency(data.totalSpend)}`;
    if (data.spendChange !== undefined && !isNaN(data.spendChange)) {
      report += ` (${formatChange(data.spendChange)} vs anterior)`;
    }
    
    if (data.averageCPL !== undefined && data.averageCPL > 0) {
      report += `\n├ CPL: ${formatCurrency(data.averageCPL)}`;
      if (data.cplChange !== undefined && !isNaN(data.cplChange)) {
        const indicator = data.cplChange <= 0 ? " (melhor)" : "";
        report += ` (${formatChange(data.cplChange)}${indicator})`;
      }
    }
    
    if (data.cpc !== undefined && data.cpc > 0) {
      report += `\n└ CPC: ${formatCurrency(data.cpc)}`;
    }
  }

  // Media performance section
  if (data.impressions !== undefined || data.clicks !== undefined) {
    report += `\n\n*${EMOJI.eye} Performance de Mídia*`;
    if (data.impressions !== undefined) {
      report += `\n├ Impressões: ${formatNumber(data.impressions)}`;
    }
    if (data.clicks !== undefined && data.ctr !== undefined) {
      report += `\n├ Cliques: ${formatNumber(data.clicks)} (CTR: ${formatPercent(data.ctr)})`;
    }
    if (data.conversionRate !== undefined && data.conversionRate > 0) {
      report += `\n└ Conversão: ${formatPercent(data.conversionRate)}`;
    }
  }

  report += `\n\n*Status: ${statusEmoji} ${statusLabel}*`;

  return report;
}

function formatSummaryReport(data: ReportData, today: string, projectLine: string): string {
  const statusEmoji = STATUS_EMOJI[data.projectionStatus];
  const statusLabel = STATUS_LABEL[data.projectionStatus];
  const appName = data.appName || "Launx Metrics";
  
  let report = `${EMOJI.chart} *Resumo - ${appName}*\n${formatPeriodLine(data, today)}\n\n${projectLine}`;
  
  report += `*Leads:* ${formatNumber(data.currentLeads)}/${formatNumber(data.monthlyGoal)} (${formatPercent(data.progressPercent)})\n`;
  report += `*Projeção:* ${formatNumber(data.projectedLeads)} leads`;

  if (data.totalSpend !== undefined) {
    report += `\n*Investimento:* ${formatCurrency(data.totalSpend)}`;
    
    if (data.averageCPL !== undefined && data.averageCPL > 0) {
      report += `\n*CPL:* ${formatCurrency(data.averageCPL)}`;
    }
  }
  
  // Add comparison info if available
  if (data.leadsChange !== undefined && !isNaN(data.leadsChange)) {
    report += `\n\n*Variação vs Período Anterior:*`;
    report += `\n├ Leads: ${formatChange(data.leadsChange)}`;
    if (data.spendChange !== undefined && !isNaN(data.spendChange)) {
      report += `\n├ Investimento: ${formatChange(data.spendChange)}`;
    }
    if (data.cplChange !== undefined && !isNaN(data.cplChange)) {
      report += `\n└ CPL: ${formatChange(data.cplChange)}`;
    }
  }

  report += `\n\n${statusEmoji} *${statusLabel}*`;

  return report;
}

function formatProjectionReport(data: ReportData, today: string, projectLine: string): string {
  const statusEmoji = STATUS_EMOJI[data.projectionStatus];
  const statusLabel = STATUS_LABEL[data.projectionStatus];
  const appName = data.appName || "Launx Metrics";
  
  // Determine goal label based on campaign period
  const isCustomPeriod = data.campaignPeriod && !data.campaignPeriod.useCurrentMonth;
  const goalLabel = isCustomPeriod ? "Meta do Período" : "Meta Mensal";
  
  let report = `${EMOJI.chartUp} *Projeção de Meta - ${appName}*\n${formatPeriodLine(data, today)}\n\n${projectLine}`;
  
  // Add period info if custom period
  if (isCustomPeriod && data.periodLabel) {
    report += `*${EMOJI.calendar} Período: ${data.periodLabel}*\n`;
  }
  
  report += `*${EMOJI.target} ${goalLabel}: ${formatNumber(data.monthlyGoal)} leads*\n`;
  
  const sourcesLabel = getDataSourcesLabel(data.dataSources);
  if (sourcesLabel) {
    report += `${EMOJI.mobile} Fontes: ${sourcesLabel}\n`;
  }

  // Scenarios section
  report += `\n*Cenários:*`;
  if (data.pessimisticTotal !== undefined) {
    const pessimisticPercent = (data.pessimisticTotal / data.monthlyGoal) * 100;
    report += `\n├ ${EMOJI.redCircle} Pessimista: ${formatNumber(data.pessimisticTotal)} leads (${formatPercent(pessimisticPercent)})`;
  }
  
  const projectedPercent = (data.projectedLeads / data.monthlyGoal) * 100;
  report += `\n├ ${EMOJI.yellowCircle} Realista: ${formatNumber(data.projectedLeads)} leads (${formatPercent(projectedPercent)})`;
  
  if (data.optimisticTotal !== undefined) {
    const optimisticPercent = (data.optimisticTotal / data.monthlyGoal) * 100;
    report += `\n└ ${EMOJI.greenCircle} Otimista: ${formatNumber(data.optimisticTotal)} leads (${formatPercent(optimisticPercent)})`;
  }

  // Current metrics section
  report += `\n\n*Métricas Atuais:*\n├ Leads hoje: ${formatNumber(data.currentLeads)}`;

  if (data.averageDailyRate !== undefined) {
    report += `\n├ Média diária: ${data.averageDailyRate.toFixed(1)}`;
  }
  
  if (data.daysRemaining !== undefined && data.totalDays !== undefined) {
    const remaining = Math.max(0, data.monthlyGoal - data.currentLeads);
    const needPerDay = remaining / Math.max(1, data.daysRemaining);
    report += `\n├ Dias restantes: ${data.daysRemaining} (de ${data.totalDays} no período)\n└ Necessário/dia: ${needPerDay.toFixed(1)}`;
  } else if (data.daysRemaining !== undefined) {
    const remaining = Math.max(0, data.monthlyGoal - data.currentLeads);
    const needPerDay = remaining / Math.max(1, data.daysRemaining);
    report += `\n├ Dias restantes: ${data.daysRemaining}\n└ Necessário/dia: ${needPerDay.toFixed(1)}`;
  }
  
  // Investment summary
  if (data.totalSpend !== undefined && data.averageCPL !== undefined) {
    report += `\n\n*${EMOJI.money} Investimento:* ${formatCurrency(data.totalSpend)} | CPL: ${formatCurrency(data.averageCPL)}`;
  }

  report += `\n\n*Status: ${statusEmoji} ${statusLabel}*`;

  return report;
}

function formatExecutiveReport(data: ReportData, today: string, projectLine: string): string {
  const statusEmoji = STATUS_EMOJI[data.projectionStatus];
  const statusLabel = STATUS_LABEL[data.projectionStatus];
  const appName = data.appName || "Launx Metrics";
  const sourcesLabel = getDataSourcesLabel(data.dataSources);
  
  let report = `${EMOJI.briefcase} *Relatório Executivo - ${appName}*\n${EMOJI.calendar}`;
  
  // Date range if available
  if (data.dateFrom && data.dateTo) {
    report += ` ${data.dateFrom} a ${data.dateTo}`;
  } else {
    report += ` ${today}`;
  }
  
  report += `\n\n${projectLine}`;
  
  if (sourcesLabel) {
    report += `${EMOJI.mobile} Fontes: ${sourcesLabel}\n\n`;
  }
  
  // Summary section
  report += `*${EMOJI.rocket} Resumo*\n`;
  report += `├ ${formatNumber(data.currentLeads)} leads captados\n`;
  if (data.totalSpend !== undefined) {
    report += `├ ${formatCurrency(data.totalSpend)} investidos\n`;
  }
  if (data.averageCPL !== undefined && data.averageCPL > 0) {
    report += `├ CPL de ${formatCurrency(data.averageCPL)}\n`;
  }
  report += `└ ${formatPercent(data.progressPercent)} da meta atingida`;
  
  // Comparison section if available
  if (data.leadsChange !== undefined && !isNaN(data.leadsChange)) {
    report += `\n\n*${EMOJI.chartUp} Performance vs Período Anterior*`;
    report += `\n├ Leads: ${formatChange(data.leadsChange)}`;
    if (data.spendChange !== undefined && !isNaN(data.spendChange)) {
      report += `\n├ Investimento: ${formatChange(data.spendChange)}`;
    }
    if (data.cplChange !== undefined && !isNaN(data.cplChange)) {
      const cplIndicator = data.cplChange <= 0 ? " (melhor)" : " (pior)";
      report += `\n├ CPL: ${formatChange(data.cplChange)}${cplIndicator}`;
    }
    if (data.ctr !== undefined && data.clicks !== undefined) {
      report += `\n└ CTR: ${formatPercent(data.ctr)}`;
    }
  }
  
  // Efficiency section
  if (data.clicks !== undefined && data.impressions !== undefined) {
    report += `\n\n*${EMOJI.fire} Eficiência*`;
    if (data.conversionRate !== undefined && data.conversionRate > 0) {
      report += `\n├ ${formatNumber(data.clicks)} cliques → ${formatNumber(data.currentLeads)} leads (${formatPercent(data.conversionRate)})`;
    }
    if (data.cpm !== undefined && data.cpm > 0) {
      report += `\n├ ${formatNumber(data.impressions)} impressões (CPM: ${formatCurrency(data.cpm)})`;
    }
    if (data.activeCampaigns !== undefined && data.activeCampaigns > 0) {
      report += `\n└ ${data.activeCampaigns} campanhas ativas`;
    }
  }
  
  // Projection section
  report += `\n\n*${EMOJI.target} Projeção Final*`;
  if (data.pessimisticTotal !== undefined) {
    const pessimisticPercent = (data.pessimisticTotal / data.monthlyGoal) * 100;
    report += `\n├ Pessimista: ${formatNumber(data.pessimisticTotal)} leads (${formatPercent(pessimisticPercent)})`;
  }
  const projectedPercent = (data.projectedLeads / data.monthlyGoal) * 100;
  report += `\n├ Realista: ${formatNumber(data.projectedLeads)} leads (${formatPercent(projectedPercent)})`;
  if (data.optimisticTotal !== undefined) {
    const optimisticPercent = (data.optimisticTotal / data.monthlyGoal) * 100;
    report += `\n└ Otimista: ${formatNumber(data.optimisticTotal)} leads (${formatPercent(optimisticPercent)})`;
  }
  
  report += `\n\n${EMOJI.chartUp} *Status: ${statusEmoji} ${statusLabel}*`;

  return report;
}

function formatAlertReport(data: ReportData, today: string, projectLine: string): string {
  const remaining = Math.max(0, data.monthlyGoal - data.currentLeads);
  
  let report = `${EMOJI.alert} *Alerta - Meta em Risco*\n${formatPeriodLine(data, today)}\n\n${projectLine}O projeto está com projeção abaixo da meta!\n\n${EMOJI.chart} *Progresso:* ${formatPercent(data.progressPercent)}\n${EMOJI.chartDown} *Projeção:* ${formatNumber(data.projectedLeads)}/${formatNumber(data.monthlyGoal)} leads`;

  if (data.daysRemaining !== undefined) {
    report += `\n${EMOJI.clock} *Restam:* ${data.daysRemaining} dias`;
  }

  if (data.averageDailyRate !== undefined && data.daysRemaining !== undefined) {
    const needPerDay = remaining / Math.max(1, data.daysRemaining);
    report += `\n\n*Para atingir a meta:*\n├ Atual: ${data.averageDailyRate.toFixed(1)} leads/dia\n└ Necessário: ${needPerDay.toFixed(1)} leads/dia`;
  }

  report += `\n\n${EMOJI.warning} Acesse o dashboard para mais detalhes.`;

  return report;
}

export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  
  // Ensure Brazilian format if number starts with 0
  const formattedNumber = cleanNumber.startsWith("0") 
    ? "55" + cleanNumber.slice(1) 
    : cleanNumber.startsWith("55") 
      ? cleanNumber 
      : "55" + cleanNumber;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}

export function saveRecentNumber(number: string): void {
  try {
    const stored = localStorage.getItem("whatsapp_recent_numbers");
    const numbers: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists and add to front
    const filtered = numbers.filter(n => n !== number);
    filtered.unshift(number);
    
    // Keep only last 5
    const trimmed = filtered.slice(0, 5);
    localStorage.setItem("whatsapp_recent_numbers", JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

export function getRecentNumbers(): string[] {
  try {
    const stored = localStorage.getItem("whatsapp_recent_numbers");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
