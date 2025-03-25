import { NextResponse } from 'next/server';

// Função para fornecer SQL para corrigir problemas de RLS
export async function GET() {
  const fixRlsSQL = `
-- SQL para corrigir problemas de Segurança em Nível de Linha (RLS) na tabela memory_game_sessions
-- Este script foca apenas em corrigir permissões sem recriar a tabela

-- Passo 1: Desabilitar RLS na tabela memory_game_sessions
ALTER TABLE public.memory_game_sessions DISABLE ROW LEVEL SECURITY;

-- Passo 2: Remover todas as políticas RLS existentes
DO $$
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || policyname || ' ON public.memory_game_sessions;', ' ')
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'memory_game_sessions'
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignora erros se não houver políticas
  NULL;
END $$;

-- Passo 3: Conceder permissões completas aos usuários necessários
GRANT ALL ON TABLE public.memory_game_sessions TO authenticated;
GRANT ALL ON TABLE public.memory_game_sessions TO service_role;
GRANT ALL ON TABLE public.memory_game_sessions TO anon;

-- Passo 4: Verificar se RLS está realmente desabilitada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'memory_game_sessions' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Atenção: RLS ainda está habilitada na tabela memory_game_sessions';
  ELSE
    RAISE NOTICE 'RLS desabilitada com sucesso para a tabela memory_game_sessions';
  END IF;
END $$;

-- Passo 5: Atualizar o cache do esquema
SELECT pg_notify('supabase_db_schema_changed', 'memory_game_sessions');
`;

  return NextResponse.json({ 
    message: 'Execute este SQL no painel de controle do Supabase para corrigir problemas de RLS',
    sql: fixRlsSQL
  });
} 