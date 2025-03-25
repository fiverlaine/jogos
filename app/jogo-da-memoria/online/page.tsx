"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gamepad2, RefreshCcw, PlusCircle, Loader2, Users } from "lucide-react"
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
  }

  // Renderiza o conteúdo principal do lobby
  const renderLobbyContent = () => {
    // Se estiver carregando a autenticação, mostrar loading
    if (authLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-lg">Carregando...</span>
        </div>
      )
    }

    // Se não estiver autenticado, mostrar o formulário de login
    if (!user) {
      return <LoginForm />
    }

    // Se estiver autenticado, mostrar o conteúdo normal do lobby
    return (
      <div className="w-full space-y-8">
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {availableGames.map(game => (
                <motion.div 
                  key={game.id} 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-medium text-lg text-white">{game.player_1_nickname}</h3>
                      <p className="text-sm text-slate-400">
                        Criado às {new Date(game.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full">
                      {game.grid_config.rows}x{game.grid_config.cols}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleJoinGame(game.id)}
                    className="w-full mt-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
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
        </div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-purple-950/80 to-slate-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/jogo-da-memoria" className="flex items-center text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="mr-2 h-5 w-5" />
            <span>Voltar</span>
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-300">
            Jogo da Memória Online
          </h1>
          
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span className="text-green-400 text-sm">Jogadores online</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-4 text-slate-300"
              onClick={fetchGames}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
        
        {renderLobbyContent()}

        {showNicknameModal && (
          <NicknameModal 
            isOpen={showNicknameModal}
            onSubmit={handleNicknameSubmit}
            onClose={() => setShowNicknameModal(false)}
          />
        )}
      </div>
    </main>
  )
} 