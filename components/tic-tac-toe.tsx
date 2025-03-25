"use client"

import { useState, useEffect } from "react"
import { RotateCcw, Trophy, AlertCircle, Sparkles, Clock, HistoryIcon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

type SquareValue = "X" | "O" | null

interface SquareProps {
  value: SquareValue
  onSquareClick: () => void
  winningSquare: boolean
  index: number
}

function Square({ value, onSquareClick, winningSquare, index }: SquareProps) {
  return (
    <motion.button
      className={`group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border shadow-lg transition-all sm:h-24 sm:w-24 ${
        winningSquare
          ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          : "border-slate-700 bg-slate-800/80 backdrop-blur-sm hover:border-slate-600"
      }`}
      onClick={onSquareClick}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ 
        y: -3, 
        boxShadow: winningSquare 
          ? "0 10px 15px -5px rgba(6, 182, 212, 0.3)" 
          : "0 10px 15px -5px rgba(0, 0, 0, 0.3)" 
      }}
    >
      {/* Efeito de borda interna */}
      <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-slate-800/70 to-slate-900/70 opacity-80" />
      
      {/* Símbolo X ou O */}
      {value && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`relative z-20 text-4xl sm:text-5xl font-bold`}
        >
          {value === "X" ? (
            <span className="text-cyan-400">X</span>
          ) : (
            <span className="text-pink-400">O</span>
          )}
        </motion.div>
      )}
      
      {/* Efeito de brilho no hover */}
      <div 
        className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30 group-hover:duration-300 ${
          value === "X" ? "from-cyan-400 to-blue-500" : value === "O" ? "from-pink-400 to-purple-500" : "from-slate-400 to-slate-500"
        }`}
      />
    </motion.button>
  )
}

export default function TicTacToe() {
  const [history, setHistory] = useState<SquareValue[][]>([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]

  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Iniciar timer quando o jogo começa
  useEffect(() => {
    if (currentMove > 0 && !timerActive) {
      setTimerActive(true)
    }
  }, [currentMove, timerActive])

  // Timer para contar tempo de jogo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && !winner && !isDraw) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

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

  function handlePlay(nextSquares: SquareValue[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)

    // Check for winner
    const winner = calculateWinner(nextSquares)
    if (winner) {
      setWinningLine(winner.line)
      setShowConfetti(true)
      setTimerActive(false)

      // Play sound effect
      const audio = new Audio("/win.mp3")
      audio.volume = 0.3
      audio.play().catch((e) => console.log("Audio play failed:", e))
    } else if (nextSquares.every(square => square !== null)) {
      // Jogo empatado
      setTimerActive(false)
    } else {
      setWinningLine(null)
    }
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove)

    // Check if there's a winner at this move
    const winner = calculateWinner(history[nextMove])
    if (winner) {
      setWinningLine(winner.line)
    } else {
      setWinningLine(null)
    }

    setShowConfetti(false)
  }

  function handleReset() {
    setHistory([Array(9).fill(null)])
    setCurrentMove(0)
    setWinningLine(null)
    setShowConfetti(false)
    setGameTime(0)
    setTimerActive(false)
  }

  const winner = calculateWinner(currentSquares)
  const isDraw = !winner && currentSquares.every((square) => square !== null)

  let status
  if (winner) {
    status = `Vencedor: ${winner.player}`
  } else if (isDraw) {
    status = "Empate!"
  } else {
    status = `Próximo jogador: ${xIsNext ? "X" : "O"}`
  }

  // Formatar o tempo de jogo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const moves = history.map((_, move) => {
    let description
    if (move === 0) {
      description = "Início do jogo"
    } else {
      description = `Jogada #${move}`
    }

    return (
      <motion.li
        key={move}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: move * 0.05 }}
        className="mb-1"
      >
        {move === currentMove ? (
          <div className="rounded-md bg-slate-700/50 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-cyan-400 border-l-2 border-cyan-400">
            {description} (atual)
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start px-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white group"
            onClick={() => jumpTo(move)}
          >
            <HistoryIcon className="w-3.5 h-3.5 mr-2 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            {description}
          </Button>
        )}
      </motion.li>
    )
  })

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col items-center">
        <motion.h1 
          className="mb-8 text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Jogo da Velha
        </motion.h1>

        <div className="mb-8 flex gap-4 items-center">
          <motion.div
            className="mb-0 rounded-lg bg-slate-800/70 backdrop-blur-sm px-5 py-3 text-lg font-medium border border-slate-700 shadow-lg"
            animate={{
              backgroundColor: winner
                ? ["rgba(8, 47, 73, 0.7)", "rgba(8, 145, 178, 0.3)", "rgba(8, 47, 73, 0.7)"]
                : isDraw
                ? ["rgba(234, 179, 8, 0.1)", "rgba(234, 179, 8, 0.2)", "rgba(234, 179, 8, 0.1)"]
                : "rgba(8, 47, 73, 0.7)",
              boxShadow: winner
                ? ["0 0 10px rgba(6, 182, 212, 0.3)", "0 0 20px rgba(6, 182, 212, 0.5)", "0 0 10px rgba(6, 182, 212, 0.3)"]
                : isDraw
                ? ["0 0 10px rgba(234, 179, 8, 0.1)", "0 0 15px rgba(234, 179, 8, 0.2)", "0 0 10px rgba(234, 179, 8, 0.1)"]
                : "none"
            }}
            transition={{
              duration: 2,
              repeat: (winner || isDraw) ? Number.POSITIVE_INFINITY : 0,
              repeatType: "reverse",
            }}
          >
            <span className={`
              ${winner ? "text-cyan-400 font-bold" : 
                isDraw ? "text-amber-400 font-bold" : 
                "text-slate-300"}
            `}>
              {status}
              {winner && <Sparkles className="inline-block ml-2 h-4 w-4" />}
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
        </div>

        <motion.div 
          className="mb-8 grid grid-cols-3 gap-3 md:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {currentSquares.map((value, i) => (
            <Square
              key={i}
              index={i}
              value={value}
              onSquareClick={() => {
                if (winner || currentSquares[i] || isDraw) return
                const nextSquares = currentSquares.slice()
                nextSquares[i] = xIsNext ? "X" : "O"

                // Play sound effect
                const audio = new Audio("/click.mp3")
                audio.volume = 0.2
                audio.play().catch((e) => console.log("Audio play failed:", e))

                handlePlay(nextSquares)
              }}
              winningSquare={winningLine?.includes(i) || false}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleReset}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 rounded-md"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reiniciar Jogo
          </Button>
        </motion.div>

        <AnimatePresence>
          {(winner || isDraw) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8 w-full max-w-md mx-auto px-4 sm:px-0"
            >
              <Alert className={`border-l-4 ${winner ? "border-l-cyan-500 bg-cyan-500/10" : "border-l-amber-500 bg-amber-500/10"} backdrop-blur-sm overflow-hidden text-sm sm:text-base`}>
                {winner ? (
                  <Trophy className="h-5 w-5 text-cyan-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                )}
                <AlertTitle className={`${winner ? "text-cyan-400" : "text-amber-400"} text-sm sm:text-base`}>
                  {winner ? "Parabéns!" : "Jogo finalizado!"}
                </AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  {winner ? (
                    <span>
                      O jogador <span className="font-bold">{winner.player}</span> venceu em{" "}
                      <span className="font-bold">{currentMove}</span> jogadas e{" "}
                      <span className="font-bold">{formatTime(gameTime)}</span> de tempo!
                    </span>
                  ) : (
                    <span>
                      O jogo terminou em empate após <span className="font-bold">{currentMove}</span> jogadas!
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700 p-5 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-200">
          <HistoryIcon className="h-4 w-4 text-cyan-400" />
          Histórico de Jogadas
        </h3>
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
          <ul>{moves}</ul>
        </div>
      </div>
    </div>
  )
}

function calculateWinner(squares: SquareValue[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: lines[i] }
    }
  }
  return null
}

