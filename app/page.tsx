"use client"

import Link from "next/link"
import { Sparkles, Grid3X3, Brain, Gamepad2, ChevronRight, Trophy, Star, AlertCircle, Rocket, Dice5, CircleDot, PenTool, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import GameCard from "@/components/game-card"
import { motion, useMotionValue, useSpring, useTransform, TargetAndTransition } from "framer-motion"
import { useEffect, useState, useRef, ReactNode } from "react"
import confetti from "canvas-confetti"

type ParticlesProps = {
  className?: string;
  quantity?: number;
}

// Componente de partículas de fundo
const Particles = ({ className = "", quantity = 50 }: ParticlesProps) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {Array.from({ length: quantity }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{
            opacity: Math.random() * 0.5 + 0.1,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.1,
          }}
          animate={{
            opacity: [null, 0, Math.random() * 0.5 + 0.1],
            y: [null, `${Math.random() * 120 - 20}%`],
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
          }}
        />
      ))}
    </div>
  )
}

type ShiningStarsProps = {
  count?: number;
}

// Componente de estrela brilhante
const ShiningStars = ({ count = 10 }: ShiningStarsProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            opacity: Math.random() * 0.7 + 0.3,
            scale: Math.random() * 0.5 + 0.5,
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [null, 0.2, null] as any,
            scale: [null, 1.2, null] as any,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        >
          <Star className="h-2 w-2 text-yellow-300 fill-yellow-300" />
        </motion.div>
      ))}
    </div>
  );
};

// Tipo para os dados dos jogos
interface GameData {
  title: string;
  description: string;
  icon: React.ReactNode;
  imageSrc: string;
  gradient: string;
  shadowColor: string;
  href: string;
  features: string[];
  onlineLink?: string;
}

// Tipo para as categorias de jogos
type GameCategories = {
  [key: string]: GameData[];
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('popular')
  
  // Efeito de confete ao montar o componente
  useEffect(() => {
    setMounted(true)
    
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#67e8f9', '#c084fc', '#f472b6']
      })
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Variáveis para animações
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  // Configurações para seções de jogos
  const gameCategories: GameCategories = {
    popular: [
      {
        title: "Jogo da Velha",
        description: "O clássico jogo da velha para jogar contra o computador ou um amigo ao seu lado.",
        icon: <Hash className="h-6 w-6 text-white" />,
        imageSrc: "https://i.imgur.com/UCjk0iO.png",
        gradient: "from-blue-600 to-cyan-400",
        shadowColor: "rgba(56, 189, 248, 0.25)",
        href: "/jogo-da-velha",
        onlineLink: "/jogo-da-velha/online",
        features: [
          "Dois jogadores",
          "IA adaptativa",
          "Visual moderno",
          "Placar de vitórias"
        ]
      },
      {
        title: "Jogo da Memória",
        description: "Teste sua memória encontrando pares de cartas iguais. Quanto mais rápido você encontrar todos os pares, melhor será sua pontuação.",
        icon: <Brain className="h-8 w-8 text-purple-400" />,
        imageSrc: "https://i.imgur.com/RNHOjRn.png",
        gradient: "from-purple-600 to-pink-600",
        shadowColor: "rgba(168,85,247,0.5)",
        href: "/jogo-da-memoria",
        onlineLink: "/jogo-da-memoria/online",
        features: [
          "Múltiplos níveis de dificuldade",
          "Diferentes tamanhos de grade",
          "Cronômetro e contador de jogadas",
          "Animações fluidas",
        ]
      },
      {
        title: "Jogo da Forca",
        description: "Teste seu vocabulário nesta versão moderna do jogo da forca. Adivinhe a palavra antes que o boneco seja desenhado por completo.",
        icon: <PenTool className="h-8 w-8 text-red-400" />,
        imageSrc: "https://i.imgur.com/PPUODn8.png",
        gradient: "from-red-600 to-rose-600",
        shadowColor: "rgba(225,29,72,0.5)",
        href: "/jogo-da-forca",
        features: [
          "Dicas opcionais",
          "Palavras em português",
          "Sistema de pontuação",
          "Animações interativas",
        ]
      }
    ],
    novos: [],
    "em breve": [
      {
        title: "Ludo",
        description: "O famoso jogo de tabuleiro estratégico com dados. Movimente suas peças pelo tabuleiro, capture as peças adversárias e seja o primeiro a levar todas para a casa final.",
        icon: <Dice5 className="h-8 w-8 text-green-400" />,
        imageSrc: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=2031&auto=format&fit=crop",
        gradient: "from-green-600 to-emerald-600",
        shadowColor: "rgba(16,185,129,0.5)",
        href: "#",
        onlineLink: undefined,
        features: [
          "Até 4 jogadores",
          "Regras personalizáveis",
          "Animações do tabuleiro",
          "Dados em 3D",
        ]
      },
      {
        title: "Snake",
        description: "O clássico jogo da cobrinha com um visual moderno. Controle a cobra, colete alimentos para crescer e evite colidir com as paredes ou com seu próprio corpo.",
        icon: <CircleDot className="h-8 w-8 text-amber-400" />,
        imageSrc: "https://images.unsplash.com/photo-1605144584264-61691a6e3d0b?q=80&w=2070&auto=format&fit=crop",
        gradient: "from-amber-600 to-yellow-600",
        shadowColor: "rgba(217,119,6,0.5)",
        href: "#",
        onlineLink: undefined,
        features: [
          "Diferentes velocidades",
          "Sistema de pontuação",
          "Power-ups especiais",
          "Níveis com obstáculos",
        ]
      }
    ]
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Efeitos de fundo */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500 opacity-20 blur-[100px] animate-pulse" />
      <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-purple-500 opacity-20 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-60 w-60 rounded-full bg-cyan-500 opacity-10 blur-[100px] animate-pulse" />

      {/* Partículas animadas */}
      {mounted && <Particles quantity={30} />}
      {mounted && <ShiningStars count={15} />}

      {/* Grade decorativa */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="container relative z-10 mx-auto px-4 py-16">
        <header className="mb-16 text-center">
          <motion.div
            className="mb-8 flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Gamepad2 className="h-16 w-16 text-cyan-400" />
              <div className="absolute -inset-1 -z-10 animate-pulse rounded-full bg-cyan-500/20 blur-xl"></div>
              
              {/* Anéis animados ao redor do ícone */}
              <motion.div 
                className="absolute -inset-2 rounded-full border border-cyan-500/30"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -inset-3 rounded-full border border-cyan-500/20"
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="mb-6 text-6xl font-bold tracking-tight sm:text-7xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-bold inline-block">
              Jogos Clássicos
            </span>
            
            <span className="relative ml-2 inline-block">
              <Trophy className="inline h-10 w-10 text-yellow-400" />
              <motion.span 
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-300"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-cyan-400 font-medium">Experiência futurista</span> com jogos atemporais. 
            Desafie seus amigos ou teste suas habilidades em jogos clássicos
            com <span className="text-purple-400 font-medium">visual moderno</span> e efeitos impressionantes.
          </motion.p>
          
          {/* Estatísticas com animação melhorada */}
          <motion.div 
            className="mt-12 flex flex-wrap justify-center gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {[
              { value: "10+", label: "Jogos", icon: <Gamepad2 className="h-5 w-5 text-cyan-400" /> },
              { value: "1000+", label: "Jogadores", icon: <Trophy className="h-5 w-5 text-purple-400" /> },
              { value: "99%", label: "Satisfação", icon: <Sparkles className="h-5 w-5 text-yellow-400" /> },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="group flex flex-col items-center p-4 rounded-xl hover:bg-white/5 transition-colors duration-300"
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <motion.span 
                    className="text-3xl font-bold text-white"
                    animate={mounted ? {
                      scale: [1, 1.03, 1],
                      transition: { duration: 2, repeat: Infinity, repeatType: "reverse", delay: index * 0.5 }
                    } : {}}
                  >
                    {stat.value}
                  </motion.span>
                  <motion.div 
                    animate={{
                      rotate: [0, 5, -5, 0],
                      transition: { 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        delay: index * 0.3,
                        ease: "easeInOut" 
                      }
                    }}
                  >
                    {stat.icon}
                  </motion.div>
                </div>
                <p className="text-sm uppercase tracking-wide text-slate-400 group-hover:text-white transition-colors duration-300">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Navegação de categorias */}
          <motion.div 
            className="mt-16 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="inline-flex rounded-lg bg-slate-800/50 backdrop-blur-sm p-1">
              {['popular', 'novos', 'em breve'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                    activeTab === tab 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-cyan-600/70 rounded-md"
                      initial={false}
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{tab}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </header>

        <motion.div
          className="mt-8 grid gap-8 md:grid-cols-2 lg:gap-12"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {(gameCategories[activeTab] || gameCategories.popular).map((game) => (
            <motion.div
              key={game.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
          
          {activeTab !== 'popular' && gameCategories[activeTab].length === 0 && (
            <div className="flex items-center justify-center md:col-span-2">
              <motion.div 
                className="text-center rounded-2xl border border-slate-800/70 bg-slate-900/70 backdrop-blur-sm p-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                <h3 className="text-2xl font-bold mb-2 text-white">Em desenvolvimento</h3>
                <p className="text-slate-300 max-w-md mx-auto">
                  Estamos trabalhando para adicionar mais jogos nesta categoria em breve. 
                  Fique atento para novidades!
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="mt-24 rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          {/* Efeito de brilho no card */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 opacity-10 blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h2 className="mb-3 text-3xl font-bold text-white flex items-center gap-2">
                Pronto para jogar?
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Rocket className="h-6 w-6 text-cyan-400 ml-2" />
                </motion.div>
              </h2>
              <p className="text-lg text-slate-300">
                Escolha um dos jogos acima e divirta-se com nossos clássicos repaginados.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <Link 
                  href="/jogo-da-velha" 
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-lg py-4 px-6 rounded-md flex items-center gap-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Grid3X3 className="h-5 w-5" />
                  <span>Jogar Jogo da Velha</span>
                  <ChevronRight className="h-5 w-5" />
                </Link>

                <Link 
                  href="/jogo-da-memoria" 
                  className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg py-4 px-6 rounded-md flex items-center gap-2 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  <Brain className="h-5 w-5" />
                  <span>Jogar Jogo da Memória</span>
                  <ChevronRight className="h-5 w-5" />
                </Link>

                <Link 
                  href="/jogo-da-forca" 
                  className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 text-white text-lg py-4 px-6 rounded-md flex items-center gap-2 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                >
                  <PenTool className="h-5 w-5" />
                  <span>Jogar Jogo da Forca</span>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
            
            {/* Gráfico de troféu com melhor animação */}
            <motion.div 
              className="hidden md:flex min-w-36 h-36 rounded-full bg-slate-800/50 items-center justify-center relative"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 border border-slate-700/50 rounded-full" />
              <div className="absolute inset-2 border border-dashed border-slate-700/30 rounded-full" />
              <motion.div 
                className="flex items-center justify-center p-4 bg-slate-900 rounded-full relative"
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 0 rgba(34, 211, 238, 0.2)', 
                    '0 0 15px rgba(34, 211, 238, 0.4)', 
                    '0 0 0 rgba(34, 211, 238, 0.2)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="h-14 w-14 text-yellow-400" />
                <span className="absolute text-xs font-bold top-0 -right-1 bg-blue-500 text-white h-6 w-6 flex items-center justify-center rounded-full">1</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Rodapé com animação de aparecimento */}
        <motion.footer 
          className="mt-16 border-t border-slate-800/50 pt-8 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="text-slate-400 font-medium mb-2">© 2024 Jogos Clássicos</h4>
              <p>Todos os direitos reservados</p>
            </div>
            <div>
              <div className="flex justify-center gap-4">
                {['Twitter', 'Discord', 'GitHub'].map(social => (
                  <a 
                    key={social}
                    href="#" 
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                    onClick={(e) => e.preventDefault()}
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p>Feito com <span className="text-pink-500">♥</span> para todos os jogadores</p>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  )
}

