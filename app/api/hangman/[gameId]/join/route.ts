import { NextResponse } from 'next/server';
import { joinHangmanGameSession } from '@/lib/hangman-supabase';

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const gameId = params.gameId;
    const body = await request.json();
    
    // Extrair informações do jogador
    const { player_id, player_nickname } = body;
    
    if (!player_id || !player_nickname) {
      return NextResponse.json(
        { error: 'ID e nickname do jogador são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Usar a função joinHangmanGameSession específica para o jogo da forca
    const success = await joinHangmanGameSession(gameId, {
      id: player_id,
      nickname: player_nickname
    });
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Não foi possível entrar no jogo' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 