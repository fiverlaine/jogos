import { NextRequest, NextResponse } from 'next/server';
import { startMemoryGame, updateMemoryGameStatus, getMemoryGame } from '@/lib/supabase';

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    const { status, current_player_id } = body;
    
    if (!gameId) {
      return NextResponse.json({ error: 'ID do jogo não fornecido' }, { status: 400 });
    }
    
    // Primeiro verificar o estado atual do jogo
    const currentGame = await getMemoryGame(gameId);
    if (!currentGame) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    
    // Verificar se o jogo tem dois jogadores mas ainda está com status 'waiting'
    if (currentGame.player_1_id && currentGame.player_2_id && currentGame.status === 'waiting') {
      console.log(`API: Corrigindo jogo ${gameId} que tem 2 jogadores mas status ainda é waiting`);
      // Forçar a inicialização do jogo
      const updatedGame = await startMemoryGame(gameId);
      
      if (!updatedGame) {
        return NextResponse.json({ error: 'Falha ao iniciar o jogo' }, { status: 500 });
      }
      
      return NextResponse.json(updatedGame);
    }
    
    // Caso normal: atualizar o status do jogo conforme solicitado
    if (status === 'playing' && current_player_id) {
      // Atualizar o status do jogo para 'playing' e definir o jogador atual
      const updatedGame = await startMemoryGame(gameId);
      
      if (!updatedGame) {
        return NextResponse.json({ error: 'Falha ao atualizar o jogo' }, { status: 500 });
      }
      
      return NextResponse.json(updatedGame);
    } else {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}