"use client"

import Link from "next/link"
import { ArrowLeft, Home, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Hangman from "@/components/hangman"
import { motion } from "framer-motion"

export default function JogoDaForcaPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white">
      {/* Fundo com gradiente */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      {/* Luzes de fundo sutis */}
      <div className="absolute top-1/4 -right-20 h-60 w-60 rounded-full bg-red-500 opacity-10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 h-60 w-60 rounded-full bg-rose-500 opacity-10 blur-[100px] animate-pulse" />
      
      <div className="container relative z-10 mx-auto px-4 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 text-slate-300 hover:bg-slate-800/50 hover:text-white"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Voltar para Jogos</span>
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className="mx-auto max-w-4xl rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-lg backdrop-blur-md sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Hangman />
        </motion.div>
        
        {/* Rodapé */}
        <motion.footer 
          className="mt-12 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p>© 2024 Jogos Clássicos. Divirta-se!</p>
        </motion.footer>
      </div>
    </main>
  )
} 