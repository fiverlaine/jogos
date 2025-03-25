"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Star, Sun, Moon, Cloud, Flower2, Music, Zap, Brush, Coffee, Pizza, Gift, LucideIcon, ChevronDown, Smartphone, Rocket, Camera, Leaf, Plane, Car, Gamepad2, Crown, Gem, Flame, Ghost, Bird, Fish } from 'lucide-react'
import { toast } from "sonner"
import { RotateCcw, Trophy, AlertCircle, Sparkles, Clock, Brain, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react"
import confetti from "canvas-confetti"

// Definições de ícones por dificuldade
const ICON_SETS = {
  easy: [Heart, Star, Sun, Moon, Cloud, Flower2],
  medium: [Heart, Star, Sun, Moon, Cloud, Flower2, Music, Zap],
  hard: [Heart, Star, Sun, Moon, Cloud, Flower2, Music, Zap, Brush, Coffee, Pizza, Gift],
  expert: [
    Heart, Star, Sun, Moon, Cloud, Flower2, Music, Zap, Brush, Coffee, Pizza, Gift,
    Smartphone, Rocket, Camera, Leaf, Plane, Car, Gamepad2, Crown, Gem, Flame, Ghost, Bird, Fish
  ]
}

// Definições de grid por dificuldade
type GridConfig = {
  rows: number
  cols: number
  className: string
  name: string
  icon: LucideIcon
}

const GRID_CONFIGS: GridConfig[] = [
  { rows: 3, cols: 4, className: "grid-cols-4 grid-rows-3", name: "Fácil (3x4)", icon: Grid2X2 },
  { rows: 4, cols: 4, className: "grid-cols-4 grid-rows-4", name: "Médio (4x4)", icon: Grid3X3 },
  { rows: 4, cols: 6, className: "grid-cols-6 grid-rows-4", name: "Difícil (4x6)", icon: LayoutGrid },
  { rows: 6, cols: 6, className: "grid-cols-6 grid-rows-6", name: "Expert (6x6)", icon: LayoutGrid }
]

type MemoryCard = {
  id: number
  icon: LucideIcon
  isFlipped: boolean
  isMatched: boolean
  color: string
}

const createCards = (gridConfig: GridConfig) => {
  const totalPairs = (gridConfig.rows * gridConfig.cols) / 2
  let iconSet: LucideIcon[] = []
  
  if (totalPairs <= 6) {
    iconSet = [...ICON_SETS.easy]
  } else if (totalPairs <= 8) {
    iconSet = [...ICON_SETS.medium]
  } else if (totalPairs <= 12) {
    iconSet = [...ICON_SETS.hard]
  } else {
    iconSet = [...ICON_SETS.expert]
  }
  
  // Se precisarmos de mais ícones do que temos disponíveis, repetimos alguns
  while (iconSet.length < totalPairs) {
    iconSet = [...iconSet, ...ICON_SETS.easy]
  }
  
  // Pegamos apenas a quantidade necessária de ícones
  iconSet = iconSet.slice(0, totalPairs)
  
  const iconConfigs = iconSet.map(icon => {
    const colors = [
      "text-rose-400", "text-amber-400", "text-yellow-400", 
      "text-purple-400", "text-sky-400", "text-emerald-400",
      "text-blue-400", "text-orange-400", "text-pink-400",
      "text-green-400", "text-indigo-400", "text-red-400"
    ]
    return { icon, color: colors[Math.floor(Math.random() * colors.length)] }
  })
  
  const cards: MemoryCard[] = []

  iconConfigs.forEach(({ icon, color }, index) => {
    cards.push(
      { id: index * 2, icon, color, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, icon, color, isFlipped: false, isMatched: false }
    )
  })

  return cards.sort(() => Math.random() - 0.5)
}

export default function MemoryGame() {
  const [gridConfigIndex, setGridConfigIndex] = useState<number>(0)
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // Inicializar cartas com base na configuração de grid selecionada
  useEffect(() => {
    setCards(createCards(GRID_CONFIGS[gridConfigIndex]))
  }, [gridConfigIndex])

  // Iniciar timer quando o jogo começa
  useEffect(() => {
    if (flippedIndexes.length > 0 && !timerActive) {
      setTimerActive(true)
      setGameStarted(true)
    }
  }, [flippedIndexes.length, timerActive])

  // Timer para contar tempo de jogo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && !gameOver) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameOver]);

  const changeGridConfig = (index: number) => {
    if (gameStarted && !gameOver) {
      if (confirm("Mudar a dificuldade reiniciará o jogo atual. Você tem certeza?")) {
        resetGame(index)
      }
    } else {
      setGridConfigIndex(index)
      resetGame(index)
    }
  }

  const handleCardClick = (clickedIndex: number) => {
    // Prevent clicking if already checking or card is already matched
    if (isChecking || cards[clickedIndex].isMatched) return
    // Prevent clicking if card is already flipped
    if (flippedIndexes.includes(clickedIndex)) return
    // Prevent clicking if two cards are already flipped
    if (flippedIndexes.length === 2) return

    // Play flip sound
    const flipAudio = new Audio("/flip.mp3")
    flipAudio.volume = 0.3
    flipAudio.play().catch(e => console.log("Audio play failed:", e))

    // Add clicked card to flipped cards
    const newFlipped = [...flippedIndexes, clickedIndex]
    setFlippedIndexes(newFlipped)

    // Update card state to show it's flipped
    setCards(prevCards => 
      prevCards.map((card, index) => 
        index === clickedIndex ? { ...card, isFlipped: true } : card
      )
    )

    // If we now have two cards flipped, check for a match
    if (newFlipped.length === 2) {
      setIsChecking(true)
      setAttempts(prev => prev + 1)
      
      const [firstIndex, secondIndex] = newFlipped
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (firstCard.icon === secondCard.icon) {
        // Match found - play match sound
        setTimeout(() => {
          const matchAudio = new Audio("/match.mp3")
          matchAudio.volume = 0.3
          matchAudio.play().catch(e => console.log("Audio play failed:", e))
          
          setCards(prevCards => 
            prevCards.map((card, index) => 
              index === firstIndex || index === secondIndex
                ? { ...card, isMatched: true }
                : card
            )
          )
          
          const newMatches = matches + 1
          setMatches(newMatches)
          setFlippedIndexes([])
          setIsChecking(false)
          
          // Check for game completion
          if (newMatches === cards.length / 2) {
            // Game completed
            setGameOver(true)
            setTimerActive(false)
            
            setTimeout(() => {
              // Play win sound
              const winAudio = new Audio("/win.mp3")
              winAudio.volume = 0.4
              winAudio.play().catch(e => console.log("Audio play failed:", e))
              
              // Trigger confetti
              confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 }
              })
              
              toast("🎉 Parabéns! Você encontrou todos os pares! 🎈", {
                className: "bg-purple-900 text-purple-100 border-purple-700"
              })
            }, 300)
          }
        }, 500)
      } else {
        // No match - reset after delay
        setTimeout(() => {
          // Explicitamente marcar os dois índices em flippedIndexes como não virados
          const [firstIndex, secondIndex] = newFlipped;
          
          setCards(prevCards => 
            prevCards.map((card, index) => {
              if (index === firstIndex || index === secondIndex) {
                return { ...card, isFlipped: false };
              }
              return card;
            })
          )
          
          setFlippedIndexes([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const resetGame = (gridIndex = gridConfigIndex) => {
    setCards(createCards(GRID_CONFIGS[gridIndex]))
    setFlippedIndexes([])
    setMatches(0)
    setIsChecking(false)
    setGameTime(0)
    setTimerActive(false)
    setAttempts(0)
    setGameOver(false)
    setGameStarted(false)
  }

  // Formatar o tempo de jogo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Determinar o tamanho das cartas com base na configuração do grid
  const getCardSize = () => {
    const isExpertMode = gridConfigIndex === 3; // 6x6 grid
    const isHardMode = gridConfigIndex === 2;  // 4x6 grid
    
    if (isExpertMode) {
      return "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16";
    } else if (isHardMode) {
      return "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18";
    } else {
      return "w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22";
    }
  }

  // Determinar o tamanho do ícone das cartas com base na configuração do grid
  const getIconSize = () => {
    const isExpertMode = gridConfigIndex === 3; // 6x6 grid
    const isHardMode = gridConfigIndex === 2;  // 4x6 grid
    
    if (isExpertMode) {
      return "w-6 h-6 sm:w-8 sm:h-8";
    } else if (isHardMode) {
      return "w-7 h-7 sm:w-9 sm:h-9";
    } else {
      return "w-8 h-8 sm:w-10 sm:h-10";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.h1 
        className="mb-6 text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Jogo da Memória
      </motion.h1>

      {/* Seletor de Dificuldade */}
      <motion.div 
        className="mb-6 flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {GRID_CONFIGS.map((config, index) => (
          <Button 
            key={index}
            variant={gridConfigIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => changeGridConfig(index)}
            className={gridConfigIndex === index 
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
            }
          >
            <config.icon className="mr-1 h-4 w-4" />
            {config.name}
          </Button>
        ))}
      </motion.div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-center">
        <motion.div
          className="rounded-lg bg-slate-800/70 backdrop-blur-sm px-5 py-3 text-lg font-medium border border-slate-700 shadow-lg"
          animate={{
            backgroundColor: gameOver
              ? ["rgba(147, 51, 234, 0.1)", "rgba(147, 51, 234, 0.3)", "rgba(147, 51, 234, 0.1)"]
              : "rgba(15, 23, 42, 0.7)",
            boxShadow: gameOver
              ? ["0 0 10px rgba(147, 51, 234, 0.3)", "0 0 20px rgba(147, 51, 234, 0.5)", "0 0 10px rgba(147, 51, 234, 0.3)"]
              : "none"
          }}
          transition={{
            duration: 2,
            repeat: gameOver ? Number.POSITIVE_INFINITY : 0,
            repeatType: "reverse",
          }}
        >
          <span className={gameOver ? "text-purple-400 font-bold" : "text-slate-300"}>
            Pares encontrados: {matches} de {cards.length / 2}
            {gameOver && <Sparkles className="inline-block ml-2 h-4 w-4" />}
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
        
        <motion.div 
          className="rounded-lg bg-slate-800/70 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-slate-700 flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Brain className="h-4 w-4 text-slate-400" />
          <span className="text-slate-300">Tentativas: {attempts}</span>
        </motion.div>
      </div>

      <motion.div 
        className={`mb-8 grid gap-2 md:gap-3 ${GRID_CONFIGS[gridConfigIndex].className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="perspective-1000"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            whileHover={{ scale: 1.03 }}
          >
            <div
              className={`relative ${getCardSize()} transform-style-3d transition-all duration-300 cursor-pointer`}
              style={{
                transformStyle: "preserve-3d",
                transform: card.isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
              }}
              onClick={() => handleCardClick(index)}
            >
              {/* Card Back */}
              <div 
                className={`absolute w-full h-full rounded-xl border bg-gradient-to-br ${
                  card.isMatched 
                    ? "border-purple-500/50 from-purple-900/40 to-purple-800/40 shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    : "border-slate-700 from-slate-800 to-slate-900 hover:border-slate-600"
                } flex items-center justify-center backface-hidden`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_70%)]" />
                {!card.isMatched && (
                  <svg width="20" height="20" viewBox="0 0 40 40" fill="none" className="sm:w-[24px] sm:h-[24px]">
                    <path 
                      d="M20 8L24.4903 17.5371L35 19.0229L27.5 26.4629L29.0195 37L20 32.0371L10.9805 37L12.5 26.4629L5 19.0229L15.5097 17.5371L20 8Z" 
                      stroke="rgba(168, 85, 247, 0.4)" 
                      strokeWidth="2" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              
              {/* Card Front */}
              <div 
                className={`absolute w-full h-full rounded-xl border flex items-center justify-center backface-hidden ${
                  card.isMatched 
                    ? "border-purple-500/50 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                    : "border-slate-700 bg-slate-800/80"
                }`}
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-500/5 to-white/5" />
                <card.icon 
                  className={`${getIconSize()} ${
                    card.isMatched 
                      ? `${card.color} filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]` 
                      : card.color
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={() => resetGame()}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Novo Jogo
        </Button>
      </motion.div>
    </div>
  )
} 