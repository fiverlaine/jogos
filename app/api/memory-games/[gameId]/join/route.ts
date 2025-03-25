import { NextResponse } from "next/server";
import { joinMemoryGame } from "@/lib/memory-game/memorygameservice";

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
    const game = await joinMemoryGame(gameId, player_2_id, player_2_nickname);

    if (game) {
      return NextResponse.json({ success: true, game });
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