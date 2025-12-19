import { useState } from "react";
import { 
  Loader2, Link2, CheckCircle2, XCircle, RefreshCw, Plus, Trash2, 
  Edit2, FolderOpen, Palette, Eye, EyeOff, Download 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjects, Project } from "@/hooks/useProjects";
import { useIntegrations, MetaAdsIntegration, GoogleSheetsIntegration, GoogleAdsIntegration, GoogleAdsCredentials, GoogleAdsSheetsIntegration } from "@/hooks/useIntegrations";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const PROJECT_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", 
  "#0891b2", "#db2777", "#ea580c", "#4f46e5", "#059669"
];

export function IntegrationsTab() {
  const { isAdmin } = useAdminCheck();
  const { 
    projects, 
    isLoading: projectsLoading, 
    activeProject, 
    setActiveProject,
    createProject,
    updateProject,
    deleteProject,
    refetch: refetchProjects,
  } = useProjects();

  const {
    metaAdsIntegrations,
    googleSheetsIntegrations,
    googleAdsIntegrations,
    googleAdsSheetsIntegrations,
    isLoading: integrationsLoading,
    addMetaAds,
    updateMetaAds,
    removeMetaAds,
    addGoogleAds,
    updateGoogleAds,
    removeGoogleAds,
    addGoogleSheets,
    updateGoogleSheets,
    removeGoogleSheets,
    addGoogleAdsSheets,
    updateGoogleAdsSheets,
    removeGoogleAdsSheets,
    testMetaAds,
    testGoogleAds,
    testGoogleSheets,
    testGoogleAdsSheets,
  } = useIntegrations(activeProject?.id || null);

  // Project dialogs
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#2563eb");
  const [projectLoading, setProjectLoading] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // Meta Ads dialogs
  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaAdsIntegration | null>(null);
  const [metaName, setMetaName] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaAccountId, setMetaAccountId] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testingMeta, setTestingMeta] = useState<string | null>(null);
  const [deleteMetaId, setDeleteMetaId] = useState<string | null>(null);

  // Google Sheets dialogs
  const [showSheetsDialog, setShowSheetsDialog] = useState(false);
  const [editingSheets, setEditingSheets] = useState<GoogleSheetsIntegration | null>(null);
  const [sheetsName, setSheetsName] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [testingSheets, setTestingSheets] = useState<string | null>(null);
  const [deleteSheetsId, setDeleteSheetsId] = useState<string | null>(null);

  // Google Ads (API) dialogs
  const [showGoogleAdsDialog, setShowGoogleAdsDialog] = useState(false);
  const [editingGoogleAds, setEditingGoogleAds] = useState<GoogleAdsIntegration | null>(null);
  const [googleAdsName, setGoogleAdsName] = useState("");
  const [googleAdsDeveloperToken, setGoogleAdsDeveloperToken] = useState("");
  const [googleAdsClientId, setGoogleAdsClientId] = useState("");
  const [googleAdsClientSecret, setGoogleAdsClientSecret] = useState("");
  const [googleAdsRefreshToken, setGoogleAdsRefreshToken] = useState("");
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState("");
  const [googleAdsLoginCustomerId, setGoogleAdsLoginCustomerId] = useState("");
  const [googleAdsLoading, setGoogleAdsLoading] = useState(false);
  const [showGoogleAdsSecrets, setShowGoogleAdsSecrets] = useState(false);
  const [testingGoogleAds, setTestingGoogleAds] = useState<string | null>(null);
  const [deleteGoogleAdsId, setDeleteGoogleAdsId] = useState<string | null>(null);

  // Google Ads (Planilha) dialogs
  const [showGoogleAdsSheetsDialog, setShowGoogleAdsSheetsDialog] = useState(false);
  const [editingGoogleAdsSheets, setEditingGoogleAdsSheets] = useState<GoogleAdsSheetsIntegration | null>(null);
  const [googleAdsSheetsName, setGoogleAdsSheetsName] = useState("");
  const [googleAdsSheetsUrl, setGoogleAdsSheetsUrl] = useState("");
  const [googleAdsSheetsLoading, setGoogleAdsSheetsLoading] = useState(false);
  const [testingGoogleAdsSheets, setTestingGoogleAdsSheets] = useState<string | null>(null);
  const [deleteGoogleAdsSheetsId, setDeleteGoogleAdsSheetsId] = useState<string | null>(null);
  
  // Migration state
  const [migrating, setMigrating] = useState(false);

  // Project handlers
  const openProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectDescription(project.description || "");
      setProjectColor(project.color);
    } else {
      setEditingProject(null);
      setProjectName("");
      setProjectDescription("");
      setProjectColor("#2563eb");
    }
    setShowProjectDialog(true);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    setProjectLoading(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projectName,
          description: projectDescription || null,
          color: projectColor,
        });
      } else {
        const newProject = await createProject(projectName, projectDescription, projectColor);
        if (newProject) setActiveProject(newProject);
      }
      setShowProjectDialog(false);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    await deleteProject(deleteProjectId);
    setDeleteProjectId(null);
  };

  // Meta Ads handlers
  const openMetaDialog = (integration?: MetaAdsIntegration) => {
    if (integration) {
      setEditingMeta(integration);
      setMetaName(integration.name);
      setMetaToken(""); // Token não disponível na VIEW por segurança - usuário deve re-inserir se quiser alterar
      setMetaAccountId(integration.ad_account_id);
    } else {
      setEditingMeta(null);
      setMetaName("");
      setMetaToken("");
      setMetaAccountId("");
    }
    setShowToken(false);
    setShowMetaDialog(true);
  };

  const handleSaveMeta = async () => {
    if (!metaName.trim() || !metaToken.trim() || !metaAccountId.trim()) return;
    setMetaLoading(true);
    try {
      if (editingMeta) {
        await updateMetaAds(editingMeta.id, {
          name: metaName,
          access_token: metaToken,
          ad_account_id: metaAccountId,
        });
      } else {
        await addMetaAds(metaName, metaToken, metaAccountId);
      }
      setShowMetaDialog(false);
    } finally {
      setMetaLoading(false);
    }
  };

  const handleTestMeta = async (id: string) => {
    setTestingMeta(id);
    await testMetaAds(id);
    setTestingMeta(null);
  };

  const handleDeleteMeta = async () => {
    if (!deleteMetaId) return;
    await removeMetaAds(deleteMetaId);
    setDeleteMetaId(null);
  };

  // Google Sheets handlers
  const openSheetsDialog = (integration?: GoogleSheetsIntegration) => {
    if (integration) {
      setEditingSheets(integration);
      setSheetsName(integration.name);
      setSheetsUrl(integration.csv_url);
    } else {
      setEditingSheets(null);
      setSheetsName("");
      setSheetsUrl("");
    }
    setShowSheetsDialog(true);
  };

  const handleSaveSheets = async () => {
    if (!sheetsName.trim() || !sheetsUrl.trim()) return;
    setSheetsLoading(true);
    try {
      if (editingSheets) {
        await updateGoogleSheets(editingSheets.id, {
          name: sheetsName,
          csv_url: sheetsUrl,
        });
      } else {
        await addGoogleSheets(sheetsName, sheetsUrl);
      }
      setShowSheetsDialog(false);
    } finally {
      setSheetsLoading(false);
    }
  };

  const handleTestSheets = async (id: string) => {
    setTestingSheets(id);
    await testGoogleSheets(id);
    setTestingSheets(null);
  };

  const handleDeleteSheets = async () => {
    if (!deleteSheetsId) return;
    await removeGoogleSheets(deleteSheetsId);
    setDeleteSheetsId(null);
  };

  // Google Ads handlers
  const openGoogleAdsDialog = (integration?: GoogleAdsIntegration) => {
    if (integration) {
      setEditingGoogleAds(integration);
      setGoogleAdsName(integration.name);
      setGoogleAdsDeveloperToken(""); // Não disponível na VIEW por segurança
      setGoogleAdsClientId("");
      setGoogleAdsClientSecret("");
      setGoogleAdsRefreshToken("");
      setGoogleAdsCustomerId(integration.customer_id);
      setGoogleAdsLoginCustomerId(integration.login_customer_id || "");
    } else {
      setEditingGoogleAds(null);
      setGoogleAdsName("");
      setGoogleAdsDeveloperToken("");
      setGoogleAdsClientId("");
      setGoogleAdsClientSecret("");
      setGoogleAdsRefreshToken("");
      setGoogleAdsCustomerId("");
      setGoogleAdsLoginCustomerId("");
    }
    setShowGoogleAdsSecrets(false);
    setShowGoogleAdsDialog(true);
  };

  const handleSaveGoogleAds = async () => {
    if (!googleAdsName.trim() || !googleAdsDeveloperToken.trim() || 
        !googleAdsClientId.trim() || !googleAdsClientSecret.trim() || 
        !googleAdsRefreshToken.trim() || !googleAdsCustomerId.trim()) return;
    
    setGoogleAdsLoading(true);
    try {
      const credentials: GoogleAdsCredentials = {
        name: googleAdsName,
        developer_token: googleAdsDeveloperToken,
        client_id: googleAdsClientId,
        client_secret: googleAdsClientSecret,
        refresh_token: googleAdsRefreshToken,
        customer_id: googleAdsCustomerId,
        login_customer_id: googleAdsLoginCustomerId || undefined,
      };

      if (editingGoogleAds) {
        await updateGoogleAds(editingGoogleAds.id, credentials);
      } else {
        await addGoogleAds(credentials);
      }
      setShowGoogleAdsDialog(false);
    } finally {
      setGoogleAdsLoading(false);
    }
  };

  const handleTestGoogleAds = async (id: string) => {
    setTestingGoogleAds(id);
    await testGoogleAds(id);
    setTestingGoogleAds(null);
  };

  const handleDeleteGoogleAds = async () => {
    if (!deleteGoogleAdsId) return;
    await removeGoogleAds(deleteGoogleAdsId);
    setDeleteGoogleAdsId(null);
  };

  // Google Ads Sheets handlers
  const openGoogleAdsSheetsDialog = (integration?: GoogleAdsSheetsIntegration) => {
    if (integration) {
      setEditingGoogleAdsSheets(integration);
      setGoogleAdsSheetsName(integration.name);
      setGoogleAdsSheetsUrl(integration.csv_url);
    } else {
      setEditingGoogleAdsSheets(null);
      setGoogleAdsSheetsName("");
      setGoogleAdsSheetsUrl("");
    }
    setShowGoogleAdsSheetsDialog(true);
  };

  const handleSaveGoogleAdsSheets = async () => {
    if (!googleAdsSheetsName.trim() || !googleAdsSheetsUrl.trim()) return;
    setGoogleAdsSheetsLoading(true);
    try {
      if (editingGoogleAdsSheets) {
        await updateGoogleAdsSheets(editingGoogleAdsSheets.id, {
          name: googleAdsSheetsName,
          csv_url: googleAdsSheetsUrl,
        });
      } else {
        await addGoogleAdsSheets(googleAdsSheetsName, googleAdsSheetsUrl);
      }
      setShowGoogleAdsSheetsDialog(false);
    } finally {
      setGoogleAdsSheetsLoading(false);
    }
  };

  const handleTestGoogleAdsSheets = async (id: string) => {
    setTestingGoogleAdsSheets(id);
    await testGoogleAdsSheets(id);
    setTestingGoogleAdsSheets(null);
  };

  const handleDeleteGoogleAdsSheets = async () => {
    if (!deleteGoogleAdsSheetsId) return;
    await removeGoogleAdsSheets(deleteGoogleAdsSheetsId);
    setDeleteGoogleAdsSheetsId(null);
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return "••••••••";
    return token.substring(0, 4) + "••••••••" + token.substring(token.length - 4);
  };

  const maskUrl = (url: string) => {
    if (url.length <= 40) return url;
    return url.substring(0, 30) + "..." + url.substring(url.length - 10);
  };

  const handleMigrateCredentials = async () => {
    setMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-credentials");
      
      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      
      toast.success(data?.message || "Credenciais migradas com sucesso!");
      await refetchProjects();
    } catch (err) {
      console.error("Migration error:", err);
      toast.error("Erro ao migrar credenciais");
    } finally {
      setMigrating(false);
    }
  };

  if (projectsLoading) {
    return (
      <Card variant="glass">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Projects Section */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Projetos</CardTitle>
                <CardDescription>
                  Gerencie seus projetos e selecione qual visualizar
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {projects.length === 0 && isAdmin && (
                <Button 
                  onClick={handleMigrateCredentials} 
                  size="sm" 
                  variant="outline"
                  className="gap-2"
                  disabled={migrating}
                >
                  {migrating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Migrar Credenciais
                </Button>
              )}
              <Button onClick={() => openProjectDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum projeto criado</p>
              <p className="text-sm">Crie seu primeiro projeto para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setActiveProject(project)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    activeProject?.id === project.id
                      ? "ring-2 ring-primary bg-primary/5 border-primary"
                      : "bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProjectDialog(project);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteProjectId(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations Section (only show if project selected) */}
      {activeProject && (
        <>
          <Separator />
          
          {/* Meta Ads Integrations */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Meta Ads - API</CardTitle>
                    <CardDescription>
                      Contas de anúncio conectadas ao projeto "{activeProject.name}"
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => openMetaDialog()} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Conta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : metaAdsIntegrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conta Meta Ads conectada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metaAdsIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          integration.is_active
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {integration.is_active ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {integration.ad_account_id} • Token: ••••••••
                          </p>
                          {integration.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Último teste: {new Date(integration.last_sync_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? "default" : "destructive"}>
                          {integration.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestMeta(integration.id)}
                          disabled={testingMeta === integration.id}
                          className="gap-2"
                        >
                          {testingMeta === integration.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Testar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openMetaDialog(integration)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteMetaId(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Ads (Planilha) Integrations */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle>Google Ads - Sheets</CardTitle>
                    <CardDescription>
                      Dados do Google Ads via planilha CSV para o projeto "{activeProject.name}"
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => openGoogleAdsSheetsDialog()} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Planilha
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : googleAdsSheetsIntegrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma planilha Google Ads conectada</p>
                  <p className="text-xs mt-2">Exporte os dados do Google Ads para uma planilha e conecte aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {googleAdsSheetsIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          integration.is_active
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {integration.is_active ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {maskUrl(integration.csv_url)}
                          </p>
                          {integration.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Último teste: {new Date(integration.last_sync_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? "default" : "destructive"}>
                          {integration.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGoogleAdsSheets(integration.id)}
                          disabled={testingGoogleAdsSheets === integration.id}
                          className="gap-2"
                        >
                          {testingGoogleAdsSheets === integration.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Testar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openGoogleAdsSheetsDialog(integration)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteGoogleAdsSheetsId(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Sheets Integrations */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Google Sheets - Leads</CardTitle>
                    <CardDescription>
                      Planilhas de leads conectadas ao projeto "{activeProject.name}"
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => openSheetsDialog()} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Planilha
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : googleSheetsIntegrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma planilha conectada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {googleSheetsIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          integration.is_active
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {integration.is_active ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {maskUrl(integration.csv_url)}
                          </p>
                          {integration.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Último teste: {new Date(integration.last_sync_at).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? "default" : "destructive"}>
                          {integration.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestSheets(integration.id)}
                          disabled={testingSheets === integration.id}
                          className="gap-2"
                        >
                          {testingSheets === integration.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Testar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSheetsDialog(integration)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteSheetsId(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? "Atualize as informações do projeto"
                : "Crie um novo projeto para organizar suas integrações"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Projeto</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Cliente ABC"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Descrição breve do projeto"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cor de Identificação
              </Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setProjectColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      projectColor === color 
                        ? "ring-2 ring-offset-2 ring-primary" 
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProject} 
              disabled={projectLoading || !projectName.trim()}
            >
              {projectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProject ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meta Ads Dialog */}
      <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMeta ? "Editar Conta Meta Ads" : "Adicionar Conta Meta Ads"}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais da conta de anúncios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Integração</Label>
              <Input
                value={metaName}
                onChange={(e) => setMetaName(e.target.value)}
                placeholder="Ex: Conta Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="Token de acesso da API"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ad Account ID</Label>
              <Input
                value={metaAccountId}
                onChange={(e) => setMetaAccountId(e.target.value)}
                placeholder="Ex: act_123456789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetaDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMeta} 
              disabled={metaLoading || !metaName.trim() || !metaToken.trim() || !metaAccountId.trim()}
            >
              {metaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMeta ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Sheets Dialog */}
      <Dialog open={showSheetsDialog} onOpenChange={setShowSheetsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSheets ? "Editar Planilha" : "Adicionar Planilha"}
            </DialogTitle>
            <DialogDescription>
              Configure a URL pública da planilha (formato CSV)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Integração</Label>
              <Input
                value={sheetsName}
                onChange={(e) => setSheetsName(e.target.value)}
                placeholder="Ex: Leads Orgânicos"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do CSV Público</Label>
              <Input
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              />
              <p className="text-xs text-muted-foreground">
                Use o link de publicação web da planilha no formato CSV
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSheetsDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSheets} 
              disabled={sheetsLoading || !sheetsName.trim() || !sheetsUrl.trim()}
            >
              {sheetsLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSheets ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Ads Dialog */}
      <Dialog open={showGoogleAdsDialog} onOpenChange={setShowGoogleAdsDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoogleAds ? "Editar Conta Google Ads" : "Adicionar Conta Google Ads"}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais OAuth2 da conta de anúncios Google
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Integração</Label>
              <Input
                value={googleAdsName}
                onChange={(e) => setGoogleAdsName(e.target.value)}
                placeholder="Ex: Conta Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Developer Token</Label>
              <Input
                type={showGoogleAdsSecrets ? "text" : "password"}
                value={googleAdsDeveloperToken}
                onChange={(e) => setGoogleAdsDeveloperToken(e.target.value)}
                placeholder="Token de desenvolvedor Google Ads"
              />
            </div>
            <div className="space-y-2">
              <Label>Client ID (OAuth2)</Label>
              <Input
                value={googleAdsClientId}
                onChange={(e) => setGoogleAdsClientId(e.target.value)}
                placeholder="Ex: 123456789.apps.googleusercontent.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type={showGoogleAdsSecrets ? "text" : "password"}
                value={googleAdsClientSecret}
                onChange={(e) => setGoogleAdsClientSecret(e.target.value)}
                placeholder="Secret do OAuth2"
              />
            </div>
            <div className="space-y-2">
              <Label>Refresh Token</Label>
              <Input
                type={showGoogleAdsSecrets ? "text" : "password"}
                value={googleAdsRefreshToken}
                onChange={(e) => setGoogleAdsRefreshToken(e.target.value)}
                placeholder="Token de atualização OAuth2"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer ID</Label>
              <Input
                value={googleAdsCustomerId}
                onChange={(e) => setGoogleAdsCustomerId(e.target.value)}
                placeholder="Ex: 123-456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label>Login Customer ID (MCC - opcional)</Label>
              <Input
                value={googleAdsLoginCustomerId}
                onChange={(e) => setGoogleAdsLoginCustomerId(e.target.value)}
                placeholder="Ex: 123-456-7890 (se usa conta gerenciadora)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGoogleAdsSecrets(!showGoogleAdsSecrets)}
                className="gap-2"
              >
                {showGoogleAdsSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showGoogleAdsSecrets ? "Ocultar" : "Mostrar"} credenciais
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleAdsDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGoogleAds} 
              disabled={googleAdsLoading || !googleAdsName.trim() || !googleAdsDeveloperToken.trim() || 
                        !googleAdsClientId.trim() || !googleAdsClientSecret.trim() || 
                        !googleAdsRefreshToken.trim() || !googleAdsCustomerId.trim()}
            >
              {googleAdsLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGoogleAds ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as integrações associadas a este projeto também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Meta Confirmation */}
      <AlertDialog open={!!deleteMetaId} onOpenChange={() => setDeleteMetaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Conta Meta Ads?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta conta será desconectada do projeto. Você pode adicioná-la novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sheets Confirmation */}
      <AlertDialog open={!!deleteSheetsId} onOpenChange={() => setDeleteSheetsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Planilha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta planilha será desconectada do projeto. Você pode adicioná-la novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSheets} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Google Ads Confirmation */}
      <AlertDialog open={!!deleteGoogleAdsId} onOpenChange={() => setDeleteGoogleAdsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Conta Google Ads?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta conta será desconectada do projeto. Você pode adicioná-la novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoogleAds} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Google Ads Sheets Dialog */}
      <Dialog open={showGoogleAdsSheetsDialog} onOpenChange={setShowGoogleAdsSheetsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoogleAdsSheets ? "Editar Planilha Google Ads" : "Adicionar Planilha Google Ads"}
            </DialogTitle>
            <DialogDescription>
              Configure a URL pública da planilha com dados do Google Ads (formato CSV)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Integração</Label>
              <Input
                value={googleAdsSheetsName}
                onChange={(e) => setGoogleAdsSheetsName(e.target.value)}
                placeholder="Ex: Google Ads Principal"
              />
            </div>
            <div className="space-y-2">
              <Label>URL do CSV Público</Label>
              <Input
                value={googleAdsSheetsUrl}
                onChange={(e) => setGoogleAdsSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              />
              <p className="text-xs text-muted-foreground">
                Exporte os dados do Google Ads para uma planilha e publique no formato CSV
              </p>
            </div>
            <div className="rounded-lg border border-dashed p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Template de Exemplo</p>
                  <p className="text-xs text-muted-foreground">
                    Baixe o modelo com a estrutura correta de colunas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href="/templates/google-ads-template.csv" download="google-ads-template.csv">
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleAdsSheetsDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGoogleAdsSheets} 
              disabled={googleAdsSheetsLoading || !googleAdsSheetsName.trim() || !googleAdsSheetsUrl.trim()}
            >
              {googleAdsSheetsLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGoogleAdsSheets ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Google Ads Sheets Confirmation */}
      <AlertDialog open={!!deleteGoogleAdsSheetsId} onOpenChange={() => setDeleteGoogleAdsSheetsId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Planilha Google Ads?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta planilha será desconectada do projeto. Você pode adicioná-la novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoogleAdsSheets} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
