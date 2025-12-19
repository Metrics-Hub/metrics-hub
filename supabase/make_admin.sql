DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Buscar o ID do usuário pelo email na tabela de autenticação
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'flaviohuertas@hotmail.com';

  -- 2. Verificar se o usuário foi encontrado
  IF v_user_id IS NOT NULL THEN
    -- 3. Inserir a role de 'admin' para este usuário
    -- Usamos ON CONFLICT DO NOTHING para evitar erro se ele já for admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ SUCESSO: Usuário flaviohuertas@hotmail.com agora é um ADMIN!';
  ELSE
    RAISE NOTICE '❌ ERRO: Usuário flaviohuertas@hotmail.com não encontrado. Verifique se ele já fez cadastro/login.';
  END IF;
END $$;
