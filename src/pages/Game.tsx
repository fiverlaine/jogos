import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TicTacToe from '@/components/tic-tac-toe';
import OnlineTicTacToe from '@/components/online-game/online-tictactoe';
import { useUser } from '@/lib/hooks/useUser';
import { getGameById as getGameData } from '@/data/games';

export default function Game() {
  const router = useRouter();
  const { id: gameId } = router.query;
  const { user } = useUser();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    
    // Buscar dados do jogo
    const gameData = getGameData(gameId as string);
    setGame(gameData);
    setLoading(false);
  }, [gameId]);

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (!game) {
    return <div className="container mx-auto p-4">Jogo não encontrado</div>;
  }

  // Renderizar o jogo apropriado baseado no ID
  if (gameId === 'tictactoe') {
    return <TicTacToe />;
  }

  if (gameId === 'online-tictactoe') {
    if (!user) {
      router.push('/login');
      return <div className="container mx-auto p-4">Redirecionando para o login...</div>;
    }
    return <OnlineTicTacToe />;
  }

  // Temporariamente indisponível para o jogo da memória
  if (gameId === 'memory') {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Jogo da Memória</h1>
        <p className="mb-4">O jogo da memória está temporariamente indisponível.</p>
        <button 
          onClick={() => router.push('/games')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Voltar para jogos
        </button>
      </div>
    );
  }

  // Fallback para outros jogos
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{game.title}</h1>
      <p>{game.description}</p>
    </div>
  );
} 