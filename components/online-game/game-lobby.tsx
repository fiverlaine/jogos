"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createGameSession, getAvailableGames, GameSession, Player } from "@/lib/supabase";
import { Loader2, RefreshCw, Plus, Users, Clock, Trophy, UserCheck, ArrowLeft, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface GameLobbyProps {
  playerNickname: string;
  playerId: string;
}

export function GameLobby({ playerNickname, playerId }: GameLobbyProps) {
  const router = useRouter();
  const [availableGames, setAvailableGames] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const games = await getAvailableGames();
        setAvailableGames(games || []);
      } catch (error) {
        console.error("Erro ao buscar jogos disponíveis:", error);
        toast.error("Não foi possível carregar os jogos disponíveis");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchGames();
  }, [refreshKey]);

  const handleCreateGame = async () => {
    try {
      setIsCreatingGame(true);
      console.log("Criando jogo com jogador:", playerNickname, playerId);
      
      // Criar um objeto Player para passar para a função createGameSession
      const player: Player = {
        id: playerId,
        nickname: playerNickname
      };
      
      const game = await createGameSession(player);

      if (game) {
        toast.success("Jogo criado com sucesso!");
        router.push(`/jogo-da-velha/online/${game.id}`);
      } else {
        toast.error("Não foi possível criar um novo jogo");
      }
    } catch (error) {
      console.error("Erro ao criar jogo:", error);
      toast.error("Erro ao criar jogo");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId: string, hostNickname: string) => {
    try {
      setIsJoiningGame(true);
      
      // Atualizar o jogo para adicionar o jogador O
      const response = await fetch(`/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_o_id: playerId,
          player_o_nickname: playerNickname
        }),
      });
      
      if (response.ok) {
        toast.success(`Entrando no jogo de ${hostNickname}`);
        router.push(`/jogo-da-velha/online/${gameId}`);
      } else {
        toast.error("Não foi possível entrar no jogo");
        // Atualizar a lista de jogos
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao entrar no jogo:", error);
      toast.error("Erro ao entrar no jogo");
    } finally {
      setIsJoiningGame(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes === 1) return "1 minuto atrás";
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return "1 hora atrás";
    return `${hours} horas atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com gradiente e efeito de vidro */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-sm p-6 shadow-lg"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Lobby de Jogos</h2>
            <p className="text-slate-300 mt-2">
              Olá, <span className="font-medium text-blue-400">{playerNickname}</span>! Crie um novo jogo ou entre em um existente.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <Link href="/jogo-da-velha">
                <Home className="h-4 w-4" />
                Voltar ao Menu
              </Link>
            </Button>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Botão de Criar Novo Jogo */}
      {availableGames.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleCreateGame}
            disabled={isCreatingGame}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
          >
            {isCreatingGame ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando Novo Jogo...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Criar Novo Jogo
              </>
            )}
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          <span>Jogos Disponíveis</span>
        </h3>
        
        <Separator className="my-4" />
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando jogos disponíveis...</p>
        </div>
      ) : availableGames.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-12 text-center"
        >
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="bg-blue-500/10 rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Nenhum jogo disponível</h3>
            <p className="text-slate-300 mb-8">
              Não há jogos disponíveis no momento. Crie um novo jogo e convide alguém para jogar!
            </p>
            <Button 
              onClick={handleCreateGame} 
              disabled={isCreatingGame}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
              size="lg"
            >
              {isCreatingGame ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando Novo Jogo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Novo Jogo
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {availableGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm hover:shadow-md hover:shadow-blue-900/20 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Aguardando Jogador
                          </Badge>
                          <CardTitle className="text-lg">Jogo de {game.player_x_nickname}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <Clock className="h-4 w-4" />
                        <span>Criado {formatTimestamp(game.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Trophy className="h-4 w-4" />
                        <span>Primeiro a jogar: {game.player_x_nickname}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t border-slate-700">
                      <Button
                        onClick={() => handleJoinGame(game.id, game.player_x_nickname)}
                        disabled={isJoiningGame || game.player_x_id === playerId}
                        className={`w-full ${game.player_x_id !== playerId ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white" : ""}`}
                        variant={game.player_x_id === playerId ? "outline" : "default"}
                      >
                        {isJoiningGame ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : game.player_x_id === playerId ? (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Seu Jogo
                          </>
                        ) : (
                          <>
                            <Users className="mr-2 h-4 w-4" />
                            Entrar no Jogo
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Botão de voltar para dispositivos móveis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 md:hidden"
      >
        <Button
          asChild
          variant="outline"
          className="w-full border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <Link href="/jogo-da-velha">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Menu Principal
          </Link>
        </Button>
      </motion.div>
    </div>
  );
} 