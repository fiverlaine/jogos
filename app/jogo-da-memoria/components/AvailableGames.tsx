import React, { useEffect } from 'react';
import { useAvailableMemoryGames } from '@/lib/memory-game/useMemoryGame';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsersIcon, Clock, Layers, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Definir a interface do jogo
interface Game {
  id: string;
  creatorNickname: string;
  createdAt: string;
  rows: number;
  cols: number;
  players: any[];
  status: string;
}

// Criar um componente CardDescription já que não é exportado do módulo card
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm text-muted-foreground ${className || ''}`}
    {...props}
  />
))
CardDescription.displayName = "CardDescription";

export const AvailableGames = () => {
  const { games, loading, error, refreshGames } = useAvailableMemoryGames();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Iniciar a assinatura em tempo real ao montar o componente
    // (implementado dentro do hook useAvailableMemoryGames)
    
    // Ainda mantemos um refresh periódico como fallback a cada 10 segundos
    const intervalId = setInterval(() => {
      refreshGames();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [refreshGames]);

  const handleJoinGame = (gameId: string) => {
    router.push(`/jogo-da-memoria/online/${gameId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Partidas Disponíveis</h2>
          <p className="text-slate-400 text-sm">Junte-se a uma partida existente ou crie sua própria.</p>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> 
            Atualizando...
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg text-red-300 text-sm"
        >
          Erro ao carregar jogos: {error}
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {games.length === 0 ? (
          <motion.div 
            key="no-games"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg text-center"
          >
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="p-3 bg-slate-700/50 rounded-full">
                <UsersIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Nenhuma partida disponível</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Não há jogos disponíveis no momento. Crie um novo jogo para começar!
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game: Game) => (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      Jogo de {game.creatorNickname}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> Criado {formatTimeAgo(game.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        <span>Tabuleiro {game.rows}x{game.cols}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <UsersIcon className="h-4 w-4 text-purple-400" />
                        <span>{game.players.length}/2 jogadores</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="default"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                      onClick={() => handleJoinGame(game.id)}
                      disabled={!user}
                    >
                      Entrar no Jogo
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Função auxiliar para formatar o tempo relativo (ex: "há 5 minutos")
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
} 