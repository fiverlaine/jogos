'use client';

import { useState, useEffect } from "react";
import { OnlineTicTacToe } from "@/components/online-game/online-tictactoe";
import { NicknameModal } from "@/components/online-game/nickname-modal";
import { usePlayer } from "@/lib/hooks/use-player";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const gameIdParam = React.use(Promise.resolve(params));
  const gameId = React.useMemo(() => gameIdParam.gameId, [gameIdParam]);
  const { player, setPlayerInfo, isLoading } = usePlayer();
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Se o jogador já tem um nickname, marcar como pronto
    if (player?.nickname) {
      setIsReady(true);
    } else if (!isLoading) {
      // Se não tem nickname e não está carregando, abrir o modal
      setIsNicknameModalOpen(true);
    }
  }, [player, isLoading]);

  const handleSetNickname = (nickname: string) => {
    const playerId = crypto.randomUUID();
    setPlayerInfo(nickname, playerId);
    setIsNicknameModalOpen(false);
    setIsReady(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!player?.nickname && !isNicknameModalOpen) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="mb-6 text-3xl font-bold">Jogo da Velha Online</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Para jogar, você precisa escolher um apelido.
        </p>
        <Button 
          size="lg" 
          onClick={() => setIsNicknameModalOpen(true)}
          className="mx-auto"
        >
          Escolher Apelido
        </Button>
        
        <NicknameModal 
          isOpen={isNicknameModalOpen}
          onClose={() => setIsNicknameModalOpen(false)}
          onSubmit={handleSetNickname}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isReady && player ? (
        <OnlineTicTacToe gameId={gameId} player={player} />
      ) : (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <NicknameModal 
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        onSubmit={handleSetNickname}
      />
    </div>
  );
} 