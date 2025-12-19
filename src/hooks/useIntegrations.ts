import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface segura sem access_token (usada para leitura via VIEW)
export interface MetaAdsIntegration {
  id: string;
  project_id: string;
  name: string;
  ad_account_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleSheetsIntegration {
  id: string;
  project_id: string;
  name: string;
  csv_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

// Interface segura para Google Ads (sem tokens sensíveis)
export interface GoogleAdsIntegration {
  id: string;
  project_id: string;
  name: string;
  customer_id: string;
  login_customer_id: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleAdsCredentials {
  name: string;
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
  login_customer_id?: string;
}

// Google Ads via Sheets (simplified integration)
export interface GoogleAdsSheetsIntegration {
  id: string;
  project_id: string;
  name: string;
  csv_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegrations(projectId: string | null) {
  const [metaAdsIntegrations, setMetaAdsIntegrations] = useState<MetaAdsIntegration[]>([]);
  const [googleSheetsIntegrations, setGoogleSheetsIntegrations] = useState<GoogleSheetsIntegration[]>([]);
  const [googleAdsIntegrations, setGoogleAdsIntegrations] = useState<GoogleAdsIntegration[]>([]);
  const [googleAdsSheetsIntegrations, setGoogleAdsSheetsIntegrations] = useState<GoogleAdsSheetsIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    if (!projectId) {
      setMetaAdsIntegrations([]);
      setGoogleSheetsIntegrations([]);
      setGoogleAdsIntegrations([]);
      setGoogleAdsSheetsIntegrations([]);
      setIsLoading(false);
      return;
    }

    try {
      const [metaResult, sheetsResult, googleAdsResult, googleAdsSheetsResult] = await Promise.all([
        // Usar VIEW segura que exclui access_token
        supabase
          .from("meta_ads_integrations_safe" as any)
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        supabase
          .from("google_sheets_integrations")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        // Usar VIEW segura para Google Ads
        supabase
          .from("google_ads_integrations_safe" as any)
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        // Google Ads via Sheets
        supabase
          .from("google_ads_sheets_integrations")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
      ]);

      if (metaResult.error) throw metaResult.error;
      if (sheetsResult.error) throw sheetsResult.error;
      if (googleAdsResult.error) {
        console.warn("Google Ads integrations error (may not exist yet):", googleAdsResult.error);
      }
      if (googleAdsSheetsResult.error) {
        console.warn("Google Ads Sheets integrations error:", googleAdsSheetsResult.error);
      }

      setMetaAdsIntegrations((metaResult.data as unknown as MetaAdsIntegration[]) || []);
      setGoogleSheetsIntegrations(sheetsResult.data || []);
      setGoogleAdsIntegrations((googleAdsResult.data as unknown as GoogleAdsIntegration[]) || []);
      setGoogleAdsSheetsIntegrations((googleAdsSheetsResult.data as GoogleAdsSheetsIntegration[]) || []);
    } catch (err) {
      console.error("Error fetching integrations:", err);
      toast.error("Erro ao carregar integrações");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const addMetaAds = async (name: string, accessToken: string, adAccountId: string) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return;
    }

    try {
      const { error } = await supabase
        .from("meta_ads_integrations")
        .insert({
          project_id: projectId,
          name,
          access_token: accessToken,
          ad_account_id: adAccountId,
        });

      if (error) throw error;
      
      toast.success("Conta Meta Ads adicionada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error adding Meta Ads:", err);
      toast.error("Erro ao adicionar conta Meta Ads");
      throw err;
    }
  };

  const updateMetaAds = async (id: string, updates: { name?: string; access_token?: string; ad_account_id?: string; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from("meta_ads_integrations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Conta Meta Ads atualizada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error updating Meta Ads:", err);
      toast.error("Erro ao atualizar conta Meta Ads");
      throw err;
    }
  };

  const removeMetaAds = async (id: string) => {
    try {
      const { error } = await supabase
        .from("meta_ads_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Conta Meta Ads removida!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error removing Meta Ads:", err);
      toast.error("Erro ao remover conta Meta Ads");
      throw err;
    }
  };

  // Google Ads functions
  const addGoogleAds = async (credentials: GoogleAdsCredentials) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return;
    }

    try {
      const { error } = await supabase
        .from("google_ads_integrations")
        .insert({
          project_id: projectId,
          name: credentials.name,
          developer_token: credentials.developer_token,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          refresh_token: credentials.refresh_token,
          customer_id: credentials.customer_id,
          login_customer_id: credentials.login_customer_id || null,
        });

      if (error) throw error;
      
      toast.success("Conta Google Ads adicionada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error adding Google Ads:", err);
      toast.error("Erro ao adicionar conta Google Ads");
      throw err;
    }
  };

  const updateGoogleAds = async (id: string, updates: Partial<GoogleAdsCredentials> & { is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from("google_ads_integrations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Conta Google Ads atualizada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error updating Google Ads:", err);
      toast.error("Erro ao atualizar conta Google Ads");
      throw err;
    }
  };

  const removeGoogleAds = async (id: string) => {
    try {
      const { error } = await supabase
        .from("google_ads_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Conta Google Ads removida!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error removing Google Ads:", err);
      toast.error("Erro ao remover conta Google Ads");
      throw err;
    }
  };

  const testGoogleAds = async (integrationId: string) => {
    const integration = googleAdsIntegrations.find(i => i.id === integrationId);
    if (!integration) return false;

    try {
      const { error } = await supabase.functions.invoke("google-ads-insights", {
        body: { 
          dateFrom: new Date().toISOString().split("T")[0], 
          dateTo: new Date().toISOString().split("T")[0],
          integrationId,
        },
      });

      if (error) throw error;
      
      // Update last_sync_at
      await supabase
        .from("google_ads_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integrationId);

      toast.success("Conexão Google Ads testada com sucesso!");
      await fetchIntegrations();
      return true;
    } catch (err) {
      console.error("Error testing Google Ads:", err);
      toast.error("Erro ao testar conexão Google Ads");
      return false;
    }
  };

  const addGoogleSheets = async (name: string, csvUrl: string) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return;
    }

    try {
      const { error } = await supabase
        .from("google_sheets_integrations")
        .insert({
          project_id: projectId,
          name,
          csv_url: csvUrl,
        });

      if (error) throw error;
      
      toast.success("Planilha Google Sheets adicionada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error adding Google Sheets:", err);
      toast.error("Erro ao adicionar planilha");
      throw err;
    }
  };

  const updateGoogleSheets = async (id: string, updates: Partial<Pick<GoogleSheetsIntegration, "name" | "csv_url" | "is_active">>) => {
    try {
      const { error } = await supabase
        .from("google_sheets_integrations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Planilha atualizada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error updating Google Sheets:", err);
      toast.error("Erro ao atualizar planilha");
      throw err;
    }
  };

  const removeGoogleSheets = async (id: string) => {
    try {
      const { error } = await supabase
        .from("google_sheets_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Planilha removida!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error removing Google Sheets:", err);
      toast.error("Erro ao remover planilha");
      throw err;
    }
  };

  const testMetaAds = async (integrationId: string) => {
    const integration = metaAdsIntegrations.find(i => i.id === integrationId);
    if (!integration) return false;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.functions.invoke("meta-ads-insights", {
        body: { 
          dateFrom: today, 
          dateTo: today,
          integrationId,
        },
      });

      if (error) throw error;
      
      // Update last_sync_at
      await supabase
        .from("meta_ads_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integrationId);

      toast.success("Conexão Meta Ads testada com sucesso!");
      await fetchIntegrations();
      return true;
    } catch (err) {
      console.error("Error testing Meta Ads:", err);
      toast.error("Erro ao testar conexão Meta Ads");
      return false;
    }
  };

  const testGoogleSheets = async (integrationId: string) => {
    const integration = googleSheetsIntegrations.find(i => i.id === integrationId);
    if (!integration) return false;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.functions.invoke("google-sheets-leads", {
        body: { 
          dateFrom: today, 
          dateTo: today,
          integrationId,
        },
      });

      if (error) throw error;
      
      // Update last_sync_at
      await supabase
        .from("google_sheets_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integrationId);

      toast.success("Conexão Google Sheets testada com sucesso!");
      await fetchIntegrations();
      return true;
    } catch (err) {
      console.error("Error testing Google Sheets:", err);
      toast.error("Erro ao testar conexão Google Sheets");
      return false;
    }
  };

  // Google Ads Sheets functions
  const addGoogleAdsSheets = async (name: string, csvUrl: string) => {
    if (!projectId) {
      toast.error("Selecione um projeto primeiro");
      return;
    }

    try {
      const { error } = await supabase
        .from("google_ads_sheets_integrations")
        .insert({
          project_id: projectId,
          name,
          csv_url: csvUrl,
        });

      if (error) throw error;
      
      toast.success("Planilha Google Ads adicionada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error adding Google Ads Sheets:", err);
      toast.error("Erro ao adicionar planilha Google Ads");
      throw err;
    }
  };

  const updateGoogleAdsSheets = async (id: string, updates: Partial<Pick<GoogleAdsSheetsIntegration, "name" | "csv_url" | "is_active">>) => {
    try {
      const { error } = await supabase
        .from("google_ads_sheets_integrations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Planilha Google Ads atualizada!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error updating Google Ads Sheets:", err);
      toast.error("Erro ao atualizar planilha Google Ads");
      throw err;
    }
  };

  const removeGoogleAdsSheets = async (id: string) => {
    try {
      const { error } = await supabase
        .from("google_ads_sheets_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Planilha Google Ads removida!");
      await fetchIntegrations();
    } catch (err) {
      console.error("Error removing Google Ads Sheets:", err);
      toast.error("Erro ao remover planilha Google Ads");
      throw err;
    }
  };

  const testGoogleAdsSheets = async (integrationId: string) => {
    const integration = googleAdsSheetsIntegrations.find(i => i.id === integrationId);
    if (!integration) return false;

    try {
      const { error } = await supabase.functions.invoke("google-ads-sheets", {
        body: { 
          dateFrom: new Date().toISOString().split("T")[0], 
          dateTo: new Date().toISOString().split("T")[0],
          integrationId,
        },
      });

      if (error) throw error;
      
      // Update last_sync_at
      await supabase
        .from("google_ads_sheets_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integrationId);

      toast.success("Conexão Google Ads Sheets testada com sucesso!");
      await fetchIntegrations();
      return true;
    } catch (err) {
      console.error("Error testing Google Ads Sheets:", err);
      toast.error("Erro ao testar conexão Google Ads Sheets");
      return false;
    }
  };

  return {
    metaAdsIntegrations,
    googleSheetsIntegrations,
    googleAdsIntegrations,
    googleAdsSheetsIntegrations,
    isLoading,
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
    refetch: fetchIntegrations,
  };
}
