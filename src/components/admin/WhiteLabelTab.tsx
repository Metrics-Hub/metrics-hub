import { useState, useEffect, useRef } from "react";
import { useWhiteLabel, WhiteLabelSettings, FONT_OPTIONS, WHITE_LABEL_TEMPLATES } from "@/hooks/useWhiteLabel";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Palette, Type, RotateCcw, Save, Monitor, Sun, Moon, Eye, Upload, Link2, 
  Trash2, Loader2, Download, FileUp, ChevronDown, Smartphone, Layout, 
  Sparkles, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Color conversion utilities
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#3b82f6";
  
  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ColorPicker Component
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

function ColorPicker({ label, value, onChange, compact = false }: ColorPickerProps) {
  const hexValue = hslToHex(value);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="h-8 w-10 rounded border border-border cursor-pointer"
        />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-4">
      <Label className="w-40 text-sm">{label}</Label>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="h-10 w-14 rounded border border-border cursor-pointer"
        />
        <div 
          className="h-10 flex-1 rounded border border-border"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        <span className="text-xs text-muted-foreground font-mono w-20">{hexValue}</span>
      </div>
    </div>
  );
}

// ImageUploadField Component
interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSize?: number;
  previewSize?: "sm" | "md";
}

function ImageUploadField({ 
  label, 
  value, 
  onChange, 
  accept = "image/*",
  maxSize = 2 * 1024 * 1024,
  previewSize = "md"
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setUrlInput(value || "");
  }, [value]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('white-label-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('white-label-assets')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast({ title: "Upload concluído", description: "Imagem enviada com sucesso." });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const previewSizeClass = previewSize === "sm" ? "h-8 w-8" : "h-12 max-w-40";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "upload" | "url")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="h-3 w-3" />Upload</TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1"><Link2 className="h-3 w-3" />URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-2">
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileUpload} className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Enviando..." : "Arquivo"}
            </Button>
            <span className="text-xs text-muted-foreground">Máx. {Math.round(maxSize / 1024 / 1024)}MB</span>
          </div>
        </TabsContent>
        <TabsContent value="url" className="mt-2">
          <div className="flex items-center gap-2">
            <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className="flex-1 h-8 text-sm" />
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(urlInput.trim())} disabled={!urlInput.trim()}>Aplicar</Button>
          </div>
        </TabsContent>
      </Tabs>
      {value && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <img src={value} alt={label} className={`${previewSizeClass} object-contain rounded`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="flex-1 text-xs text-muted-foreground truncate">{value}</p>
          <Button type="button" variant="ghost" size="icon" onClick={() => { onChange(null); setUrlInput(""); }} className="h-6 w-6 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Interactive Preview Component
interface PreviewProps {
  settings: WhiteLabelSettings;
}

function InteractivePreview({ settings }: PreviewProps) {
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const bgColor = previewTheme === "dark" ? settings.backgroundColor : "0 0% 100%";
  const fgColor = previewTheme === "dark" ? settings.foregroundColor : "240 10% 3.9%";
  const cardBg = previewTheme === "dark" ? settings.cardColor : "0 0% 100%";
  const mutedBg = previewTheme === "dark" ? settings.mutedColor : "240 4.8% 95.9%";
  const borderCol = previewTheme === "dark" ? settings.borderColor : "240 5.9% 90%";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={previewTheme === "light" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreviewTheme("light")}
            className="h-7 gap-1"
          >
            <Sun className="h-3 w-3" />
            Claro
          </Button>
          <Button
            variant={previewTheme === "dark" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreviewTheme("dark")}
            className="h-7 gap-1"
          >
            <Moon className="h-3 w-3" />
            Escuro
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewDevice === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreviewDevice("desktop")}
            className="h-7 gap-1"
          >
            <Monitor className="h-3 w-3" />
          </Button>
          <Button
            variant={previewDevice === "mobile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreviewDevice("mobile")}
            className="h-7 gap-1"
          >
            <Smartphone className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div 
        className={`rounded-lg border overflow-hidden transition-all ${previewDevice === "mobile" ? "max-w-xs mx-auto" : ""}`}
        style={{ 
          backgroundColor: `hsl(${bgColor})`,
          borderColor: `hsl(${borderCol})`,
          fontFamily: settings.fontFamily === "custom" ? "inherit" : settings.fontFamily,
        }}
      >
        {/* Header Preview */}
        <div 
          className="p-3 border-b flex items-center gap-2"
          style={{ borderColor: `hsl(${borderCol})`, backgroundColor: `hsl(${cardBg})` }}
        >
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-6 max-w-16 object-contain" />
          ) : (
            <div 
              className="h-6 w-6 rounded flex items-center justify-center"
              style={{ backgroundColor: `hsl(${settings.primaryColor})` }}
            >
              <span className="text-white text-xs font-bold">L</span>
            </div>
          )}
          <span className="font-semibold text-sm" style={{ color: `hsl(${fgColor})` }}>{settings.appName}</span>
        </div>

        {/* Content Preview */}
        <div className="p-4 space-y-3">
          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="h-7 px-3 rounded text-xs text-white" style={{ backgroundColor: `hsl(${settings.primaryColor})` }}>Primário</button>
            <button className="h-7 px-3 rounded text-xs text-white" style={{ backgroundColor: `hsl(${settings.successColor})` }}>Sucesso</button>
            <button className="h-7 px-3 rounded text-xs text-white" style={{ backgroundColor: `hsl(${settings.warningColor})` }}>Alerta</button>
            <button className="h-7 px-3 rounded text-xs text-white" style={{ backgroundColor: `hsl(${settings.dangerColor})` }}>Erro</button>
          </div>

          {/* Card Preview */}
          <div 
            className="p-3 rounded-lg border"
            style={{ backgroundColor: `hsl(${cardBg})`, borderColor: `hsl(${borderCol})` }}
          >
            <div className="text-sm font-medium" style={{ color: `hsl(${fgColor})` }}>Card de Exemplo</div>
            <div className="text-xs mt-1" style={{ color: `hsl(${settings.mutedForegroundColor})` }}>Texto muted secundário</div>
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `hsl(${mutedBg})`, color: `hsl(${fgColor})` }}>Badge</span>
            <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: `hsl(${settings.accentColor})` }}>Accent</span>
          </div>

          {/* Input Preview */}
          <div 
            className="h-8 px-3 rounded border flex items-center text-xs"
            style={{ backgroundColor: `hsl(${bgColor})`, borderColor: `hsl(${borderCol})`, color: `hsl(${settings.mutedForegroundColor})` }}
          >
            Placeholder do input...
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Selector Component
interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  currentSettings: WhiteLabelSettings;
}

function TemplateSelector({ onSelect, currentSettings }: TemplateSelectorProps) {
  return (
    <ScrollArea className="h-48">
      <div className="grid grid-cols-2 gap-2 pr-4">
        {WHITE_LABEL_TEMPLATES.map((template) => {
          const isSelected = template.settings.primaryColor === currentSettings.primaryColor &&
                            template.settings.fontFamily === currentSettings.fontFamily;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`p-3 rounded-lg border text-left transition-all hover:border-primary ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${template.settings.primaryColor})` }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${template.settings.successColor})` }} />
                </div>
                {isSelected && <Check className="h-3 w-3 text-primary ml-auto" />}
              </div>
              <div className="text-sm font-medium">{template.name}</div>
              <div className="text-xs text-muted-foreground">{template.description}</div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Main Component
export function WhiteLabelTab() {
  const { settings, loading, updateSettings, resetToDefaults, applyTemplate, exportSettings, importSettings, defaults } = useWhiteLabel();
  const [localSettings, setLocalSettings] = useState<WhiteLabelSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
  }, [localSettings, settings]);

  const handleChange = <K extends keyof WhiteLabelSettings>(key: K, value: WhiteLabelSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(localSettings);
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    await resetToDefaults();
    setLocalSettings(defaults);
    setSaving(false);
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = WHITE_LABEL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setLocalSettings(prev => ({ ...prev, ...template.settings }));
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(localSettings, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `white-label-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: "Configurações exportadas com sucesso." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);
        setLocalSettings(prev => ({ ...prev, ...parsed }));
        toast({ title: "Importado", description: "Configurações importadas. Clique em Salvar para aplicar." });
      } catch (error) {
        toast({ title: "Erro", description: "Arquivo JSON inválido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Templates */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Templates</CardTitle>
          </div>
          <CardDescription className="text-xs">Escolha um tema pré-definido para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateSelector onSelect={handleApplyTemplate} currentSettings={localSettings} />
        </CardContent>
      </Card>

      {/* Brand Identity */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Identidade da Marca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Nome do Sistema</Label>
              <Input value={localSettings.appName} onChange={(e) => handleChange("appName", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Fonte</Label>
              <Select value={localSettings.fontFamily} onValueChange={(v) => handleChange("fontFamily", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value !== "custom" ? font.value : undefined }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Tagline (exibida na tela de login)</Label>
            <Input 
              value={localSettings.appTagline} 
              onChange={(e) => handleChange("appTagline", e.target.value)} 
              placeholder="Dashboard de análise de Meta Ads e Leads"
              className="h-9" 
            />
          </div>
          
          {localSettings.fontFamily === "custom" && (
            <div className="space-y-2">
              <Label className="text-sm">URL da Fonte (Google Fonts)</Label>
              <Input 
                value={localSettings.customFontUrl || ""} 
                onChange={(e) => handleChange("customFontUrl", e.target.value)} 
                placeholder="https://fonts.googleapis.com/css2?family=..."
                className="h-9"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField label="Logo" value={localSettings.logoUrl} onChange={(v) => handleChange("logoUrl", v)} previewSize="md" />
            <ImageUploadField label="Favicon" value={localSettings.faviconUrl} onChange={(v) => handleChange("faviconUrl", v)} previewSize="sm" maxSize={512 * 1024} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Esconder ícone padrão quando há logo</Label>
            <Switch checked={localSettings.hideLogoIcon} onCheckedChange={(c) => handleChange("hideLogoIcon", c)} />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Cores</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Primária" value={localSettings.primaryColor} onChange={(v) => handleChange("primaryColor", v)} />
            <ColorPicker label="Sucesso" value={localSettings.successColor} onChange={(v) => handleChange("successColor", v)} />
            <ColorPicker label="Alerta" value={localSettings.warningColor} onChange={(v) => handleChange("warningColor", v)} />
            <ColorPicker label="Erro" value={localSettings.dangerColor} onChange={(v) => handleChange("dangerColor", v)} />
          </div>

          <Collapsible open={showAdvancedColors} onOpenChange={setShowAdvancedColors}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Cores Avançadas
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedColors ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Background" value={localSettings.backgroundColor} onChange={(v) => handleChange("backgroundColor", v)} />
                <ColorPicker label="Foreground" value={localSettings.foregroundColor} onChange={(v) => handleChange("foregroundColor", v)} />
                <ColorPicker label="Card" value={localSettings.cardColor} onChange={(v) => handleChange("cardColor", v)} />
                <ColorPicker label="Card Foreground" value={localSettings.cardForegroundColor} onChange={(v) => handleChange("cardForegroundColor", v)} />
                <ColorPicker label="Muted" value={localSettings.mutedColor} onChange={(v) => handleChange("mutedColor", v)} />
                <ColorPicker label="Muted Foreground" value={localSettings.mutedForegroundColor} onChange={(v) => handleChange("mutedForegroundColor", v)} />
                <ColorPicker label="Accent" value={localSettings.accentColor} onChange={(v) => handleChange("accentColor", v)} />
                <ColorPicker label="Border" value={localSettings.borderColor} onChange={(v) => handleChange("borderColor", v)} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* PWA Settings */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">PWA (App Mobile)</CardTitle>
          </div>
          <CardDescription className="text-xs">Configurações para instalação como app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField label="Ícone do App (512x512px)" value={localSettings.pwaIconUrl} onChange={(v) => handleChange("pwaIconUrl", v)} previewSize="md" />
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Cor do Tema" value={localSettings.pwaThemeColor} onChange={(v) => handleChange("pwaThemeColor", v)} />
            <ColorPicker label="Cor de Fundo" value={localSettings.pwaBackgroundColor} onChange={(v) => handleChange("pwaBackgroundColor", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Default Theme */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Tema Padrão</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={localSettings.defaultTheme} onValueChange={(v) => handleChange("defaultTheme", v as "light" | "dark" | "system")} className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-1 text-sm cursor-pointer"><Sun className="h-3 w-3" />Claro</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-1 text-sm cursor-pointer"><Moon className="h-3 w-3" />Escuro</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-1 text-sm cursor-pointer"><Monitor className="h-3 w-3" />Sistema</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Preview Interativo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <InteractivePreview settings={localSettings} />
        </CardContent>
      </Card>

      {/* Actions */}
      <Separator />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="gap-1">
            <RotateCcw className="h-3 w-3" />Restaurar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-3 w-3" />Exportar
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
            <FileUp className="h-3 w-3" />Importar
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocalSettings(settings)} disabled={!hasChanges || saving}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gap-1">
            <Save className="h-3 w-3" />{saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
