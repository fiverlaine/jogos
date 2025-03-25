import { NextResponse } from "next/server";
import { joinMemoryGame } from "@/lib/memory-supabase";

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { player_2_id, player_2_nickname } = await request.json();
    const { gameId } = params;

    // Validar os dados de entrada
    if (!gameId || !player_2_id || !player_2_nickname) {
      return NextResponse.json(
        { error: "Dados inválidos para entrar no jogo" },
        { status: 400 }
      );
    }

    // Entrar no jogo
    const success = await joinMemoryGame(gameId, {
      id: player_2_id,
      nickname: player_2_nickname,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Não foi possível entrar no jogo" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Erro ao entrar no jogo:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 