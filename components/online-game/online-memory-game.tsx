'use client';

import React, { useEffect, useState, useRef } from 'react';
import '@/styles/card-fixed-no-circle.css'; // Importar estilos consolidados para corrigir os ícones sem círculos
import { Heart, Medal, RotateCcw, Trophy, AlertCircle, Clock, Users, 
  // Importar explicitamente os ícones que usaremos para as cartas
  Heart as HeartIcon, 
  Star, 
  Moon, 
  Sun, 
  Cloud, 
  Umbrella, 
  Pencil, 
  Camera, 
  Gift, 
  Music, 
  Bell, 
  Anchor, 
  Airplay,
  Trees,
  Car, 
  Key, 
  Lock, 
  Crown, 
  Diamond,
  Loader2,
  Link2,
  RefreshCw,
  ArrowLeft,
  Hand,
  Scale,
  X,
  Check,
  HourglassIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MemoryGameSession,
  MemoryCard,
  flipMemoryCard,
  requestMemoryRematch,
  subscribeToMemoryGame,
  unsubscribeFromChannel
} from '@/lib/supabase';
import { usePlayer } from '@/lib/hooks/use-player';
import { RematchModal } from './rematch-modal';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';

// Mapeamento de nomes de ícones para componentes Lucide
import * as LucideIcons from 'lucide-react';

interface OnlineMemoryGameProps {
  initialGame: MemoryGameSession;
  onGameUpdate?: (game: MemoryGameSession) => void;
}

// Pré-carregar explicitamente TODOS os componentes de ícone diretamente
const allIconComponents: Record<string, React.ComponentType<any>> = {
  Heart: HeartIcon,
  Star: Star,
  Moon: Moon,
  Sun: Sun,
  Cloud: Cloud,
  Umbrella: Umbrella,
  Pencil: Pencil,
  Camera: Camera,
  Gift: Gift,
  Music: Music,
  Bell: Bell,
  Anchor: Anchor,
  Airplay: Airplay,
  Trees: Trees,
  Car: Car,
  Key: Key,
  Lock: Lock,
  Crown: Crown,
  Diamond: Diamond
};

export function OnlineMemoryGame({ initialGame, onGameUpdate }: OnlineMemoryGameProps) {
  const router = useRouter();
  const { player } = usePlayer();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [game, setGame] = useState<MemoryGameSession>(initialGame);
  const [isRematchModalOpen, setIsRematchModalOpen] = useState(false);
  const [rematchGameId, setRematchGameId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [waitingForReset, setWaitingForReset] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [isAcceptingRematch, setIsAcceptingRematch] = useState(false);
  const [isReceivingRematch, setIsReceivingRematch] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | 'draw' | 'playing'>('playing');
  // Adicionar estado de cooldown para evitar cliques muito rápidos
  const [cooldownActive, setCooldownActive] = useState(false);
  // Adicionar estado para controlar o modal de resultado
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Identificar se o jogador é o jogador 1 ou 2
  const isPlayer1 = player?.id === game.player_1_id;
  const isPlayer2 = player?.id === game.player_2_id;
  const isCurrentPlayer = player?.id === game.current_player_id;
  
  // Obter os nomes dos jogadores
  const player1Name = game.player_1_nickname;
  const player2Name = game.player_2_nickname || 'Aguardando jogador...';
  
  // Obter a pontuação dos jogadores
  const player1Score = game.player_1_matches;
  const player2Score = game.player_2_matches || 0;
  
  // Determinar o status do jogo
  const isGameFinished = game.status === 'finished';
  const isGameWaiting = game.status === 'waiting';
  const isGamePlaying = game.status === 'playing';
  
  // Verificar se há um vencedor
  const isWinner = isGameFinished && game.winner_id === player?.id;
  const isDraw = isGameFinished && game.winner_id === null;
  
  // Verificar se alguém solicitou revanche
  const hasRematchRequest = !!game.rematch_requested_by;
  const playerRequestedRematch = game.rematch_requested_by === player?.id;
  const opponentRequestedRematch = game.rematch_requested_by && game.rematch_requested_by !== player?.id;
  
  // Nome do oponente
  const opponentNickname = isPlayer1 ? player2Name : player1Name;

  // Referências para os elementos de áudio pré-carregados
  const flipAudioRef = useRef<HTMLAudioElement | null>(null);
  const matchAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pré-carregar os sons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Criar elementos de áudio uma vez e reutilizá-los
      flipAudioRef.current = new Audio("/sounds/flip.mp3");
      matchAudioRef.current = new Audio("/sounds/match.mp3");
      winAudioRef.current = new Audio("/sounds/win.mp3");
      
      // Configurar volume
      if (flipAudioRef.current) flipAudioRef.current.volume = 0.3;
      if (matchAudioRef.current) matchAudioRef.current.volume = 0.3;
      if (winAudioRef.current) winAudioRef.current.volume = 0.4;
    }
    
    return () => {
      // Limpar os elementos de áudio na desmontagem
      if (flipAudioRef.current) flipAudioRef.current = null;
      if (matchAudioRef.current) matchAudioRef.current = null;
      if (winAudioRef.current) winAudioRef.current = null;
    };
  }, []);
  
  // Função para reproduzir som com tratamento de erro
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    try {
      if (audioRef.current && !isMuted) {
        const sound = audioRef.current;
        sound.currentTime = 0;
        sound.play().catch(e => console.warn('Sound play failed:', e));
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  };

  // Mapeamento de nomes de ícones para emojis
  const emojiMap: {[key: string]: string} = {
    Heart: '❤️',
    Star: '⭐',
    Moon: '🌙',
    Sun: '☀️',
    Cloud: '☁️',
    Umbrella: '☂️',
    Pencil: '✏️',
    Camera: '📸',
    Gift: '🎁',
    Music: '🎵',
    Bell: '🔔',
    Anchor: '⚓',
    Airplay: '📱',
    Trees: '🌳',
    Car: '🚗',
    Key: '🔑',
    Lock: '🔒',
    Crown: '👑',
    Diamond: '💎'
  };
  
  // Timer para o jogo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isGamePlaying && !isGameFinished) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGamePlaying, isGameFinished]);

  // Formatador de tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Efeito para assinar as atualizações do jogo em tempo real
  useEffect(() => {
    // Inscreve-se para atualizações em tempo real
    const subscription = subscribeToMemoryGame(game.id, (payload: any) => {
      // Verificar se é um evento específico de revanche aceita
      if (payload.event === 'rematch_accepted') {
        console.log('Evento de revanche aceita recebido!', payload);
        const rematchData = payload.payload;

        if (rematchData.original_game_id === game.id && rematchData.new_game_id) {
          console.log(`Revanche aceita! Redirecionando para novo jogo: ${rematchData.new_game_id}`);

          // Limpar todos os estados de revanche
          setIsRequestingRematch(false);
          setIsReceivingRematch(false);
          setIsRematchModalOpen(false);

          // Atualizar estado local do jogo
          setGame(prevGame => ({
            ...prevGame,
            rematch_game_id: rematchData.new_game_id,
            rematch_accepted: true,
            rematch_requested_by: null // Limpar o solicitante para não ficar bloqueado
          }));

          // Atualizar estado local de ID de revanche
          setRematchGameId(rematchData.new_game_id);

          // Mostrar toast de confirmação
          toast.success("Revanche aceita! Redirecionando...", {
            id: "rematch-toast",
            duration: 2000,
            className: "bg-green-800 text-green-100 border-green-700"
          });

          // Atraso para redirecionar
          setTimeout(() => {
            router.push(`/jogo-da-memoria/online/${rematchData.new_game_id}`);
          }, 1500);
          return;
        }
      }
      
      // Continuar com a lógica existente para os outros eventos
      const updatedGame = payload.new as MemoryGameSession;
      
      // Verificar se o jogo foi atualizado com um ID de revanche
      if (updatedGame && updatedGame.rematch_game_id && 
          (game.rematch_game_id !== updatedGame.rematch_game_id || 
           !game.rematch_accepted && updatedGame.rematch_accepted)) {
        console.log(`Jogo atualizado com ID de revanche: ${updatedGame.rematch_game_id}, aceito: ${updatedGame.rematch_accepted}`);
        
        // Atualizar estado local
        setGame(prevGame => ({
          ...prevGame,
          rematch_game_id: updatedGame.rematch_game_id,
          rematch_accepted: true, 
          rematch_requested_by: null // Limpar o estado de solicitação
        }));
        
        // Definir o ID de revanche no estado para acionar o redirecionamento
        setRematchGameId(updatedGame.rematch_game_id);
        
        // Fechar os modais e limpar estados de revanche
        setIsRequestingRematch(false);
        setIsRematchModalOpen(false);
        
        // Mostrar toast e redirecionar
        toast.success("Revanche aceita! Redirecionando...", {
          id: "rematch-toast",
          duration: 2000,
          className: "bg-green-800 text-green-100 border-green-700"
        });
        
        // Usar timeout mais longo para garantir que o outro jogador também tenha tempo de processar
        setTimeout(() => {
          router.push(`/jogo-da-memoria/online/${updatedGame.rematch_game_id}`);
        }, 1500);
        return;
      }
      
      // Ativar cooldown temporariamente para evitar cliques durante atualizações
      setCooldownActive(true);
      
      // Verificar se há cartas com ícones inválidos e corrigi-las
      if (updatedGame.cards && updatedGame.cards.some(card => 
          card.iconName && !allIconComponents[card.iconName])) {
        
        // Mapear nomes de ícones antigos para os novos
        const iconCorrections: {[key: string]: string} = {
          'Tree': 'Trees',
          'Airplane': 'Airplay'
        };
        
        // Criar cópia das cartas com os ícones corrigidos
        const correctedCards = updatedGame.cards.map(card => {
          if (card.iconName && iconCorrections[card.iconName]) {
            return {
              ...card,
              iconName: iconCorrections[card.iconName]
            };
          }
          return card;
        });
        
        // Verificar se houve correções
        const hasCorrections = correctedCards.some((card, index) => 
          card.iconName !== updatedGame.cards[index].iconName);
        
        // Atualizar o jogo com as cartas corrigidas
        updatedGame.cards = correctedCards;
        
        // Se houve correções, persistir no servidor
        if (hasCorrections && player && isCurrentPlayer) {
          // Enviar as cartas corrigidas para o servidor
          fetch(`/api/memory-game/${game.id}/update-cards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              cards: correctedCards
            })
          }).catch(error => {
            console.error('Erro ao salvar correções de ícones:', error);
          });
        }
      }
      
      // Processar o reset de cartas pendentes
      if (updatedGame.reset_pending && updatedGame.cards_to_reset && updatedGame.cards_to_reset.length > 0) {
        const resetTime = 1500; // 1.5 segundos
        const resetScheduledAt = new Date(updatedGame.reset_scheduled_at || Date.now()).getTime();
        const currentTime = Date.now();
        const timeElapsed = currentTime - resetScheduledAt;
        
        // Quando recebemos um evento de cartas para desvirar, imediatamente marcamos como waitingForReset
        // para prevenir novas interações do usuário enquanto o reset está ocorrendo
        setWaitingForReset(true);
        
        if (timeElapsed < resetTime) {
          // Se ainda não passou o tempo de reset, esperar o tempo restante
          const remainingTime = Math.max(0, resetTime - timeElapsed);
          
          setTimeout(() => {
            // Desvirar as cartas no estado interno (mesmo se o servidor já as desvirou)
            setGame(prevGame => {
              // Criar uma cópia profunda para evitar mutações diretas do estado
              const updatedGameCopy = JSON.parse(JSON.stringify(prevGame));
              
              // Desvirar as cartas específicas
              if (updatedGameCopy.cards_to_reset) {
                updatedGameCopy.cards_to_reset.forEach((cardId: number) => {
                  if (updatedGameCopy.cards && updatedGameCopy.cards[cardId]) {
                    updatedGameCopy.cards[cardId].isFlipped = false;
                  }
                });
              }
              
              // Garantir que o estado de reset é atualizado
              updatedGameCopy.reset_pending = false;
              updatedGameCopy.cards_to_reset = [];
              
              return updatedGameCopy;
            });
            
            // Liberar o bloqueio de interação
        setWaitingForReset(false);
            setCooldownActive(false);
          }, remainingTime);
        } else {
          // Se já passou o tempo de reset, desvirar as cartas imediatamente
          setGame(prevGame => {
            // Criar uma cópia profunda para evitar mutações diretas do estado
            const updatedGameCopy = JSON.parse(JSON.stringify(prevGame));
            
            // Desvirar as cartas específicas
            if (updatedGameCopy.cards_to_reset) {
              updatedGameCopy.cards_to_reset.forEach((cardId: number) => {
                if (updatedGameCopy.cards && updatedGameCopy.cards[cardId]) {
                  updatedGameCopy.cards[cardId].isFlipped = false;
                }
              });
            }
            
            // Garantir que o estado de reset é atualizado
            updatedGameCopy.reset_pending = false;
            updatedGameCopy.cards_to_reset = [];
            
            return updatedGameCopy;
          });
          
          // Liberar o bloqueio de interação
          setWaitingForReset(false);
          setCooldownActive(false);
        }
      } else {
        // Se não há cards_to_reset, não estamos mais esperando pelo reset
        setWaitingForReset(false);
        
        // Desativar o cooldown depois de um curto período para permitir a visualização das mudanças
        setTimeout(() => {
          setCooldownActive(false);
        }, 300);
      }
      
      // Atualizar o estado do jogo
      setGame(updatedGame);
      
      // Notificar o componente pai, se necessário
      if (onGameUpdate) {
        onGameUpdate(updatedGame);
      }
      
      // Verificar se uma revanche foi solicitada ou aceita
      if (!game.rematch_requested_by && updatedGame.rematch_requested_by) {
        // Se o oponente solicitou revanche
        if (updatedGame.rematch_requested_by !== player?.id) {
          // Fechar o modal de resultado se estiver aberto
          setShowResultModal(false);
          
          setIsReceivingRematch(true);
          setIsRematchModalOpen(true);
          
          // Notificar o usuário
          toast.info(`${opponentNickname} solicitou uma revanche!`, {
            duration: 5000,
            className: "bg-purple-800 text-purple-100 border-purple-700"
          });
        }
      }
    });
    
    // Inicializa as cartas após os jogadores entrarem
    if (game.status === 'playing' && game.cards) {
      // Verificar se as cartas precisam de inicialização (sem iconName)
      const needsInitialization = game.cards.some(card => !card.iconName);
      if (needsInitialization) {
        console.log('Inicializando cartas do jogo...');
        initializeCards();
      } else {
        console.log('Cartas já estão inicializadas:', game.cards);
        
        // Verificar e corrigir ícones inválidos em cartas já inicializadas
        const hasInvalidIcons = game.cards.some(card => 
          card.iconName && !allIconComponents[card.iconName]);
        
        if (hasInvalidIcons) {
          console.log('Corrigindo ícones inválidos em cartas existentes');
          
          // Mapear nomes de ícones antigos para os novos
          const iconCorrections: {[key: string]: string} = {
            'Tree': 'Trees',
            'Airplane': 'Airplay'
          };
          
          // Corrigir as cartas localmente
          const correctedCards = game.cards.map(card => {
            if (card.iconName && iconCorrections[card.iconName]) {
              console.log(`Corrigindo ícone '${card.iconName}' para '${iconCorrections[card.iconName]}'`);
              return {
                ...card,
                iconName: iconCorrections[card.iconName]
              };
            }
            return card;
          });
          
          // Atualizar o estado local com as cartas corrigidas
          setGame(prevGame => ({
            ...prevGame,
            cards: correctedCards
          }));
        }
      }
    }
    
    return () => {
      // Cancelar inscrição na desmontagem do componente
      if (subscription) {
      unsubscribeFromChannel(subscription);
      }
    };
  }, [game.id, game.rematch_requested_by, game.rematch_game_id, player?.id, opponentNickname, router]);
  
  // Adicionar um efeito para forçar a renderização de todas as cartas no carregamento inicial
  useEffect(() => {
    // Garantir que o estado das cartas inclui as informações de ícone
    if (game.cards && game.cards.length > 0) {
      const anyCardMissingIconName = game.cards.some(card => !card || !card.iconName);
      
      if (anyCardMissingIconName) {
        console.log('Detectado cartas sem iconName - corrigindo...');
        
        // Se o jogo já começou e há cartas sem iconName, tentar inicializar
        if (isGamePlaying) {
          console.log('Tentando inicializar cartas faltando iconName...');
          initializeCards();
        }
      }
    }
  }, [game.cards, isGamePlaying]);
  
  // Função para inicializar as cartas (modificada para garantir ícones corretos)
  const initializeCards = async () => {
    // Lista de ícones disponíveis - usar apenas os que temos certeza que estão definidos
    const availableIcons = [
      'Heart', 'Star', 'Moon', 'Sun', 'Cloud', 
      'Umbrella', 'Pencil', 'Camera', 'Gift', 'Music', 
      'Bell', 'Anchor', 'Airplay', 'Trees', 'Car',
      'Key', 'Lock', 'Crown', 'Diamond'
    ];
    
    // Validar que todos os ícones estão disponíveis

    // Lista de cores
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#33FFF5',
      '#F533FF', '#FF8C33', '#33FF8C', '#8C33FF', '#FFFF33'
    ];
    
    const { rows, cols } = game.grid_config;
    const totalPairs = (rows * cols) / 2;
    
    // Verificar se temos ícones suficientes
    if (availableIcons.length < totalPairs) {
      console.error(`Não há ícones suficientes! Temos ${availableIcons.length} ícones para ${totalPairs} pares.`);
      // Repetir ícones se necessário
      while (availableIcons.length < totalPairs) {
        availableIcons.push(...availableIcons);
      }
    }
    
    // Embaralhar os ícones e selecionar os pares necessários
    const shuffledIcons = [...availableIcons]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalPairs);
    
    // Ícones selecionados para os pares
    
    // Cria pares de cartas
    let pairs: { iconName: string, color: string }[] = [];
    shuffledIcons.forEach(iconName => {
      // Escolhe uma cor aleatória para o par
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Adiciona duas cartas com o mesmo ícone e cor
      pairs.push({ iconName, color: randomColor });
      pairs.push({ iconName, color: randomColor });
    });
    
    // Embaralha todos os pares
    const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
    
    // Cria o array de cartas com as informações atualizadas
    const updatedCards: MemoryCard[] = shuffledPairs.map((pair, index) => ({
      id: index,
      iconName: pair.iconName,
      color: pair.color,
      isFlipped: false,
      isMatched: false
    }));
    
    // Atualiza o estado do jogo com reconciliação de reset
    setGame(prevGame => ({
      ...prevGame,
      cards: updatedCards,
      last_reset: new Date().toISOString()
    }));
    
    // Cartas inicializadas
    
    // Enviar as cartas atualizadas para o servidor
    try {
      const { data, error } = await fetch(`/api/memory-game/${game.id}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cards: updatedCards,
          grid_config: game.grid_config
        })
      }).then(res => res.json());
      
      if (error) {
        console.error('Erro ao inicializar cartas:', error);
      }
    } catch (error) {
      console.error('Erro ao inicializar cartas:', error);
    }
  };
  
  // Função para garantir que todos os dados necessários estão presentes
  const validateGameState = (game: MemoryGameSession | null) => {
    if (!game) {
      console.error('Estado do jogo é nulo');
      return false;
    }
    
    if (!game.cards || !Array.isArray(game.cards)) {
      console.error('Cartas não estão definidas ou não são um array');
      return false;
    }
    
    if (!game.player_1_id) {
      console.error('Jogador 1 não definido');
      return false;
    }
    
    return true;
  };
  
  // Função para lidar com o clique em uma carta
  const handleCardClick = async (cardIndex: number) => {
    // Verificações de segurança para evitar cliques indevidos
    if (gameEnded) return;
    if (cooldownActive) {
        console.log('Clique bloqueado: em período de cooldown');
        return;
    }

    const canPlay = player?.id === game.current_player_id;
    console.log("Tentativa de jogada:", 
      "ID jogador:", player?.id?.substring(0, 6), 
      "ID turno atual:", game.current_player_id?.substring(0, 6),
      "Pode jogar?", canPlay);
      
    if (!canPlay) {
        toast.info("Espere sua vez para jogar!", {
            duration: 2000,
            className: "bg-blue-800 text-blue-100 border-blue-700"
        });
        return;
    }

    if (waitingForReset) return;

    const card = game.cards[cardIndex];
    if (!card) {
        console.error(`Carta não encontrada no índice ${cardIndex}`);
        return;
    }

    if (card.isFlipped) {
        toast.info("Esta carta já está virada", {
            duration: 1500,
            position: "bottom-center",
            className: "bg-blue-800/80 text-blue-100 border-blue-700/50 text-sm"
        });
        return;
    }

    if (card.isMatched) {
        toast.info("Esta carta já foi combinada", {
            duration: 1500,
            position: "bottom-center",
            className: "bg-green-800/80 text-green-100 border-green-700/50 text-sm"
        });
        return;
    }

    try {
        setCooldownActive(true);
        playSound(flipAudioRef);

        // Obter o jogo atualizado do servidor
        const updatedGame = await flipMemoryCard(game.id, player!.id, cardIndex);

        // Verificar se a resposta é válida
        if (!updatedGame || !updatedGame.cards) {
            console.error('Resposta inválida do servidor');
            setCooldownActive(false);
            return;
        }

        // Atualizar o estado local com a resposta do servidor
        setGame(updatedGame);

        // Verificar se a jogada resultou em um par
        const matchedCards = updatedGame.cards.filter(c => c.isMatched);
        const matchFound = matchedCards.length > game.cards.filter(c => c.isMatched).length;

        if (matchFound) {
            playSound(matchAudioRef);
            setTimeout(() => {
                setCooldownActive(false);
            }, 600); // Cooldown um pouco maior para matches
        } else {
            // Se a vez mudou para o outro jogador
            const turnChanged = updatedGame.current_player_id !== game.current_player_id;

            if (turnChanged) {
                // Atualizar o estado do jogo para passar a vez
                setGame(prevGame => ({
                    ...prevGame,
                    current_player_id: updatedGame.current_player_id // Atualiza o ID do próximo jogador
                }));

                // Notificar o servidor sobre a mudança de turno
                await supabase.channel('memory-game').send({
                    type: 'broadcast',
                    event: 'turn_changed',
                    payload: {
                        game_id: game.id,
                        current_player_id: updatedGame.current_player_id
                    }
                });

                setWaitingForReset(true);
                setTimeout(() => {
                    setWaitingForReset(false);
                }, 1500);
            } else {
                // Para a primeira carta de um par, usar cooldown curto
                setTimeout(() => {
                    setCooldownActive(false);
                }, 300);
            }
        }

        // Notificar o componente pai
        if (onGameUpdate) {
            onGameUpdate(updatedGame);
        }
    } catch (error) {
        console.error('Erro ao processar jogada:', error);
        setCooldownActive(false);
    }
};
  
  // Função para solicitar revanche
  const handleRequestRematch = async () => {
    if (!player) return;
    
    try {
      setIsRequestingRematch(true);
      // Fechar o modal de resultado ao solicitar revanche
      setShowResultModal(false);
      
      // Mostrar feedback ao usuário
      toast.loading("Solicitando revanche...", {
        id: "rematch-request",
        duration: 3000,
        className: "bg-indigo-800 text-indigo-100 border-indigo-700"
      });
      
      // Verificar se o jogo já tem um ID de revanche (caso o outro jogador já tenha solicitado)
      if (game.rematch_game_id) {
        console.log(`Jogo já tem revanche com ID: ${game.rematch_game_id}. Redirecionando...`);
        setRematchGameId(game.rematch_game_id);
        
        toast.success("Revanche já criada! Redirecionando...", {
          id: "rematch-request",
          duration: 2000,
          className: "bg-green-800 text-green-100 border-green-700"
        });
        
        // Enviar evento de revanche aceita manualmente para garantir sincronização
        try {
            const channel = supabase.channel('memory-game');
            await channel.send({
                type: 'broadcast',
                event: 'rematch_accepted',
                payload: {
                    original_game_id: game.id,
                    new_game_id: game.rematch_game_id,
                    timestamp: new Date().toISOString()
                }
            });
            console.log('Broadcast manual de rematch_accepted enviado de handleRequestRematch');
        } catch (error) {
            console.warn('Erro ao enviar broadcast manual de rematch_accepted:', error);
        }
        
        setTimeout(() => {
          router.push(`/jogo-da-memoria/online/${game.rematch_game_id}`);
        }, 800);
        return;
      }
      
      // Tentar criar a revanche
      const result = await requestMemoryRematch(game.id, player.id);
      
      if (result && result.rematch_game_id) {
        console.log(`Revanche aceita com ID: ${result.rematch_game_id}`);
        setRematchGameId(result.rematch_game_id);
        
        toast.success("Revanche criada! Redirecionando...", {
          id: "rematch-request",
          duration: 2000,
          className: "bg-green-800 text-green-100 border-green-700"
        });
        
        // Atualizar o estado do jogo
        setGame(prevGame => ({
          ...prevGame,
          rematch_game_id: result.rematch_game_id,
          rematch_accepted: true
        }));
        
        // Enviar evento de revanche aceita manualmente como backup
        try {
            const channel = supabase.channel('memory-game');
            await channel.send({
                type: 'broadcast',
                event: 'rematch_accepted',
                payload: {
                    original_game_id: game.id,
                    new_game_id: result.rematch_game_id,
                    timestamp: new Date().toISOString()
                }
            });
            console.log('Broadcast manual de rematch_accepted enviado após solicitar e criar revanche');
        } catch (error) {
            console.warn('Erro ao enviar broadcast manual de rematch_accepted:', error);
        }
        
        setTimeout(() => {
          router.push(`/jogo-da-memoria/online/${result.rematch_game_id}`);
        }, 800);
      } else if (result) {
        console.log('Solicitação de revanche registrada, aguardando aceitação');
        
        // Atualizar o estado local com a solicitação de revanche
        setGame(result);
        setIsRematchModalOpen(true);
        
        toast.success("Solicitação de revanche enviada! Aguardando resposta...", {
          id: "rematch-request",
          duration: 3000,
          className: "bg-indigo-800 text-indigo-100 border-indigo-700"
        });
      } else {
        console.error('Falha ao processar solicitação de revanche');
        
        toast.error("Não foi possível processar a revanche. Tente novamente.", {
          id: "rematch-request",
          duration: 3000,
          className: "bg-red-800 text-red-100 border-red-700"
        });
        
        setIsRequestingRematch(false);
      }
    } catch (error) {
      console.error('Erro ao solicitar revanche:', error);
      setIsRequestingRematch(false);
      
      // Feedback de erro
      toast.error("Erro ao solicitar revanche. Tente novamente.", {
        duration: 3000,
        className: "bg-red-800 text-red-100 border-red-700"
      });
    }
  };
  
  // Função para aceitar revanche
  const handleAcceptRematch = async () => {
    try {
        // Mostrar toast de carregamento
        toast.loading("Processando revanche...", {
            id: "revanche-loading",
            duration: 5000,
            className: "bg-blue-800 text-blue-100 border-blue-700"
        });

        // Verificar se já existe um ID de revanche
        const rematchId = rematchGameId || game.rematch_game_id;

        if (rematchId) {
            // Caso 1: Se já temos um ID de revanche, vamos usá-lo
            toast.success("Revanche aceita! Redirecionando...", {
                id: "revanche-loading",
                duration: 2000,
                className: "bg-green-800 text-green-100 border-green-700"
            });

            // Atualizar no banco de dados para garantir que o estado seja persistido
            try {
                const response = await fetch(`/api/memory-game/${game.id}/accept-rematch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        playerId: player?.id,
                        rematchGameId: rematchId
                    })
                });

                if (response.ok) {
                    console.log('[REVANCHE] Rematch confirmado com sucesso no servidor');
                } else {
                    console.warn('[REVANCHE] Erro ao confirmar rematch no servidor, mas continuando...');
                }
            } catch (apiError) {
                console.warn('[REVANCHE] Erro ao confirmar revanche via API:', apiError);
            }

            // Enviar evento de revanche aceita manualmente para garantir que ambos os jogadores recebam
            try {
                const channel = supabase.channel('memory-game');
                await channel.send({
                    type: 'broadcast',
                    event: 'rematch_accepted',
                    payload: {
                        original_game_id: game.id,
                        new_game_id: rematchId,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log('[REVANCHE] Broadcast manual de rematch_accepted enviado');
                
                // Enviar um segundo broadcast como garantia
                setTimeout(async () => {
                    try {
                        await channel.send({
                            type: 'broadcast',
                            event: 'rematch_accepted',
                            payload: {
                                original_game_id: game.id,
                                new_game_id: rematchId,
                                timestamp: new Date().toISOString(),
                                is_retry: true
                            }
                        });
                    } catch (error) {
                        console.warn('[REVANCHE] Erro ao enviar retry do broadcast:', error);
                    }
                }, 1000);
            } catch (error) {
                console.warn('[REVANCHE] Erro ao enviar broadcast manual de rematch_accepted:', error);
            }

            // Atualizar o estado do jogo para ambos os jogadores
            setGame(prevGame => ({
                ...prevGame,
                rematch_game_id: rematchId,
                rematch_accepted: true,
                rematch_requested_by: null // Limpar o solicitante
            }));

            // Atualizar estado local de ID de revanche 
            setRematchGameId(rematchId);

            // Redirecionar para o novo jogo após um breve delay
            setTimeout(() => {
                console.log(`[REVANCHE] Redirecionando para jogo de revanche existente: ${rematchId}`);
                router.push(`/jogo-da-memoria/online/${rematchId}`);
            }, 800);
        } else if (player && game.rematch_requested_by) {
            // Caso 2: Precisamos criar um novo jogo de revanche
            console.log(`[REVANCHE] Criando jogo de revanche para o jogo ${game.id} pelo jogador ${player.id}`);

            const result = await requestMemoryRematch(game.id, player.id);

            if (result && result.rematch_game_id) {
                // Sucesso! Temos um novo jogo de revanche
                console.log(`[REVANCHE] Revanche criada com sucesso: ${result.rematch_game_id}`);
                const newRematchId = result.rematch_game_id;
                
                // Definir o ID de revanche no estado
                setRematchGameId(newRematchId);

                toast.success("Revanche aceita! Redirecionando...", {
                    id: "revanche-loading",
                    duration: 2000,
                    className: "bg-green-800 text-green-100 border-green-700"
                });

                // Atualizar o estado do jogo com o novo rematch_game_id
                setGame(prevGame => ({
                    ...prevGame,
                    rematch_game_id: newRematchId,
                    rematch_accepted: true,
                    rematch_requested_by: null // Limpar o solicitante
                }));

                // Enviar evento de revanche aceita manualmente como backup
                try {
                    const channel = supabase.channel('memory-game');
                    await channel.send({
                        type: 'broadcast',
                        event: 'rematch_accepted',
                        payload: {
                            original_game_id: game.id,
                            new_game_id: newRematchId,
                            timestamp: new Date().toISOString()
                        }
                    });
                    console.log('[REVANCHE] Broadcast manual de rematch_accepted enviado após criar revanche');
                    
                    // Enviar um segundo broadcast como garantia
                    setTimeout(async () => {
                        try {
                            await channel.send({
                                type: 'broadcast',
                                event: 'rematch_accepted',
                                payload: {
                                    original_game_id: game.id,
                                    new_game_id: newRematchId,
                                    timestamp: new Date().toISOString(),
                                    is_retry: true
                                }
                            });
                        } catch (error) {
                            console.warn('[REVANCHE] Erro ao enviar retry do broadcast:', error);
                        }
                    }, 1000);
                } catch (error) {
                    console.warn('[REVANCHE] Erro ao enviar broadcast manual de rematch_accepted:', error);
                }

                // Redirecionar para o novo jogo após um breve delay
                setTimeout(() => {
                    router.push(`/jogo-da-memoria/online/${newRematchId}`);
                }, 800);
            } else {
                // Falha ao criar jogo de revanche
                console.error('[REVANCHE] Falha ao criar jogo de revanche', { result });

                toast.error("Erro ao processar revanche. Tente novamente.", {
                    id: "revanche-loading",
                    duration: 3000,
                    className: "bg-red-800 text-red-100 border-red-700"
                });

                // Fechar o modal para permitir uma nova tentativa
                setIsRematchModalOpen(false);
                setIsReceivingRematch(false);
            }
        } else {
            // Caso 3: Não há solicitação de revanche para aceitar
            console.error('[REVANCHE] Não há uma solicitação de revanche válida', {
                rematchGameId,
                gameRematchId: game.rematch_game_id,
                rematchRequestedBy: game.rematch_requested_by,
                playerId: player?.id
            });

            toast.error("Não foi possível encontrar a solicitação de revanche.", {
                id: "revanche-loading",
                duration: 3000,
                className: "bg-red-800 text-red-100 border-red-700"
            });

            // Fechar o modal
            setIsRematchModalOpen(false);
            setIsReceivingRematch(false);
        }
    } catch (error) {
        console.error('[REVANCHE] Erro ao processar aceitação de revanche:', error);

        toast.error("Erro ao processar revanche.", {
            id: "revanche-loading",
            duration: 3000,
            className: "bg-red-800 text-red-100 border-red-700"
        });

        // Fechar o modal
        setIsRematchModalOpen(false);
        setIsReceivingRematch(false);
    }
};
  
  // Função para recusar revanche
  const handleDeclineRematch = () => {
    // Use setTimeout para garantir que a atualização do estado ocorra após a renderização
    setTimeout(() => {
    setIsRematchModalOpen(false);
    setIsReceivingRematch(false);
    }, 0);
  };
  
  // Função para fechar o modal de revanche
  const handleCloseRematchModal = () => {
    if (!opponentRequestedRematch) {
      setIsRematchModalOpen(false);
    }
  };
  
  // Função para determinar o tamanho das cartas baseado no grid
  const getCardSize = () => {
    const { rows, cols } = game.grid_config;
    
    // Tamanhos baseados na versão offline, com ajustes para mais dispositivos
    if (rows === 3 && cols === 4) {
      // 3x4 - Fácil
      return "w-[65px] h-[65px] xs:w-[70px] xs:h-[70px] sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24";
    } else if (rows === 4 && cols === 4) {
      // 4x4 - Médio
      return "w-[60px] h-[60px] xs:w-[65px] xs:h-[65px] sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px] lg:w-22 lg:h-22";
    } else if (rows === 4 && cols === 6) {
      // 4x6 - Difícil
      return "w-[50px] h-[50px] xs:w-[55px] xs:h-[55px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] lg:w-20 lg:h-20";
    } else if (rows === 6 && cols === 6) {
      // 6x6 - Expert
      return "w-[40px] h-[40px] xs:w-[45px] xs:h-[45px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-16 lg:h-16";
    }
    
    // Tamanho padrão para qualquer outra configuração
    return "w-[60px] h-[60px] xs:w-16 xs:h-16 sm:w-[70px] sm:h-[70px] md:w-20 md:h-20 lg:w-24 lg:h-24";
  };
  
  // Função para determinar o tamanho do ícone baseado no grid
  const getIconSize = () => {
    const { rows, cols } = game.grid_config;
    
    if (rows === 3 && cols === 4) {
      // 3x4 - Fácil
      return "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14";
    } else if (rows === 4 && cols === 4) {
      // 4x4 - Médio
      return "w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12";
    } else if (rows === 4 && cols === 6) {
      // 4x6 - Difícil
      return "w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9";
    } else if (rows === 6 && cols === 6) {
      // 6x6 - Expert
      return "w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8";
    }
    
    // Tamanho padrão para qualquer outra configuração
    return "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10";
  };
  
  // Renderiza as cartas do jogo
  const renderCards = () => {
    const cardSize = getCardSize();
    const { rows, cols } = game.grid_config;
    
    // Definir a classe de grid com base no número de colunas
    const getGridClass = () => {
      // Classes adaptadas para dispositivos móveis
      return `memory-cards-grid grid-cols-${cols} xs:grid-cols-${cols} sm:grid-cols-${cols} md:grid-cols-${cols}`;
    };
    
    // Verificar se todas as cartas estão prontas para renderização
    const isCardsReady = game.cards && game.cards.every(card => card != null);
    
    if (!isCardsReady && isGamePlaying) {
      // Se as cartas não estiverem prontas, tentar inicializar
      console.log('Tentando inicializar cartas que não estão prontas...');
      initializeCards();
    }
    
    return (
      <div className={getGridClass()}>
        {game.cards.map((card, index) => {
          const isMatched = card.isMatched;
          // Usamos diretamente o estado do servidor para determinar se a carta está virada
          const isFlipped = card.isFlipped;
          const isClickable = !card.isFlipped && !card.isMatched && isCurrentPlayer && !waitingForReset && !cooldownActive;
          
          // Determinar o jogador que virou a carta para a cor da borda
          const flippedByCurrentPlayer = isFlipped && game.current_player_id !== player?.id;
          const flippedByOpponent = isFlipped && game.current_player_id === player?.id;
          
          // Definir a classe de borda baseada em quem virou a carta - agora mantém a borda mesmo quando combinada
          let borderColorClass = '';
          if (isFlipped || isMatched) {
            // Se a carta está virada ou combinada, determinar qual jogador a virou
            if (flippedByCurrentPlayer || (isMatched && player?.id !== game.winner_id)) {
              borderColorClass = 'ring-2 ring-blue-500';
            } else if (flippedByOpponent || (isMatched && player?.id === game.winner_id)) {
              borderColorClass = 'ring-2 ring-rose-500';
            }
          }
          
          return (
            <div className="memory-card-wrapper" key={`wrapper-${index}`}>
              <motion.div
                key={`card-${index}-${card.iconName || 'undefined'}`}
                className={`absolute inset-0 memory-card perspective-1000 rounded-xl ${isClickable ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed'} ${borderColorClass}`}
                onClick={() => isClickable && handleCardClick(index)}
                whileTap={{ scale: isClickable ? 0.95 : 1 }}
                whileHover={{ scale: isClickable ? 1.03 : 1 }}
                initial={{ scale: 1 }}
                title={!isClickable && isFlipped ? "Esta carta já está virada" : (
                  !isClickable && isMatched ? "Esta carta já foi combinada" : (
                    !isClickable && !isCurrentPlayer ? "Não é sua vez de jogar" : 
                      isClickable ? "Clique para virar esta carta" : "Aguarde..."
                  )
                )}
              >
                <div className={`card-inner ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${cooldownActive && !isFlipped && !isMatched ? 'cooldown' : ''}`}>
                  <div className="card-face card-front rounded-xl flex items-center justify-center">
                    <div className="text-4xl font-bold text-purple-200 opacity-20">?</div>
                  </div>
                  <div className={`card-face card-back bg-gradient-to-br from-${card.color || 'indigo'}-600 to-${card.color || 'purple'}-800 shadow-xl rounded-xl flex items-center justify-center p-2`}>
                    {renderCardIcon(card.iconName, getIconSize(), 'text-white')}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Função simples para renderizar o emoji correto
  const renderCardIcon = (iconName: string | undefined, size: string, color: string) => {
    // Se não há nome de ícone, mostrar um ícone genérico em vez de erro
    if (!iconName) {
      // Usar um ícone padrão em vez de mostrar um erro
      return (
        <div className={`flex items-center justify-center w-full h-full card-icon ${size}`}>
          <div className="text-gray-300 text-lg">?</div>
        </div>
      );
    }
    
    try {
      // Verificar se o nome do ícone precisa ser corrigido
      const iconCorrections: {[key: string]: string} = {
        'Tree': 'Trees',
        'Airplane': 'Airplay',
        'Airplay': 'Airplay',
        'Trees': 'Trees'
      };
      
      // Aplicar correção se necessário
      const correctedIconName = iconCorrections[iconName] || iconName;
      
      // Usar o mapa de componentes pré-carregados para garantir consistência
      const IconComponent = allIconComponents[correctedIconName];
      
      // Se encontrou o componente, renderizar
      if (IconComponent) {
        return (
          <div className={`flex items-center justify-center w-full h-full card-icon ${size}`}>
            <IconComponent className={color} />
          </div>
        );
      }
      
      // Fallback para emojis se o componente não existir
      if (correctedIconName && emojiMap[correctedIconName]) {
        return (
          <div 
            className={`flex items-center justify-center w-full h-full card-icon ${size}`}
          >
            {emojiMap[correctedIconName]}
          </div>
        );
      }
      
      // Se não encontrou emoji nem ícone, mostrar o nome do ícone como texto
      console.warn(`Ícone não encontrado: ${correctedIconName}`);
      return (
        <div 
          className={`text-white text-xs p-1 card-icon ${size}`}
        >
          {correctedIconName}
        </div>
      );
    } catch (error) {
      console.error('Erro ao renderizar ícone:', iconName, error);
      return <div className="text-red-500 text-xs p-1 card-icon">Erro</div>;
    }
  }
  
  // Renderiza o placar do jogo
  const renderScoreboard = () => {
    return (
      <div className="flex justify-center mb-3 sm:mb-6">
        <div className="grid grid-cols-3 w-full max-w-xl bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          {/* Jogador 1 */}
          <div className={`p-2 xs:p-3 sm:p-4 flex flex-col items-center ${isPlayer1 && isCurrentPlayer ? 'bg-purple-900/30 border-b-2 border-b-purple-500' : ''}`}>
            <div className="font-bold text-center text-xs xs:text-sm sm:text-base truncate max-w-full">
              {isPlayer1 ? 'Você' : player1Name}
            </div>
            <div className="text-xl xs:text-2xl sm:text-3xl font-bold">{player1Score}</div>
          </div>
          
          {/* Status do Jogo */}
          <div className="p-2 xs:p-3 sm:p-4 flex flex-col items-center justify-center border-l border-r border-slate-700 text-center">
            {isGameWaiting ? (
              <div className="text-amber-400 flex items-center text-xs xs:text-sm sm:text-base">
                <Users className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Aguardando...
              </div>
            ) : isGameFinished ? (
              <div className="text-purple-400 flex items-center text-xs xs:text-sm sm:text-base">
                <Trophy className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Jogo Finalizado
              </div>
            ) : (
              <div className="text-blue-400 flex items-center text-xs xs:text-sm">
                <Clock className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                {formatTime(gameTime)}
              </div>
            )}
          </div>
          
          {/* Jogador 2 */}
          <div className={`p-2 xs:p-3 sm:p-4 flex flex-col items-center ${!isPlayer1 && isCurrentPlayer ? 'bg-purple-900/30 border-b-2 border-b-purple-500' : ''}`}>
            <div className="font-bold text-center text-xs xs:text-sm sm:text-base truncate max-w-full">
              {!isPlayer1 ? 'Você' : player2Name}
            </div>
            <div className="text-xl xs:text-2xl sm:text-3xl font-bold">{player2Score}</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderiza a mensagem de estado do jogo
  const renderStatusMessage = () => {
    // Vários estados possíveis com prioridades diferentes
    
    // 1. Aguardando segundo jogador
    if (isGameWaiting) {
      return (
        <div className="mb-4 md:mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 md:p-4">
          <div className="flex flex-col xs:flex-row items-center gap-2 md:gap-4 justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Users className="h-5 w-5" />
              <span className="text-sm xs:text-base">Aguardando segundo jogador</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs xs:text-sm bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400"
                onClick={() => copyGameLink()}
              >
                <Link2 className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Convidar
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // 2. Jogo encerrado
    if (isGameFinished) {
      return (
        <div className={`mb-4 md:mb-6 rounded-lg p-2 md:p-4 ${
          isWinner 
            ? 'bg-green-500/10 border border-green-500/30' 
            : isDraw 
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-rose-500/10 border border-rose-500/30'
        }`}>
          <div className="flex flex-col xs:flex-row items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              {isWinner ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm xs:text-base">Você venceu!</span>
                </div>
              ) : isDraw ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <Scale className="h-5 w-5" />
                  <span className="text-sm xs:text-base">Empate!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-400">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm xs:text-base">{player2Name} venceu</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!hasRematchRequest && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-xs xs:text-sm ${
                    isWinner 
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400' 
                      : isDraw 
                        ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-400'
                  }`}
                  onClick={handleRequestRematch}
                  disabled={isRequestingRematch}
                >
                  {isRequestingRematch ? (
                    <>
                      <Loader2 className="h-3 w-3 xs:h-4 xs:w-4 mr-1 animate-spin" />
                      Aguarde...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                      Revanche
                    </>
                  )}
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="text-xs xs:text-sm bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20 text-slate-400"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Voltar ao Menu Principal
              </Button>
            </div>
          </div>
          
          {hasRematchRequest && (
            <div className={`mt-3 p-2 rounded ${
              playerRequestedRematch 
                ? 'bg-blue-500/10 border border-blue-500/30' 
                : 'bg-green-500/10 border border-green-500/30'
            }`}>
              {playerRequestedRematch ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-400 text-sm">
                    <HourglassIcon className="h-4 w-4 mr-2 animate-pulse" />
                    Aguardando resposta do adversário...
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400"
                    onClick={handleCancelRematch}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {player2Name} está pedindo revanche!
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400"
                      onClick={handleAcceptRematch}
                      disabled={isAcceptingRematch}
                    >
                      {isAcceptingRematch ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Aguarde...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Aceitar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-400"
                      onClick={handleDeclineRematch}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Recusar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // 3. Jogo em andamento - indicador de vez
    if (isGamePlaying) {
      return (
        <div className={`mb-4 md:mb-6 rounded-lg p-2 md:p-4 ${
          isCurrentPlayer 
            ? 'bg-blue-500/10 border border-blue-500/30' 
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCurrentPlayer ? (
                <div className="flex items-center gap-2 text-blue-400">
                  <Hand className="h-5 w-5" />
                  <span className="text-sm xs:text-base">Sua vez de jogar</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <HourglassIcon className="h-5 w-5 animate-pulse" />
                  <span className="text-sm xs:text-base">Vez de {player2Name}</span>
                </div>
              )}
            </div>
            
            <div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20 text-slate-400"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Voltar ao Menu Principal
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback - não deveria acontecer
    return null;
  };
  
  // No useEffect para verificar estado do jogo, adicionar verificações
  useEffect(() => {
    if (!game) return;
    
    // Verificar se o jogo terminou
    if (game.status === 'finished') {
      setGameEnded(true);
      
      // Definir o vencedor
      if (game.winner_id) {
        if (game.winner_id === player?.id) {
          setGameResult('won');
        } else {
          setGameResult('lost');
        }
      } else {
        // Sem vencedor definido = empate
        setGameResult('draw');
      }
    } 
    // Se o jogo estiver em andamento mas todas as cartas estiverem combinadas
    else if (game.status === 'playing') {
      // Verificar se todas as cartas estão combinadas
      const allMatched = game.cards && game.cards.every(card => card.isMatched);
      
      if (allMatched) {
        // O jogo acabou, determinar o vencedor com base nas correspondências
        const player1Score = game.player_1_matches || 0;
        const player2Score = game.player_2_matches || 0;
        
        if (player1Score > player2Score) {
          // Jogador 1 venceu
          setGameResult(game.player_1_id === player?.id ? 'won' : 'lost');
        } else if (player2Score > player1Score) {
          // Jogador 2 venceu
          setGameResult(game.player_2_id === player?.id ? 'won' : 'lost');
        } else {
          // Empate
          setGameResult('draw');
        }
        
        setGameEnded(true);
      }
    }
  }, [game, player?.id]);
  
  // Verificar o estado de revanche quando o componente montar
  useEffect(() => {
    // Verificar se o jogo já tem um ID de revanche
    if (game.rematch_game_id) {
      console.log(`Jogo já tem ID de revanche: ${game.rematch_game_id}`);
      
      // Atualizar estado local para garantir que o redirecionamento funcionará
      setGame(prevGame => ({
        ...prevGame,
        rematch_accepted: true
      }));
      
      // Definir explicitamente o ID de revanche para acionar o redirecionamento no outro useEffect
      setRematchGameId(game.rematch_game_id);
      
      // Limpar quaisquer estados de solicitação de revanche
      setIsRequestingRematch(false);
      setIsReceivingRematch(false);
      setIsRematchModalOpen(false);
      
      // Mostrar toast informativo
      toast.success("Revanche em andamento! Redirecionando...", {
        duration: 2000,
        className: "bg-green-800 text-green-100 border-green-700"
      });
    }
    
    // Verificar se há uma solicitação de revanche
    else if (game.rematch_requested_by) {
      console.log(`Jogo tem solicitação de revanche de: ${game.rematch_requested_by}`);
      
      // Se a solicitação é do jogador atual
      if (game.rematch_requested_by === player?.id) {
        console.log('Solicitação de revanche feita por este jogador');
        setIsRequestingRematch(true);
        setIsRematchModalOpen(true);
      } 
      // Se a solicitação é do oponente
      else if (player) {
        console.log('Solicitação de revanche feita pelo oponente');
        setIsReceivingRematch(true);
        setIsRematchModalOpen(true);
      }
    }
  }, []);
  
  // Adicionar useEffect para mostrar o modal quando o jogo terminar
  useEffect(() => {
    // Se o jogo terminou e não temos nenhuma solicitação de revanche ativa
    if (game.status === 'finished' && !showResultModal && !isRematchModalOpen && 
        !isRequestingRematch && !isReceivingRematch && !game.rematch_requested_by) {
      // Esperar um pouco para mostrar o modal após o jogo terminar (efeito visual)
      setTimeout(() => {
        setShowResultModal(true);
        
        // Se for vitória, mostrar confete
        if (game.winner_id === player?.id) {
          if (typeof window !== 'undefined') {
            confetti({
              particleCount: 200,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      }, 1000);
    } else if (isRematchModalOpen || isRequestingRematch || isReceivingRematch || game.rematch_requested_by) {
      // Se qualquer condição de revanche estiver ativa, feche o modal de resultado
      setShowResultModal(false);
    }
  }, [game.status, game.winner_id, game.rematch_requested_by, player?.id, showResultModal, 
      isRematchModalOpen, isRequestingRematch, isReceivingRematch]);
  
  // Função para fechar o modal de resultado
  const handleCloseResultModal = () => {
    setShowResultModal(false);
  };

  // Componente de modal para o resultado do jogo
  const ResultModal = () => {
    // Determinar o resultado do jogo
    const isWinner = game.winner_id === player?.id;
    const isDraw = game.status === 'finished' && !game.winner_id;
    
    // Título e mensagem baseados no resultado
    let title = '';
    let message = '';
    let bgColor = '';
    let iconComponent = null;
    
    if (isWinner) {
      title = 'Vitória!';
      message = 'Parabéns! Você venceu o jogo!';
      bgColor = 'bg-gradient-to-r from-green-600 to-emerald-700';
      iconComponent = <Trophy className="h-12 w-12 text-yellow-300" />;
    } else if (isDraw) {
      title = 'Empate!';
      message = 'O jogo terminou empatado.';
      bgColor = 'bg-gradient-to-r from-blue-600 to-indigo-700';
      iconComponent = <Medal className="h-12 w-12 text-indigo-300" />;
    } else {
      title = 'Derrota';
      message = `${opponentNickname} venceu o jogo.`;
      bgColor = 'bg-gradient-to-r from-red-600 to-rose-700';
      iconComponent = <AlertCircle className="h-12 w-12 text-red-300" />;
    }
    
    if (!showResultModal) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${bgColor} p-6 rounded-xl shadow-lg max-w-sm w-full border border-white/20`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              {iconComponent}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-white/90 mb-6">{message}</p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                onClick={() => router.push('/')}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                Voltar para o lobby
              </Button>
              
              {!playerRequestedRematch ? (
                <Button
                  onClick={handleRequestRematch}
                  className="bg-white/20 hover:bg-white/30 text-white"
                  disabled={isRequestingRematch}
                >
                  {isRequestingRematch ? 'Solicitando...' : 'Revanche'}
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-white/10 cursor-not-allowed text-white/70"
                >
                  Solicitado
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Efeito para redirecionar automaticamente quando houver um jogo de revanche
  useEffect(() => {
    const checkAndRedirectToRematch = async () => {
      try {
        // Se já estamos redirecionando, não fazer nada
        if (window.location.pathname.includes('/redirecting')) {
          return false;
        }
        
        // Já temos o rematchGameId em memória?
        if (rematchGameId && rematchGameId !== game.id) {
          console.log(`[REVANCHE] Redirecionando para jogo de revanche já detectado: ${rematchGameId}`);
          setTimeout(() => {
            window.location.href = `/jogo-da-memoria/online/${rematchGameId}`;
          }, 300);
          return true;
        }
        
        // O jogo atual tem rematch_game_id configurado?
        if (game.rematch_game_id && game.rematch_game_id !== game.id) {
          console.log(`[REVANCHE] O jogo tem ID de revanche configurado: ${game.rematch_game_id}`);
          setRematchGameId(game.rematch_game_id);
          
          // Mostrar toast de redirecionamento
          toast.success("Revanche aceita! Redirecionando...", {
            id: "redirect-toast-auto",
            duration: 2000,
            className: "bg-green-800 text-green-100 border-green-700"
          });
          
          // Redirecionar para o novo jogo após um breve delay
          setTimeout(() => {
            window.location.href = `/jogo-da-memoria/online/${game.rematch_game_id}`;
          }, 800);
          return true;
        }
        
        // Verificar o status atual do jogo no servidor
        try {
          // Usar caminho correto para a API com retentativas
          let serverGame = null;
          let attempts = 0;
          
          while (!serverGame && attempts < 3) {
            try {
              attempts++;
              const response = await fetch(`/api/memory-game/${game.id}`);
              if (response.ok) {
                serverGame = await response.json();
                break;
              } else if (response.status === 404) {
                // Tentar com caminho alternativo
                const altResponse = await fetch(`/api/memory-game/${game.id}/get`);
                if (altResponse.ok) {
                  serverGame = await altResponse.json();
                  break;
                }
              }
            } catch (fetchError) {
              console.warn(`[REVANCHE] Erro ao buscar jogo (tentativa ${attempts}/3):`, fetchError);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // O jogo no servidor tem ID de revanche?
          if (serverGame?.rematch_game_id && serverGame.rematch_game_id !== game.id) {
            console.log(`[REVANCHE] Detectado ID de revanche no servidor: ${serverGame.rematch_game_id}`);
            
            // Atualizar o estado local com o ID de revanche
            setRematchGameId(serverGame.rematch_game_id);
            setGame(prevGame => ({
              ...prevGame,
              rematch_game_id: serverGame.rematch_game_id,
              rematch_accepted: true
            }));
            
            // Mostrar toast de redirecionamento
            toast.success("Revanche aceita! Redirecionando...", {
              id: "redirect-toast-server",
              duration: 2000,
              className: "bg-green-800 text-green-100 border-green-700"
            });
            
            // Redirecionar para o novo jogo após um breve delay
            setTimeout(() => {
              window.location.href = `/jogo-da-memoria/online/${serverGame.rematch_game_id}`;
            }, 800);
            return true;
          }
        } catch (error) {
          console.warn('[REVANCHE] Erro ao verificar jogo no servidor:', error);
        }
        
        return false;
      } catch (error) {
        console.error('[REVANCHE] Erro ao redirecionar para revanche:', error);
        return false;
      }
    };
    
    // Verificar imediatamente
    checkAndRedirectToRematch();
    
    // Configurar um intervalo para verificar o status de revanche periodicamente
    const checkInterval = setInterval(checkAndRedirectToRematch, 2000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [game.id, game.rematch_game_id, rematchGameId, router]);

  // Definir um intervalo para verificar se existe um jogo de revanche
  useEffect(() => {
    let rematchCheckInterval: NodeJS.Timeout | null = null;
    
    // Se estamos solicitando ou recebendo uma revanche, verificar mais frequentemente
    if ((isRequestingRematch || isReceivingRematch || opponentRequestedRematch || game.rematch_requested_by) && 
        !rematchGameId) {
      console.log("[REVANCHE] Iniciando verificação intensiva de status de revanche");
      
      rematchCheckInterval = setInterval(async () => {
        try {
          // Verificar diretamente com o servidor, usando vários caminhos alternativos
          let serverGame = null;
          
          try {
            // Tentar com o novo endpoint
            const response = await fetch(`/api/memory-game/${game.id}`);
            if (response.ok) {
              serverGame = await response.json();
            } 
          } catch (e) {
            console.warn("[REVANCHE] Erro ao verificar com primeira API:", e);
          }
          
          if (!serverGame) {
            try {
              // Tentar com endpoint alternativo
              const response = await fetch(`/api/memory-game/${game.id}/get`);
              if (response.ok) {
                serverGame = await response.json();
              }
            } catch (e) {
              console.warn("[REVANCHE] Erro ao verificar com segunda API:", e);
            }
          }
          
          if (!serverGame) {
            try {
              // Tentar ainda com o endpoint de depuração
              const response = await fetch(`/api/memory-game/${game.id}/debug-rematch`);
              if (response.ok) {
                const debugData = await response.json();
                serverGame = debugData.game;
              }
            } catch (e) {
              console.warn("[REVANCHE] Erro ao verificar com API de depuração:", e);
            }
          }
          
          // Se conseguimos obter o jogo e ele tem ID de revanche
          if (serverGame?.rematch_game_id) {
            console.log(`[REVANCHE] Verificação intensiva: Detectado ID de revanche ${serverGame.rematch_game_id}`);
            
            // Definir o ID de revanche e redirecionamento será tratado por outro efeito
            setRematchGameId(serverGame.rematch_game_id);
            
            // Atualizar o estado do jogo
            setGame(prevGame => ({
              ...prevGame,
              rematch_game_id: serverGame.rematch_game_id,
              rematch_accepted: true
            }));
            
            // Limpar intervalos
            if (rematchCheckInterval) clearInterval(rematchCheckInterval);
          }
        } catch (error) {
          console.warn("[REVANCHE] Erro na verificação intensiva:", error);
        }
      }, 1000); // Verificar a cada 1 segundo
    }
    
    return () => {
      if (rematchCheckInterval) clearInterval(rematchCheckInterval);
    };
  }, [isRequestingRematch, isReceivingRematch, opponentRequestedRematch, game.rematch_requested_by, game.id, rematchGameId]);

  // Efeito adicional para forçar redirecionamento se rematchGameId mudar
  useEffect(() => {
    if (rematchGameId && rematchGameId !== game.id) {
      console.log(`[REVANCHE] Efeito dedicado de redirecionamento ativado: ${rematchGameId}`);
      // Usar tanto router quanto window.location para garantir que o redirecionamento ocorra
      router.push(`/jogo-da-memoria/online/${rematchGameId}`);
      
      // Como backup, usar window.location também
      setTimeout(() => {
        window.location.href = `/jogo-da-memoria/online/${rematchGameId}`;
      }, 1000);
    }
  }, [rematchGameId, game.id, router]);
  
  // Configurar a comunicação em tempo real com Supabase
  useEffect(() => {
    if (!game?.id) return;

    console.log(`[SUPABASE] Configurando canal para o jogo ${game.id}`);

    // Criar canal para o jogo específico
    const channel = supabase.channel(`memory_game_${game.id}`);

    // Inscrever-se em eventos de revanche
    channel
      .on('broadcast', { event: 'rematch' }, (payload) => {
        console.log(`[BROADCAST JOGO] Evento de revanche recebido:`, payload);
        
        // Verificar se temos um ID de revanche
        if (payload.payload?.rematch_game_id) {
          console.log(`[REVANCHE] ID de jogo de revanche recebido via broadcast: ${payload.payload.rematch_game_id}`);
          
          // Mostrar toast de sucesso
          toast.success("Revanche aceita! Redirecionando para o novo jogo...", {
            id: "revanche-redirect-broadcast",
            duration: 2000
          });
          
          // Atualizar estado com o ID de revanche
          setRematchGameId(payload.payload.rematch_game_id);
          
          // Atualizar o estado do jogo
          setGame(prevGame => ({
            ...prevGame,
            rematch_game_id: payload.payload.rematch_game_id,
            rematch_accepted: true
          }));
          
          // Redirecionar para o novo jogo após delay curto
          setTimeout(() => {
            window.location.href = `/jogo-da-memoria/online/${payload.payload.rematch_game_id}`;
          }, 1000);
        }
      })
      .subscribe();

    // Configurar canal geral como backup
    const generalChannel = supabase.channel('memory-game');
    
    // Inscrever-se em eventos gerais de revanche
    generalChannel
      .on('broadcast', { event: 'rematch_accepted' }, (payload) => {
        console.log(`[BROADCAST GERAL] Evento de revanche aceita recebido:`, payload);
        
        // Verificar se o evento é relevante para este jogo
        if (payload.payload?.original_game_id === game.id && payload.payload?.new_game_id) {
          console.log(`[REVANCHE] ID de revanche recebido via broadcast geral: ${payload.payload.new_game_id}`);
          
          // Mostrar toast de sucesso
          toast.success("Revanche aceita! Redirecionando para o novo jogo...", {
            id: "revanche-redirect-broadcast-geral",
            duration: 2000
          });
          
          // Atualizar estado com o ID de revanche
          setRematchGameId(payload.payload.new_game_id);
          
          // Atualizar o estado do jogo
          setGame(prevGame => ({
            ...prevGame,
            rematch_game_id: payload.payload.new_game_id,
            rematch_accepted: true
          }));
          
          // Redirecionar para o novo jogo após delay curto
          setTimeout(() => {
            window.location.href = `/jogo-da-memoria/online/${payload.payload.new_game_id}`;
          }, 1000);
        }
      })
      .subscribe();

    // Limpar subscrições quando o componente for desmontado
    return () => {
      channel.unsubscribe();
      generalChannel.unsubscribe();
      console.log(`[SUPABASE] Canais de tempo real desconectados para o jogo ${game.id}`);
    };
  }, [game?.id, supabase]);

  // Função para compartilhar link do jogo
  const copyGameLink = () => {
    const gameLink = `${window.location.origin}/jogo-da-memoria/online/${game.id}`;
    navigator.clipboard.writeText(gameLink)
      .then(() => {
        toast.success("Link copiado para a área de transferência!", {
          id: "copy-link-success",
          duration: 2000
        });
      })
      .catch(err => {
        console.error("Falha ao copiar link:", err);
        toast.error("Falha ao copiar link. Tente novamente.", {
          id: "copy-link-error",
          duration: 2000
        });
      });
  };

  // Função para cancelar solicitação de revanche
  const handleCancelRematch = async () => {
    try {
      // Cancelar a solicitação de revanche
      const response = await fetch(`/api/memory-game/${game.id}/cancel-rematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: player?.id
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.error('Erro ao cancelar revanche:', result.error);
        return;
      }
      
      // Atualizar o estado do jogo
      if (result.data) {
        setGame(result.data);
      }
    } catch (error) {
      console.error('Erro ao cancelar revanche:', error);
    }
  };

  return (
    <div className="w-full flex flex-col items-center memory-game-container">
      {/* Elementos de áudio pré-carregados */}
      
      {/* Cabeçalho com placar */}
      <motion.div 
        className="w-full mb-4 scoreboard-container"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderScoreboard()}
      </motion.div>
      
      {/* Status do jogo e mensagens */}
      <motion.div
        className="w-full mb-4 status-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {renderStatusMessage()}
      </motion.div>
      
      {/* Área do jogo */}
      <motion.div 
        className="w-full mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Renderizar cartas do jogo */}
        {renderCards()}
      </motion.div>
      
      {/* Modais e diálogos */}
      <RematchModal
        isOpen={isRematchModalOpen}
        isRequesting={!!playerRequestedRematch}
        isReceiving={!!opponentRequestedRematch}
        opponentNickname={opponentNickname}
        onClose={handleCloseRematchModal}
        onAccept={handleAcceptRematch}
        onDecline={handleDeclineRematch}
        onRequest={handleRequestRematch}
      />
      
      {isGameFinished && <ResultModal />}
    </div>
  );
}