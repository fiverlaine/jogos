"use client";

import { useEffect, useState } from "react";
import { 
  subscribeToGame, 
  getGameById, 
  makeMove,
  joinGameSession,
  GameSession,
  Player,
  requestRematch,
  acceptRematch,
  declineRematch
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, RefreshCw, Trophy, AlertCircle, Sparkles, Clock, HistoryIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RematchModal } from "./rematch-modal";

interface OnlineTicTacToeProps {
  gameId: string;
  player: Player;
}

// Componente Square para cada célula do tabuleiro
function Square({ 
  value, 
  onSquareClick, 
  winningSquare, 
  index 
}: { 
  value: string; 
  onSquareClick: () => void; 
  winningSquare: boolean;
  index: number;
}) {
  return (
    <motion.button
      className={`group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border shadow-lg transition-all sm:h-24 sm:w-24 ${
        winningSquare
          ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          : "border-slate-700 bg-slate-800/80 backdrop-blur-sm hover:border-slate-600"
      }`}
      onClick={onSquareClick}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ 
        y: -3, 
        boxShadow: winningSquare 
          ? "0 10px 15px -5px rgba(6, 182, 212, 0.3)" 
          : "0 10px 15px -5px rgba(0, 0, 0, 0.3)" 
      }}
    >
      {/* Efeito de borda interna */}
      <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-slate-800/70 to-slate-900/70 opacity-80" />
      
      {/* Símbolo X ou O */}
      {value && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`relative z-20 text-4xl sm:text-5xl font-bold`}
        >
          {value === "X" ? (
            <span className="text-cyan-400">X</span>
          ) : (
            <span className="text-pink-400">O</span>
          )}
        </motion.div>
      )}
      
      {/* Efeito de brilho no hover */}
      <div 
        className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30 group-hover:duration-300 ${
          value === "X" ? "from-cyan-400 to-blue-500" : value === "O" ? "from-pink-400 to-purple-500" : "from-slate-400 to-slate-500"
        }`}
      />
    </motion.button>
  );
}

export function OnlineTicTacToe({ gameId, player }: OnlineTicTacToeProps) {
  const [game, setGame] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [isReceivingRematch, setIsReceivingRematch] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Função para buscar dados do jogo
  const fetchGameData = async () => {
    try {
      setIsRefreshing(true);
      console.log(`Buscando dados do jogo ${gameId}...`);
      
      const gameData = await getGameById(gameId);
      
      if (!gameData) {
        setError("Jogo não encontrado");
        return;
      }
      
      console.log("Dados do jogo recebidos:", gameData);
      setGame(gameData);
      
      // Verificar se há um vencedor
      if (gameData.winner_id) {
        checkWinningLine(gameData.board);
        
        // Se o jogador ganhou, mostrar confetti
        if (gameData.winner_id === player.id) {
          triggerConfetti();
        }
      } else if (gameData.status === 'finished') {
        // Se o jogo terminou sem vencedor, é empate
        checkWinningLine(gameData.board); // Limpar qualquer linha vencedora
      }
      
      // Verificar se há uma solicitação de revanche
      console.log("Verificando solicitação de revanche:", {
        rematch_requested_by: gameData.rematch_requested_by,
        player_id: player.id,
        isRequestingRematch: gameData.rematch_requested_by === player.id,
        isReceivingRematch: gameData.rematch_requested_by && gameData.rematch_requested_by !== player.id
      });
      
      if (gameData.rematch_requested_by) {
        // Se o jogador atual solicitou a revanche
        if (gameData.rematch_requested_by === player.id) {
          console.log("Este jogador solicitou revanche, mostrando modal de espera");
          setIsRequestingRematch(true);
          setIsReceivingRematch(false);
          setShowRematchModal(true);
          // Garantir que o modal de resultado não esteja visível
          setShowResultModal(false);
        } 
        // Se o oponente solicitou a revanche
        else if (gameData.player_x_id === player.id || gameData.player_o_id === player.id) {
          console.log("Oponente solicitou revanche, mostrando modal de aceitação");
          setIsRequestingRematch(false);
          setIsReceivingRematch(true);
          setShowRematchModal(true);
          // Garantir que o modal de resultado não esteja visível
          setShowResultModal(false);
        }
      } else {
        // Se não há solicitação de revanche, fechar o modal apenas se não estiver no meio de uma solicitação
        console.log("Não há solicitação de revanche ativa");
        if (!isRequestingRematch) {
          setShowRematchModal(false);
        }
      }
      
      // Se há um jogo de revanche, redirecionar para ele
      if (gameData.rematch_game_id) {
        toast({
          title: "Sucesso",
          description: "Revanche aceita! Redirecionando para o novo jogo...",
        });
        router.push(`/jogo-da-velha/online/${gameData.rematch_game_id}`);
      }
    } catch (err) {
      console.error("Erro ao buscar dados do jogo:", err);
      setError("Erro ao carregar o jogo");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Verificar a linha vencedora
  const checkWinningLine = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
      [0, 4, 8], [2, 4, 6]             // diagonais
    ];
    
    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningLine(line);
        return;
      }
    }
    
    setWinningLine(null);
  };

  // Timer para contar tempo de jogo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (game && game.status === 'playing') {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game?.status]);

  // Verificar se há um vencedor ou empate
  useEffect(() => {
    if (game?.status === 'finished') {
      // Verificar se há um vencedor
      if (game.winner_id) {
        checkWinningLine(game.board);
        
        // Se o jogador ganhou, mostrar confetti
        if (game.winner_id === player.id) {
          triggerConfetti();
        }
      } else {
        // Se não há vencedor mas o jogo terminou, é empate
        checkWinningLine(game.board); // Limpar qualquer linha vencedora
      }
      
      // Se já existe uma solicitação de revanche ou o modal está aberto, não mostrar o modal de resultado
      if (showRematchModal || game.rematch_requested_by) {
        console.log("Modal de revanche ou solicitação já existe, não mostrando modal de resultado");
        setShowResultModal(false);
        return;
      }
      
      // Aguardar um momento antes de mostrar o modal para dar tempo de ver o tabuleiro final
      const timer = setTimeout(() => {
        console.log("Mostrando modal de resultado após o jogo terminar");
        setShowResultModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Se o jogo não está finalizado, não mostrar o modal
      setShowResultModal(false);
    }
  }, [game?.status, game?.winner_id, game?.board, game?.rematch_requested_by, player.id, showRematchModal]);

  // Buscar dados do jogo e configurar inscrição em tempo real
  useEffect(() => {
    fetchGameData();

    // Configurar inscrição em tempo real
    console.log(`Configurando inscrição em tempo real para o jogo ${gameId}...`);
    const unsubscribe = subscribeToGame(gameId, (updatedGame) => {
      console.log("Jogo atualizado via tempo real:", updatedGame);
      
      // Atualizar o estado do jogo
      setGame(updatedGame);
      
      // Verificar se há um vencedor
      if (updatedGame.winner_id) {
        checkWinningLine(updatedGame.board);
        
        // Se o jogador ganhou, mostrar confetti
        if (updatedGame.winner_id === player.id) {
          triggerConfetti();
        }
      } else if (updatedGame.status === 'finished') {
        // Se o jogo terminou sem vencedor, é empate
        checkWinningLine(updatedGame.board);
      }
      
      // Verificar se há uma solicitação de revanche
      console.log("Atualização em tempo real - verificando revanche:", {
        rematch_requested_by: updatedGame.rematch_requested_by,
        player_id: player.id
      });
      
      if (updatedGame.rematch_requested_by) {
        // Se o jogador atual solicitou a revanche
        if (updatedGame.rematch_requested_by === player.id) {
          console.log("Tempo real: Este jogador solicitou revanche");
          setIsRequestingRematch(true);
          setIsReceivingRematch(false);
          setShowRematchModal(true);
          
          // Garantir que o modal de resultado não esteja visível
          setShowResultModal(false);
        } 
        // Se o oponente solicitou a revanche
        else if (updatedGame.player_x_id === player.id || updatedGame.player_o_id === player.id) {
          console.log("Tempo real: Oponente solicitou revanche");
          setIsRequestingRematch(false);
          setIsReceivingRematch(true);
          setShowRematchModal(true);
          
          // Garantir que o modal de resultado não esteja visível
          setShowResultModal(false);
        }
      } else {
        // Se não há solicitação de revanche, fechar o modal apenas se não estiver no meio de uma solicitação
        console.log("Tempo real: Não há solicitação de revanche ativa");
        if (!isRequestingRematch) {
          setIsReceivingRematch(false);
          setShowRematchModal(false);
        }
      }
      
      // Se há um jogo de revanche, redirecionar para ele
      if (updatedGame.rematch_game_id) {
        console.log("Tempo real: Revanche aceita, redirecionando para novo jogo");
        toast({
          title: "Sucesso",
          description: "Revanche aceita! Redirecionando para o novo jogo...",
        });
        router.push(`/jogo-da-velha/online/${updatedGame.rematch_game_id}`);
      }
    });

    return () => {
      console.log(`Cancelando inscrição em tempo real para o jogo ${gameId}...`);
      unsubscribe();
    };
  }, [gameId, player.id]);

  // Verificar se o jogador precisa entrar no jogo
  useEffect(() => {
    const checkAndJoinGame = async () => {
      if (!game) return;
      
      // Verificar se o jogador atual já está no jogo
      const isPlayerX = game.player_x_id === player.id;
      const isPlayerO = game.player_o_id === player.id;
      
      console.log("Verificando se o jogador precisa entrar no jogo:", {
        isPlayerX,
        isPlayerO,
        gameStatus: game.status,
        playerId: player.id
      });
      
      // Se o jogo está aguardando e o jogador não é o criador, tentar entrar
      if (game.status === 'waiting' && !isPlayerX && !isPlayerO) {
        console.log("Jogador precisa entrar no jogo. Tentando entrar...");
        await handleJoinGame();
      }
    };
    
    checkAndJoinGame();
  }, [game]);

  // Função para entrar no jogo
  const handleJoinGame = async () => {
    try {
      setIsJoining(true);
      console.log(`Jogador ${player.nickname} (${player.id}) tentando entrar no jogo ${gameId}...`);
      
      const success = await joinGameSession(gameId, player);
      
      if (!success) {
        console.error("Falha ao entrar no jogo");
        toast({
          title: "Erro",
          description: "Não foi possível entrar no jogo.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Jogador entrou no jogo com sucesso!");
      toast({
        title: "Sucesso",
        description: "Você entrou no jogo!",
      });
      
      // Atualizar os dados do jogo
      await fetchGameData();
    } catch (err) {
      console.error("Erro ao entrar no jogo:", err);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no jogo.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Função para fazer uma jogada
  const handleMove = async (position: number) => {
    if (!game) return;
    
    // Verificar se é a vez do jogador
    if (game.current_player_id !== player.id) {
      toast({
        title: "Não é sua vez",
        description: "Aguarde o outro jogador fazer sua jogada.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se a posição já está ocupada
    if (game.board[position] !== '') {
      toast({
        title: "Jogada inválida",
        description: "Esta posição já está ocupada.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log(`Fazendo jogada na posição ${position}...`);
      
      // Play sound effect
      try {
        const audio = new Audio("/click.mp3");
        audio.volume = 0.2;
        audio.play().catch((e) => console.log("Audio play failed:", e));
      } catch (e) {
        console.log("Audio play failed:", e);
      }
      
      const success = await makeMove(gameId, player.id, position);
      
      if (!success) {
        toast({
          title: "Erro",
          description: "Não foi possível fazer esta jogada.",
          variant: "destructive",
        });
      } else {
        console.log("Jogada realizada com sucesso!");
        
        // Atualizar os dados do jogo após a jogada
        await fetchGameData();
      }
    } catch (err) {
      console.error("Erro ao fazer jogada:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer a jogada.",
        variant: "destructive",
      });
    }
  };

  // Função para mostrar confetti quando o jogador vencer
  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti com cores personalizadas
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#67e8f9", "#22d3ee", "#06b6d4"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#c084fc", "#a855f7", "#9333ea"],
      });
    }, 250);
  };

  // Função para determinar o status do jogo
  const getGameStatus = () => {
    if (!game) return null;
    
    const isPlayerX = game.player_x_id === player.id;
    const isPlayerO = game.player_o_id === player.id;
    
    if (game.status === 'waiting') {
      if (isPlayerX) {
        return "Aguardando outro jogador entrar...";
      } else {
        return "Aguardando você entrar no jogo...";
      }
    }
    
    if (game.status === 'playing') {
      if (game.current_player_id === player.id) {
        return "Sua vez de jogar";
      } else {
        return "Aguardando jogada do oponente...";
      }
    }
    
    if (game.status === 'finished') {
      if (game.winner_id) {
        if (game.winner_id === player.id) {
          return "Você venceu! 🎉";
        } else {
          return "Você perdeu! 😢";
        }
      } else {
        return "Empate! 🤝";
      }
    }
    
    return null;
  };

  // Função para determinar o símbolo do jogador (X ou O)
  const getPlayerSymbol = () => {
    if (!game) return null;
    
    if (game.player_x_id === player.id) {
      return "X";
    } else if (game.player_o_id === player.id) {
      return "O";
    }
    
    return null;
  };

  // Função para obter o nome do oponente
  const getOpponentName = () => {
    if (!game) return "...";
    
    if (player.id === game.player_x_id) {
      return game.player_o_nickname || "Aguardando oponente...";
    } else {
      return game.player_x_nickname;
    }
  };

  // Formatar o tempo de jogo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Função para solicitar revanche
  const handleRequestRematch = async () => {
    try {
      console.log("Solicitando revanche...");
      
      // Fechar o modal de resultado imediatamente
      setShowResultModal(false);
      
      setIsRequestingRematch(true);
      
      if (await requestRematch(gameId, player.id)) {
        console.log("Solicitação de revanche enviada com sucesso");
        
        // Atualizar o estado local para evitar reabrir o modal de resultado
        setShowRematchModal(true);
        
        toast({
          title: "Sucesso",
          description: "Solicitação de revanche enviada!",
          variant: "default",
        });
      } else {
        console.error("Falha ao solicitar revanche");
        setIsRequestingRematch(false);
        
        toast({
          title: "Erro",
          description: "Não foi possível solicitar revanche",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao solicitar revanche:", error);
      setIsRequestingRematch(false);
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao solicitar revanche",
        variant: "destructive",
      });
    }
  };
  
  // Função para aceitar revanche
  const handleAcceptRematch = async () => {
    if (!game) return;
    
    try {
      console.log("Aceitando solicitação de revanche...");
      const newGameId = await acceptRematch(gameId, player.id);
      
      if (newGameId) {
        console.log(`Revanche aceita! Novo jogo: ${newGameId}`);
        toast({
          title: "Sucesso",
          description: "Revanche aceita! Redirecionando para o novo jogo...",
        });
        router.push(`/jogo-da-velha/online/${newGameId}`);
      } else {
        console.error("Falha ao aceitar revanche");
        toast({
          title: "Erro",
          description: "Não foi possível aceitar a revanche",
          variant: "destructive",
        });
        setIsReceivingRematch(false);
        setShowRematchModal(false);
      }
    } catch (error) {
      console.error("Erro ao aceitar revanche:", error);
      toast({
        title: "Erro",
        description: "Erro ao aceitar revanche",
        variant: "destructive",
      });
      setIsReceivingRematch(false);
      setShowRematchModal(false);
    }
  };
  
  // Função para recusar revanche
  const handleDeclineRematch = async () => {
    if (!game) return;
    
    try {
      console.log("Recusando solicitação de revanche...");
      const success = await declineRematch(gameId);
      
      if (success) {
        console.log("Revanche recusada com sucesso");
        toast({
          title: "Sucesso",
          description: "Revanche recusada",
        });
        setIsReceivingRematch(false);
        setIsRequestingRematch(false);
        setShowRematchModal(false);
      } else {
        console.error("Falha ao recusar revanche");
        toast({
          title: "Erro",
          description: "Não foi possível recusar a revanche",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao recusar revanche:", error);
      toast({
        title: "Erro",
        description: "Erro ao recusar revanche",
        variant: "destructive",
      });
    }
  };
  
  // Função para fechar o modal de revanche
  const handleCloseRematchModal = () => {
    console.log("Fechando modal de revanche, estado atual:", { isRequestingRematch, isReceivingRematch });
    
    if (isRequestingRematch) {
      // Se o jogador está solicitando revanche, cancelar a solicitação
      console.log("Cancelando solicitação de revanche ao fechar o modal");
      handleDeclineRematch();
    } else {
      setShowRematchModal(false);
    }
  };

  // Renderizar o modal de resultado
  const renderResultModal = () => {
    if (!game) return null;
    
    const isWinner = game.winner_id === player.id;
    const isLoser = game.winner_id && game.winner_id !== player.id;
    
    return (
      <Dialog 
        open={showResultModal} 
        onOpenChange={(open) => {
          console.log("Modal de resultado alterado para:", open);
          setShowResultModal(open);
        }}
      >
        <DialogContent className="sm:max-w-md border-slate-700 bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm w-[95%] max-w-[95%] sm:w-auto sm:max-w-md p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-2 sm:p-4"
          >
            {/* Ícone */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1, duration: 0.7 }}
                className={`
                  flex h-20 w-20 items-center justify-center rounded-full
                  ${isWinner ? 'bg-cyan-500/20 text-cyan-400' : 
                    isLoser ? 'bg-rose-500/20 text-rose-400' : 
                    'bg-amber-500/20 text-amber-400'}
                `}
              >
                {isWinner ? (
                  <Trophy className="h-10 w-10" />
                ) : isLoser ? (
                  <AlertCircle className="h-10 w-10" />
                ) : (
                  <RefreshCw className="h-10 w-10" />
                )}
              </motion.div>
            </div>
            
            {/* Título */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`
                mb-2 text-center text-2xl font-bold
                ${isWinner ? 'text-cyan-400' : 
                  isLoser ? 'text-rose-400' : 
                  'text-amber-400'}
              `}
            >
              {isWinner ? '🎉 Vitória! 🎉' : 
               isLoser ? '😢 Derrota!' : 
               '🤝 Empate!'}
            </motion.h2>
            
            {/* Mensagem */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-center text-lg text-slate-300"
            >
              {isWinner ? 'Parabéns! Você venceu o jogo!' : 
               isLoser ? `${getOpponentName()} venceu o jogo.` : 
               'O jogo terminou em empate!'}
            </motion.p>
            
            {/* Estatísticas */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 grid grid-cols-2 gap-3"
            >
              <div className={`
                rounded-lg p-3 text-center
                ${isWinner ? 'bg-cyan-500/10 border border-cyan-500/30' : 
                  isLoser ? 'bg-rose-500/10 border border-rose-500/30' : 
                  'bg-amber-500/10 border border-amber-500/30'}
              `}>
                <p className="text-sm text-slate-400">Tempo de Jogo</p>
                <p className="text-lg font-medium text-slate-200">{formatTime(gameTime)}</p>
              </div>
              <div className={`
                rounded-lg p-3 text-center
                ${isWinner ? 'bg-cyan-500/10 border border-cyan-500/30' : 
                  isLoser ? 'bg-rose-500/10 border border-rose-500/30' : 
                  'bg-amber-500/10 border border-amber-500/30'}
              `}>
                <p className="text-sm text-slate-400">Jogador</p>
                <p className="text-lg font-medium text-slate-200">
                  {getPlayerSymbol() === "X" ? (
                    <span className="text-cyan-400">X</span>
                  ) : (
                    <span className="text-pink-400">O</span>
                  )}
                </p>
              </div>
            </motion.div>
            
            {/* Botões */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-3"
            >
              <Button
                onClick={() => {
                  console.log("Solicitando revanche a partir do modal de resultado");
                  setShowResultModal(false);
                  handleRequestRematch();
                }}
                className={`
                  ${isWinner ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 
                    isLoser ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 
                    'bg-gradient-to-r from-amber-600 to-orange-600'}
                  text-white w-full sm:w-auto
                `}
              >
                Solicitar Revanche
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto"
              >
                Voltar para o Menu Principal
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Carregando jogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Erro</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/">Voltar para o Menu Principal</Link>
        </Button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Jogo não encontrado</h2>
        <p className="text-muted-foreground mb-6">O jogo solicitado não existe ou foi removido.</p>
        <Button asChild>
          <Link href="/">Voltar para o Menu Principal</Link>
        </Button>
      </div>
    );
  }

  const isPlayerInGame = game.player_x_id === player.id || game.player_o_id === player.id;
  const isWaiting = game.status === 'waiting';
  const canJoin = isWaiting && !isPlayerInGame;
  const isDraw = game.status === 'finished' && !game.winner_id;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col items-center">
        <motion.h1 
          className="mb-8 text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Jogo da Velha Online
        </motion.h1>

        <div className="mb-8 flex gap-4 items-center">
          <motion.div
            className="mb-0 rounded-lg bg-slate-800/70 backdrop-blur-sm px-5 py-3 text-lg font-medium border border-slate-700 shadow-lg"
            animate={{
              backgroundColor: game.winner_id
                ? ["rgba(8, 47, 73, 0.7)", "rgba(8, 145, 178, 0.3)", "rgba(8, 47, 73, 0.7)"]
                : isDraw
                ? ["rgba(234, 179, 8, 0.1)", "rgba(234, 179, 8, 0.2)", "rgba(234, 179, 8, 0.1)"]
                : "rgba(8, 47, 73, 0.7)",
              boxShadow: game.winner_id
                ? ["0 0 10px rgba(6, 182, 212, 0.3)", "0 0 20px rgba(6, 182, 212, 0.5)", "0 0 10px rgba(6, 182, 212, 0.3)"]
                : isDraw
                ? ["0 0 10px rgba(234, 179, 8, 0.1)", "0 0 15px rgba(234, 179, 8, 0.2)", "0 0 10px rgba(234, 179, 8, 0.1)"]
                : "none"
            }}
            transition={{
              duration: 2,
              repeat: (game.winner_id || isDraw) ? Number.POSITIVE_INFINITY : 0,
              repeatType: "reverse",
            }}
          >
            <span className={`
              ${game.winner_id ? "text-cyan-400 font-bold" : 
                isDraw ? "text-amber-400 font-bold" : 
                "text-slate-300"}
            `}>
              {getGameStatus()}
              {game.winner_id === player.id && <Sparkles className="inline-block ml-2 h-4 w-4" />}
            </span>
          </motion.div>
          
          <motion.div 
            className="rounded-lg bg-slate-800/70 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-slate-700 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-300">{formatTime(gameTime)}</span>
          </motion.div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-center">
          <motion.div 
            className="p-3 border rounded-md border-slate-700 bg-slate-800/50 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">Você</p>
            <p className="font-bold">
              {player.nickname} 
              <span className={getPlayerSymbol() === "X" ? "text-cyan-400" : "text-pink-400"}>
                {" "}({getPlayerSymbol()})
              </span>
            </p>
          </motion.div>
          <motion.div 
            className="p-3 border rounded-md border-slate-700 bg-slate-800/50 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">Oponente</p>
            <p className="font-bold">{getOpponentName()}</p>
          </motion.div>
        </div>
        
        {canJoin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-md mb-6"
          >
            <Button 
              onClick={handleJoinGame} 
              disabled={isJoining} 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando no jogo...
                </>
              ) : (
                "Entrar no Jogo"
              )}
            </Button>
          </motion.div>
        ) : null}
        
        <motion.div 
          className="mb-8 grid grid-cols-3 gap-3 md:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {game.board.map((cell, index) => (
            <Square
              key={index}
              index={index}
              value={cell}
              onSquareClick={() => handleMove(index)}
              winningSquare={winningLine?.includes(index) || false}
            />
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <Button
            asChild
            variant="outline"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Menu Principal
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={fetchGameData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </motion.div>

        <AnimatePresence>
          {(game.winner_id || isDraw) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8 w-full max-w-md mx-auto px-4 sm:px-0"
            >
              <Alert className={`border-l-4 ${game.winner_id ? "border-l-cyan-500 bg-cyan-500/10" : "border-l-amber-500 bg-amber-500/10"} backdrop-blur-sm overflow-hidden text-sm sm:text-base`}>
                {game.winner_id ? (
                  <Trophy className="h-5 w-5 text-cyan-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                )}
                <AlertTitle className={`${game.winner_id ? "text-cyan-400" : "text-amber-400"} text-sm sm:text-base`}>
                  {game.winner_id === player.id ? "Parabéns!" : game.winner_id ? "Fim de jogo!" : "Jogo finalizado!"}
                </AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  {game.winner_id === player.id ? (
                    <span>Você venceu o jogo! 🎉</span>
                  ) : game.winner_id ? (
                    <span>Seu oponente venceu o jogo.</span>
                  ) : (
                    <span>O jogo terminou em empate!</span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700 p-5 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-200">
          <HistoryIcon className="h-4 w-4 text-cyan-400" />
          Informações do Jogo
        </h3>
        <div className="space-y-3">
          <div className="rounded-md bg-slate-700/30 p-3">
            <p className="text-sm text-slate-300">
              <span className="text-cyan-400 font-medium">ID do Jogo:</span> {gameId.substring(0, 8)}...
            </p>
          </div>
          <div className="rounded-md bg-slate-700/30 p-3">
            <p className="text-sm text-slate-300">
              <span className="text-cyan-400 font-medium">Status:</span> {game.status === 'waiting' ? 'Aguardando' : game.status === 'playing' ? 'Em andamento' : 'Finalizado'}
            </p>
          </div>
          <div className="rounded-md bg-slate-700/30 p-3">
            <p className="text-sm text-slate-300">
              <span className="text-cyan-400 font-medium">Jogador X:</span> {game.player_x_nickname}
            </p>
          </div>
          <div className="rounded-md bg-slate-700/30 p-3">
            <p className="text-sm text-slate-300">
              <span className="text-cyan-400 font-medium">Jogador O:</span> {game.player_o_nickname || 'Aguardando...'}
            </p>
          </div>
          <div className="rounded-md bg-slate-700/30 p-3">
            <p className="text-sm text-slate-300">
              <span className="text-cyan-400 font-medium">Jogador Atual:</span> {game.current_player_id === player.id ? 'Você' : 'Oponente'}
            </p>
          </div>
          {game.winner_id && (
            <div className="rounded-md bg-slate-700/30 p-3">
              <p className="text-sm text-slate-300">
                <span className="text-cyan-400 font-medium">Vencedor:</span> {game.winner_id === player.id ? 'Você' : 'Oponente'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de resultado */}
      {renderResultModal()}
      
      {/* Modal de revanche */}
      <RematchModal
        isOpen={showRematchModal}
        isRequesting={isRequestingRematch}
        isReceiving={isReceivingRematch}
        opponentNickname={getOpponentName()}
        onClose={handleCloseRematchModal}
        onAccept={handleAcceptRematch}
        onDecline={handleDeclineRematch}
        onRequest={handleRequestRematch}
      />
    </div>
  );
} 