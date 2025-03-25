import { NextResponse } from 'next/server';
import { getMemoryGame } from '@/lib/supabase';

export async function GET(
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
    console.log(`API: Buscando cartas do jogo da memória ${gameId}`);
    
    // Obter o jogo completo
    const game = await getMemoryGame(gameId);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o jogo tem cartas
    if (!game.cards || game.cards.length === 0 || game.cards.some(card => !card.iconName)) {
      return NextResponse.json(
        { success: false, message: 'Jogo ainda não possui cartas inicializadas' },
        { status: 200 }
      );
    }
    
    // Retornar apenas as cartas
    return NextResponse.json({
      success: true,
      message: 'Cartas encontradas',
      cards: game.cards
    });
  } catch (error) {
    console.error(`API: Erro ao buscar cartas do jogo ${gameId}:`, error);
    
    return NextResponse.json(
      { error: 'Erro ao buscar cartas do jogo' },
      { status: 500 }
    );
  }
} 