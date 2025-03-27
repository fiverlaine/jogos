-- Habilitar modo inseguro para operações
SET session_replication_role = 'replica';

-- Criar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar para publicação em tempo real
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE game_sessions, memory_game_sessions, hangman_game_sessions;

-- Criar tabela para o jogo da forca
CREATE TABLE IF NOT EXISTS hangman_game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_move_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_player_id TEXT NOT NULL,
  player_1_id TEXT NOT NULL,
  player_1_nickname TEXT NOT NULL,
  player_2_id TEXT,
  player_2_nickname TEXT,
  word TEXT NOT NULL,        -- Palavra a ser adivinhada
  hint TEXT NOT NULL,        -- Dica para a palavra
  guessed_letters TEXT[] DEFAULT '{}',  -- Letras já tentadas
  errors INTEGER DEFAULT 0,   -- Número de erros cometidos
  winner_id TEXT,            -- ID do jogador vencedor
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  rematch_requested_by TEXT DEFAULT NULL,
  rematch_game_id UUID DEFAULT NULL,
  game_time INTEGER DEFAULT 0 -- Tempo de jogo em segundos
);

-- Desabilitar RLS para acesso anônimo
ALTER TABLE hangman_game_sessions DISABLE ROW LEVEL SECURITY;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_hangman_game_sessions_status ON hangman_game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_hangman_game_sessions_player_1_id ON hangman_game_sessions(player_1_id);
CREATE INDEX IF NOT EXISTS idx_hangman_game_sessions_player_2_id ON hangman_game_sessions(player_2_id);

-- Função para atualizar o timestamp de última jogada
CREATE OR REPLACE FUNCTION update_hangman_last_move_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_move_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp quando as letras adivinhadas forem modificadas
DROP TRIGGER IF EXISTS update_hangman_last_move_timestamp_trigger ON hangman_game_sessions;
CREATE TRIGGER update_hangman_last_move_timestamp_trigger
BEFORE UPDATE OF guessed_letters ON hangman_game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_hangman_last_move_timestamp();

-- Função para limpar jogos antigos (mais de 24 horas sem atividade)
CREATE OR REPLACE FUNCTION cleanup_old_hangman_games()
RETURNS void AS $$
BEGIN
  DELETE FROM hangman_game_sessions
  WHERE last_move_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza diária de jogos antigos
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_old_hangman_games()');

-- Comentários para documentação
COMMENT ON TABLE hangman_game_sessions IS 'Tabela para armazenar sessões de jogo da forca online';
COMMENT ON COLUMN hangman_game_sessions.id IS 'ID único da sessão de jogo';
COMMENT ON COLUMN hangman_game_sessions.created_at IS 'Data e hora de criação da sessão';
COMMENT ON COLUMN hangman_game_sessions.last_move_at IS 'Data e hora da última jogada';
COMMENT ON COLUMN hangman_game_sessions.current_player_id IS 'ID do jogador que deve fazer a próxima jogada';
COMMENT ON COLUMN hangman_game_sessions.player_1_id IS 'ID do jogador 1 (criador do jogo)';
COMMENT ON COLUMN hangman_game_sessions.player_1_nickname IS 'Apelido do jogador 1';
COMMENT ON COLUMN hangman_game_sessions.player_2_id IS 'ID do jogador 2 (segundo jogador)';
COMMENT ON COLUMN hangman_game_sessions.player_2_nickname IS 'Apelido do jogador 2';
COMMENT ON COLUMN hangman_game_sessions.word IS 'Palavra a ser adivinhada';
COMMENT ON COLUMN hangman_game_sessions.hint IS 'Dica para a palavra';
COMMENT ON COLUMN hangman_game_sessions.guessed_letters IS 'Letras já tentadas pelo jogador';
COMMENT ON COLUMN hangman_game_sessions.errors IS 'Número de erros cometidos';
COMMENT ON COLUMN hangman_game_sessions.winner_id IS 'ID do jogador vencedor (null se perdeu ou jogo em andamento)';
COMMENT ON COLUMN hangman_game_sessions.status IS 'Status do jogo: waiting (aguardando), playing (em andamento) ou finished (finalizado)';

-- Restaurar modo seguro
SET session_replication_role = 'origin';