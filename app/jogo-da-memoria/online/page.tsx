"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2, RefreshCcw, PlusCircle, Loader2, Users, Globe, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { NicknameModal } from "@/components/online-game/nickname-modal"
import { motion } from "framer-motion"
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/lib/hooks/use-player'
import { createMemoryGame, getAvailableMemoryGames, MemoryGameSession } from '@/lib/supabase'
// Importar o hook de autenticação e o formulário de login
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '../components/LoginForm'
import GameCard from '@/components/game-card'
import MemoryGameEntry from '@/components/online-game/memory-game-entry'

export default function OnlineLobbyPage() {
  const router = useRouter()
  const { player, isLoading: isPlayerLoading, setPlayerInfo } = usePlayer()
  // Usar o AuthContext
  const { user, loading: authLoading } = useAuth()
  
  const [availableGames, setAvailableGames] = useState<MemoryGameSession[]>([])
  const [isLoadingGames, setIsLoadingGames] = useState(true)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [selectedGridConfig, setSelectedGridConfig] = useState({ rows: 4, cols: 4 })
  const [showLobby, setShowLobby] = useState(false)
  
  // Opções de configuração de grade
  const gridOptions = [
    { label: '3x4 (Fácil)', config: { rows: 3, cols: 4 } },
    { label: '4x4 (Médio)', config: { rows: 4, cols: 4 } },
    { label: '4x6 (Difícil)', config: { rows: 4, cols: 6 } },
    { label: '6x6 (Expert)', config: { rows: 6, cols: 6 } },
  ]

  // Efeito para carregar jogos quando o usuário estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      console.log("Usuário autenticado:", user.nickname)
      fetchGames()
      
      // Atualizar também o sistema legado (use-player)
      if (!player || player.nickname !== user.nickname) {
        setPlayerInfo(user.nickname, user.id)
      }
      
      setShowLobby(true)
    }
  }, [authLoading, user, player])

  // Função para buscar jogos disponíveis
  const fetchGames = async () => {
    console.log("Buscando jogos disponíveis...")
    setIsLoadingGames(true)
    try {
      const games = await getAvailableMemoryGames()
      console.log("Jogos encontrados:", games.length)
      setAvailableGames(games)
    } catch (error) {
      console.error('Erro ao buscar jogos:', error)
    } finally {
      setIsLoadingGames(false)
    }
  }

  // Função para criar um novo jogo
  const handleCreateGame = async () => {
    if (!user) {
      console.error("Não é possível criar jogo sem um usuário autenticado")
      return
    }
    
    console.log("Criando novo jogo com usuário:", user)
    setIsCreatingGame(true)
    try {
      const newGame = await createMemoryGame(user.id, user.nickname, selectedGridConfig)
      
      if (newGame) {
        console.log("Jogo criado com sucesso:", newGame.id)
        router.push(`/jogo-da-memoria/online/${newGame.id}`)
      } else {
        console.error("Falha ao criar jogo - retorno nulo")
      }
    } catch (error) {
      console.error('Erro ao criar jogo:', error)
      setIsCreatingGame(false)
    }
  }

  // Função para entrar em um jogo
  const handleJoinGame = (gameId: string) => {
    router.push(`/jogo-da-memoria/online/${gameId}`)
  }

  // Função para lidar com a submissão do nickname
  const handleNicknameSubmit = (nickname: string) => {
    console.log("Nickname definido:", nickname)
    // Criar um ID único para o jogador se não existir
    const id = player?.id || crypto.randomUUID()
    
    // Atualizar o estado do jogador com o hook correto
    setPlayerInfo(nickname, id)
    
    // Fechar o modal e buscar jogos
    setShowNicknameModal(false)
    fetchGames()
    setShowLobby(true)
  }

  if (isPlayerLoading || authLoading) {
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
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
          Jogo da Memória Online
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Desafie outros jogadores em tempo real e teste sua memória neste divertido jogo de cartas.
        </p>
      </motion.div>
      
      {!user ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-4 rounded-full shadow-lg shadow-purple-500/20">
                <Globe className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-3 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Bem-vindo ao Jogo Online</h2>
            <p className="mb-8 text-center text-slate-300">
              Para jogar online, escolha um apelido para identificá-lo durante o jogo.
            </p>
            
            <LoginForm />
            
            <div className="mt-6 text-center">
              <Button
                asChild
                variant="ghost"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <Link href="/jogo-da-memoria">
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
                <div className="bg-purple-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-purple-400" />
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
                <div className="bg-indigo-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-indigo-400" />
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
                <div className="bg-violet-500/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-violet-400" />
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
          className="w-full space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
              <Users className="mr-2 h-6 w-6 text-purple-400" />
              Jogos Disponíveis
            </h2>
            
            {isLoadingGames ? (
              <div className="flex items-center justify-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="ml-2">Carregando jogos...</span>
              </div>
            ) : availableGames.length === 0 ? (
              <div className="text-center p-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
                <p className="text-slate-300">Nenhum jogo disponível no momento.</p>
                <p className="text-slate-400 text-sm mt-2">Crie um novo jogo para começar!</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {availableGames.map((game, index) => (
                  <motion.div 
                    key={game.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="mb-2 inline-flex px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                          Aguardando Jogador
                        </div>
                        <h3 className="font-medium text-lg text-white">Jogo de {game.player_1_nickname}</h3>
                      </div>
                      <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full">
                        {game.grid_config.rows}x{game.grid_config.cols}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <RefreshCcw className="h-4 w-4" />
                      <span>Criado às {new Date(game.created_at).toLocaleTimeString()}</span>
                    </div>
                    <Button
                      onClick={() => handleJoinGame(game.id)}
                      className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      Entrar no Jogo
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
              <PlusCircle className="mr-2 h-6 w-6 text-purple-400" />
              Criar Novo Jogo
            </h2>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700"
            >
              <h3 className="font-medium mb-4 text-white">Configuração da Grade</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {gridOptions.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setSelectedGridConfig(option.config)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      selectedGridConfig.rows === option.config.rows && 
                      selectedGridConfig.cols === option.config.cols
                        ? 'border-purple-500 bg-purple-900/30 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
              
              <Button
                onClick={handleCreateGame}
                disabled={isCreatingGame}
                className={`w-full h-12 text-lg flex items-center justify-center space-x-2 ${
                  isCreatingGame 
                    ? 'bg-slate-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                {isCreatingGame ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Criando jogo...</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="h-5 w-5" />
                    <span>Criar Novo Jogo</span>
                  </>
                )}
              </Button>
            </motion.div>
            
            <div className="mt-6 text-center">
              <Button
                asChild
                variant="ghost"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                <Link href="/jogo-da-memoria">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o menu principal
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-md mx-auto text-center">
          <p className="mb-6 text-lg">
            Olá, <span className="font-bold">{user.nickname}</span>! Carregando o lobby...
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowLobby(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            Entrar no Lobby
          </Button>
        </div>
      )}

      <NicknameModal 
        isOpen={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
        onSubmit={handleNicknameSubmit}
        gameType="memory"
      />
    </div>
  );
} 