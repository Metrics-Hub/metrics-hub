-- ============================================================
-- SCRIPT DE MIGRAÇÃO COMPLETO - Supabase Database
-- Data de geração: 2025-12-23
-- ============================================================
-- IMPORTANTE: Execute este script em um novo projeto Supabase
-- Este script recria todo o schema do banco de dados
-- ============================================================

-- ============================================================
-- PARTE 1: ENUM TYPES
-- ============================================================

-- Criar o tipo ENUM para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'moderator');

-- ============================================================
-- PARTE 2: FUNÇÕES DO BANCO DE DADOS
-- ============================================================

-- Função para verificar se usuário tem uma role específica (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para atribuir role 'user' automaticamente a novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- ============================================================
-- PARTE 3: TABELAS
-- ============================================================

-- Tabela: user_roles (roles de usuários)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user'::app_role,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela: projects (projetos)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#2563eb'::text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: app_settings (configurações globais)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: project_settings (configurações por projeto)
CREATE TABLE public.project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);

-- Tabela: meta_ads_integrations (integrações Meta Ads)
CREATE TABLE public.meta_ads_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  access_token text NOT NULL,
  ad_account_id text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: google_sheets_integrations (integrações Google Sheets para Leads)
CREATE TABLE public.google_sheets_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  csv_url text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: google_ads_integrations (integrações Google Ads API)
CREATE TABLE public.google_ads_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  customer_id text NOT NULL,
  login_customer_id text,
  developer_token text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  refresh_token text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: google_ads_sheets_integrations (Google Ads via Planilhas)
CREATE TABLE public.google_ads_sheets_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  csv_url text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: alert_configurations (configurações de alertas)
CREATE TABLE public.alert_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  comparison_operator text NOT NULL DEFAULT 'greater_than'::text,
  threshold_value numeric NOT NULL,
  notification_channels text[] DEFAULT ARRAY['app'::text],
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: alert_history (histórico de alertas)
CREATE TABLE public.alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id uuid REFERENCES public.alert_configurations(id) ON DELETE CASCADE,
  message text NOT NULL,
  metric_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: audit_logs (logs de auditoria)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: login_history (histórico de login)
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  success boolean NOT NULL DEFAULT true,
  ip_address text,
  user_agent text,
  login_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: user_presence (presença online de usuários)
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_email text,
  is_online boolean DEFAULT true,
  last_seen_at timestamp with time zone DEFAULT now()
);

-- Tabela: user_filters (filtros salvos por usuário)
CREATE TABLE public.user_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_key text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_key)
);

-- Tabela: dashboard_layouts (layouts de dashboard por usuário)
CREATE TABLE public.dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: report_history (histórico de relatórios)
CREATE TABLE public.report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  report_type text NOT NULL,
  report_content text NOT NULL,
  report_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela: sync_logs (logs de sincronização)
CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL,
  integration_type text NOT NULL,
  integration_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  records_processed integer DEFAULT 0,
  error_message text,
  triggered_by text DEFAULT 'cron'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer
);

-- ============================================================
-- PARTE 4: VIEWS (Visualizações Seguras)
-- ============================================================

-- View segura para Meta Ads (oculta access_token)
CREATE OR REPLACE VIEW public.meta_ads_integrations_safe AS
SELECT 
  id,
  project_id,
  name,
  ad_account_id,
  is_active,
  last_sync_at,
  created_at,
  updated_at
FROM public.meta_ads_integrations;

-- View segura para Google Ads (oculta credenciais)
CREATE OR REPLACE VIEW public.google_ads_integrations_safe AS
SELECT 
  id,
  project_id,
  name,
  customer_id,
  login_customer_id,
  is_active,
  last_sync_at,
  created_at,
  updated_at
FROM public.google_ads_integrations;

-- ============================================================
-- PARTE 5: ÍNDICES
-- ============================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_projects_is_active ON public.projects(is_active);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_meta_ads_project_id ON public.meta_ads_integrations(project_id);
CREATE INDEX idx_meta_ads_is_active ON public.meta_ads_integrations(is_active);
CREATE INDEX idx_google_sheets_project_id ON public.google_sheets_integrations(project_id);
CREATE INDEX idx_google_sheets_is_active ON public.google_sheets_integrations(is_active);
CREATE INDEX idx_google_ads_project_id ON public.google_ads_integrations(project_id);
CREATE INDEX idx_google_ads_is_active ON public.google_ads_integrations(is_active);
CREATE INDEX idx_google_ads_sheets_project_id ON public.google_ads_sheets_integrations(project_id);
CREATE INDEX idx_alert_config_project_id ON public.alert_configurations(project_id);
CREATE INDEX idx_alert_config_is_active ON public.alert_configurations(is_active);
CREATE INDEX idx_alert_history_config_id ON public.alert_history(alert_config_id);
CREATE INDEX idx_alert_history_created_at ON public.alert_history(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_filters_user_id ON public.user_filters(user_id);
CREATE INDEX idx_report_history_user_id ON public.report_history(user_id);
CREATE INDEX idx_report_history_created_at ON public.report_history(created_at);
CREATE INDEX idx_sync_logs_project_id ON public.sync_logs(project_id);
CREATE INDEX idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX idx_sync_logs_started_at ON public.sync_logs(started_at);
CREATE INDEX idx_project_settings_project_id ON public.project_settings(project_id);

-- ============================================================
-- PARTE 6: TRIGGERS
-- ============================================================

-- Trigger para auto-atribuir role 'user' a novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meta_ads_integrations_updated_at
  BEFORE UPDATE ON public.meta_ads_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_sheets_integrations_updated_at
  BEFORE UPDATE ON public.google_sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_ads_integrations_updated_at
  BEFORE UPDATE ON public.google_ads_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_ads_sheets_integrations_updated_at
  BEFORE UPDATE ON public.google_ads_sheets_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON public.alert_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at
  BEFORE UPDATE ON public.project_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_filters_updated_at
  BEFORE UPDATE ON public.user_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PARTE 7: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_sheets_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 8: POLÍTICAS RLS
-- ============================================================

-- ==================== user_roles ====================
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== projects ====================
CREATE POLICY "Authenticated users can view active projects"
  ON public.projects FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage all projects"
  ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== app_settings ====================
CREATE POLICY "Authenticated users can read settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read white label settings"
  ON public.app_settings FOR SELECT
  USING (key = 'white_label'::text);

CREATE POLICY "Admins can insert settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings"
  ON public.app_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== project_settings ====================
CREATE POLICY "Authenticated users can read project settings"
  ON public.project_settings FOR SELECT
  USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_settings.project_id AND projects.is_active = true
  )));

CREATE POLICY "Admins can manage project settings"
  ON public.project_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== meta_ads_integrations ====================
CREATE POLICY "Authenticated users can view active meta integrations"
  ON public.meta_ads_integrations FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Only admins can view meta integrations"
  ON public.meta_ads_integrations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all meta integrations"
  ON public.meta_ads_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== google_sheets_integrations ====================
CREATE POLICY "Authenticated users can view active sheets integrations"
  ON public.google_sheets_integrations FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage all sheets integrations"
  ON public.google_sheets_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== google_ads_integrations ====================
CREATE POLICY "Authenticated users can view active google ads integrations"
  ON public.google_ads_integrations FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage all google ads integrations"
  ON public.google_ads_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== google_ads_sheets_integrations ====================
CREATE POLICY "Authenticated users can view active google ads sheets integrations"
  ON public.google_ads_sheets_integrations FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage all google ads sheets integrations"
  ON public.google_ads_sheets_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== alert_configurations ====================
CREATE POLICY "Authenticated users can view active alerts"
  ON public.alert_configurations FOR SELECT
  USING ((is_active = true) AND (auth.uid() IS NOT NULL));

CREATE POLICY "Admins can manage alert configurations"
  ON public.alert_configurations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== alert_history ====================
CREATE POLICY "Admins can view all alert history"
  ON public.alert_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage alert history"
  ON public.alert_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ==================== audit_logs ====================
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ==================== login_history ====================
CREATE POLICY "Admins can view all login history"
  ON public.login_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own login history"
  ON public.login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert login history"
  ON public.login_history FOR INSERT
  WITH CHECK (true);

-- ==================== user_presence ====================
CREATE POLICY "Admins can view all presence"
  ON public.user_presence FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own presence"
  ON public.user_presence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own presence"
  ON public.user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR UPDATE
  USING (auth.uid() = user_id);

-- ==================== user_filters ====================
CREATE POLICY "Users can view their own filters"
  ON public.user_filters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own filters"
  ON public.user_filters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own filters"
  ON public.user_filters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own filters"
  ON public.user_filters FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== dashboard_layouts ====================
CREATE POLICY "Users can view their own layout"
  ON public.dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layout"
  ON public.dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layout"
  ON public.dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layout"
  ON public.dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== report_history ====================
CREATE POLICY "Admins can view all reports"
  ON public.report_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert reports"
  ON public.report_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
  ON public.report_history FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== sync_logs ====================
CREATE POLICY "Admins can view sync logs"
  ON public.sync_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage sync logs"
  ON public.sync_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- PARTE 9: STORAGE (executar manualmente via Dashboard/API)
-- ============================================================
-- NOTA: Buckets de storage devem ser criados via Supabase Dashboard ou API
-- 
-- Bucket: white-label-assets
-- Tipo: Público
-- Descrição: Armazena logos e assets de white-label
--
-- Para criar via SQL (se disponível):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('white-label-assets', 'white-label-assets', true);

-- ============================================================
-- PARTE 10: DADOS INICIAIS (opcional)
-- ============================================================

-- Inserir configuração de white-label padrão (se necessário)
-- INSERT INTO public.app_settings (key, value) 
-- VALUES ('white_label', '{"enabled": false}'::jsonb)
-- ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PARTE 11: SCRIPT PARA TORNAR USUÁRIO ADMIN
-- ============================================================
-- Execute este bloco DEPOIS de o usuário fazer cadastro no novo projeto
-- Substitua 'seu-email@exemplo.com' pelo email do administrador

/*
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'seu-email@exemplo.com';

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Usuário promovido a ADMIN com sucesso!';
  ELSE
    RAISE NOTICE '❌ Usuário não encontrado. Verifique se ele já fez cadastro.';
  END IF;
END $$;
*/

-- ============================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- ============================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este script no novo projeto Supabase
-- 2. Criar bucket de storage 'white-label-assets' (público)
-- 3. Configurar secrets: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
-- 4. Fazer cadastro do usuário admin
-- 5. Executar o bloco de PARTE 11 para torná-lo admin
-- 6. Testar as integrações
-- ============================================================
