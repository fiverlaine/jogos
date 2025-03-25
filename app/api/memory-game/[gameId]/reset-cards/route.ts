import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    
    // Verificar se o ID do jogo é válido
    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo é obrigatório' },
        { status: 400 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { cards, reset_pending = false, cards_to_reset = [] } = body;
    
    // Validar os dados
    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Cartas inválidas' },
        { status: 400 }
      );
    }
    
    // Preparar os dados para atualização
    const updateData = {
      cards,
      reset_pending,
      cards_to_reset,
      last_reset: new Date().toISOString()
    };
    
    // Realizar a atualização no Supabase
    const { data, error } = await supabase
      .from('memory_game_sessions')
      .update(updateData)
      .eq('id', gameId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar jogo:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar jogo', details: error.message },
        { status: 500 }
      );
    }
    
    // Retornar os dados atualizados
    return NextResponse.json({
      success: true,
      message: 'Cartas resetadas com sucesso',
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