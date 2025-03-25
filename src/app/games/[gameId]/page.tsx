import { notFound } from 'next/navigation';
import { getGameById } from '@/data/games';

// Remover importação do jogo da memória
// import OnlineMemoryGame from '../memory/online-memory-game';

export default function GamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const game = getGameById(gameId);
  
  if (!game) {
    return notFound();
  }
  
  // Remover renderização do jogo da memória
  // if (gameId === 'memory') {
  //   return <OnlineMemoryGame gameId={gameId} />;
  // }
  
  // Redirecionar para a página inicial se tentar acessar o jogo da memória diretamente
  if (gameId === 'memory') {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Jogo da Memória</h1>
        <p className="mb-4">O jogo da memória está temporariamente indisponível.</p>
        <a href="/games" className="text-blue-500 hover:underline">
          Voltar para a página de jogos
        </a>
      </div>
    );
  }
  
  // Renderização de outros jogos
  return (
    <div>
      {/* Conteúdo de outros jogos */}
    </div>
  );
} 