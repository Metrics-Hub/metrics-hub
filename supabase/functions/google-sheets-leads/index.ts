import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates user JWT or service role key (server-to-server)
async function authenticateRequest(req: Request): Promise<{ userId: string; isServiceRole: boolean; error?: never } | { userId?: never; isServiceRole?: never; error: Response }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    return {
      error: new Response(
        JSON.stringify({ error: 'Authorization required. Please log in to access this data.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Extract token from header
  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Check if this is a service role call (server-to-server from sync-data)
  if (serviceRoleKey && token === serviceRoleKey) {
    console.log('Service role authentication - server-to-server call');
    return { userId: 'service-role', isServiceRole: true };
  }

  // Otherwise, validate as user JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication failed:', error?.message);
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired session. Please log in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  console.log('Authenticated user:', user.email);
  return { userId: user.id, isServiceRole: false };
}

// Lead Scoring Configuration interface (question-based)
interface QuestionWeight {
  weight: number;
  label: string;
  description: string;
}

interface LeadScoringConfig {
  questions: {
    creditLimit: QuestionWeight;
    income: QuestionWeight;
    experience: QuestionWeight;
    followTime: QuestionWeight;
    socialNetwork: QuestionWeight;
    age: QuestionWeight;
    profession: QuestionWeight;
    objection: QuestionWeight;
    region: QuestionWeight;
    maritalStatus: QuestionWeight;
    gender: QuestionWeight;
  };
  thresholds: {
    hot: number;
    warm: number;
    lukewarm: number;
    cold: number;
  };
}

const DEFAULT_SCORING_CONFIG: LeadScoringConfig = {
  questions: {
    creditLimit: { weight: 20, label: "Limite de Crédito", description: "" },
    income: { weight: 15, label: "Renda Mensal", description: "" },
    experience: { weight: 15, label: "Experiência com Leilões", description: "" },
    followTime: { weight: 10, label: "Tempo de Acompanhamento", description: "" },
    socialNetwork: { weight: 5, label: "Rede Social Principal", description: "" },
    age: { weight: 10, label: "Idade", description: "" },
    profession: { weight: 10, label: "Profissão", description: "" },
    objection: { weight: 10, label: "Objeção", description: "" },
    region: { weight: 3, label: "Região", description: "" },
    maritalStatus: { weight: 2, label: "Estado Civil", description: "" },
    gender: { weight: 0, label: "Gênero", description: "" },
  },
  thresholds: {
    hot: 80,
    warm: 60,
    lukewarm: 40,
    cold: 0,
  },
};

// Default CSV URL from public Google Sheet (for backward compatibility)
const DEFAULT_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUSIHV3_Xi1XMce7kQSGpdpUJFkq34iJYymVBYsiPZwtV_xv5B8tr7asdMb6bV5fuyCrAViBS5Y0DV/pub?gid=495067603&single=true&output=csv";

async function getCsvUrl(integrationId?: string): Promise<string> {
  if (!integrationId) {
    return DEFAULT_CSV_URL;
  }

  // Fetch from database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('google_sheets_integrations')
    .select('csv_url')
    .eq('id', integrationId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching integration:', error);
    throw new Error('Failed to fetch integration configuration');
  }

  if (!data) {
    throw new Error('Integration not found or inactive');
  }

  return data.csv_url;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  tag: string;
  utmCampaign: string;
  utmSource: string;
  utmMedium: string;
  utmContent: string;
  createdAt: string;
  gender: string;
  age: string;
  income: string;
  maritalStatus: string;
  profession: string;
  region: string;
  experience: string;
  objection: string;
  followTime: string;
  socialNetwork: string;
  creditLimit: string;
  leadScoring: string;
}

interface Distribution {
  name: string;
  value: number;
  color?: string;
}

// Column mapping from spreadsheet headers
const columnMapping: Record<string, string> = {
  "Nome": "name",
  "Email": "email",
  "Telefone Completo": "phone",
  "Tag": "tag",
  "utm_campaign": "utmCampaign",
  "utm_source": "utmSource",
  "utm_medium": "utmMedium",
  "utm_content": "utmContent",
  "Data de cadastro": "createdAt",
  "Qual seu gênero?": "gender",
  "Qual a sua idade?": "age",
  "Qual a sua renda mensal?": "income",
  "Qual o seu estado civil?": "maritalStatus",
  "Qual a sua profissão atual?": "profession",
  "Em que região você mora?": "region",
  "Você já investe em leilões de imóveis?": "experience",
  "Qual a sua maior objeção com leilão de imóvel?": "objection",
  "Há quanto tempo você me conhece?": "followTime",
  "Em qual rede social você mais me acompanha?": "socialNetwork",
  "Quanto você tem hoje de limite disponível no cartão de crédito?": "creditLimit",
  "Lead Scoring": "leadScoring",
};

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  console.log(`Found ${headers.length} columns in CSV`);

  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const fieldName = columnMapping[header.trim()] || header.trim();
      row[fieldName] = values[index]?.trim() || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try different date formats
  // Format: "DD/MM/YYYY HH:MM" or "DD/MM/YYYY"
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  // Try ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  return null;
}

function groupBy(items: Record<string, string>[], field: string): Distribution[] {
  const groups: Record<string, number> = {};
  
  items.forEach(item => {
    const value = item[field] || 'Não informado';
    if (value && value.trim()) {
      groups[value] = (groups[value] || 0) + 1;
    }
  });
  
  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Calculate individual question scores (0-100 for each question)
function calculateQuestionScores(lead: Record<string, string>): Record<string, number> {
  const scores: Record<string, number> = {
    creditLimit: 0,
    income: 0,
    experience: 0,
    followTime: 0,
    socialNetwork: 0,
    age: 0,
    profession: 0,
    objection: 0,
    region: 0,
    maritalStatus: 0,
    gender: 0,
  };

  // Credit Limit (0-100)
  const creditLimit = (lead.creditLimit || '').toLowerCase();
  if (creditLimit.includes('50.000') || creditLimit.includes('50000') || creditLimit.includes('acima de r$ 50') || creditLimit.includes('acima de 50')) {
    scores.creditLimit = 100;
  } else if (creditLimit.includes('30.000') || creditLimit.includes('30000') || creditLimit.includes('r$ 30.000') || creditLimit.includes('30 mil')) {
    scores.creditLimit = 80;
  } else if (creditLimit.includes('10.000') || creditLimit.includes('10000') || creditLimit.includes('r$ 10.000') || creditLimit.includes('10 mil')) {
    scores.creditLimit = 60;
  } else if (creditLimit.includes('5.000') || creditLimit.includes('5000') || creditLimit.includes('r$ 5.000') || creditLimit.includes('5 mil')) {
    scores.creditLimit = 40;
  } else if (creditLimit.length > 0) {
    scores.creditLimit = 20;
  }

  // Income (0-100)
  const income = (lead.income || '').toLowerCase();
  if (income.includes('acima de r$ 20') || income.includes('20.000') || income.includes('20000') || income.includes('acima de 20')) {
    scores.income = 100;
  } else if (income.includes('r$ 10.000') || income.includes('10.000') || income.includes('10000') || income.includes('10 mil')) {
    scores.income = 80;
  } else if (income.includes('r$ 5.000') || income.includes('5.000') || income.includes('5000') || income.includes('5 mil')) {
    scores.income = 60;
  } else if (income.includes('r$ 3.000') || income.includes('3.000') || income.includes('3000') || income.includes('3 mil')) {
    scores.income = 40;
  } else if (income.includes('até r$ 3') || income.includes('até 3') || income.length > 0) {
    scores.income = 20;
  }

  // Experience (0-100)
  const experience = (lead.experience || '').toLowerCase();
  if (experience.includes('sim, já invisto') || experience.includes('sim, invisto') || experience.includes('já invisto')) {
    scores.experience = 100;
  } else if (experience.includes('sim, já comprei') || experience.includes('já comprei')) {
    scores.experience = 80;
  } else if (experience.includes('não, mas estou estudando') || experience.includes('estudando')) {
    scores.experience = 55;
  } else if (experience.includes('não, nunca') || experience.includes('nunca')) {
    scores.experience = 20;
  }

  // Follow Time (0-100)
  const followTime = (lead.followTime || '').toLowerCase();
  if (followTime.includes('2 anos') || followTime.includes('mais de 2') || followTime.includes('> 2')) {
    scores.followTime = 100;
  } else if (followTime.includes('1 ano') || followTime.includes('1-2 anos') || followTime.includes('1 a 2')) {
    scores.followTime = 80;
  } else if (followTime.includes('6 meses') || followTime.includes('6 meses - 1 ano') || followTime.includes('6 meses a 1')) {
    scores.followTime = 60;
  } else if (followTime.includes('3 meses') || followTime.includes('3-6 meses') || followTime.includes('3 a 6')) {
    scores.followTime = 40;
  } else if (followTime.includes('menos de 3') || followTime.includes('< 3') || followTime.length > 0) {
    scores.followTime = 20;
  }

  // Social Network (0-100)
  const socialNetwork = (lead.socialNetwork || '').toLowerCase();
  if (socialNetwork.includes('youtube')) {
    scores.socialNetwork = 100;
  } else if (socialNetwork.includes('instagram')) {
    scores.socialNetwork = 75;
  } else if (socialNetwork.includes('telegram')) {
    scores.socialNetwork = 75;
  } else if (socialNetwork.includes('tiktok')) {
    scores.socialNetwork = 60;
  } else if (socialNetwork.includes('facebook')) {
    scores.socialNetwork = 40;
  } else if (socialNetwork.length > 0) {
    scores.socialNetwork = 20;
  }

  // Age (0-100)
  const age = (lead.age || '').toLowerCase();
  if (age.includes('35') || age.includes('36') || age.includes('37') || age.includes('38') || age.includes('39') || 
      age.includes('40') || age.includes('41') || age.includes('42') || age.includes('43') || age.includes('44') ||
      age.includes('35 a 44') || age.includes('35-44')) {
    scores.age = 100;
  } else if (age.includes('45') || age.includes('46') || age.includes('47') || age.includes('48') || age.includes('49') ||
             age.includes('50') || age.includes('51') || age.includes('52') || age.includes('53') || age.includes('54') ||
             age.includes('45 a 54') || age.includes('45-54')) {
    scores.age = 90;
  } else if (age.includes('25') || age.includes('26') || age.includes('27') || age.includes('28') || age.includes('29') ||
             age.includes('30') || age.includes('31') || age.includes('32') || age.includes('33') || age.includes('34') ||
             age.includes('25 a 34') || age.includes('25-34')) {
    scores.age = 80;
  } else if (age.includes('55') || age.includes('56') || age.includes('57') || age.includes('58') || age.includes('59') ||
             age.includes('60') || age.includes('61') || age.includes('62') || age.includes('63') || age.includes('64') ||
             age.includes('55 a 64') || age.includes('55-64')) {
    scores.age = 70;
  } else if (age.includes('65') || age.includes('acima de 65') || age.includes('mais de 65')) {
    scores.age = 50;
  } else if (age.includes('18') || age.includes('19') || age.includes('20') || age.includes('21') || age.includes('22') ||
             age.includes('23') || age.includes('24') || age.includes('18 a 24') || age.includes('18-24')) {
    scores.age = 40;
  } else if (age.length > 0) {
    scores.age = 30;
  }

  // Profession (0-100)
  const profession = (lead.profession || '').toLowerCase();
  if (profession.includes('empresário') || profession.includes('empresario') || profession.includes('autônomo') || 
      profession.includes('autonomo') || profession.includes('empreendedor') || profession.includes('investidor')) {
    scores.profession = 100;
  } else if (profession.includes('funcionário público') || profession.includes('funcionario publico') || 
             profession.includes('servidor') || profession.includes('concursado')) {
    scores.profession = 90;
  } else if (profession.includes('profissional liberal') || profession.includes('médico') || profession.includes('advogado') ||
             profession.includes('engenheiro') || profession.includes('arquiteto') || profession.includes('dentista')) {
    scores.profession = 90;
  } else if (profession.includes('clt') || profession.includes('assalariado') || profession.includes('empregado')) {
    scores.profession = 70;
  } else if (profession.includes('aposentado') || profession.includes('pensionista')) {
    scores.profession = 60;
  } else if (profession.includes('estudante')) {
    scores.profession = 40;
  } else if (profession.includes('desempregado') || profession.includes('sem trabalho')) {
    scores.profession = 20;
  } else if (profession.length > 0) {
    scores.profession = 50;
  }

  // Objection (0-100 - inverted: no objection = higher score)
  const objection = (lead.objection || '').toLowerCase();
  if (objection.includes('nenhuma') || objection.includes('não tenho') || objection === '' || objection.includes('sem objeção')) {
    scores.objection = 100;
  } else if (objection.includes('tempo') || objection.includes('conhecimento') || objection.includes('não sei') || 
             objection.includes('não entendo') || objection.includes('aprender')) {
    scores.objection = 70;
  } else if (objection.includes('capital') || objection.includes('dinheiro') || objection.includes('grana') || 
             objection.includes('recurso') || objection.includes('financeiro')) {
    scores.objection = 50;
  } else if (objection.includes('medo') || objection.includes('receio') || objection.includes('insegurança')) {
    scores.objection = 40;
  } else if (objection.includes('desconfiança') || objection.includes('golpe') || objection.includes('não confio') || 
             objection.includes('fraude') || objection.includes('piramide')) {
    scores.objection = 20;
  } else if (objection.length > 0) {
    scores.objection = 50;
  }

  // Region (0-100)
  const region = (lead.region || '').toLowerCase();
  if (region.includes('são paulo') || region.includes('sao paulo') || region.includes('sp') ||
      region.includes('rio de janeiro') || region.includes('rj')) {
    scores.region = 100;
  } else if (region.includes('sul') || region.includes('paraná') || region.includes('parana') || 
             region.includes('santa catarina') || region.includes('rio grande do sul') ||
             region.includes('centro-oeste') || region.includes('goiás') || region.includes('goias') ||
             region.includes('distrito federal') || region.includes('brasília') || region.includes('brasilia') ||
             region.includes('minas gerais') || region.includes('mg')) {
    scores.region = 65;
  } else if (region.length > 0) {
    scores.region = 35;
  }

  // Marital Status (0-100)
  const maritalStatus = (lead.maritalStatus || '').toLowerCase();
  if (maritalStatus.includes('casado') || maritalStatus.includes('união estável') || maritalStatus.includes('uniao estavel') ||
      maritalStatus.includes('união') || maritalStatus.includes('uniao')) {
    scores.maritalStatus = 100;
  } else if (maritalStatus.includes('divorciado') || maritalStatus.includes('separado') || maritalStatus.includes('viúvo') || 
             maritalStatus.includes('viuvo')) {
    scores.maritalStatus = 100;
  } else if (maritalStatus.includes('solteiro')) {
    scores.maritalStatus = 50;
  } else if (maritalStatus.length > 0) {
    scores.maritalStatus = 50;
  }

  // Gender (0-100) - neutral scoring, usually weight = 0
  const gender = (lead.gender || '').toLowerCase();
  if (gender.length > 0) {
    scores.gender = 50; // Neutral score - doesn't affect if weight is 0
  }

  return scores;
}

// Lead Scoring calculation using dynamic question weights from config
function calculateLeadScore(lead: Record<string, string>, config: LeadScoringConfig): { score: number; category: string } {
  const questionScores = calculateQuestionScores(lead);
  
  // Apply weights from config for each question
  let weightedScore = 0;
  const questions = config.questions;
  
  weightedScore += (questionScores.creditLimit * questions.creditLimit.weight / 100);
  weightedScore += (questionScores.income * questions.income.weight / 100);
  weightedScore += (questionScores.experience * questions.experience.weight / 100);
  weightedScore += (questionScores.followTime * questions.followTime.weight / 100);
  weightedScore += (questionScores.socialNetwork * questions.socialNetwork.weight / 100);
  weightedScore += (questionScores.age * questions.age.weight / 100);
  weightedScore += (questionScores.profession * questions.profession.weight / 100);
  weightedScore += (questionScores.objection * questions.objection.weight / 100);
  weightedScore += (questionScores.region * questions.region.weight / 100);
  weightedScore += (questionScores.maritalStatus * questions.maritalStatus.weight / 100);
  weightedScore += (questionScores.gender * questions.gender.weight / 100);
  
  const score = Math.round(weightedScore);
  
  // Determine category based on configurable thresholds
  let category: string;
  if (score >= config.thresholds.hot) {
    category = 'A - Hot Lead';
  } else if (score >= config.thresholds.warm) {
    category = 'B - Warm';
  } else if (score >= config.thresholds.lukewarm) {
    category = 'C - Lukewarm';
  } else {
    category = 'D - Cold';
  }
  
  return { score, category };
}

function getTimeline(items: Record<string, string>[]): { date: string; leads: number }[] {
  const groups: Record<string, number> = {};
  
  items.forEach(item => {
    const date = parseDate(item.createdAt);
    if (date) {
      const dateKey = date.toISOString().split('T')[0];
      groups[dateKey] = (groups[dateKey] || 0) + 1;
    }
  });
  
  return Object.entries(groups)
    .map(([date, leads]) => ({ date, leads }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function filterByDateRange(
  items: Record<string, string>[],
  dateFrom: string | null,
  dateTo: string | null
): Record<string, string>[] {
  if (!dateFrom && !dateTo) return items;
  
  const from = dateFrom ? new Date(dateFrom) : null;
  const to = dateTo ? new Date(dateTo) : null;
  
  // Set to end of day for 'to' date
  if (to) {
    to.setHours(23, 59, 59, 999);
  }
  
  return items.filter(item => {
    const itemDate = parseDate(item.createdAt);
    if (!itemDate) return false;
    
    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;
    
    return true;
  });
}

// Fetch scoring config from database
async function getScoringConfig(): Promise<LeadScoringConfig> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "lead_scoring_config")
      .maybeSingle();
    
    if (error) {
      console.log("Error fetching scoring config, using default:", error.message);
      return DEFAULT_SCORING_CONFIG;
    }
    
    if (data?.value && typeof data.value === 'object') {
      const config = data.value as LeadScoringConfig;
      // Check for new question-based structure
      if (config.questions && config.thresholds) {
        console.log("Using custom scoring config from database");
        return config;
      }
    }
    
    console.log("No custom scoring config found, using default");
    return DEFAULT_SCORING_CONFIG;
  } catch (err) {
    console.error("Error fetching scoring config:", err);
    return DEFAULT_SCORING_CONFIG;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request - user must be logged in
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return authResult.error;
    }
    console.log('Request authenticated for user:', authResult.userId);

    const { dateFrom, dateTo, integrationId } = await req.json().catch(() => ({}));
    
    console.log(`Fetching leads from Google Sheets, dateFrom: ${dateFrom}, dateTo: ${dateTo}, integrationId: ${integrationId || 'default'}`);
    
    // Fetch scoring config from database
    const scoringConfig = await getScoringConfig();
    console.log(`Using scoring config with thresholds: hot=${scoringConfig.thresholds.hot}, warm=${scoringConfig.thresholds.warm}`);
    
    // Get CSV URL (from database if integrationId provided, otherwise use default)
    const csvUrl = await getCsvUrl(integrationId);
    console.log(`Using CSV URL: ${csvUrl.substring(0, 50)}...`);
    
    // Fetch CSV from Google Sheets URL
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log(`Received CSV with ${csvText.length} characters`);
    
    // Parse CSV
    const allLeads = parseCSV(csvText);
    console.log(`Parsed ${allLeads.length} leads from CSV`);
    
    // Filter by date range
    const filteredLeads = filterByDateRange(allLeads, dateFrom, dateTo);
    console.log(`Filtered to ${filteredLeads.length} leads in date range`);
    
    // Calculate KPIs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const leadsToday = filteredLeads.filter(lead => {
      const leadDate = parseDate(lead.createdAt);
      return leadDate && leadDate >= today;
    }).length;
    
    const leadsThisWeek = filteredLeads.filter(lead => {
      const leadDate = parseDate(lead.createdAt);
      return leadDate && leadDate >= weekAgo;
    }).length;
    
    // Source breakdown
    const organicLeads = filteredLeads.filter(lead => 
      !lead.utmSource || lead.utmSource === '' || lead.utmSource.toLowerCase() === 'organic'
    ).length;
    
    const paidLeads = filteredLeads.filter(lead => 
      lead.utmSource && lead.utmSource !== '' && lead.utmSource.toLowerCase() !== 'organic'
    ).length;
    
    // Survey rate
    const leadsWithSurvey = filteredLeads.filter(lead => lead.gender && lead.gender.trim() !== '').length;
    const surveyRate = filteredLeads.length > 0 ? (leadsWithSurvey / filteredLeads.length * 100) : 0;
    
    // Top source
    const sourceGroups = groupBy(filteredLeads, 'utmSource');
    const topSource = sourceGroups.length > 0 ? sourceGroups[0].name : 'N/A';
    
    // Calculate lead scores for leads with survey (gender field filled)
    const leadsWithSurveyData = filteredLeads.filter(lead => lead.gender && lead.gender.trim() !== '');
    console.log(`Leads with survey: ${leadsWithSurveyData.length} of ${filteredLeads.length}`);
    
    const scoredLeads = leadsWithSurveyData.map(lead => {
    const { score, category } = calculateLeadScore(lead, scoringConfig);
      return { ...lead, calculatedScore: score, scoreCategory: category } as Record<string, string> & { calculatedScore: number; scoreCategory: string };
    });
    
    // Score distribution
    const scoreDistribution = [
      { name: 'A - Alto', value: scoredLeads.filter(l => l.scoreCategory === 'A - Hot Lead').length, color: 'hsl(var(--success))' },
      { name: 'B - Médio', value: scoredLeads.filter(l => l.scoreCategory === 'B - Warm').length, color: 'hsl(var(--chart-2))' },
      { name: 'C - Baixo', value: scoredLeads.filter(l => l.scoreCategory === 'C - Lukewarm').length, color: 'hsl(var(--chart-3))' },
      { name: 'D - Desqualificado', value: scoredLeads.filter(l => l.scoreCategory === 'D - Cold').length, color: 'hsl(var(--destructive))' },
    ];
    
    // Average score
    const averageScore = scoredLeads.length > 0 
      ? Math.round(scoredLeads.reduce((sum, l) => sum + l.calculatedScore, 0) / scoredLeads.length)
      : 0;
    
    // Hot leads percentage
    const hotLeadsCount = scoredLeads.filter(l => l.scoreCategory === 'A - Hot Lead').length;
    const hotLeadsPercentage = scoredLeads.length > 0 
      ? Math.round(hotLeadsCount / scoredLeads.length * 100)
      : 0;
    
    // Score by UTM Medium (ad set)
    const scoreByMedium: Record<string, { total: number; scores: Record<string, number> }> = {};
    scoredLeads.forEach(lead => {
      const medium = lead.utmMedium || 'Direto';
      if (!scoreByMedium[medium]) {
        scoreByMedium[medium] = { total: 0, scores: { 'A': 0, 'B': 0, 'C': 0, 'D': 0 } };
      }
      scoreByMedium[medium].total++;
      if (lead.scoreCategory === 'A - Hot Lead') scoreByMedium[medium].scores['A']++;
      else if (lead.scoreCategory === 'B - Warm') scoreByMedium[medium].scores['B']++;
      else if (lead.scoreCategory === 'C - Lukewarm') scoreByMedium[medium].scores['C']++;
      else scoreByMedium[medium].scores['D']++;
    });
    
    const scoreByMediumData = Object.entries(scoreByMedium).map(([name, data]) => ({
      name,
      total: data.total,
      alto: data.scores['A'],
      medio: data.scores['B'],
      baixo: data.scores['C'],
      desqualificado: data.scores['D'],
    })).sort((a, b) => b.total - a.total);
    
    // Score by UTM Content (creative)
    const scoreByContent: Record<string, { total: number; scores: Record<string, number> }> = {};
    scoredLeads.forEach(lead => {
      const content = lead.utmContent || 'Direto';
      if (!scoreByContent[content]) {
        scoreByContent[content] = { total: 0, scores: { 'A': 0, 'B': 0, 'C': 0, 'D': 0 } };
      }
      scoreByContent[content].total++;
      if (lead.scoreCategory === 'A - Hot Lead') scoreByContent[content].scores['A']++;
      else if (lead.scoreCategory === 'B - Warm') scoreByContent[content].scores['B']++;
      else if (lead.scoreCategory === 'C - Lukewarm') scoreByContent[content].scores['C']++;
      else scoreByContent[content].scores['D']++;
    });
    
    const scoreByContentData = Object.entries(scoreByContent).map(([name, data]) => ({
      name,
      total: data.total,
      alto: data.scores['A'],
      medio: data.scores['B'],
      baixo: data.scores['C'],
      desqualificado: data.scores['D'],
    })).sort((a, b) => b.total - a.total);
    
    // Build distributions (only for leads with survey)
    const distributions = {
      gender: groupBy(leadsWithSurveyData, 'gender'),
      age: groupBy(leadsWithSurveyData, 'age'),
      income: groupBy(leadsWithSurveyData, 'income'),
      maritalStatus: groupBy(leadsWithSurveyData, 'maritalStatus'),
      profession: groupBy(leadsWithSurveyData, 'profession'),
      region: groupBy(leadsWithSurveyData, 'region'),
      experience: groupBy(leadsWithSurveyData, 'experience'),
      objection: groupBy(leadsWithSurveyData, 'objection'),
      followTime: groupBy(leadsWithSurveyData, 'followTime'),
      socialNetwork: groupBy(leadsWithSurveyData, 'socialNetwork'),
      creditLimit: groupBy(leadsWithSurveyData, 'creditLimit'),
      utmSource: groupBy(filteredLeads, 'utmSource'), // All leads for UTM
      utmMedium: groupBy(filteredLeads, 'utmMedium'),
      utmContent: groupBy(filteredLeads, 'utmContent'),
      utmCampaign: groupBy(filteredLeads, 'utmCampaign'),
      scoreDistribution,
    };
    
    // Timeline
    const timeline = getTimeline(filteredLeads);
    
    // Prepare response data
    const responseData = {
      kpis: {
        totalLeads: filteredLeads.length,
        leadsToday,
        leadsThisWeek,
        organicLeads,
        paidLeads,
        surveyRate: Math.round(surveyRate * 10) / 10,
        leadsWithSurvey,
        topSource,
        averageScore,
        hotLeadsPercentage,
        hotLeadsCount,
      },
      distributions,
      timeline,
      scoreByMedium: scoreByMediumData,
      scoreByContent: scoreByContentData,
      leads: filteredLeads.map((lead, index) => ({
        id: index + 1,
        ...lead,
        calculatedScore: scoredLeads.find(sl => sl.email === lead.email)?.calculatedScore,
        scoreCategory: scoredLeads.find(sl => sl.email === lead.email)?.scoreCategory,
      })),
    };
    
    console.log(`Returning data: ${filteredLeads.length} leads, ${timeline.length} timeline points`);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});