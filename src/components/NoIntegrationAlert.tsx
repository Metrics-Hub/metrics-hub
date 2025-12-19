import { AlertCircle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface NoIntegrationAlertProps {
  projectName?: string;
  integrationType: "Meta Ads" | "Google Ads" | "Google Sheets";
}

export function NoIntegrationAlert({ projectName, integrationType }: NoIntegrationAlertProps) {
  return (
    <Alert variant="default" className="border-warning/50 bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">Nenhuma integração configurada</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-muted-foreground">
          O projeto <strong>{projectName || "selecionado"}</strong> não possui nenhuma integração {integrationType} ativa.
          Configure uma integração para visualizar os dados.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar Integrações
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
