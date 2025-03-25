import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Função para executar SQL diretamente no Supabase
export async function GET() {
  try {
    // Criar cliente Supabase com as variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Credenciais do Supabase não configuradas' 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // SQL para corrigir ou criar a tabela memory_game_sessions
    const sqlCommands = `
    -- Verificar se a tabela já existe
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'memory_game_sessions'
      ) THEN
        -- Criar tabela se não existir
        CREATE TABLE memory_game_sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
        
        ALTER TABLE memory_game_sessions DISABLE ROW LEVEL SECURITY;
      ELSE
        -- Verificar e adicionar colunas faltantes
        -- started_at é a que está dando problema
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'memory_game_sessions'
          AND column_name = 'started_at'
        ) THEN
          ALTER TABLE memory_game_sessions ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END IF;
    END $$;
    
    -- Criar índices se não existirem
    CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_status ON memory_game_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_1_id ON memory_game_sessions(player_1_id);
    CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_2_id ON memory_game_sessions(player_2_id);
    `;
    
    // Tentar executar o SQL
    // Infelizmente, não podemos executar SQL arbitrário diretamente,
    // mas podemos tentar outras abordagens seguras.
    
    // Vamos tentar um método alternativo: criar uma tabela temporária 
    // Para este projeto, adaptamos o código para funcionar com as limitações
    
    // Modificar nossa API para trabalhar sem a coluna problemática
    return NextResponse.json({
      message: 'Para resolver este problema, por favor execute o SQL no painel de controle do Supabase',
      sql: sqlCommands
    });
    
  } catch (error: any) {
    console.error('Erro ao executar SQL:', error);
    return NextResponse.json({ 
      error: 'Erro ao executar SQL',
      details: error.message 
    }, { status: 500 });
  }
} 