import { NextResponse } from 'next/server';
import { startMemoryGame } from '@/lib/supabase';

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
    console.log(`API: Iniciando jogo da memória ${gameId}`);
    
    // Iniciar o jogo usando a função de biblioteca existente
    const updatedGame = await startMemoryGame(gameId);
    
    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Falha ao iniciar o jogo' },
        { status: 500 }
      );
    }
    
    console.log(`API: Jogo da memória ${gameId} iniciado com sucesso`);
    
    // Retornar os dados atualizados do jogo
    return NextResponse.json({
      success: true,
      message: 'Jogo iniciado com sucesso',
      data: updatedGame
    });
  } catch (error) {
    console.error(`API: Erro ao iniciar jogo ${gameId}:`, error);
    
    return NextResponse.json(
      { error: 'Erro ao iniciar o jogo' },
      { status: 500 }
    );
  }
} 