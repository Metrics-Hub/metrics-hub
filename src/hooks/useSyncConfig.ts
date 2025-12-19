import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncConfig {
  enabled: boolean;
  intervalHours: number;
  retryOnFailure: boolean;
  maxRetries: number;
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
  syncMetaAds: boolean;
  syncGoogleAdsSheets: boolean;
  syncGoogleSheetsLeads: boolean;
}

export interface SyncLog {
  id: string;
  integration_type: string;
  integration_id: string;
  integration_name: string;
  project_id: string | null;
  status: 'pending' | 'running' | 'success' | 'failed';
  error_message: string | null;
  records_processed: number;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
}

export interface SyncStatus {
  meta_ads: { lastSync: string | null; status: 'success' | 'failed' | 'never' };
  google_ads_sheets: { lastSync: string | null; status: 'success' | 'failed' | 'never' };
  google_sheets_leads: { lastSync: string | null; status: 'success' | 'failed' | 'never' };
}

const defaultSyncConfig: SyncConfig = {
  enabled: true,
  intervalHours: 1,
  retryOnFailure: true,
  maxRetries: 3,
  notifyOnFailure: true,
  notifyOnSuccess: false,
  syncMetaAds: true,
  syncGoogleAdsSheets: true,
  syncGoogleSheetsLeads: true,
};

export function useSyncConfig(projectId?: string | null) {
  const [config, setConfig] = useState<SyncConfig>(defaultSyncConfig);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [status, setStatus] = useState<SyncStatus>({
    meta_ads: { lastSync: null, status: 'never' },
    google_ads_sheets: { lastSync: null, status: 'never' },
    google_sheets_leads: { lastSync: null, status: 'never' },
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'sync_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setConfig({ ...defaultSyncConfig, ...(data.value as Partial<SyncConfig>) });
      }
    } catch (error) {
      console.error('Error fetching sync config:', error);
    }
  }, []);

  const fetchLogs = useCallback(async (limit = 50) => {
    try {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      // Filter by project if specified
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs((data || []) as SyncLog[]);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  }, [projectId]);

  const fetchStatus = useCallback(async () => {
    try {
      // Get latest successful sync for each type
      const types = ['meta_ads', 'google_ads_sheets', 'google_sheets_leads'] as const;
      const newStatus: SyncStatus = {
        meta_ads: { lastSync: null, status: 'never' },
        google_ads_sheets: { lastSync: null, status: 'never' },
        google_sheets_leads: { lastSync: null, status: 'never' },
      };

      for (const type of types) {
        let query = supabase
          .from('sync_logs')
          .select('status, completed_at')
          .eq('integration_type', type)
          .order('started_at', { ascending: false })
          .limit(1);

        // Filter by project if specified
        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data } = await query.maybeSingle();

        if (data) {
          newStatus[type] = {
            lastSync: data.completed_at,
            status: data.status === 'success' ? 'success' : 'failed',
          };
        }
      }

      setStatus(newStatus);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  }, [projectId]);

  const updateConfig = async (newConfig: Partial<SyncConfig>): Promise<boolean> => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      // Check if config exists first
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'sync_config')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: updatedConfig as any,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'sync_config');
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: 'sync_config',
            value: updatedConfig as any,
          });
        
        if (error) throw error;
      }

      setConfig(updatedConfig);
      toast.success('Configuração de sincronização salva');
      return true;
    } catch (error) {
      console.error('Error updating sync config:', error);
      toast.error('Erro ao salvar configuração');
      return false;
    }
  };

  const triggerManualSync = async (targetProjectId?: string): Promise<boolean> => {
    setSyncing(true);
    try {
      const body: Record<string, unknown> = { triggered_by: 'manual', force: true };
      if (targetProjectId) {
        body.project_id = targetProjectId;
      }

      const { data, error } = await supabase.functions.invoke('sync-data', { body });

      if (error) throw error;

      const summary = data as { success: number; failed: number };
      
      if (summary.failed > 0) {
        toast.warning(`Sincronização concluída: ${summary.success} sucesso, ${summary.failed} falhas`);
      } else {
        toast.success(`Sincronização concluída: ${summary.success} integrações atualizadas`);
      }

      // Refresh logs and status
      await Promise.all([fetchLogs(), fetchStatus()]);
      return true;
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast.error('Erro ao executar sincronização');
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const clearLogs = async (olderThanDays = 30): Promise<boolean> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('sync_logs')
        .delete()
        .lt('started_at', cutoffDate.toISOString());

      if (error) throw error;

      toast.success(`Logs com mais de ${olderThanDays} dias removidos`);
      await fetchLogs();
      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Erro ao limpar logs');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfig(), fetchLogs(), fetchStatus()]);
      setLoading(false);
    };
    loadData();
  }, [fetchConfig, fetchLogs, fetchStatus]);

  return {
    config,
    logs,
    status,
    loading,
    syncing,
    updateConfig,
    triggerManualSync,
    clearLogs,
    refetch: () => Promise.all([fetchConfig(), fetchLogs(), fetchStatus()]),
  };
}
