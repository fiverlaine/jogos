import { NextRequest, NextResponse } from 'next/server';
import { supabase, getMemoryGame, requestMemoryRematch } from '@/lib/supabase';

async function sendMultipleBroadcasts(gameId: string, rematchGameId: string) {
  console.log(`[REVANCHE] Enviando broadcasts para notificar aceitação de revanche (jogo ${gameId} -> ${rematchGameId})`);
  
  try {
    // Canal específico do jogo
    const gameChannel = `memory_game_${gameId}`;
    const rematchPayload = {
      type: 'REMATCH_ACCEPTED',
      original_game_id: gameId,
      rematch_game_id: rematchGameId,
      message: 'Revanche aceita! Redirecionando para o novo jogo.',
      timestamp: new Date().toISOString()
    };
    
    // Enviar via canal específico
    await supabase
      .channel(gameChannel)
      .send({
        type: 'broadcast',
        event: 'rematch',
        payload: rematchPayload
      });
    
    // Enviar via canal geral como backup
    await supabase
      .channel('memory-game')
      .send({
        type: 'broadcast',
        event: 'rematch_accepted',
        payload: {
          ...rematchPayload,
          is_broadcast: true
        }
      });
    
    console.log(`[REVANCHE] Broadcasts enviados com sucesso para o jogo ${gameId}`);
    return true;
  } catch (error) {
    console.error(`[REVANCHE] Erro ao enviar broadcasts para o jogo ${gameId}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    const { playerId, rematchGameId } = body;
    
    if (!gameId) {
      return NextResponse.json({ error: 'ID do jogo não fornecido' }, { status: 400 });
    }
    
    if (!playerId) {
      return NextResponse.json({ error: 'ID do jogador não fornecido' }, { status: 400 });
    }
    
    console.log(`[REVANCHE] Processando solicitação de aceitação de revanche para o jogo ${gameId}`);
    
    // Obter o jogo atual
    const game = await getMemoryGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    
    // Se não foi fornecido um ID de revanche na solicitação, verificar se o jogo já tem um
    let updatedRematchGameId = rematchGameId || game.rematch_game_id;
    
    if (!updatedRematchGameId) {
      return NextResponse.json({ 
        error: 'Nenhum ID de jogo de revanche fornecido ou disponível no jogo atual' 
      }, { status: 400 });
    }
    
    // Atualizar o jogo com o ID de revanche e marcar como aceito
    const { data: updatedGame, error: updateError } = await supabase
      .from('memory_games')
      .update({
        rematch_game_id: updatedRematchGameId,
        rematch_accepted: true,
        rematch_requested_by: null, // Limpar solicitante ao aceitar
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[REVANCHE] Erro ao atualizar jogo com aceitação de revanche:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar jogo' }, { status: 500 });
    }
    
    // Enviar broadcasts múltiplos para garantir que todos os jogadores sejam notificados
    const broadcastSuccess = await sendMultipleBroadcasts(gameId, updatedRematchGameId);
    
    // Aguardar um momento para dar tempo aos broadcasts serem processados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Enviar um segundo broadcast caso o primeiro não tenha funcionado
    if (!broadcastSuccess) {
      console.log('[REVANCHE] Tentando enviar broadcasts novamente após falha inicial');
      await sendMultipleBroadcasts(gameId, updatedRematchGameId);
    }
    
    // Verificar e atualizar também o jogo de revanche para garantir a sincronização bidirecional
    const rematchGame = await getMemoryGame(updatedRematchGameId);
    if (rematchGame) {
      // Atualizar o jogo de revanche com referência ao jogo original
      await supabase
        .from('memory_games')
        .update({
          original_game_id: gameId,
          is_rematch: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedRematchGameId);
      
      console.log(`[REVANCHE] Jogo de revanche ${updatedRematchGameId} atualizado com referência ao jogo original ${gameId}`);
    }
    
    return NextResponse.json({
      message: 'Revanche aceita com sucesso!',
      game: updatedGame,
      rematch_game_id: updatedRematchGameId,
      broadcasts_sent: broadcastSuccess,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[REVANCHE] Erro na API accept-rematch:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor ao processar aceitação de revanche' 
    }, { status: 500 });
  }
} 