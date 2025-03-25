import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MemoryCard } from '@/lib/supabase';

interface InitializeRequest {
  cards: MemoryCard[];
  grid_config: { rows: number; cols: number };
}

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  const gameId = params.gameId;
  
  if (!gameId) {
    return NextResponse.json(
      { error: 'ID do jogo não fornecido' },
      { status: 400 }
    );
  }
  
  try {
    // Verificar se o jogo existe
    const { data: gameExists, error: gameCheckError } = await supabase
      .from('memory_game_sessions')
      .select('id, status')
      .eq('id', gameId)
      .single();
      
    if (gameCheckError || !gameExists) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter os dados da requisição
    const requestData: InitializeRequest = await request.json();
    
    if (!requestData.cards || !Array.isArray(requestData.cards) || requestData.cards.length === 0) {
      return NextResponse.json(
        { error: 'Cartas não fornecidas ou inválidas' },
        { status: 400 }
      );
    }
    
    // Atualizar o jogo com as cartas
    const { data, error } = await supabase
      .from('memory_game_sessions')
      .update({
        cards: requestData.cards,
        grid_config: requestData.grid_config || { rows: 4, cols: 4 },
        status: 'playing', // Garantir que o jogo esteja em status playing
        last_move_at: new Date().toISOString()
      })
      .eq('id', gameId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inicializar cartas no Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao inicializar cartas' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cartas inicializadas com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao processar requisição de inicialização:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
} 