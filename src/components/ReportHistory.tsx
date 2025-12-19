import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  History,
  FileText,
  Trash2,
  Eye,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileDown,
  MoreVertical,
} from "lucide-react";
import { useReportHistory } from "@/hooks/useReportHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdf-export";

const reportTypeLabels: Record<string, string> = {
  daily: "Relatório Diário",
  weekly: "Relatório Semanal",
  performance: "Análise de Performance",
  leads: "Relatório de Leads",
};

export function ReportHistory() {
  const { reports, isLoading, deleteReport, refetch } = useReportHistory();
  const [selectedReport, setSelectedReport] = useState<{
    content: string;
    type: string;
    date: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Relatório copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const downloadAsTxt = (content: string, type: string, date: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${type}-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório baixado!");
  };

  const downloadAsPDF = (content: string, type: string, date: string) => {
    try {
      exportToPDF({
        title: reportTypeLabels[type] || type,
        subtitle: `Gerado em: ${date}`,
        content,
      });
      toast.success("PDF gerado!");
    } catch (error) {
      toast.error("Erro ao gerar PDF. Verifique se popups estão permitidos.");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Histórico de Relatórios
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-[40%] mb-2" />
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum relatório gerado ainda</p>
              <p className="text-xs mt-1">
                Use o gerador de relatórios IA para criar seu primeiro relatório
              </p>
            </div>
          )}

          {!isLoading && reports.length > 0 && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {reports.map((report) => {
                  const formattedDate = format(
                    new Date(report.created_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  );
                  const shortDate = format(new Date(report.created_at), "dd-MM-yyyy");

                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {reportTypeLabels[report.report_type] || report.report_type}
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {report.report_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formattedDate}
                          {report.user_email && ` • ${report.user_email}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setSelectedReport({
                              content: report.report_content,
                              type: report.report_type,
                              date: formattedDate,
                            })
                          }
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                downloadAsPDF(
                                  report.report_content,
                                  report.report_type,
                                  formattedDate
                                )
                              }
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                downloadAsTxt(
                                  report.report_content,
                                  report.report_type,
                                  shortDate
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(report.report_content)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O relatório será
                                permanentemente excluído.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReport(report.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport &&
                (reportTypeLabels[selectedReport.type] || selectedReport.type)}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedReport.date}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadAsPDF(
                        selectedReport.content,
                        selectedReport.type,
                        selectedReport.date
                      )
                    }
                    className="gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedReport.content)}
                    className="gap-1"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {selectedReport.content}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
