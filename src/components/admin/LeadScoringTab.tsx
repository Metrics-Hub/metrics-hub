import { useState, useEffect } from "react";
import { Loader2, Calculator, Save, RotateCcw, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface QuestionWeight {
  weight: number;
  label: string;
  description: string;
}

export interface LeadScoringConfig {
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

export const DEFAULT_SCORING_CONFIG: LeadScoringConfig = {
  questions: {
    creditLimit: { 
      weight: 20, 
      label: "Limite de Crédito",
      description: "Acima de R$50k (+100), R$30k (+80), R$10k (+60), R$5k (+40), Outros (+20)"
    },
    income: { 
      weight: 15, 
      label: "Renda Mensal",
      description: "Acima de R$20k (+100), R$10k (+80), R$5k (+60), R$3k (+40), Até R$3k (+20)"
    },
    experience: { 
      weight: 15, 
      label: "Experiência com Leilões",
      description: "Já investe (+100), Já comprou (+80), Estudando (+55), Nunca (+20)"
    },
    followTime: { 
      weight: 10, 
      label: "Tempo de Acompanhamento",
      description: "Mais de 2 anos (+100), 1-2 anos (+80), 6 meses-1 ano (+60), 3-6 meses (+40), Menos de 3 meses (+20)"
    },
    socialNetwork: { 
      weight: 5, 
      label: "Rede Social Principal",
      description: "YouTube (+100), Instagram/Telegram (+75), TikTok (+60), Facebook (+40), Outros (+20)"
    },
    age: { 
      weight: 10, 
      label: "Idade",
      description: "35-44 (+100), 45-54 (+90), 25-34 (+80), 55-64 (+70), 65+ (+50), 18-24 (+40)"
    },
    profession: { 
      weight: 10, 
      label: "Profissão",
      description: "Empresário/Investidor (+100), Servidor Público (+90), Profissional Liberal (+90), CLT (+70), Aposentado (+60), Estudante (+40)"
    },
    objection: { 
      weight: 10, 
      label: "Objeção",
      description: "Nenhuma (+100), Tempo/Conhecimento (+70), Capital (+50), Medo (+40), Desconfiança (+20)"
    },
    region: { 
      weight: 3, 
      label: "Região",
      description: "SP/RJ (+100), Sul/Centro-Oeste/MG (+65), Outras (+35)"
    },
    maritalStatus: { 
      weight: 2, 
      label: "Estado Civil",
      description: "Casado/União Estável (+100), Divorciado/Viúvo (+100), Solteiro (+50)"
    },
    gender: { 
      weight: 0, 
      label: "Gênero",
      description: "Opcional - peso 0 por padrão (não influencia score)"
    },
  },
  thresholds: {
    hot: 80,
    warm: 60,
    lukewarm: 40,
    cold: 0,
  },
};

export function LeadScoringTab() {
  const [config, setConfig] = useState<LeadScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = Object.values(config.questions).reduce((sum, q) => sum + q.weight, 0);
  const isValidWeight = totalWeight === 100;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "lead_scoring_config")
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value && typeof data.value === 'object') {
        const savedConfig = data.value as unknown as LeadScoringConfig;
        // Check for new question-based structure
        if (savedConfig.questions && savedConfig.thresholds) {
          setConfig(savedConfig);
        }
        // If old category-based structure, keep default
      }
    } catch (err) {
      console.error("Error fetching scoring config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isValidWeight) {
      toast.error("A soma dos pesos deve ser igual a 100%");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "lead_scoring_config", value: config as any }, { onConflict: "key" });

      if (error) throw error;

      toast.success("Configuração de scoring salva com sucesso");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving scoring config:", err);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_SCORING_CONFIG);
    setHasChanges(true);
  };

  const updateQuestionWeight = (question: keyof typeof config.questions, weight: number) => {
    setConfig((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [question]: { ...prev.questions[question], weight },
      },
    }));
    setHasChanges(true);
  };

  const updateThreshold = (level: keyof typeof config.thresholds, value: number) => {
    setConfig((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [level]: value },
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Weights */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Pesos por Pergunta</CardTitle>
                <CardDescription>
                  Configure a importância de cada pergunta da pesquisa na pontuação final (soma deve ser 100%)
                </CardDescription>
              </div>
            </div>
            <Badge variant={isValidWeight ? "default" : "destructive"}>
              Total: {totalWeight}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(config.questions).map(([key, question]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{question.label}</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">{question.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium w-12 text-right">{question.weight}%</span>
              </div>
              <Slider
                value={[question.weight]}
                onValueChange={([value]) => updateQuestionWeight(key as keyof typeof config.questions, value)}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Score Thresholds */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Faixas de Qualificação</CardTitle>
              <CardDescription>
                Defina os limites de pontuação para cada categoria de lead
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" />
                A - Hot (Alto)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.hot}
                  onChange={(e) => updateThreshold("hot", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">- 100</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-chart-2" />
                B - Warm (Médio)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.warm}
                  onChange={(e) => updateThreshold("warm", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">- {config.thresholds.hot - 1}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-chart-3" />
                C - Lukewarm (Baixo)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.lukewarm}
                  onChange={(e) => updateThreshold("lukewarm", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">- {config.thresholds.warm - 1}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                D - Cold (Desqualificado)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">0 - {config.thresholds.lukewarm - 1}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} disabled={saving || !hasChanges || !isValidWeight} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configuração
        </Button>
      </div>

      {/* Info */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Alterações na configuração de scoring serão aplicadas aos novos cálculos. 
            Os scores existentes não serão recalculados automaticamente. Para aplicar as novas configurações, 
            atualize os dados no dashboard de Leads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
