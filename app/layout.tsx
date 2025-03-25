import "@/lib/utils";
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./card-styles.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Jogos Clássicos - Design Futurista",
  description: "Jogue Jogo da Velha e Jogo da Memória com visual futurista",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <Suspense fallback={<div>Carregando...</div>}>
              <main className="min-h-screen flex flex-col">
                {children}
              </main>
            </Suspense>
            <Toaster position="top-center" toastOptions={{
              className: 'bg-slate-800 border-slate-700 text-slate-100',
              duration: 3000,
            }} />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import './globals.css'