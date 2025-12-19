import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Sparkles, Copy, Check, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useReportHistory } from "@/hooks/useReportHistory";
import { exportToPDF } from "@/lib/pdf-export";

type ReportType = "daily" | "weekly" | "performance" | "leads";

interface ReportData {
  leads: number;
  spend: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  goal: number;
  period: string;
  topAdSets?: Array<{ name: string; cpl: number; leads: number }>;
  topCreatives?: Array<{ name: string; ctr: number; clicks: number }>;
}

interface AIReportGeneratorProps {
  data: ReportData;
}

const reportTypeLabels: Record<ReportType, string> = {
  daily: "Relatório Diário",
  weekly: "Relatório Semanal",
  performance: "Análise de Performance",
  leads: "Relatório de Leads",
};

export function AIReportGenerator({ data }: AIReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { saveReport } = useReportHistory();

  const generateReport = async () => {
    setIsLoading(true);
    setReport(null);
    setSaved(false);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Sessão não encontrada");
      }

      const response = await supabase.functions.invoke("generate-report", {
        body: { reportType, data },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao gerar relatório");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setReport(response.data.report);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar relatório");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success("Relatório copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    await saveReport(reportType, report, data as unknown as Record<string, unknown>);
    setSaved(true);
  };

  const handleExportPDF = () => {
    if (!report) return;
    exportToPDF({
      title: reportTypeLabels[reportType],
      subtitle: `Período: ${data.period}`,
      content: report,
      metadata: {
        Leads: data.leads.toString(),
        Investimento: `R$ ${data.spend.toFixed(2)}`,
        CPL: `R$ ${data.cpl.toFixed(2)}`,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar Relatório IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerador de Relatórios com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={generateReport} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar
                </>
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          )}

          {report && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {reportTypeLabels[reportType]}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleSaveReport} className="gap-1" disabled={saved}>
                    {saved ? <Check className="h-4 w-4 text-success" /> : <Save className="h-4 w-4" />}
                    {saved ? "Salvo" : "Salvar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleExportPDF} className="gap-1">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-1">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {report}
                </div>
              </ScrollArea>
            </div>
          )}

          {!report && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione o tipo de relatório e clique em "Gerar"</p>
              <p className="text-sm mt-1">
                A IA analisará os dados e gerará um relatório em linguagem natural
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
