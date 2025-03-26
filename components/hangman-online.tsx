"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSupabase } from "@/lib/hooks/use-supabase"
import { usePlayer } from "@/lib/hooks/use-player"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import { 
  Clock, 
  HeartPulse, 
  Loader2, 
  RefreshCcw, 
  Lightbulb,
  Trophy
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Lista de palavras para o jogo
const PALAVRAS = [
  "ABACAXI", "BANANA", "CACHORRO", "DENTISTA", "ELEFANTE",
  "FUTEBOL", "GIRASSOL", "HOSPITAL", "INTERNET", "JANELA",
  "KIWI", "LIMÃO", "MACARRÃO", "NAVIO", "ORELHA",
  "PATO", "QUEIJO", "RATO", "SAPO", "TEATRO",
  "UVA", "VIOLINO", "XÍCARA", "YOGA", "ZEBRA",
  "ÁRVORE", "BICICLETA", "COMPUTADOR", "DIAMANTE", "ESCADA",
  "FOGUETE", "GUITARRA", "HELICÓPTERO", "IGREJA", "JARDIM",
  "LEÃO", "MONTANHA", "NOTEBOOK", "OCEANO", "PÁSSARO",
  "QUADRO", "ROBÔ", "SMARTPHONE", "TELEFONE", "UNIVERSO"
]

// Dicas correspondentes para cada palavra
const DICAS = [
  "Fruta tropical com coroa", "Fruta amarela e curvada", "Animal doméstico que late", "Profissional da saúde bucal", "Grande mamífero com tromba",
  "Esporte com bola", "Flor que segue o sol", "Local para tratamento médico", "Rede mundial de computadores", "Abertura na parede",
  "Fruta pequena e verde por dentro", "Fruta cítrica amarela", "Massa alimentícia", "Embarcação grande", "Parte do corpo que capta sons",
  "Ave aquática", "Produto lácteo", "Roedor pequeno", "Anfíbio que pula", "Local de apresentações artísticas",
  "Fruta pequena roxa ou verde", "Instrumento musical de cordas", "Recipiente para bebidas quentes", "Prática de exercícios e meditação", "Animal listrado preto e branco",
  "Planta grande com tronco e galhos", "Veículo de duas rodas", "Máquina eletrônica de processamento", "Pedra preciosa", "Objeto com degraus",
  "Veículo que vai ao espaço", "Instrumento musical de cordas", "Veículo aéreo com hélices", "Edifício religioso", "Área externa com plantas",
  "Animal felino selvagem", "Elevação natural do terreno", "Computador portátil", "Grande extensão de água salgada", "Animal que voa",
  "Obra de arte para pendurar", "Máquina automatizada", "Telefone inteligente", "Aparelho de comunicação", "Espaço sideral"
]

const MAX_ERROS = 6

interface HangmanOnlineProps {
  gameId: string
  hostId: string
  hostNickname: string
  guestId?: string
  guestNickname?: string
}

export default function HangmanOnline({ 
  gameId, 
  hostId, 
  hostNickname, 
  guestId, 
  guestNickname 
}: HangmanOnlineProps) {
  const { player } = usePlayer()
  const { supabase, game, updateGame, syncGameState, resetGame } = useSupabase()
  const [palavra, setPalavra] = useState("")
  const [dica, setDica] = useState("")
  const [letrasAdivinhadas, setLetrasAdivinhadas] = useState<string[]>([])
  const [erros, setErros] = useState(0)
  const [tempoJogo, setTempoJogo] = useState(0)
  const [statusJogo, setStatusJogo] = useState<"esperando" | "jogando" | "vitoria" | "derrota" | "encerrado">("esperando")
  const [mostrarDica, setMostrarDica] = useState(false)
  const [indicePalavra, setIndicePalavra] = useState(0)
  const [jogadorAtual, setJogadorAtual] = useState<string | null>(null)
  const [solicitacaoRevanche, setSolicitacaoRevanche] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Inicializar o jogo quando ambos os jogadores estiverem presentes
  useEffect(() => {
    if (hostId && guestId && player?.id && statusJogo === "esperando") {
      iniciarJogo()
    }
    
    // Limpar temporizador ao desmontar componente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [hostId, guestId, player?.id])

  // Configurar temporizador do jogo
  useEffect(() => {
    if (statusJogo === "jogando") {
      intervalRef.current = setInterval(() => {
        setTempoJogo(prev => prev + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [statusJogo])

  // Efeito de confete ao vencer
  useEffect(() => {
    if (statusJogo === "vitoria") {
      const end = Date.now() + 3 * 1000
      
      const runConfetti = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3']
        })
        
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3']
        })
        
        if (Date.now() < end) {
          requestAnimationFrame(runConfetti)
        }
      }
      
      runConfetti()
    }
  }, [statusJogo])

  // Iniciar um novo jogo
  function iniciarJogo() {
    if (!player?.id) return
    
    // Escolher aleatoriamente uma palavra
    const novoIndice = Math.floor(Math.random() * PALAVRAS.length)
    const novaPalavra = PALAVRAS[novoIndice]
    const novaDica = DICAS[novoIndice]
    
    // Decidir aleatoriamente quem começa
    const primeiroJogador = Math.random() < 0.5 ? hostId : guestId
    
    setPalavra(novaPalavra)
    setDica(novaDica)
    setIndicePalavra(novoIndice)
    setLetrasAdivinhadas([])
    setErros(0)
    setTempoJogo(0)
    setStatusJogo("jogando")
    setMostrarDica(false)
    setJogadorAtual(primeiroJogador || hostId)
    setSolicitacaoRevanche(null)

    // Atualizar o estado do jogo no Supabase
    updateGame({
      currentWord: novaPalavra,
      currentWordIndex: novoIndice,
      hint: novaDica,
      guessedLetters: [],
      errors: 0,
      gameTime: 0,
      gameStatus: "jogando",
      showHint: false,
      currentPlayer: primeiroJogador || hostId,
      rematchRequest: null
    })
  }

  // Verificar se o jogador venceu
  function verificarVitoria() {
    if (!palavra) return false
    
    return [...palavra].every(letra => 
      letrasAdivinhadas.includes(letra) || letra === " " || letra === "-"
    )
  }

  // Manipular clique em uma letra
  function handleLetraClick(letra: string) {
    if (statusJogo !== "jogando" || jogadorAtual !== player?.id) return
    
    if (!letrasAdivinhadas.includes(letra)) {
      const novasLetrasAdivinhadas = [...letrasAdivinhadas, letra]
      setLetrasAdivinhadas(novasLetrasAdivinhadas)
      
      // Verificar se a letra está na palavra
      if (!palavra.includes(letra)) {
        const novosErros = erros + 1
        setErros(novosErros)
        
        // Verificar se o jogador perdeu
        if (novosErros >= MAX_ERROS) {
          setStatusJogo("derrota")
          updateGame({
            guessedLetters: novasLetrasAdivinhadas,
            errors: novosErros,
            gameStatus: "derrota"
          })
          return
        }
      }
      
      // Alternar jogador atual
      const novoJogadorAtual = jogadorAtual === hostId ? guestId : hostId
      setJogadorAtual(novoJogadorAtual || hostId)
      
      // Verificar se o jogador venceu
      const vitoria = [...palavra].every(l => 
        novasLetrasAdivinhadas.includes(l) || l === " " || l === "-"
      )
      
      if (vitoria) {
        setStatusJogo("vitoria")
        updateGame({
          guessedLetters: novasLetrasAdivinhadas,
          errors: erros,
          gameStatus: "vitoria",
          gameTime: tempoJogo
        })
      } else {
        updateGame({
          guessedLetters: novasLetrasAdivinhadas,
          errors: erros,
          currentPlayer: novoJogadorAtual
        })
      }
    }
  }

  // Mostrar dica com penalidade
  function mostrarDicaComPenalidade() {
    setMostrarDica(true)
    const novosErros = erros + 1
    setErros(novosErros)
    
    if (novosErros >= MAX_ERROS) {
      setStatusJogo("derrota")
    }
    
    updateGame({
      showHint: true,
      errors: novosErros,
      gameStatus: novosErros >= MAX_ERROS ? "derrota" : statusJogo
    })
    
    toast({
      description: "Uma penalidade foi aplicada por usar a dica!",
      variant: "destructive"
    })
  }

  // Solicitar revanche
  function solicitarRevanche() {
    if (!player?.id) return
    
    setSolicitacaoRevanche(player.id)
    updateGame({
      rematchRequest: player.id
    })
    
    toast({
      description: "Solicitação de revanche enviada!",
      variant: "default"
    })
  }

  // Aceitar revanche
  function aceitarRevanche() {
    if (!solicitacaoRevanche || !player?.id) return
    
    iniciarJogo()
    
    toast({
      description: "Revanche aceita! Novo jogo iniciado.",
      variant: "default"
    })
  }

  // Formatar tempo
  function formatarTempo(segundos: number) {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`
  }

  // Renderizar a palavra com espaços
  function renderizarPalavra() {
    return [...palavra].map((letra, index) => {
      const isGuessed = letrasAdivinhadas.includes(letra)
      
      return (
        <motion.div
          key={`${index}-${letra}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "w-10 h-12 md:w-12 md:h-14 flex items-center justify-center border-b-2 mx-1",
            letra === " " ? "border-transparent" : isGuessed ? "border-green-500" : "border-slate-600"
          )}
        >
          {letra !== " " && (
            <span 
              className={cn(
                "text-xl md:text-2xl font-bold",
                isGuessed ? "text-white" : "text-transparent"
              )}
            >
              {letra}
            </span>
          )}
        </motion.div>
      )
    })
  }

  // Renderizar o teclado
  function renderizarTeclado() {
    const linhas = [
      "QWERTYUIOP".split(""),
      "ASDFGHJKL".split(""),
      "ZXCVBNM".split("")
    ]
    
    return (
      <div className="max-w-lg mx-auto mt-6">
        {linhas.map((linha, rowIndex) => (
          <div 
            key={`row-${rowIndex}`} 
            className="flex justify-center space-x-1 mb-2"
          >
            {linha.map((letra) => {
              const foiAdivinhada = letrasAdivinhadas.includes(letra)
              const estaCorreta = palavra.includes(letra)
              
              return (
                <button
                  key={letra}
                  onClick={() => handleLetraClick(letra)}
                  disabled={
                    statusJogo !== "jogando" || 
                    foiAdivinhada || 
                    jogadorAtual !== player?.id
                  }
                  className={cn(
                    "w-8 h-10 md:w-10 md:h-12 rounded flex items-center justify-center font-medium transition-colors",
                    foiAdivinhada 
                      ? estaCorreta 
                        ? "bg-green-600 text-white" 
                        : "bg-rose-600 text-white"
                      : jogadorAtual === player?.id
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {letra}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // Interface para mostrar esperando o segundo jogador
  if (statusJogo === "esperando" && (!guestId || !hostId)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-slate-700 bg-slate-800/50 shadow-xl">
        <div className="animate-pulse flex flex-col items-center mb-6">
          <Loader2 className="h-12 w-12 text-rose-400 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-white">Aguardando oponente...</h2>
          <p className="text-slate-400 mt-2 text-center">
            Compartilhe o link do jogo com um amigo ou aguarde alguém entrar
          </p>
        </div>
        
        <div className="flex items-center space-x-4 bg-slate-900 p-3 rounded-lg shadow-inner w-full max-w-sm">
          <div className="shrink-0">
            <Avatar className="h-10 w-10 border border-slate-700 bg-slate-800">
              <AvatarFallback className="bg-rose-500/10 text-rose-500">
                {hostNickname.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {hostNickname} <span className="text-rose-400">(Você)</span>
            </p>
            <p className="text-xs text-slate-400">
              Criador da sala
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Forca e Status */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Título */}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-red-300 via-rose-400 to-red-500 bg-clip-text text-transparent"
          >
            Jogo da Forca Online
          </motion.h1>
          
          {/* Área da forca */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative aspect-square max-w-md mx-auto w-full"
          >
            {/* Base */}
            <div className="absolute bottom-0 left-0 w-full h-[5%] bg-slate-700 rounded-md" />
            
            {/* Poste vertical */}
            <div className="absolute bottom-0 left-[10%] w-[5%] h-[95%] bg-slate-700 rounded-md" />
            
            {/* Poste horizontal superior */}
            <div className="absolute top-0 left-[10%] w-[65%] h-[5%] bg-slate-700 rounded-md" />
            
            {/* Corda */}
            <div className="absolute top-[5%] right-[30%] w-[2%] h-[15%] bg-slate-600 rounded-md" />
            
            {/* Cabeça (erros >= 1) */}
            {erros >= 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-[20%] right-[27.5%] w-[15%] h-[15%] rounded-full border-4 border-rose-500"
              />
            )}
            
            {/* Corpo (erros >= 2) */}
            {erros >= 2 && (
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                className="absolute top-[35%] right-[30%] w-[2%] h-[25%] bg-rose-500 origin-top"
              />
            )}
            
            {/* Braço esquerdo (erros >= 3) */}
            {erros >= 3 && (
              <motion.div 
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                className="absolute top-[38%] right-[30%] w-[15%] h-[2%] bg-rose-500 origin-left -rotate-45"
              />
            )}
            
            {/* Braço direito (erros >= 4) */}
            {erros >= 4 && (
              <motion.div 
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                className="absolute top-[38%] right-[30%] w-[15%] h-[2%] bg-rose-500 origin-right rotate-45 -scale-x-100"
              />
            )}
            
            {/* Perna esquerda (erros >= 5) */}
            {erros >= 5 && (
              <motion.div 
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                className="absolute top-[60%] right-[30%] w-[15%] h-[2%] bg-rose-500 origin-left -rotate-45"
              />
            )}
            
            {/* Perna direita (erros >= 6) */}
            {erros >= 6 && (
              <motion.div 
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                className="absolute top-[60%] right-[30%] w-[15%] h-[2%] bg-rose-500 origin-right rotate-45 -scale-x-100"
              />
            )}
          </motion.div>
        </div>

        {/* Painel de Status */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="w-full p-4 shadow-md bg-slate-800/60 border-slate-700">
            <div className="flex flex-col gap-4">
              {/* Status do jogo */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <span className="font-mono">{formatarTempo(tempoJogo)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <HeartPulse className="h-5 w-5 text-rose-500" />
                  <span>{MAX_ERROS - erros} / {MAX_ERROS}</span>
                </div>
              </div>
              
              {/* Jogadores */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  jogadorAtual === hostId ? "bg-slate-700 ring-1 ring-rose-500" : "bg-slate-800"
                )}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 border border-slate-700">
                      <AvatarFallback className="bg-rose-500/10 text-rose-500">
                        {hostNickname.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-slate-400">Jogador 1</p>
                      <p className="text-sm font-medium text-white truncate">
                        {hostNickname}
                        {player?.id === hostId && <span className="text-xs text-rose-400 ml-1">(Você)</span>}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "p-2 rounded-lg",
                  jogadorAtual === guestId ? "bg-slate-700 ring-1 ring-rose-500" : "bg-slate-800"
                )}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 border border-slate-700">
                      <AvatarFallback className="bg-blue-500/10 text-blue-500">
                        {guestNickname ? guestNickname.substring(0, 2).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-slate-400">Jogador 2</p>
                      <p className="text-sm font-medium text-white truncate">
                        {guestNickname || "Aguardando..."}
                        {player?.id === guestId && <span className="text-xs text-blue-400 ml-1">(Você)</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status atual do jogo */}
              {statusJogo === "jogando" && (
                <div className="text-center py-2 px-4 bg-slate-700/50 rounded-lg">
                  {jogadorAtual === player?.id ? (
                    <p className="text-white">
                      <span className="font-bold text-rose-400">Sua vez!</span> Escolha uma letra.
                    </p>
                  ) : (
                    <p className="text-slate-300">
                      Aguardando jogada de {jogadorAtual === hostId ? hostNickname : guestNickname}...
                    </p>
                  )}
                </div>
              )}
              
              {/* Vitória */}
              {statusJogo === "vitoria" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-3 px-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
                >
                  <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-white font-bold">Parabéns!</p>
                  <p className="text-slate-200 text-sm">A palavra foi adivinhada com sucesso!</p>
                  <p className="text-slate-300 mt-1 text-xs">
                    Tempo: {formatarTempo(tempoJogo)} | Erros: {erros}/{MAX_ERROS}
                  </p>
                </motion.div>
              )}
              
              {/* Derrota */}
              {statusJogo === "derrota" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-3 px-4 bg-rose-500/20 border border-rose-500/30 rounded-lg"
                >
                  <p className="text-white font-bold">Fim de jogo!</p>
                  <p className="text-slate-200 text-sm">A palavra era: <span className="text-rose-300 font-bold">{palavra}</span></p>
                </motion.div>
              )}
              
              {/* Botões de ação */}
              <div className="flex gap-2 mt-2">
                {(statusJogo === "vitoria" || statusJogo === "derrota") && (
                  <>
                    {solicitacaoRevanche && solicitacaoRevanche !== player?.id ? (
                      <Button 
                        onClick={aceitarRevanche}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        Aceitar Revanche
                      </Button>
                    ) : (
                      <Button 
                        onClick={solicitarRevanche}
                        disabled={solicitacaoRevanche === player?.id}
                        className="w-full bg-slate-700 hover:bg-slate-600"
                      >
                        {solicitacaoRevanche === player?.id ? "Revanche Solicitada" : "Solicitar Revanche"}
                        <RefreshCcw className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </>
                )}
                
                {statusJogo === "jogando" && jogadorAtual === player?.id && (
                  <Button
                    onClick={mostrarDicaComPenalidade}
                    disabled={mostrarDica}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    {mostrarDica ? "Dica Revelada" : "Revelar Dica (Penalidade)"}
                    <Lightbulb className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
              
              {/* Dica */}
              {mostrarDica && dica && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2 bg-slate-700/50 rounded-lg text-center"
                >
                  <p className="text-yellow-300 text-sm font-medium">Dica: {dica}</p>
                </motion.div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Área da palavra */}
      <div className="mt-8 mb-6">
        <div className="flex flex-wrap justify-center">
          {renderizarPalavra()}
        </div>
      </div>

      {/* Teclado */}
      {renderizarTeclado()}
      
      {/* Instruções */}
      {(statusJogo === "jogando" || statusJogo === "esperando") && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center text-sm text-slate-400 max-w-lg mx-auto"
        >
          <p>
            Adivinhe a palavra clicando nas letras. Cuidado! Após {MAX_ERROS} erros, o bonequinho está completo e você perde.
          </p>
        </motion.div>
      )}
    </div>
  )
} 