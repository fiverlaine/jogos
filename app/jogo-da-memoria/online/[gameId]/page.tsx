"use client";

import React from 'react';
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/hooks/use-player';
import { getMemoryGame, joinMemoryGame, MemoryGameSession, checkMemoryGameExists } from '@/lib/supabase';
import { NicknameModal } from "@/components/online-game/nickname-modal";
import { OnlineMemoryGame } from "@/components/online-game/online-memory-game";
import { motion } from "framer-motion";
import Image from "next/image";
import { generateUUID } from '@/lib/utils';

// Importar os estilos responsivos para dispositivos móveis
import "@/app/mobile-memory-game.css";

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  // Descompactar os parâmetros usando React.use()
  const unwrappedParams = React.use(params);
  const { gameId } = unwrappedParams; // Agora você pode acessar gameId diretamente
  const router = useRouter();
  const { player, isLoading: isPlayerLoading, setPlayerInfo } = usePlayer();
  
  const [game, setGame] = useState<MemoryGameSession | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar se o jogador está pronto para jogar
  const isPlayerReady = !!player?.nickname;
  
  // Verificar se o jogo existe e carregar seus dados
  useEffect(() => {
    const loadGame = async () => {
      setIsLoadingGame(true);
      try {
        // Verificar se o jogo existe
        const exists = await checkMemoryGameExists(gameId);
        if (!exists) {
          setError('Jogo não encontrado');
          setIsLoadingGame(false);
          return;
        }
        
        // Carregar os dados do jogo
        const gameData = await getMemoryGame(gameId);
        setGame(gameData);
      } catch (error) {
        console.error('Erro ao carregar jogo:', error);
        setError('Erro ao carregar o jogo');
      } finally {
        setIsLoadingGame(false);
      }
    };
    
    // Carregar o jogo quando tivermos o ID do jogo
    if (gameId) {
      loadGame();
    }
  }, [gameId]);
  
  // Verificar se o jogador tem um apelido
  useEffect(() => {
    if (!isPlayerLoading && !player?.nickname) {
      console.log("Página do jogo: jogador sem nickname, mostrando modal");
      setShowNicknameModal(true);
    }
  }, [isPlayerLoading, player]);
  
  // Função para lidar com erros de rede
  const handleNetworkError = (error: any) => {
    console.error('Erro de rede:', error);
    
    // Verificar se é um erro de conexão
    if (error.message && (
      error.message.includes('network') || 
      error.message.includes('failed to fetch') ||
      error.message.includes('connection')
    )) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      setError(`Erro ao entrar no jogo: ${error.message || 'Erro desconhecido'}`);
    }
  };
  
  // Função para lidar com a submissão do nickname
  const handleNicknameSubmit = (nickname: string) => {
    if (!nickname || nickname.trim() === '') {
      console.error('Nickname não pode ser vazio');
      return;
    }
    
    console.log("Nickname definido na página do jogo:", nickname);
    
    try {
      // Criar um ID único para o jogador se não existir
      const id = player?.id || generateUUID();
      
      // Atualizar o estado do jogador com o hook correto
      setPlayerInfo(nickname, id);
      
      // Fechar o modal
      setShowNicknameModal(false);
      
      console.log('Informações do jogador atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao configurar informações do jogador:', error);
    }
  };
  
  // Função para atualizar o estado do jogo
  const handleGameUpdate = (updatedGame: MemoryGameSession) => {
    setGame(updatedGame);
  };
  
  // Juntar-se ao jogo quando o jogador estiver pronto
  useEffect(() => {
    const joinGameIfReady = async () => {
      // Verificar se temos todas as informações necessárias
      if (!isPlayerReady || !game || !player || isJoiningGame) {
        if (!isPlayerReady) console.log('Jogador não está pronto (sem nickname)');
        if (!game) console.log('Dados do jogo ainda não foram carregados');
        if (!player) console.log('Dados do jogador não disponíveis');
        if (isJoiningGame) console.log('Já está tentando entrar no jogo');
        return;
      }
      
      // Verificar se o nickname está definido
      if (!player.nickname || player.nickname.trim() === '') {
        console.error('Nickname inválido ou vazio');
        setShowNicknameModal(true);
        return;
      }
      
      // Verificar se o jogador já está no jogo
      const isPlayerInGame = 
        player.id === game.player_1_id || 
        player.id === game.player_2_id;
        
      if (isPlayerInGame) {
        console.log('Jogador já está neste jogo');
        return;
      }
      
      // Verificar se o jogo está em espera
      if (game.status !== 'waiting') {
        console.log(`Jogo não está aceitando novos jogadores (status: ${game.status})`);
        setError('Este jogo não está aceitando novos jogadores');
        return;
      }
      
      // Juntar-se ao jogo
      setIsJoiningGame(true);
      try {
        console.log(`Tentando entrar no jogo ${gameId} como ${player.nickname} (${player.id})`);
        
        const updatedGame = await joinMemoryGame(
          gameId,
          player.id,
          player.nickname
        );
        
        if (updatedGame) {
          console.log('Entrou no jogo com sucesso:', updatedGame);
          setGame(updatedGame);
        } else {
          console.error('Retorno nulo ao tentar entrar no jogo');
          setError('Não foi possível entrar no jogo');
        }
      } catch (error) {
        console.error('Erro ao entrar no jogo:', error);
        handleNetworkError(error);
      } finally {
        setIsJoiningGame(false);
      }
    };
    
    joinGameIfReady();
  }, [gameId, game, player, isPlayerReady, isJoiningGame, setPlayerInfo]);
  
  // Renderizar conteúdo da página
  const renderContent = () => {
    // Exibir mensagem de erro
    if (error) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-900 rounded-2xl p-6 text-center"
        >
          <h2 className="text-xl font-bold text-red-500 mb-2">Erro</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button
            asChild
            variant="outline"
            className="border-purple-600/30 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 hover:text-purple-300"
          >
            <Link href="/jogo-da-memoria/online">
              Voltar ao Lobby
            </Link>
          </Button>
        </motion.div>
      );
    }
    
    // Exibir indicador de carregamento
    if (isLoadingGame || isJoiningGame) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12"
        >
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
          <p className="text-lg text-white">
            {isLoadingGame ? 'Carregando jogo...' : 'Entrando no jogo...'}
          </p>
        </motion.div>
      );
    }
    
    // Exibir o jogo
    if (game) {
      return (
        <div className="w-full overflow-hidden memory-game-wrapper">
          <OnlineMemoryGame initialGame={game} onGameUpdate={handleGameUpdate} />
        </div>
      );
    }
    
    // Fallback (não deveria acontecer)
    return (
      <div className="text-center p-8">
        <p className="text-lg text-slate-400 mb-4">Algo deu errado.</p>
        <Button
          asChild
          variant="outline"
          className="border-purple-600/30 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 hover:text-purple-300"
        >
          <Link href="/jogo-da-memoria/online">
            Voltar ao Lobby
          </Link>
        </Button>
      </div>
    );
  };
  
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover object-center opacity-10"
          priority
          quality={75}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-purple-950/80 to-slate-900/80"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Link href="/jogo-da-memoria/online">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Lobby
            </Link>
          </Button>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-md sm:p-8"
        >
          {renderContent()}
        </motion.div>
      </div>

      <NicknameModal
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
        onSubmit={handleNicknameSubmit}
        gameType="memory"
      />
    </main>
  );
} 