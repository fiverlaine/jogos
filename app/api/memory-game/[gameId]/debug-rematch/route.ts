import { NextRequest, NextResponse } from 'next/server';
import { supabase, getMemoryGame } from '@/lib/supabase';

// Interface para o status de revanche com todas as propriedades necessárias
interface RematchStatus {
  has_rematch_game_id: boolean;
  rematch_game_id: string | null;
  rematch_accepted: boolean;
  rematch_requested_by: string | null;
  status: 'waiting' | 'playing' | 'finished';
  timestamp: string;
  broadcast_sent?: boolean;
  broadcast_error?: string;
  rematch_game_found?: boolean;
  rematch_game_status?: 'waiting' | 'playing' | 'finished';
  rematch_game_players?: {
    player_1: string | null;
    player_2: string | null;
  };
}

export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId;
    
    if (!gameId) {
      return NextResponse.json({ error: 'ID do jogo não fornecido' }, { status: 400 });
    }
    
    console.log(`[DEBUG REVANCHE] Verificando jogo ${gameId}`);
    
    // Buscar o jogo atual
    const game = await getMemoryGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    
    // Status de revanche
    const rematchStatus: RematchStatus = {
      has_rematch_game_id: !!game.rematch_game_id,
      rematch_game_id: game.rematch_game_id,
      rematch_accepted: !!game.rematch_accepted,
      rematch_requested_by: game.rematch_requested_by,
      status: game.status,
      timestamp: new Date().toISOString()
    };
    
    // Se existe um ID de revanche, enviar broadcast manual para garantir sincronização
    if (game.rematch_game_id) {
      try {
        const channel = supabase.channel('memory-game');
        await channel.send({
          type: 'broadcast',
          event: 'rematch_accepted',
          payload: {
            original_game_id: gameId,
            new_game_id: game.rematch_game_id,
            timestamp: new Date().toISOString(),
            is_debug: true
          }
        });
        console.log('[DEBUG REVANCHE] Broadcast de sincronização enviado');
        rematchStatus.broadcast_sent = true;
      } catch (error) {
        console.error('[DEBUG REVANCHE] Erro ao enviar broadcast:', error);
        rematchStatus.broadcast_sent = false;
        rematchStatus.broadcast_error = error instanceof Error ? error.message : 'Erro desconhecido';
      }
    }
    
    // Buscar o jogo de revanche se houver
    let rematchGame = null;
    if (game.rematch_game_id) {
      rematchGame = await getMemoryGame(game.rematch_game_id);
      rematchStatus.rematch_game_found = !!rematchGame;
      
      if (rematchGame) {
        rematchStatus.rematch_game_status = rematchGame.status;
        rematchStatus.rematch_game_players = {
          player_1: rematchGame.player_1_nickname,
          player_2: rematchGame.player_2_nickname
        };
      }
    }
    
    return NextResponse.json({
      game_id: gameId,
      rematch_status: rematchStatus,
      game: game,
      rematch_game: rematchGame,
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG REVANCHE] Erro ao processar diagnóstico:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    const { force_rematch_id } = body;
    
    if (!gameId) {
      return NextResponse.json({ error: 'ID do jogo não fornecido' }, { status: 400 });
    }
    
    console.log(`[DEBUG REVANCHE] Forçando ID de revanche ${force_rematch_id} para o jogo ${gameId}`);
    
    // Verificar se o jogo existe
    const game = await getMemoryGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    
    // Verificar se o jogo de revanche existe se fornecido
    if (force_rematch_id) {
      const rematchGame = await getMemoryGame(force_rematch_id);
      if (!rematchGame) {
        return NextResponse.json({ error: 'Jogo de revanche não encontrado' }, { status: 404 });
      }
      
      // Forçar a atualização do ID de revanche no jogo original
      const { error: updateError } = await supabase
        .from('memory_game_sessions')
        .update({
          rematch_game_id: force_rematch_id,
          rematch_accepted: true,
          rematch_requested_by: null
        })
        .eq('id', gameId);
      
      if (updateError) {
        console.error('[DEBUG REVANCHE] Erro ao forçar atualização:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao forçar atualização', 
          details: updateError.message
        }, { status: 500 });
      }
      
      // Enviar broadcast para notificar todos os jogadores
      try {
        const channel = supabase.channel('memory-game');
        await channel.send({
          type: 'broadcast',
          event: 'rematch_accepted',
          payload: {
            original_game_id: gameId,
            new_game_id: force_rematch_id,
            timestamp: new Date().toISOString(),
            is_forced: true
          }
        });
        console.log('[DEBUG REVANCHE] Broadcast de revanche forçada enviado com sucesso');
      } catch (error) {
        console.error('[DEBUG REVANCHE] Erro ao enviar broadcast de revanche forçada:', error);
      }
      
      // Retornar status atualizado
      return NextResponse.json({
        success: true,
        message: 'ID de revanche forçado com sucesso',
        game_id: gameId,
        rematch_game_id: force_rematch_id,
        updated_at: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ error: 'ID de revanche não fornecido' }, { status: 400 });
    }
  } catch (error) {
    console.error('[DEBUG REVANCHE] Erro ao forçar ID de revanche:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 