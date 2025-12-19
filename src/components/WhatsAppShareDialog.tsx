import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Copy, ExternalLink, Clock } from "lucide-react";
import { 
  formatWhatsAppReport, 
  generateWhatsAppLink, 
  saveRecentNumber, 
  getRecentNumbers,
  type ReportType, 
  type ReportData,
  type CampaignPeriod 
} from "@/lib/whatsapp-report-formatter";

interface WhatsAppShareDialogProps {
  // White-label
  appName?: string;
  
  // Report data
  currentLeads: number;
  monthlyGoal: number;
  progressPercent: number;
  projectedLeads: number;
  projectionStatus: "success" | "warning" | "danger";
  
  // Optional data
  projectName?: string;
  totalSpend?: number;
  averageCPL?: number;
  averageDailyRate?: number;
  daysRemaining?: number;
  daysElapsed?: number;
  totalDays?: number;
  pessimisticTotal?: number;
  optimisticTotal?: number;
  
  // Campaign period info
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
  conversionRate?: number;
  
  // Report period
  dateFrom?: string;
  dateTo?: string;
  
  // Default report type
  defaultReportType?: ReportType;
  
  // Trigger customization
  trigger?: React.ReactNode;
  
  children?: React.ReactNode;
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: "summary", label: "Resumo Rápido", description: "Visão geral compacta" },
  { value: "daily", label: "Relatório Diário", description: "Progresso detalhado do dia" },
  { value: "weekly", label: "Resumo Semanal", description: "Performance da semana" },
  { value: "projection", label: "Projeção de Meta", description: "Cenários e projeções" },
  { value: "executive", label: "Relatório Executivo", description: "Resumo gerencial completo" },
  { value: "alert", label: "Alerta de Performance", description: "Aviso sobre meta em risco" },
];

export function WhatsAppShareDialog({
  appName,
  currentLeads,
  monthlyGoal,
  progressPercent,
  projectedLeads,
  projectionStatus,
  projectName,
  totalSpend,
  averageCPL,
  averageDailyRate,
  daysRemaining,
  daysElapsed,
  totalDays,
  pessimisticTotal,
  optimisticTotal,
  campaignPeriod,
  periodLabel,
  impressions,
  reach,
  clicks,
  ctr,
  cpc,
  cpm,
  sales,
  cps,
  leadsChange,
  spendChange,
  cplChange,
  activeCampaigns,
  dataSources,
  conversionRate,
  dateFrom,
  dateTo,
  defaultReportType = "summary",
  trigger,
  children,
}: WhatsAppShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);

  // Load recent numbers on mount
  useEffect(() => {
    setRecentNumbers(getRecentNumbers());
  }, []);

  // Build report data
  const reportData: ReportData = useMemo(() => ({
    appName,
    projectName,
    currentLeads,
    monthlyGoal,
    progressPercent,
    projectedLeads,
    projectionStatus,
    totalSpend,
    averageCPL,
    averageDailyRate,
    daysRemaining,
    daysElapsed,
    totalDays,
    pessimisticTotal,
    optimisticTotal,
    campaignPeriod,
    periodLabel,
    impressions,
    reach,
    clicks,
    ctr,
    cpc,
    cpm,
    sales,
    cps,
    leadsChange,
    spendChange,
    cplChange,
    activeCampaigns,
    dataSources,
    conversionRate,
    dateFrom,
    dateTo,
  }), [
    appName,
    projectName,
    currentLeads,
    monthlyGoal,
    progressPercent,
    projectedLeads,
    projectionStatus,
    totalSpend,
    averageCPL,
    averageDailyRate,
    daysRemaining,
    daysElapsed,
    totalDays,
    pessimisticTotal,
    optimisticTotal,
    campaignPeriod,
    periodLabel,
    impressions,
    reach,
    clicks,
    ctr,
    cpc,
    cpm,
    sales,
    cps,
    leadsChange,
    spendChange,
    cplChange,
    activeCampaigns,
    dataSources,
    conversionRate,
    dateFrom,
    dateTo,
  ]);

  // Generate formatted message
  const formattedMessage = useMemo(() => {
    return formatWhatsAppReport(reportType, reportData);
  }, [reportType, reportData]);

  // Handle phone number input with mask
  const handlePhoneChange = (value: string) => {
    // Allow only numbers, spaces, parentheses, plus, and dash
    const cleaned = value.replace(/[^\d\s()+-]/g, "");
    setPhoneNumber(cleaned);
  };

  // Copy message to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      toast({
        title: "Mensagem copiada!",
        description: "Cole no WhatsApp para enviar.",
      });
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem.",
        variant: "destructive",
      });
    }
  };

  // Open WhatsApp with message - with iframe fallback strategy
  const handleOpenWhatsApp = () => {
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    
    if (cleanedNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Insira um número de telefone válido com DDD.",
        variant: "destructive",
      });
      return;
    }

    // Save to recent numbers
    saveRecentNumber(phoneNumber);
    setRecentNumbers(getRecentNumbers());

    // Generate link
    const link = generateWhatsAppLink(phoneNumber, formattedMessage);
    
    // Strategy 1: Try window.top.open (escapes iframe)
    try {
      const opened = window.top?.open(link, "_blank");
      if (opened) {
        toast({
          title: "WhatsApp aberto!",
          description: "Clique em enviar no WhatsApp.",
        });
        return;
      }
    } catch {
      // window.top may be blocked by same-origin policy
    }
    
    // Strategy 2: Try regular window.open
    try {
      const opened = window.open(link, "_blank");
      if (opened) {
        toast({
          title: "WhatsApp aberto!",
          description: "Clique em enviar no WhatsApp.",
        });
        return;
      }
    } catch {
      // May be blocked by popup blocker
    }
    
    // Strategy 3: Create temporary link element and click it
    try {
      const tempLink = document.createElement('a');
      tempLink.href = link;
      tempLink.target = '_blank';
      tempLink.rel = 'noopener noreferrer';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      toast({
        title: "WhatsApp aberto!",
        description: "Clique em enviar no WhatsApp.",
      });
      return;
    } catch {
      // Link click may also fail
    }
    
    // Strategy 4: Copy link to clipboard as fallback
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copiado!",
        description: "O link do WhatsApp foi copiado. Cole no navegador para abrir.",
        duration: 5000,
      });
    }).catch(() => {
      toast({
        title: "Não foi possível abrir o WhatsApp",
        description: "Copie a mensagem manualmente e envie pelo app.",
        variant: "destructive",
      });
    });
  };

  // Use recent number
  const handleUseRecentNumber = (number: string) => {
    setPhoneNumber(number);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="outline" size="sm" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Compartilhar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Compartilhar via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de relatório e envie para qualquer contato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <RadioGroup 
              value={reportType} 
              onValueChange={(value) => setReportType(value as ReportType)}
              className="grid gap-2"
            >
              {REPORT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label 
                    htmlFor={type.value} 
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número do Destinatário</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Inclua o DDD. O código do país (55) será adicionado automaticamente.
            </p>
            
            {/* Recent Numbers */}
            {recentNumbers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                {recentNumbers.map((num, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="cursor-pointer text-xs hover:bg-secondary/80"
                    onClick={() => handleUseRecentNumber(num)}
                  >
                    {num}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <ScrollArea className="h-[150px] w-full rounded-md border bg-muted/30 p-3">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {formattedMessage}
              </pre>
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleOpenWhatsApp}
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCopyMessage}
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Mensagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
