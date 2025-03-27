"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2, Globe, Zap, Shield, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NicknameModal } from "@/components/online-game/nickname-modal"
import { motion } from "framer-motion"
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/lib/hooks/use-player'
import { GameLobby } from '@/components/online-game/game-lobby'

export default function OnlineLobbyPage() {
  const router = useRouter()
  const { player, isLoading, setPlayerInfo } = usePlayer()
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [showLobby, setShowLobby] = useState(false)

  useEffect(() => {
    // Se o jogador já tem um nickname, mostrar o lobby diretamente
    if (player?.nickname) {
      setShowLobby(true)
    }
  }, [player])

  const handleSetNickname = (nickname: string) => {
    const playerId = crypto.randomUUID()
    setPlayerInfo(nickname, playerId)
    setIsNicknameModalOpen(false)
    setShowLobby(true) // Mostrar o lobby imediatamente após definir o nickname
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-300 via-rose-400 to-red-500 bg-clip-text text-transparent mb-4">
          Jogo da Forca Online
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Desafie outros jogadores em tempo real e teste suas habilidades de adivinhação neste clássico jogo de palavras.
        </p>
      </motion.div>
      
      {!player?.nickname ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-rose-500 to-red-500 p-4 rounded-full shadow-lg shadow-rose-500/20">
                <Globe className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">Bem-vindo ao Jogo Online</h2>
            <p className="mb-8 text-center text-slate-300">
              Para jogar online, escolha um apelido para identificá-lo durante o jogo.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => setIsNicknameModalOpen(true)}
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-medium py-6 rounded-xl shadow-lg shadow-rose-600/20 transition-all hover:shadow-rose-600/30 hover:-translate-y-1"
            >
              <Users className="mr-2 h-5 w-5" />
              Escolher Apelido
            </Button>
            
            <div className="mt-6 text-center">
              <Button
                asChild
                variant="ghost"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o menu principal
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 text-center text-slate-200">Recursos do Jogo Online</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/70 to-slate-900/70 p-5 text-center shadow-lg"
              >
                <div className="bg-rose-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="font-medium text-slate-200 mb-1">Jogue Online</h3>
                <p className="text-sm text-slate-400">Desafie jogadores reais em partidas online</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/70 to-slate-900/70 p-5 text-center shadow-lg"
              >
                <div className="bg-red-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="font-medium text-slate-200 mb-1">Tempo Real</h3>
                <p className="text-sm text-slate-400">Atualizações em tempo real durante o jogo</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/70 to-slate-900/70 p-5 text-center shadow-lg"
              >
                <div className="bg-orange-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="font-medium text-slate-200 mb-1">Sem Cadastro</h3>
                <p className="text-sm text-slate-400">Jogue imediatamente sem necessidade de cadastro</p>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-center"
          >
            <p className="text-slate-400 text-sm">
              Desenvolvido com ❤️ para proporcionar a melhor experiência de jogo
            </p>
          </motion.div>
        </motion.div>
      ) : showLobby ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GameLobby playerNickname={player.nickname} playerId={player.id} gameType="hangman" />
        </motion.div>
      ) : (
        <div className="max-w-md mx-auto text-center">
          <p className="mb-6 text-lg">
            Olá, <span className="font-bold">{player.nickname}</span>! Carregando o lobby...
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowLobby(true)}
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
          >
            Entrar no Lobby
          </Button>
        </div>
      )}

      <NicknameModal 
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        onSubmit={handleSetNickname}
        gameType="hangman"
      />
    </div>
  );
} 