-- =====================================================
-- SCRIPT DE MIGRAÇÃO DE DADOS
-- Projeto: Metrics Hub
-- Data: 2024-12-23
-- =====================================================
-- IMPORTANTE: Execute este script APÓS o migration_script.sql
-- Este script migra os dados existentes das tabelas app_settings e user_roles
-- =====================================================

-- =====================================================
-- 1. MIGRAÇÃO: app_settings (Configurações White Label)
-- =====================================================

INSERT INTO public.app_settings (id, key, value, updated_at, updated_by)
VALUES (
  '105ed97e-fb0c-45e4-ab34-939fa46f4fe9',
  'white_label',
  '{
    "accentColor": "240 3.7% 15.9%",
    "accentForegroundColor": "0 0% 98%",
    "appName": "Metrics Hub",
    "appTagline": "Dashboard de análise de Meta Ads e Leads",
    "backgroundColor": "240 10% 3.9%",
    "borderColor": "240 3.7% 15.9%",
    "cardColor": "240 10% 3.9%",
    "cardForegroundColor": "0 0% 98%",
    "customFontUrl": null,
    "dangerColor": "0 84% 60%",
    "defaultTheme": "system",
    "faviconUrl": null,
    "fontFamily": "Inter",
    "foregroundColor": "0 0% 98%",
    "hideLogoIcon": false,
    "logoUrl": null,
    "mutedColor": "240 3.7% 15.9%",
    "mutedForegroundColor": "240 5% 64.9%",
    "primaryColor": "217 91% 60%",
    "pwaBackgroundColor": "240 10% 3.9%",
    "pwaIconUrl": null,
    "pwaThemeColor": "217 91% 60%",
    "successColor": "142 71% 45%",
    "warningColor": "38 92% 50%"
  }'::jsonb,
  '2025-12-19 19:37:57.361+00',
  NULL
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- 2. MIGRAÇÃO: user_roles
-- =====================================================
-- NOTA: O user_id abaixo é do projeto ORIGINAL.
-- No novo projeto, você precisará:
-- 1. Primeiro criar o usuário (fazer signup)
-- 2. Depois executar o script make_admin.sql com o email correto
-- =====================================================

-- O script abaixo é apenas para referência do usuário admin original
-- user_id: 4fd271f2-d930-4ec1-b71f-35d076ddc0cf (projeto original)
-- role: admin

-- Para promover um usuário a admin no NOVO projeto, use:
-- (Substitua 'seu_email@exemplo.com' pelo email do usuário)

/*
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'seu_email@exemplo.com';

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (v_user_id, 'admin', true)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Usuário promovido a admin com sucesso!';
  ELSE
    RAISE NOTICE '❌ Usuário não encontrado. Certifique-se de que ele já fez cadastro.';
  END IF;
END $$;
*/

-- =====================================================
-- 3. VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

-- Execute estas queries para verificar se os dados foram migrados:

-- Verificar app_settings:
-- SELECT * FROM app_settings WHERE key = 'white_label';

-- Verificar user_roles:
-- SELECT ur.*, au.email 
-- FROM user_roles ur 
-- JOIN auth.users au ON ur.user_id = au.id;

-- =====================================================
-- FIM DO SCRIPT DE MIGRAÇÃO DE DADOS
-- =====================================================
