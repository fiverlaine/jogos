"use client"

import { useState, useEffect } from "react"
import { RotateCcw, Trophy, AlertCircle, Sparkles, Clock, HelpCircle, Zap, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

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
const MAX_ERROS = 6

export default function Hangman() {
  const [palavra, setPalavra] = useState("")
  const [letrasAdivinhadas, setLetrasAdivinhadas] = useState<string[]>([])
  const [erros, setErros] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [status, setStatus] = useState<"jogando" | "venceu" | "perdeu">("jogando")
  const [showConfetti, setShowConfetti] = useState(false)
  const [mostraDica, setMostraDica] = useState(false)
  const [penaltyForHint, setPenaltyForHint] = useState(false)
  
  // Inicializar o jogo
  useEffect(() => {
    iniciarJogo()
  }, [])
  
  // Timer para contar tempo de jogo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && status === "jogando") {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, status]);
  
  // Efeito de confetti
  useEffect(() => {
    if (showConfetti) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Confetti com cores personalizadas
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#67e8f9", "#22d3ee", "#06b6d4"],
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#c084fc", "#a855f7", "#9333ea"],
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [showConfetti])

  // Iniciar um novo jogo
  const iniciarJogo = () => {
    // Escolher uma palavra aleatória
    const novaPalavra = palavras[Math.floor(Math.random() * palavras.length)]
    setPalavra(novaPalavra)
    setLetrasAdivinhadas([])
    setErros(0)
    setStatus("jogando")
    setGameTime(0)
    setTimerActive(true)
    setShowConfetti(false)
    setMostraDica(false)
    setPenaltyForHint(false)
  }

  // Verificar se o jogador ganhou
  const verificarVitoria = (palavra: string, letrasAdivinhadas: string[]) => {
    // Ganha quando todas as letras da palavra foram adivinhadas
    return [...palavra].every(letra => letrasAdivinhadas.includes(letra))
  }

  // Lidar com o clique em uma letra
  const handleLetraClique = (letra: string) => {
    if (status !== "jogando" || letrasAdivinhadas.includes(letra)) {
      return
    }

    const novasLetrasAdivinhadas = [...letrasAdivinhadas, letra]
    setLetrasAdivinhadas(novasLetrasAdivinhadas)

    // Verificar se a letra está na palavra
    if (!palavra.includes(letra)) {
      const novosErros = erros + 1
      setErros(novosErros)
      
      // Play error sound
      const audio = new Audio("/error.mp3")
      audio.volume = 0.3
      audio.play().catch((e) => console.log("Audio play failed:", e))

      // Verificar se perdeu o jogo
      if (novosErros >= MAX_ERROS) {
        setStatus("perdeu")
        setTimerActive(false)
      }
    } else {
      // Play success sound
      const audio = new Audio("/success.mp3")
      audio.volume = 0.3
      audio.play().catch((e) => console.log("Audio play failed:", e))
      
      // Verificar se ganhou o jogo
      if (verificarVitoria(palavra, novasLetrasAdivinhadas)) {
        setStatus("venceu")
        setTimerActive(false)
        setShowConfetti(true)
        
        // Play win sound
        const audio = new Audio("/win.mp3")
        audio.volume = 0.3
        audio.play().catch((e) => console.log("Audio play failed:", e))
      }
    }
  }

  // Mostrar dica com penalidade (adiciona um erro)
  const mostrarDica = () => {
    if (!penaltyForHint) {
      setErros(prev => Math.min(prev + 1, MAX_ERROS))
      setPenaltyForHint(true)
    }
    setMostraDica(true)
  }

  // Criar display da palavra com espaços e letras adivinhadas
  const palavraDisplay = [...palavra].map((letra, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-center w-7 sm:w-10 h-10 sm:h-14 mx-0.5 sm:mx-1 border-b-2 ${
        letrasAdivinhadas.includes(letra) || status === "perdeu"
          ? "border-cyan-500"
          : "border-slate-600"
      }`}
    >
      <span className="text-xl sm:text-2xl font-bold">
        {letrasAdivinhadas.includes(letra) || status === "perdeu" ? letra : " "}
      </span>
    </motion.div>
  ))

  // Criar teclado virtual
  const teclado = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ]

  // Formatar o tempo de jogo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      <motion.h1 
        className="mb-4 sm:mb-6 text-center text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-300 via-rose-400 to-red-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Jogo da Forca
      </motion.h1>

      <div className="grid gap-4 sm:gap-8 w-full md:grid-cols-[1fr_auto]">
        {/* Boneco da forca */}
        <motion.div 
          className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 p-3 sm:p-4 backdrop-blur-sm shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="180" height="220" viewBox="0 0 200 250" className="text-white">
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
            {erros >= 1 && (
              <motion.circle
                cx="140" cy="70" r="20"
                strokeWidth="4"
                stroke={erros >= 1 ? "currentColor" : "transparent"}
                fill="transparent"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Corpo */}
            {erros >= 2 && (
              <motion.line
                x1="140" y1="90" x2="140" y2="150"
                strokeWidth="4"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Braço esquerdo */}
            {erros >= 3 && (
              <motion.line
                x1="140" y1="110" x2="110" y2="130"
                strokeWidth="4"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Braço direito */}
            {erros >= 4 && (
              <motion.line
                x1="140" y1="110" x2="170" y2="130"
                strokeWidth="4"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Perna esquerda */}
            {erros >= 5 && (
              <motion.line
                x1="140" y1="150" x2="110" y2="190"
                strokeWidth="4"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            {/* Perna direita */}
            {erros >= 6 && (
              <motion.line
                x1="140" y1="150" x2="170" y2="190"
                strokeWidth="4"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </svg>
        </motion.div>

        {/* Painel de informações e status */}
        <motion.div 
          className="flex flex-col rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Status do jogo */}
          <div className="mb-3 sm:mb-4 flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
              <span className="text-slate-400">Tempo:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
                <span className="font-mono font-medium text-white">{formatTime(gameTime)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between rounded-lg bg-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
              <span className="text-slate-400">Erros:</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className={`font-mono font-medium ${erros > 3 ? "text-red-400" : "text-white"}`}>
                  {erros}/{MAX_ERROS}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="mt-auto space-y-1 sm:space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 sm:gap-2 border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white text-xs sm:text-sm py-1 sm:py-2"
              onClick={iniciarJogo}
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Novo Jogo</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 sm:gap-2 border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white text-xs sm:text-sm py-1 sm:py-2"
              onClick={mostrarDica}
              disabled={mostraDica || status !== "jogando"}
            >
              <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Dica (+1 erro)</span>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Mensagens de vitória/derrota */}
      <AnimatePresence>
        {status !== "jogando" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 w-full"
          >
            <Alert
              className={`border ${
                status === "venceu"
                  ? "border-green-700 bg-green-900/30"
                  : "border-red-700 bg-red-900/30"
              }`}
            >
              {status === "venceu" ? (
                <Trophy className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <AlertTitle className={status === "venceu" ? "text-green-400" : "text-red-400"}>
                {status === "venceu" ? "Parabéns!" : "Que pena!"}
              </AlertTitle>
              <AlertDescription className="text-slate-300">
                {status === "venceu"
                  ? `Você acertou a palavra "${palavra}" em ${formatTime(gameTime)}!`
                  : `A palavra era "${palavra}". Tente novamente!`}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dica */}
      <AnimatePresence>
        {mostraDica && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 w-full"
          >
            <Alert className="border border-yellow-700 bg-yellow-900/30">
              <BookOpen className="h-5 w-5 text-yellow-400" />
              <AlertTitle className="text-yellow-400">Dica</AlertTitle>
              <AlertDescription className="text-slate-300">
                {dicas[palavra]}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display da palavra */}
      <motion.div 
        className="mt-6 sm:mt-8 flex flex-wrap justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {palavraDisplay}
      </motion.div>

      {/* Teclado virtual */}
      <motion.div 
        className="mt-8 w-full max-w-md mx-auto flex flex-col items-center space-y-1 sm:space-y-2 px-1 sm:px-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {teclado.map((linha, linhaIndex) => (
          <div key={linhaIndex} className="flex justify-center w-full gap-1 sm:gap-2">
            {linha.map((letra) => (
              <motion.button
                key={letra}
                onClick={() => handleLetraClique(letra)}
                disabled={letrasAdivinhadas.includes(letra) || status !== "jogando"}
                className={`flex h-8 w-8 xs:h-9 xs:w-9 sm:h-12 sm:w-12 items-center justify-center rounded-md text-base sm:text-lg font-semibold transition-all ${
                  letrasAdivinhadas.includes(letra)
                    ? palavra.includes(letra)
                      ? "bg-green-600/80 text-white shadow-md shadow-green-900/20"
                      : "bg-red-600/80 text-white shadow-md shadow-red-900/20"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                } ${status !== "jogando" ? "opacity-70" : ""}`}
                whileHover={status === "jogando" && !letrasAdivinhadas.includes(letra) ? { y: -2 } : {}}
                whileTap={status === "jogando" && !letrasAdivinhadas.includes(letra) ? { scale: 0.95 } : {}}
              >
                {letra}
              </motion.button>
            ))}
          </div>
        ))}
      </motion.div>

      {/* Instruções do jogo */}
      <motion.div 
        className="mt-6 sm:mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-white">Como jogar</h3>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto px-2">
          Tente adivinhar a palavra clicando nas letras. Cada erro adiciona uma parte ao boneco da forca. 
          Você tem direito a {MAX_ERROS} erros antes de perder o jogo. Você pode solicitar uma dica, 
          mas isso contará como um erro adicional.
        </p>
      </motion.div>
    </div>
  )
} 