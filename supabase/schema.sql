-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar a extensão para Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_game_sessions;

-- Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil após registro
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();

-- Tabela para armazenar as sessões de jogo da velha
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_move_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_player_id TEXT NOT NULL,
  player_x_id TEXT NOT NULL,
  player_x_nickname TEXT NOT NULL,
  player_o_id TEXT,
  player_o_nickname TEXT,
  board JSONB NOT NULL DEFAULT '["", "", "", "", "", "", "", "", ""]'::JSONB,
  winner_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  moves INTEGER DEFAULT 0,
  rematch_requested_by TEXT DEFAULT NULL,
  rematch_game_id UUID DEFAULT NULL
);

-- Tabela para armazenar as sessões de jogo da memória
CREATE TABLE IF NOT EXISTS memory_game_sessions (
  last_reset TIMESTAMP WITH TIME ZONE,
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_move_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_player_id TEXT NOT NULL,
  player_1_id TEXT NOT NULL,
  player_1_nickname TEXT NOT NULL,
  player_2_id TEXT,
  player_2_nickname TEXT,
  cards JSONB NOT NULL, -- Array de cartas e seus estados
  matches JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array de pares encontrados
  player_1_matches INTEGER DEFAULT 0, -- Número de pares encontrados pelo jogador 1
  player_2_matches INTEGER DEFAULT 0, -- Número de pares encontrados pelo jogador 2
  winner_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  grid_config JSONB NOT NULL DEFAULT '{"rows": 4, "cols": 4}'::JSONB,
  rematch_requested_by TEXT DEFAULT NULL,
  rematch_game_id UUID DEFAULT NULL
);

-- Permitir acesso anônimo às sessões de jogo (sem políticas RLS)
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_game_sessions DISABLE ROW LEVEL SECURITY;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS game_sessions_status_idx ON game_sessions (status);
CREATE INDEX IF NOT EXISTS game_sessions_player_x_idx ON game_sessions (player_x_id);
CREATE INDEX IF NOT EXISTS game_sessions_player_o_idx ON game_sessions (player_o_id);

-- Índices para o jogo da memória
CREATE INDEX IF NOT EXISTS memory_game_sessions_status_idx ON memory_game_sessions (status);
CREATE INDEX IF NOT EXISTS memory_game_sessions_player_1_idx ON memory_game_sessions (player_1_id);
CREATE INDEX IF NOT EXISTS memory_game_sessions_player_2_idx ON memory_game_sessions (player_2_id);

-- Função para atualizar o timestamp 'last_move_at'
CREATE OR REPLACE FUNCTION update_last_move_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_move_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar 'last_move_at' a cada jogada no jogo da velha
CREATE TRIGGER update_game_timestamp
BEFORE UPDATE ON game_sessions
FOR EACH ROW
WHEN (OLD.board IS DISTINCT FROM NEW.board)
EXECUTE FUNCTION update_last_move_timestamp();

-- Trigger para atualizar 'last_move_at' a cada jogada no jogo da memória
CREATE TRIGGER update_memory_game_timestamp
BEFORE UPDATE ON memory_game_sessions
FOR EACH ROW
WHEN (OLD.matches IS DISTINCT FROM NEW.matches)
EXECUTE FUNCTION update_last_move_timestamp();

-- Índice para otimizar consultas por último reset
CREATE INDEX IF NOT EXISTS memory_game_sessions_last_reset_idx ON memory_game_sessions (last_reset);
CREATE INDEX IF NOT EXISTS memory_game_sessions_current_turn_idx ON memory_game_sessions (current_player_id);

-- Trigger para atualizar last_reset quando houver alteração nas cartas
CREATE TRIGGER update_memory_reset_timestamp
BEFORE UPDATE OF cards ON memory_game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_move_timestamp();

-- Função para limpar jogos antigos (pode ser executada periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_games()
RETURNS void AS $$
BEGIN
  -- Remover jogos da velha em espera que não tiveram atividade nas últimas 24 horas
  DELETE FROM game_sessions 
  WHERE status = 'waiting' 
  AND last_move_at < NOW() - INTERVAL '24 hours';
  
  -- Remover jogos da velha concluídos que não tiveram atividade nas últimas 72 horas
  DELETE FROM game_sessions 
  WHERE (status = 'finished') 
  AND last_move_at < NOW() - INTERVAL '72 hours';
  
  -- Remover jogos da memória em espera que não tiveram atividade nas últimas 24 horas
  DELETE FROM memory_game_sessions 
  WHERE status = 'waiting' 
  AND last_move_at < NOW() - INTERVAL '24 hours';
  
  -- Remover jogos da memória concluídos que não tiveram atividade nas últimas 72 horas
  DELETE FROM memory_game_sessions 
  WHERE (status = 'finished') 
  AND last_move_at < NOW() - INTERVAL '72 hours';
END;
$$ LANGUAGE plpgsql;