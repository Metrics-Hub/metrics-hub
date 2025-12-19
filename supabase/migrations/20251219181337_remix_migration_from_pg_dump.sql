CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'moderator'
);


--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: alert_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    metric_type text NOT NULL,
    threshold_value numeric NOT NULL,
    comparison_operator text DEFAULT 'greater_than'::text NOT NULL,
    is_active boolean DEFAULT true,
    notification_channels text[] DEFAULT ARRAY['app'::text],
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alert_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_config_id uuid,
    metric_value numeric NOT NULL,
    threshold_value numeric NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_value jsonb,
    new_value jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dashboard_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_layouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    layout jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: google_ads_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_ads_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    developer_token text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    refresh_token text NOT NULL,
    customer_id text NOT NULL,
    login_customer_id text,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: google_ads_integrations_safe; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.google_ads_integrations_safe WITH (security_invoker='true') AS
 SELECT id,
    project_id,
    name,
    customer_id,
    login_customer_id,
    is_active,
    last_sync_at,
    created_at,
    updated_at
   FROM public.google_ads_integrations;


--
-- Name: google_ads_sheets_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_ads_sheets_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    csv_url text NOT NULL,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: google_sheets_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_sheets_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    csv_url text NOT NULL,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email text,
    login_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    success boolean DEFAULT true NOT NULL
);


--
-- Name: meta_ads_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_ads_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    access_token text NOT NULL,
    ad_account_id text NOT NULL,
    is_active boolean DEFAULT true,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: meta_ads_integrations_safe; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.meta_ads_integrations_safe WITH (security_invoker='true') AS
 SELECT id,
    project_id,
    name,
    ad_account_id,
    is_active,
    last_sync_at,
    created_at,
    updated_at
   FROM public.meta_ads_integrations;


--
-- Name: project_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#2563eb'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: report_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email text,
    report_type text NOT NULL,
    report_content text NOT NULL,
    report_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    integration_type text NOT NULL,
    integration_id uuid NOT NULL,
    integration_name text NOT NULL,
    project_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    records_processed integer DEFAULT 0,
    duration_ms integer,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    triggered_by text DEFAULT 'cron'::text
);


--
-- Name: user_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_filters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    page_key text NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_presence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email text,
    last_seen_at timestamp with time zone DEFAULT now(),
    is_online boolean DEFAULT true
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: alert_configurations alert_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_configurations
    ADD CONSTRAINT alert_configurations_pkey PRIMARY KEY (id);


--
-- Name: alert_history alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_key UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: dashboard_layouts dashboard_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT dashboard_layouts_pkey PRIMARY KEY (id);


--
-- Name: dashboard_layouts dashboard_layouts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT dashboard_layouts_user_id_key UNIQUE (user_id);


--
-- Name: google_ads_integrations google_ads_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_ads_integrations
    ADD CONSTRAINT google_ads_integrations_pkey PRIMARY KEY (id);


--
-- Name: google_ads_sheets_integrations google_ads_sheets_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_ads_sheets_integrations
    ADD CONSTRAINT google_ads_sheets_integrations_pkey PRIMARY KEY (id);


--
-- Name: google_sheets_integrations google_sheets_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_sheets_integrations
    ADD CONSTRAINT google_sheets_integrations_pkey PRIMARY KEY (id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: meta_ads_integrations meta_ads_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_ads_integrations
    ADD CONSTRAINT meta_ads_integrations_pkey PRIMARY KEY (id);


--
-- Name: project_settings project_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_settings
    ADD CONSTRAINT project_settings_pkey PRIMARY KEY (id);


--
-- Name: project_settings project_settings_project_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_settings
    ADD CONSTRAINT project_settings_project_id_key_key UNIQUE (project_id, key);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: report_history report_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_history
    ADD CONSTRAINT report_history_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: user_filters user_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_filters
    ADD CONSTRAINT user_filters_pkey PRIMARY KEY (id);


--
-- Name: user_filters user_filters_user_id_page_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_filters
    ADD CONSTRAINT user_filters_user_id_page_key_key UNIQUE (user_id, page_key);


--
-- Name: user_presence user_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_pkey PRIMARY KEY (id);


--
-- Name: user_presence user_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_presence
    ADD CONSTRAINT user_presence_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_login_history_login_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_history_login_at ON public.login_history USING btree (login_at DESC);


--
-- Name: idx_login_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_history_user_id ON public.login_history USING btree (user_id);


--
-- Name: idx_sync_logs_integration_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_logs_integration_type ON public.sync_logs USING btree (integration_type);


--
-- Name: idx_sync_logs_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_logs_started_at ON public.sync_logs USING btree (started_at DESC);


--
-- Name: idx_sync_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_logs_status ON public.sync_logs USING btree (status);


--
-- Name: idx_user_presence_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_presence_last_seen ON public.user_presence USING btree (last_seen_at DESC);


--
-- Name: alert_configurations update_alert_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_alert_configurations_updated_at BEFORE UPDATE ON public.alert_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: app_settings update_app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dashboard_layouts update_dashboard_layouts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON public.dashboard_layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: google_ads_integrations update_google_ads_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_google_ads_integrations_updated_at BEFORE UPDATE ON public.google_ads_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: google_ads_sheets_integrations update_google_ads_sheets_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_google_ads_sheets_integrations_updated_at BEFORE UPDATE ON public.google_ads_sheets_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: google_sheets_integrations update_google_sheets_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_google_sheets_integrations_updated_at BEFORE UPDATE ON public.google_sheets_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: meta_ads_integrations update_meta_ads_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_meta_ads_integrations_updated_at BEFORE UPDATE ON public.meta_ads_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_settings update_project_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON public.project_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_filters update_user_filters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_filters_updated_at BEFORE UPDATE ON public.user_filters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_configurations alert_configurations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_configurations
    ADD CONSTRAINT alert_configurations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: alert_history alert_history_alert_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_alert_config_id_fkey FOREIGN KEY (alert_config_id) REFERENCES public.alert_configurations(id) ON DELETE CASCADE;


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: google_ads_integrations google_ads_integrations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_ads_integrations
    ADD CONSTRAINT google_ads_integrations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: google_ads_sheets_integrations google_ads_sheets_integrations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_ads_sheets_integrations
    ADD CONSTRAINT google_ads_sheets_integrations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: google_sheets_integrations google_sheets_integrations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_sheets_integrations
    ADD CONSTRAINT google_sheets_integrations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: login_history login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: meta_ads_integrations meta_ads_integrations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_ads_integrations
    ADD CONSTRAINT meta_ads_integrations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_settings project_settings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_settings
    ADD CONSTRAINT project_settings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: sync_logs sync_logs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: user_filters user_filters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_filters
    ADD CONSTRAINT user_filters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: report_history Admins can delete reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete reports" ON public.report_history FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can delete settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete settings" ON public.app_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: report_history Admins can insert reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert reports" ON public.report_history FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alert_configurations Admins can manage alert configurations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage alert configurations" ON public.alert_configurations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alert_history Admins can manage alert history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage alert history" ON public.alert_history USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: google_ads_integrations Admins can manage all google ads integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all google ads integrations" ON public.google_ads_integrations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: google_ads_sheets_integrations Admins can manage all google ads sheets integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all google ads sheets integrations" ON public.google_ads_sheets_integrations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: meta_ads_integrations Admins can manage all meta integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all meta integrations" ON public.meta_ads_integrations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: projects Admins can manage all projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all projects" ON public.projects USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: google_sheets_integrations Admins can manage all sheets integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all sheets integrations" ON public.google_sheets_integrations USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: project_settings Admins can manage project settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage project settings" ON public.project_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sync_logs Admins can manage sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage sync logs" ON public.sync_logs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alert_history Admins can view all alert history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all alert history" ON public.alert_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: login_history Admins can view all login history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all login history" ON public.login_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_presence Admins can view all presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all presence" ON public.user_presence FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: report_history Admins can view all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reports" ON public.report_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sync_logs Admins can view sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view sync logs" ON public.sync_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Anyone can read white label settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read white label settings" ON public.app_settings FOR SELECT TO anon USING ((key = 'white_label'::text));


--
-- Name: project_settings Authenticated users can read project settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read project settings" ON public.project_settings FOR SELECT USING (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_settings.project_id) AND (projects.is_active = true))))));


--
-- Name: app_settings Authenticated users can read settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);


--
-- Name: alert_configurations Authenticated users can view active alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active alerts" ON public.alert_configurations FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: google_ads_integrations Authenticated users can view active google ads integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active google ads integrations" ON public.google_ads_integrations FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: google_ads_sheets_integrations Authenticated users can view active google ads sheets integrati; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active google ads sheets integrati" ON public.google_ads_sheets_integrations FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: meta_ads_integrations Authenticated users can view active meta integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active meta integrations" ON public.meta_ads_integrations FOR SELECT TO authenticated USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: projects Authenticated users can view active projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active projects" ON public.projects FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: google_sheets_integrations Authenticated users can view active sheets integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active sheets integrations" ON public.google_sheets_integrations FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: meta_ads_integrations Only admins can view meta integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view meta integrations" ON public.meta_ads_integrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Service role can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: login_history Service role can insert login history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert login history" ON public.login_history FOR INSERT WITH CHECK (true);


--
-- Name: user_filters Users can create their own filters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own filters" ON public.user_filters FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_filters Users can delete their own filters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own filters" ON public.user_filters FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts Users can delete their own layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own layout" ON public.dashboard_layouts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts Users can insert their own layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own layout" ON public.dashboard_layouts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_presence Users can update own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own presence" ON public.user_presence FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_filters Users can update their own filters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own filters" ON public.user_filters FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts Users can update their own layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own layout" ON public.dashboard_layouts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_presence Users can upsert own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upsert own presence" ON public.user_presence FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: login_history Users can view own login history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own login history" ON public.login_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_presence Users can view own presence; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own presence" ON public.user_presence FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_filters Users can view their own filters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own filters" ON public.user_filters FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dashboard_layouts Users can view their own layout; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own layout" ON public.dashboard_layouts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alert_configurations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

--
-- Name: alert_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_layouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

--
-- Name: google_ads_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_ads_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: google_ads_sheets_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_ads_sheets_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: google_sheets_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_sheets_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: login_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

--
-- Name: meta_ads_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meta_ads_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: project_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: report_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_filters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_filters ENABLE ROW LEVEL SECURITY;

--
-- Name: user_presence; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;