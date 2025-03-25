import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import MemoryGame from "@/components/memory-game"
import Image from "next/image"

export default function MemoryGamePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover object-center opacity-10"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-purple-950/80 to-slate-900/80"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Jogos
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 border-purple-600/30 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 hover:text-purple-300"
          >
            <Link href="/jogo-da-memoria/online">
              <Users className="h-4 w-4" />
              Jogar Online
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-md sm:p-8">
          <MemoryGame />
        </div>
      </div>
    </main>
  )
}

