-- Habilitar modo inseguro para operações
SET session_replication_role = 'replica';

-- Criar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar para publicação em tempo real
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE game_sessions, memory_game_sessions;

-- Criar tabela de sessões de jogo
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_move_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_player_id UUID NOT NULL,
  player_x_id UUID NOT NULL,
  player_x_nickname TEXT NOT NULL,
  player_o_id UUID,
  player_o_nickname TEXT,
  winner_id UUID,
  board TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  rematch_requested_by UUID,
  rematch_game_id UUID
);

-- Desabilitar RLS para acesso anônimo
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_x_id ON game_sessions(player_x_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_o_id ON game_sessions(player_o_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_rematch_requested_by ON game_sessions(rematch_requested_by);

-- Função para atualizar o timestamp de última jogada
CREATE OR REPLACE FUNCTION update_last_move_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_move_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp quando o tabuleiro for modificado
DROP TRIGGER IF EXISTS update_last_move_timestamp_trigger ON game_sessions;
CREATE TRIGGER update_last_move_timestamp_trigger
BEFORE UPDATE OF board ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_move_timestamp();

-- Função para limpar jogos antigos (mais de 24 horas sem atividade)
CREATE OR REPLACE FUNCTION cleanup_old_games()
RETURNS void AS $$
BEGIN
  DELETE FROM game_sessions
  WHERE last_move_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza diária de jogos antigos
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_old_games()');

-- Comentários para documentação
COMMENT ON TABLE game_sessions IS 'Tabela para armazenar sessões de jogo da velha online';
COMMENT ON COLUMN game_sessions.id IS 'ID único da sessão de jogo';
COMMENT ON COLUMN game_sessions.created_at IS 'Data e hora de criação da sessão';
COMMENT ON COLUMN game_sessions.last_move_at IS 'Data e hora da última jogada';
COMMENT ON COLUMN game_sessions.current_player_id IS 'ID do jogador que deve fazer a próxima jogada';
COMMENT ON COLUMN game_sessions.player_x_id IS 'ID do jogador X (criador do jogo)';
COMMENT ON COLUMN game_sessions.player_x_nickname IS 'Apelido do jogador X';
COMMENT ON COLUMN game_sessions.player_o_id IS 'ID do jogador O (segundo jogador)';
COMMENT ON COLUMN game_sessions.player_o_nickname IS 'Apelido do jogador O';
COMMENT ON COLUMN game_sessions.winner_id IS 'ID do jogador vencedor (null se empate ou jogo em andamento)';
COMMENT ON COLUMN game_sessions.board IS 'Tabuleiro do jogo como array de 9 posições (vazio, X ou O)';
COMMENT ON COLUMN game_sessions.status IS 'Status do jogo: waiting (aguardando), playing (em andamento) ou finished (finalizado)';

-- Criar tabela para o jogo da memória
CREATE TABLE IF NOT EXISTS memory_game_sessions (
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
  rematch_new_game_id UUID,
  reset_pending BOOLEAN DEFAULT FALSE,
  cards_to_reset JSONB DEFAULT '[]'::jsonb,
  reset_scheduled_at TIMESTAMP WITH TIME ZONE,
  last_reset TIMESTAMP WITH TIME ZONE
);

-- Desabilitar RLS para acesso anônimo à tabela de jogo da memória
ALTER TABLE memory_game_sessions DISABLE ROW LEVEL SECURITY;

-- Criar índices para melhorar performance na tabela de jogo da memória
CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_status ON memory_game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_1_id ON memory_game_sessions(player_1_id);
CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_2_id ON memory_game_sessions(player_2_id);

-- Trigger para atualizar o timestamp quando as cartas forem modificadas
DROP TRIGGER IF EXISTS update_memory_last_move_timestamp_trigger ON memory_game_sessions;
CREATE TRIGGER update_memory_last_move_timestamp_trigger
BEFORE UPDATE OF cards ON memory_game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_move_timestamp();

-- Função para limpar jogos da memória antigos (mais de 24 horas sem atividade)
CREATE OR REPLACE FUNCTION cleanup_old_memory_games()
RETURNS void AS $$
BEGIN
  DELETE FROM memory_game_sessions
  WHERE last_move_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza diária de jogos da memória antigos
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_old_memory_games()');

-- Restaurar modo seguro
SET session_replication_role = 'origin'; 