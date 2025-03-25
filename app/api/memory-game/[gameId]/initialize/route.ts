import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  // Ensure params is awaited before using its properties
  const { gameId } = await params;
  
  try {
    // Verificar se o ID do jogo é válido
    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo é obrigatório' },
        { status: 400 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { cards, grid_config } = body;
    
    // Validar os dados
    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Cartas inválidas' },
        { status: 400 }
      );
    }
    
    if (!grid_config || !grid_config.rows || !grid_config.cols) {
      return NextResponse.json(
        { error: 'Configuração de grade inválida' },
        { status: 400 }
      );
    }
    
    // Verificar se o jogo existe
    const { data: existingGame, error: checkError } = await supabase
      .from('memory_game_sessions')
      .select('id, status')
      .eq('id', gameId)
      .single();
      
    if (checkError) {
      return NextResponse.json(
        { error: 'Jogo não encontrado', details: checkError.message },
        { status: 404 }
      );
    }
    
    // Atualizar o jogo com as cartas inicializadas
    const { data, error } = await supabase
      .from('memory_game_sessions')
      .update({
        cards,
        grid_config,
        last_reset: new Date().toISOString()
      })
      .eq('id', gameId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inicializar cartas:', error);
      return NextResponse.json(
        { error: 'Erro ao inicializar cartas', details: error.message },
        { status: 500 }
      );
    }
    
    // Retornar os dados atualizados
    return NextResponse.json({
      success: true,
      message: 'Cartas inicializadas com sucesso',
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}