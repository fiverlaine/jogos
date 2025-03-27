-- Criar tabela específica para o jogo da forca
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
CREATE INDEX IF NOT EXISTS hangman_game_sessions_status_idx ON hangman_game_sessions (status);
CREATE INDEX IF NOT EXISTS hangman_game_sessions_player_1_idx ON hangman_game_sessions (player_1_id);
CREATE INDEX IF NOT EXISTS hangman_game_sessions_player_2_idx ON hangman_game_sessions (player_2_id);

-- Função para atualizar o timestamp 'last_move_at'
CREATE OR REPLACE FUNCTION update_hangman_last_move_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_move_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar 'last_move_at' a cada jogada
CREATE TRIGGER update_hangman_game_timestamp
BEFORE UPDATE ON hangman_game_sessions
FOR EACH ROW
WHEN (OLD.guessed_letters IS DISTINCT FROM NEW.guessed_letters)
EXECUTE FUNCTION update_hangman_last_move_timestamp();

-- Adicionar à publicação Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hangman_game_sessions;