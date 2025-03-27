"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createGameSession, getAvailableGames, GameSession, Player, createMemoryGame, getAvailableMemoryGames, MemoryGameSession } from "@/lib/supabase";
import { createHangmanGameSession, getAvailableHangmanGames, HangmanGameSession } from "@/lib/hangman-supabase";
import { Loader2, RefreshCw, Plus, Users, Clock, Trophy, UserCheck, ArrowLeft, Home, Grid, Dices } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface GameLobbyProps {
  playerNickname: string;
  playerId: string;
  gameType?: "tictactoe" | "memory" | "hangman";
}

export function GameLobby({ playerNickname, playerId, gameType = "tictactoe" }: GameLobbyProps) {
  const router = useRouter();
  const [availableGames, setAvailableGames] = useState<GameSession[] | MemoryGameSession[] | HangmanGameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGridConfig, setSelectedGridConfig] = useState({ rows: 4, cols: 4 });
  const [showGridDialog, setShowGridDialog] = useState(false);

  // Opções de configuração de grade para o jogo da memória
  const gridOptions = [
    { label: '3x4 (Fácil)', config: { rows: 3, cols: 4 } },
    { label: '4x4 (Médio)', config: { rows: 4, cols: 4 } },
    { label: '4x6 (Difícil)', config: { rows: 4, cols: 6 } },
    { label: '6x6 (Expert)', config: { rows: 6, cols: 6 } },
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        if (gameType === "tictactoe") {
          // Jogo da velha usa a API padrão de jogos
          const games = await getAvailableGames();
          setAvailableGames(games || []);
        } else if (gameType === "hangman") {
          // Jogo da forca usa sua própria API específica
          const games = await getAvailableHangmanGames();
          setAvailableGames(games || []);
        } else if (gameType === "memory") {
          const games = await getAvailableMemoryGames();
          setAvailableGames(games || []);
        }
      } catch (error) {
        console.error("Erro ao buscar jogos disponíveis:", error);
        toast.error("Não foi possível carregar os jogos disponíveis");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchGames();
  }, [refreshKey, gameType]);

  const handleCreateGame = async () => {
    if (gameType === "memory") {
      setShowGridDialog(true);
      return;
    }
    
    await createGame();
  };
  
  const createGame = async () => {
    try {
      setIsCreatingGame(true);
      console.log("Criando jogo com jogador:", playerNickname, playerId);
      
      // Criar um objeto Player para passar para a função createGameSession
      const player: Player = {
        id: playerId,
        nickname: playerNickname
      };
      
      if (gameType === "tictactoe") {
        const game = await createGameSession(player);

        if (game) {
          toast.success("Jogo criado com sucesso!");
          router.push(`/jogo-da-velha/online/${game.id}`);
        } else {
          toast.error("Não foi possível criar um novo jogo");
        }
      } else if (gameType === "memory") {
        const game = await createMemoryGame(playerId, playerNickname, selectedGridConfig);
        
        if (game) {
          toast.success("Jogo criado com sucesso!");
          router.push(`/jogo-da-memoria/online/${game.id}`);
        } else {
          toast.error("Não foi possível criar um novo jogo");
        }
      } else if (gameType === "hangman") {
        // Para o jogo da forca, usamos a API específica do jogo da forca
        const game = await createHangmanGameSession(player);
        
        if (game) {
          toast.success("Jogo criado com sucesso!");
          router.push(`/jogo-da-forca/online/${game.id}`);
        } else {
          toast.error("Não foi possível criar um novo jogo");
        }
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
      
      if (gameType === "tictactoe") {
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
      } else if (gameType === "memory") {
        // Para o jogo da memória, apenas navegamos para a página do jogo
        toast.success(`Entrando no jogo de ${hostNickname}`);
        router.push(`/jogo-da-memoria/online/${gameId}`);
      } else if (gameType === "hangman") {
        // Para o jogo da forca, usamos a API específica
        const response = await fetch(`/api/hangman/${gameId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: playerId,
            player_nickname: playerNickname
          }),
        });
        
        if (response.ok) {
          toast.success(`Entrando no jogo de ${hostNickname}`);
          router.push(`/jogo-da-forca/online/${gameId}`);
        } else {
          toast.error("Não foi possível entrar no jogo");
          // Atualizar a lista de jogos
          setRefreshKey(prev => prev + 1);
        }
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

  // Função para determinar o caminho de retorno correto com base no tipo de jogo
  const getReturnPath = () => {
    // Retornar para a página inicial
    return "/";
  };

  // Função para determinar as cores de gradiente baseadas no tipo de jogo
  const getGradientColors = () => {
    if (gameType === "tictactoe") return "from-cyan-300 via-blue-400 to-purple-400";
    if (gameType === "memory") return "from-purple-300 via-purple-400 to-indigo-400";
    if (gameType === "hangman") return "from-red-300 via-rose-400 to-red-500";
    return "from-cyan-300 via-blue-400 to-purple-400";
  };

  // Função para determinar o botão de cores baseadas no tipo de jogo
  const getButtonGradient = () => {
    if (gameType === "tictactoe") return "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700";
    if (gameType === "memory") return "from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700";
    if (gameType === "hangman") return "from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700";
    return "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700";
  };

  // Função para determinar a cor do texto baseada no tipo de jogo
  const getAccentColor = () => {
    if (gameType === "tictactoe") return "text-blue-400";
    if (gameType === "memory") return "text-purple-400";
    if (gameType === "hangman") return "text-rose-400";
    return "text-blue-400";
  };

  // Determinar as informações do jogo com base no tipo
  const useGameSession = gameType === "tictactoe";
  const useHangmanSession = gameType === "hangman";
  const isMemoryGame = gameType === "memory";
  
  const getHostNickname = (game: GameSession | MemoryGameSession | HangmanGameSession) => {
    if (useGameSession) return (game as GameSession).player_x_nickname;
    if (useHangmanSession) return (game as HangmanGameSession).player_1_nickname;
    return (game as MemoryGameSession).player_1_nickname;
  };

  const getHostId = (game: GameSession | MemoryGameSession | HangmanGameSession) => {
    if (useGameSession) return (game as GameSession).player_x_id;
    if (useHangmanSession) return (game as HangmanGameSession).player_1_id;
    return (game as MemoryGameSession).player_1_id;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto pb-8">
        {/* Cabeçalho com gradiente e efeito de vidro */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-sm p-6 shadow-lg sticky top-0 z-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className={`text-3xl font-bold bg-gradient-to-r ${getGradientColors()} bg-clip-text text-transparent`}>Lobby de Jogos</h2>
              <p className="text-slate-300 mt-2">
                Olá, <span className={`font-medium ${getAccentColor()}`}>{playerNickname}</span>! Crie um novo jogo ou entre em um existente.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <Link href={getReturnPath()}>
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
        {(availableGames.length > 0 || !isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center sticky top-24 z-10 backdrop-blur-sm py-2"
          >
            <Button
              onClick={handleCreateGame}
              disabled={isCreatingGame}
              size="lg"
              className={`bg-gradient-to-r ${getButtonGradient()} text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all`}
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
            <Users className={`h-5 w-5 ${getAccentColor()}`} />
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
              <div className={`rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4 ${gameType === "tictactoe" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
                <Users className={`h-10 w-10 ${getAccentColor()}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-3 bg-gradient-to-r ${getGradientColors()} bg-clip-text text-transparent`}>Nenhum jogo disponível</h3>
              <p className="text-slate-300 mb-8">
                Não há jogos disponíveis no momento. Crie um novo jogo e convide alguém para jogar!
              </p>
              
              <Button 
                onClick={handleCreateGame} 
                disabled={isCreatingGame}
                className={`bg-gradient-to-r ${getButtonGradient()} text-white shadow-lg hover:shadow-${gameType === "tictactoe" ? "blue" : "purple"}-600/30 hover:-translate-y-0.5 transition-all`}
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
                {availableGames.map((game, index) => {
                  const hostNickname = getHostNickname(game);
                  const hostId = getHostId(game);
                  
                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`overflow-hidden border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm hover:shadow-md ${gameType === "tictactoe" ? "hover:shadow-blue-900/20" : "hover:shadow-purple-900/20"} transition-all`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className={`mb-2 ${gameType === "tictactoe" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                                Aguardando Jogador
                              </Badge>
                              <CardTitle className="text-lg">Jogo de {hostNickname}</CardTitle>
                            </div>
                            {isMemoryGame && (game as MemoryGameSession).grid_config && (
                              <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full">
                                {(game as MemoryGameSession).grid_config.rows}x{(game as MemoryGameSession).grid_config.cols}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Clock className="h-4 w-4" />
                            <span>Criado {formatTimestamp(game.created_at)}</span>
                          </div>
                          {useGameSession && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Trophy className="h-4 w-4" />
                              <span>Primeiro a jogar: {hostNickname}</span>
                            </div>
                          )}
                          {useHangmanSession && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Trophy className="h-4 w-4" />
                              <span>Criador da sala: {hostNickname}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2 border-t border-slate-700">
                          <Button
                            onClick={() => handleJoinGame(game.id, hostNickname)}
                            disabled={isJoiningGame || hostId === playerId}
                            className={`w-full ${hostId !== playerId ? `bg-gradient-to-r ${getButtonGradient()} text-white` : ""}`}
                            variant={hostId === playerId ? "outline" : "default"}
                          >
                            {isJoiningGame ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                              </>
                            ) : hostId === playerId ? (
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
                  );
                })}
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
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Menu Principal
            </Link>
          </Button>
        </motion.div>
      </div>
      
      {/* Dialog para configuração da grade do jogo da memória */}
      <Dialog open={showGridDialog} onOpenChange={setShowGridDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[90vw] max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`text-xl font-semibold bg-gradient-to-r ${getGradientColors()} bg-clip-text text-transparent flex items-center gap-2`}>
              <Grid className="h-5 w-5" />
              Configuração do Jogo
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-3 sm:py-4">
            <p className="text-slate-300 mb-3 sm:mb-4 text-sm sm:text-base">Escolha o tamanho da grade para o seu jogo:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {gridOptions.map((option, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedGridConfig(option.config)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 sm:p-4 rounded-xl border ${
                    selectedGridConfig.rows === option.config.rows && 
                    selectedGridConfig.cols === option.config.cols
                      ? 'border-purple-500 bg-gradient-to-b from-purple-900/40 to-purple-900/20 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                      : 'border-slate-700 hover:border-slate-600 text-slate-300 bg-slate-800/50'
                  } transition-all`}
                >
                  <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-3">
                    <div className="grid" 
                      style={{ 
                        gridTemplateColumns: `repeat(${Math.min(option.config.cols, 6)}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.min(option.config.rows, 6)}, 1fr)`,
                        gap: '2px'
                      }}
                    >
                      {Array.from({ length: Math.min(option.config.rows * option.config.cols, 36) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-purple-500/30 border border-purple-500/40"
                        />
                      ))}
                    </div>
                    <div className="flex flex-col items-start sm:items-center">
                      <span className="font-medium text-sm sm:text-base">{option.label}</span>
                      <span className="text-xs opacity-70">{option.config.rows * option.config.cols} cartas</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-purple-950/30 to-indigo-950/30 rounded-lg border border-purple-800/30 mt-3 sm:mt-4">
              <Dices className="h-5 w-5 text-purple-400 flex-shrink-0 hidden sm:block" />
              <Dices className="h-4 w-4 text-purple-400 flex-shrink-0 sm:hidden" />
              <span className="text-xs sm:text-sm text-slate-300">
                Quanto maior a grade, maior será o desafio e mais cartas você precisará memorizar!
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowGridDialog(false)}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowGridDialog(false);
                createGame();
              }}
              disabled={isCreatingGame}
              className={`bg-gradient-to-r ${getButtonGradient()} text-white px-5 w-full sm:w-auto order-1 sm:order-2`}
            >
              {isCreatingGame ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Jogo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Jogo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}