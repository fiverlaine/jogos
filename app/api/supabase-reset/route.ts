import { NextResponse } from 'next/server';

// Função para fornecer SQL para resetar a tabela memory_game_sessions
export async function GET() {
  const resetSQL = `
-- ATENÇÃO: Este comando irá excluir todos os dados da tabela memory_game_sessions
-- Execute apenas se quiser recomeçar do zero ou se estiver tendo problemas com o cache do schema

-- Passo 1: Remover a tabela existente e seu relacionamento com a publicação em tempo real
DO $$
BEGIN
  -- Remover a tabela da publicação em tempo real (se estiver incluída)
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'memory_game_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.memory_game_sessions;
  END IF;
  
  -- Remover todos os gatilhos da tabela
  EXECUTE (
    SELECT string_agg('DROP TRIGGER IF EXISTS ' || trigger_name || ' ON public.memory_game_sessions CASCADE;', ' ')
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
    AND event_object_table = 'memory_game_sessions'
  );
  
  -- Remover todos os índices da tabela
  EXECUTE (
    SELECT string_agg('DROP INDEX IF EXISTS ' || indexname || ' CASCADE;', ' ')
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'memory_game_sessions'
  );
  
  -- Remover todas as políticas RLS existentes
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
  END;
  
  -- Descartar a tabela
  DROP TABLE IF EXISTS public.memory_game_sessions CASCADE;
END $$;

-- Passo 2: Criar a tabela do zero com todos os campos necessários
CREATE TABLE public.memory_game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  last_move_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_turn INTEGER DEFAULT 1,
  player_1_id UUID NOT NULL,
  player_1_nickname TEXT NOT NULL,
  player_1_score INTEGER DEFAULT 0,
  player_2_id UUID,
  player_2_nickname TEXT,
  player_2_score INTEGER DEFAULT 0,
  cards JSONB NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 4,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'waiting_for_player',
  winner INTEGER,
  rematch_requested BOOLEAN DEFAULT FALSE,
  rematch_requested_by UUID,
  rematch_accepted BOOLEAN DEFAULT FALSE,
  rematch_declined BOOLEAN DEFAULT FALSE,
  rematch_new_game_id UUID
);

-- Passo 3: Garantir que a segurança em nível de linha (RLS) esteja DESABILITADA
ALTER TABLE public.memory_game_sessions DISABLE ROW LEVEL SECURITY;

-- Passo extra: Verificar e garantir que RLS está realmente desabilitada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'memory_game_sessions' 
    AND rowsecurity = true
  ) THEN
    -- Aplicar novamente a desativação do RLS
    ALTER TABLE public.memory_game_sessions DISABLE ROW LEVEL SECURITY;
    
    -- Verificar novamente
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'memory_game_sessions' 
      AND rowsecurity = true
    ) THEN
      RAISE EXCEPTION 'Não foi possível desativar RLS para a tabela memory_game_sessions';
    END IF;
  END IF;
END $$;

-- Passo 4: Criar índices para melhorar performance
CREATE INDEX idx_memory_game_sessions_status ON public.memory_game_sessions(status);
CREATE INDEX idx_memory_game_sessions_player_1_id ON public.memory_game_sessions(player_1_id);
CREATE INDEX idx_memory_game_sessions_player_2_id ON public.memory_game_sessions(player_2_id);

-- Passo 5: Adicionar a tabela à publicação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_game_sessions;

-- Passo 6: Incluir trigger para atualizar last_move_at
CREATE OR REPLACE FUNCTION update_memory_last_move_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_move_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_last_move_timestamp_trigger
BEFORE UPDATE OF cards ON public.memory_game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_memory_last_move_timestamp();

-- Passo 7: Verificação final e confirmação
SELECT pg_notify('supabase_db_schema_changed', 'memory_game_sessions');

-- Passo 8: Conceder permissões necessárias
GRANT ALL ON TABLE public.memory_game_sessions TO authenticated;
GRANT ALL ON TABLE public.memory_game_sessions TO service_role;
GRANT ALL ON TABLE public.memory_game_sessions TO anon;
`;

  return NextResponse.json({ 
    message: 'Execute este SQL no painel de controle do Supabase para resetar completamente a tabela memory_game_sessions',
    sql: resetSQL
  });
} 