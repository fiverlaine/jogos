import { NextRequest, NextResponse } from 'next/server';
import { getMemoryGame, supabase } from '@/lib/supabase';

// Rota GET para obter os detalhes de um jogo da memória por ID
export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const resolvedParams = await params;
    const gameId = resolvedParams.gameId;

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo não fornecido' },
        { status: 400 }
      );
    }

    console.log(`[API] Buscando jogo com ID: ${gameId}`);
    
    // Buscar o jogo pelo ID usando a função auxiliar existente
    const game = await getMemoryGame(gameId);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se há um jogo de revanche associado
    if (game.rematch_game_id && game.rematch_game_id !== game.id) {
      console.log(`[API] Jogo ${gameId} tem jogo de revanche: ${game.rematch_game_id}`);
      
      // Enviar broadcast para todos os jogadores
      try {
        const channel = `memory_game_${gameId}`;
        const payload = {
          type: 'REMATCH_ACCEPTED',
          rematch_game_id: game.rematch_game_id,
          message: 'Revanche aceita! Redirecionando para o novo jogo.',
          timestamp: new Date().toISOString()
        };
        
        // Enviar broadcast via Supabase
        const broadcastResponse = await supabase
          .channel(channel)
          .send({
            type: 'broadcast',
            event: 'rematch',
            payload
          });
        
        console.log(`[API] Broadcast enviado para ${channel}:`, broadcastResponse);
      } catch (broadcastError) {
        console.error(`[API] Exceção ao enviar broadcast:`, broadcastError);
      }
    }
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('[API] Erro na rota GET /api/memory-game/[gameId]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 