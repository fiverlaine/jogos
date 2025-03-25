import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Criar uma rota para configurar o Supabase
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
    
    // Verificar se a tabela já existe
    const { data: tables, error: tablesError } = await supabase
      .from('memory_game_sessions')
      .select('id')
      .limit(1);
    
    if (!tablesError) {
      return NextResponse.json({ 
        message: 'Tabela memory_game_sessions já existe',
        exists: true 
      });
    }
    
    // Se a tabela não existe, criar usando SQL (via API do projeto)
    try {
      // Aqui usamos fetch para chamar o ponto de extremidade SQL do Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          name: 'create_memory_game_table',
          schema: 'public',
          definition: `
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
              rematch_new_game_id UUID
            );
            
            ALTER TABLE memory_game_sessions DISABLE ROW LEVEL SECURITY;
            
            CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_status ON memory_game_sessions(status);
            CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_1_id ON memory_game_sessions(player_1_id);
            CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_player_2_id ON memory_game_sessions(player_2_id);
          `
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ 
          error: 'Erro ao criar tabela via API',
          details: errorData 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Tabela memory_game_sessions criada com sucesso',
        success: true 
      });
    } catch (sqlError) {
      console.error('Erro ao executar SQL:', sqlError);
      return NextResponse.json({ 
        error: 'Erro ao executar SQL para criar tabela',
        details: sqlError 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao configurar Supabase:', error);
    return NextResponse.json({ 
      error: 'Erro ao configurar Supabase',
      details: error 
    }, { status: 500 });
  }
} 