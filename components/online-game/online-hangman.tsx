'use client';

import { useState, useEffect } from "react";
import { 
  subscribeToGame, 
  getGameById, 
  makeMove,
  joinGameSession,
  GameSession,
  Player,
  requestRematch,
  acceptRematch,
  declineRematch,
  HangmanGameState
} from "@/lib/supabase";
import { 
  getHangmanGameById, 
  joinHangmanGameSession,
  subscribeToHangmanGame, 
  makeHangmanMove,
  HangmanGameSession 
} from "@/lib/hangman-supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, RefreshCw, Trophy, AlertCircle, Sparkles, Clock, HelpCircle, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RematchModal } from "./rematch-modal";

// Lista de palavras para o jogo da forca (em português)
const palavras = [
  "ABACAXI", "BANANA", "LARANJA", "MORANGO", "UVA", "MELANCIA", "MANGA", 
  "CASA", "ESCOLA", "COMPUTADOR", "BRASIL", "FUTEBOL", "PRAIA", "FLORESTA",
  "CACHORRO", "GATO", "ELEFANTE", "GIRAFA", "MACACO", "LEAO", "TIGRE",
  "AMOR", "FELICIDADE", "ESPERANCA", "AMIZADE", "FAMILIA", "CORAGEM", "LIBERDADE",
  "TELEVISAO", "CELULAR", "INTERNET", "CINEMA", "MUSICA", "HISTORIA", "GEOGRAFIA",
  "AZUL", "VERMELHO", "AMARELO", "VERDE", "PRETO", "BRANCO", "ROXO"
]

// Dicas para as palavras
const dicas: Record<string, string> = {
  "ABACAXI": "Fruta tropical com coroa", 
  "BANANA": "Fruta amarela e curvada", 
  "LARANJA": "Fruta cítrica e redonda", 
  "MORANGO": "Fruta vermelha pequena", 
  "UVA": "Fruta usada para fazer vinho", 
  "MELANCIA": "Fruta grande e verde por fora, vermelha por dentro", 
  "MANGA": "Fruta tropical amarela e doce",
  "CASA": "Onde moramos", 
  "ESCOLA": "Lugar de aprendizado", 
  "COMPUTADOR": "Máquina eletrônica para processar dados", 
  "BRASIL": "País da América do Sul", 
  "FUTEBOL": "Esporte popular com bola", 
  "PRAIA": "Local com areia e mar", 
  "FLORESTA": "Área com muitas árvores",
  "CACHORRO": "Animal de estimação que late", 
  "GATO": "Animal de estimação que mia", 
  "ELEFANTE": "Animal grande com tromba", 
  "GIRAFA": "Animal com pescoço longo", 
  "MACACO": "Animal que se parece com humanos", 
  "LEAO": "Rei da selva", 
  "TIGRE": "Felino com listras",
  "AMOR": "Sentimento forte de afeto", 
  "FELICIDADE": "Estado de contentamento", 
  "ESPERANCA": "Sentimento de expectativa positiva", 
  "AMIZADE": "Relação de carinho entre pessoas", 
  "FAMILIA": "Grupo de pessoas unidas por laços de parentesco", 
  "CORAGEM": "Capacidade de enfrentar o medo", 
  "LIBERDADE": "Estado de poder agir conforme a própria vontade",
  "TELEVISAO": "Aparelho para assistir programas", 
  "CELULAR": "Dispositivo portátil de comunicação", 
  "INTERNET": "Rede global de computadores", 
  "CINEMA": "Local para assistir filmes", 
  "MUSICA": "Arte de combinar sons", 
  "HISTORIA": "Estudo do passado humano", 
  "GEOGRAFIA": "Estudo da Terra e seus fenômenos",
  "AZUL": "Cor do céu", 
  "VERMELHO": "Cor do sangue", 
  "AMARELO": "Cor do sol", 
  "VERDE": "Cor das plantas", 
  "PRETO": "Cor da ausência de luz", 
  "BRANCO": "Cor da neve", 
  "ROXO": "Cor entre o vermelho e o azul"
}

// Definir os estados máximos de erro (cada parte do corpo)
const MAX_ERROS = 6;

interface OnlineHangmanProps {
  gameId: string;
  player: Player;
}

export function OnlineHangman({ gameId, player }: OnlineHangmanProps) {
  const [game, setGame] = useState<HangmanGameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mostraDica, setMostraDica] = useState(false);
  const [penaltyForHint, setPenaltyForHint] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Estado do jogo da forca
  const [gameState, setGameState] = useState<HangmanGameState>({
    palavra: "",
    letrasAdivinhadas: [],
    erros: 0,
    status: "jogando",
    jogadorAtual: "",
    vencedor: null,
    dica: ""
  });

  // Carregar o jogo
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const gameData = await getHangmanGameById(gameId);
        
        if (!gameData) {
          setError("Jogo não encontrado");
          return;
        }
        
        setGame(gameData);
        
        // Converter os dados da tabela para o formato do estado interno
        if (gameData.status !== 'waiting') {
          const state: HangmanGameState = {
            palavra: gameData.word || "",
            letrasAdivinhadas: gameData.guessed_letters || [],
            erros: gameData.errors || 0,
            status: gameData.status === "finished" ? (gameData.winner_id ? "venceu" : "perdeu") : "jogando",
            jogadorAtual: gameData.current_player_id || "",
            vencedor: gameData.winner_id,
            dica: gameData.hint || ""
          };
          setGameState(state);
        }
        
        // Verificar se o jogador já está no jogo
        if (gameData.player_1_id !== player.id && gameData.player_2_id !== player.id) {
          // Jogador não está no jogo, tentar entrar
          if (!gameData.player_2_id && gameData.status === 'waiting') {
            await joinGame();
          } else {
            setError("Este jogo já está cheio");
          }
        }
        
        // Se o jogo foi recém criado pelo jogador atual e ainda não tem uma palavra definida
        if (gameData.player_1_id === player.id && gameData.status === 'waiting' && !gameData.word) {
          console.log("O jogador criou o jogo e está aguardando o segundo jogador entrar");
        }
      } catch (err) {
        console.error("Erro ao carregar jogo:", err);
        setError("Erro ao carregar o jogo");
      } finally {
        setLoading(false);
      }
    };
    
    loadGame();
    
    // Inscrever para atualizações em tempo real
    const unsubscribe = subscribeToHangmanGame(gameId, (updatedGame) => {
      console.log("Recebida atualização do jogo:", updatedGame);
      setGame(updatedGame);
      
      if (updatedGame && updatedGame.status !== 'waiting') {
        // Converter os dados da tabela para o formato do estado interno
        const state: HangmanGameState = {
          palavra: updatedGame.word || "",
          letrasAdivinhadas: updatedGame.guessed_letters || [],
          erros: updatedGame.errors || 0,
          status: updatedGame.status === "finished" ? (updatedGame.winner_id ? "venceu" : "perdeu") : "jogando",
          jogadorAtual: updatedGame.current_player_id || "",
          vencedor: updatedGame.winner_id,
          dica: updatedGame.hint || ""
        };
        setGameState(state);
        
        // Verificar se o jogo acabou
        if (updatedGame.status === "finished") {
          if (updatedGame.winner_id) {
            setShowConfetti(true);
            // Play win sound
            const audio = new Audio("/win.mp3");
            audio.volume = 0.3;
            audio.play().catch((e) => console.log("Audio play failed:", e));
          }
          setShowResultModal(true);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [gameId, player.id]);
  
  // Efeito de confetti
  useEffect(() => {
    if (showConfetti) {
      const duration = 3 * 1000;
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

      return () => clearInterval(interval);
    }
  }, [showConfetti]);

  // Entrar no jogo
  const joinGame = async () => {
    try {
      setIsJoining(true);
      await joinHangmanGameSession(gameId, player);
      toast({
        title: "Você entrou no jogo!",
        description: "Aguarde sua vez de jogar.",
      });
    } catch (err) {
      console.error("Erro ao entrar no jogo:", err);
      toast({
        variant: "destructive",
        title: "Erro ao entrar no jogo",
        description: "Não foi possível entrar neste jogo.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Iniciar um novo jogo
  const iniciarJogo = async () => {
    // Escolher uma palavra aleatória
    const novaPalavra = palavras[Math.floor(Math.random() * palavras.length)];
    const novaDica = dicas[novaPalavra];
    
    const novoEstado: HangmanGameState = {
      palavra: novaPalavra,
      letrasAdivinhadas: [],
      erros: 0,
      status: "jogando",
      jogadorAtual: player.id,
      vencedor: null,
      dica: novaDica
    };
    
    setGameState(novoEstado);
    
    // Atualizar o estado no servidor
    try {
      await makeHangmanMove(gameId, novoEstado);
    } catch (err) {
      console.error("Erro ao inicializar jogo:", err);
      toast({
        variant: "destructive",
        title: "Erro ao inicializar jogo",
        description: "Não foi possível iniciar um novo jogo.",
      });
    }
  };

  // Verificar se o jogador ganhou
  const verificarVitoria = (palavra: string, letrasAdivinhadas: string[]) => {
    // Ganha quando todas as letras da palavra foram adivinhadas
    return [...palavra].every(letra => letrasAdivinhadas.includes(letra));
  };

  // Lidar com o clique em uma letra
  const handleLetraClique = async (letra: string) => {
    // Verificar se é a vez do jogador
    if (gameState.jogadorAtual !== player.id || gameState.status !== "jogando" || gameState.letrasAdivinhadas.includes(letra)) {
      return;
    }

    const novasLetrasAdivinhadas = [...gameState.letrasAdivinhadas, letra];
    let novosErros = gameState.erros;
    let novoStatus: "jogando" | "venceu" | "perdeu" = gameState.status;
    let novoVencedor = gameState.vencedor;

    // Verificar se a letra está na palavra
    const acertou = gameState.palavra.includes(letra);
    if (!acertou) {
      novosErros++;
      
      // Play error sound
      const audio = new Audio("/error.mp3");
      audio.volume = 0.3;
      audio.play().catch((e) => console.log("Audio play failed:", e));

      // Verificar se atingiu o máximo de erros
      if (novosErros >= MAX_ERROS) {
        novoStatus = "perdeu";
        // O vencedor é o outro jogador
        novoVencedor = game?.player_1_id === player.id ? game?.player_2_id : game?.player_1_id;
      }
    } else {
      // Play success sound
      const audio = new Audio("/success.mp3");
      audio.volume = 0.3;
      audio.play().catch((e) => console.log("Audio play failed:", e));
      
      // Verificar se o jogador ganhou
      const todasLetrasAdivinhadas = verificarVitoria(gameState.palavra, novasLetrasAdivinhadas);
      if (todasLetrasAdivinhadas) {
        novoStatus = "venceu";
        novoVencedor = player.id;
        setShowConfetti(true);
        
        // Play win sound
        const audio = new Audio("/win.mp3");
        audio.volume = 0.3;
        audio.play().catch((e) => console.log("Audio play failed:", e));
      }
    }

    // Alternar jogador apenas se errou a letra e o jogo continuar
    const novoJogadorAtual = (novoStatus === "jogando" && !acertou) ? 
      (game?.player_1_id === player.id ? game?.player_2_id : game?.player_1_id) : 
      player.id;

    const novoEstado: HangmanGameState = {
      ...gameState,
      letrasAdivinhadas: novasLetrasAdivinhadas,
      erros: novosErros,
      status: novoStatus,
      jogadorAtual: novoJogadorAtual,
      vencedor: novoVencedor
    };

    setGameState(novoEstado);

    // Enviar a jogada para o servidor
    try {
      await makeHangmanMove(gameId, novoEstado);
    } catch (err) {
      console.error("Erro ao fazer jogada:", err);
      toast({
        variant: "destructive",
        title: "Erro ao fazer jogada",
        description: "Não foi possível enviar sua jogada.",
      });
    }
  };

  // Mostrar dica
  const handleMostrarDica = async () => {
    if (gameState.jogadorAtual !== player.id || gameState.status !== "jogando") {
      return;
    }

    setMostraDica(true);
    setPenaltyForHint(true);

    // Aplicar penalidade (incrementar erros)
    const novosErros = gameState.erros + 1;
    let novoStatus = gameState.status;
    let novoVencedor = gameState.vencedor;

    // Verificar se perdeu o jogo devido à penalidade
    if (novosErros >= MAX_ERROS) {
      novoStatus = "perdeu";
      novoVencedor = game?.player_1_id === player.id ? game?.player_2_id : game?.player_1_id;
    }

    const novoEstado: HangmanGameState = {
      ...gameState,
      erros: novosErros,
      status: novoStatus,
      vencedor: novoVencedor
    };

    setGameState(novoEstado);

    // Enviar a atualização para o servidor
    try {
      await makeHangmanMove(gameId, novoEstado);
    } catch (err) {
      console.error("Erro ao aplicar penalidade por dica:", err);
    }
  };

  // Solicitar revanche
  const handleRequestRematch = async () => {
    try {
      await requestRematch(gameId, player.id);
      toast({
        title: "Revanche solicitada",
        description: "Aguardando resposta do outro jogador.",
      });
    } catch (err) {
      console.error("Erro ao solicitar revanche:", err);
      toast({
        variant: "destructive",
        title: "Erro ao solicitar revanche",
        description: "Não foi possível solicitar uma revanche.",
      });
    }
  };

  // Aceitar revanche
  const handleAcceptRematch = async () => {
    try {
      await acceptRematch(gameId);
      setShowRematchModal(false);
      setShowResultModal(false);
      iniciarJogo();
    } catch (err) {
      console.error("Erro ao aceitar revanche:", err);
      toast({
        variant: "destructive",
        title: "Erro ao aceitar revanche",
        description: "Não foi possível aceitar a revanche.",
      });
    }
  };

  // Recusar revanche
  const handleDeclineRematch = async () => {
    try {
      await declineRematch(gameId);
      setShowRematchModal(false);
      router.push("/jogo-da-forca/online");
    } catch (err) {
      console.error("Erro ao recusar revanche:", err);
      toast({
        variant: "destructive",
        title: "Erro ao recusar revanche",
        description: "Não foi possível recusar a revanche.",
      });
    }
  };

  // Renderizar o teclado
  const renderTeclado = () => {
    const linhas = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    return (
      <div className="mt-6">
        {linhas.map((linha, i) => (
          <div key={i} className="flex justify-center mb-2 gap-1">
            {linha.map(letra => {
              const isDisabled = gameState.letrasAdivinhadas.includes(letra) || gameState.status !== "jogando" || gameState.jogadorAtual !== player.id;
              const isCorrect = gameState.palavra.includes(letra) && gameState.letrasAdivinhadas.includes(letra);
              const isIncorrect = !gameState.palavra.includes(letra) && gameState.letrasAdivinhadas.includes(letra);
              
              return (
                <motion.button
                  key={letra}
                  onClick={() => handleLetraClique(letra)}
                  disabled={isDisabled}
                  className={`w-9 h-10 sm:w-10 sm:h-11 rounded-md font-medium text-sm sm:text-base flex items-center justify-center transition-all ${isCorrect ? 'bg-green-600 text-white' : isIncorrect ? 'bg-red-600 text-white' : isDisabled ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {letra}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar a palavra com espaços para letras não adivinhadas
  const renderPalavra = () => {
    return (
      <div className="flex justify-center flex-wrap gap-2 my-6">
        {[...gameState.palavra].map((letra, index) => (
          <motion.div
            key={index}
            className={`w-8 h-10 sm:w-10 sm:h-12 border-b-2 ${gameState.letrasAdivinhadas.includes(letra) || gameState.status !== "jogando" ? 'border-cyan-500' : 'border-slate-400'} flex items-center justify-center text-xl sm:text-2xl font-bold`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {gameState.letrasAdivinhadas.includes(letra) || gameState.status !== "jogando" ? letra : ''}
          </motion.div>
        ))}
      </div>
    );
  };

  // Renderizar o boneco da forca
  const renderForca = () => {
    return (
      <div className="relative w-full h-64 max-w-md mx-auto">
        <svg width="100%" height="100%" viewBox="0 0 200 250" className="text-slate-300">
          {/* Base */}
          <motion.line
            x1="20" y1="230" x2="100" y2="230"
            strokeWidth="4"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Poste vertical */}
          <motion.line
            x1="40" y1="230" x2="40" y2="30"
            strokeWidth="4"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          {/* Poste horizontal */}
          <motion.line
            x1="40" y1="30" x2="140" y2="30"
            strokeWidth="4"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />
          
          {/* Corda */}
          <motion.line
            x1="140" y1="30" x2="140" y2="50"
            strokeWidth="4"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
          
          {/* Cabeça */}
          {gameState.erros >= 1 && (
            <motion.circle
              cx="140" cy="70" r="20"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              fill="transparent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Corpo */}
          {gameState.erros >= 2 && (
            <motion.line
              x1="140" y1="90" x2="140" y2="150"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Braço esquerdo */}
          {gameState.erros >= 3 && (
            <motion.line
              x1="140" y1="110" x2="110" y2="130"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Braço direito */}
          {gameState.erros >= 4 && (
            <motion.line
              x1="140" y1="110" x2="170" y2="130"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Perna esquerda */}
          {gameState.erros >= 5 && (
            <motion.line
              x1="140" y1="150" x2="110" y2="190"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          
          {/* Perna direita */}
          {gameState.erros >= 6 && (
            <motion.line
              x1="140" y1="150" x2="170" y2="190"
              strokeWidth="4"
              stroke="rgb(248 113 113)" // text-red-400 equivalent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </svg>
      </div>
    );
  };

  // Renderizar informações do jogo
  const renderGameInfo = () => {
    if (!game) return null;
    
    const isMyTurn = gameState.jogadorAtual === player.id;
    const opponentId = game.player_1_id === player.id ? game.player_2_id : game.player_1_id;
    const opponentNickname = game.player_1_id === player.id ? game.player_2_nickname : game.player_1_nickname;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 text-slate-300 hover:bg-slate-800/50 hover:text-white"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Voltar ao Menu</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2 text-slate-300 hover:bg-slate-800/50 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`rounded-xl border ${isMyTurn ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/50'} p-4 text-center`}>
            <p className="text-sm text-slate-400 mb-1">Você</p>
            <p className="font-bold text-lg">{player.nickname}</p>
            {isMyTurn && <p className="text-cyan-400 text-sm mt-1">Sua vez</p>}
          </div>
          
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <p className="font-bold text-lg">
              {gameState.status === "jogando" ? "Em andamento" : 
               gameState.status === "venceu" ? "Jogo finalizado" : 
               "Jogo finalizado"}
            </p>
            <p className="text-sm mt-1">
              {gameState.status === "jogando" ? 
                `Erros: ${gameState.erros}/${MAX_ERROS}` : 
                (gameState.status === "venceu" ? 
                  (gameState.vencedor === player.id ? "Você venceu!" : "Você perdeu!") : "Você perdeu!")}
            </p>
          </div>
          
          <div className={`rounded-xl border ${!isMyTurn && opponentId ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 bg-slate-800/50'} p-4 text-center`}>
            <p className="text-sm text-slate-400 mb-1">Oponente</p>
            <p className="font-bold text-lg">{opponentNickname || "Aguardando..."}</p>
            {!isMyTurn && opponentId && <p className="text-pink-400 text-sm mt-1">Vez do oponente</p>}
          </div>
        </div>
        
        {/* Mostrar dica se solicitado */}
        {mostraDica && gameState.dica && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-slate-800/70 border border-slate-700 text-center"
          >
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-cyan-400">Dica:</span> {gameState.dica}
              {penaltyForHint && <span className="text-red-400 ml-2">(+1 erro)</span>}
            </p>
          </motion.div>
        )}
      </div>
    );
  };

  // Renderizar o conteúdo principal do jogo
  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao Menu</Link>
        </Button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Jogo não encontrado</AlertTitle>
          <AlertDescription>Este jogo não existe ou foi removido.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao Menu</Link>
        </Button>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Entrando no jogo...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-lg backdrop-blur-md sm:p-8">
      {renderGameInfo()}
      
      <div className="mb-6">
        {renderForca()}
      </div>
      
      <div className="mb-6">
        {renderPalavra()}
      </div>
      
      {renderTeclado()}
      
      {/* Botão de dica */}
      {gameState.status === "jogando" && gameState.jogadorAtual === player.id && !mostraDica && (
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={handleMostrarDica}
            className="gap-2 text-amber-400 border-amber-800/50 hover:bg-amber-950/30"
          >
            <HelpCircle className="h-4 w-4" />
            Ver Dica (Penalidade: +1 erro)
          </Button>
        </div>
      )}
      
      {/* Modal de resultado */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            {gameState.status === "venceu" ? (
              <>
                {gameState.vencedor === player.id ? (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Você Venceu!</h2>
                    <p className="text-slate-400 mb-6">Parabéns! Você adivinhou a palavra corretamente.</p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                      <Trophy className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Você Perdeu!</h2>
                    <p className="text-slate-400 mb-6">Seu oponente adivinhou a palavra corretamente.</p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Fim de Jogo</h2>
                <p className="text-slate-400 mb-2">Você não conseguiu adivinhar a palavra.</p>
                <p className="font-medium mb-6">A palavra era: <span className="text-cyan-400">{gameState.palavra}</span></p>
              </>
            )}
            
            <div className="flex justify-center gap-3">
              <Button onClick={handleRequestRematch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Revanche
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  Voltar ao Menu
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de revanche */}
      <RematchModal 
        isOpen={showRematchModal}
        onAccept={handleAcceptRematch}
        onDecline={handleDeclineRematch}
        requesterName={game.rematch_requested_by === game.player_1_id ? game.player_1_nickname : game.player_2_nickname}
      />
    </div>
  );
}