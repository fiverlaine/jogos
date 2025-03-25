"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Star, Clock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { SafeHydration } from "@/lib/safe-hydration";
import ExternalLinkIcon from './icons/external-link-icon'

interface GameCardProps {
  title: string
  description: string
  icon: React.ReactNode
  imageSrc: string
  gradient: string
  shadowColor: string
  href: string
  onlineLink?: string
  features: string[]
}

export default function GameCard({
  title,
  description,
  icon,
  imageSrc,
  gradient,
  shadowColor,
  href,
  onlineLink,
  features,
}: GameCardProps) {
  const isComingSoon = href === "#";
  
  return (
    <div className="relative">
      {/* Card principal - Link removido do wrapper principal */}
      <motion.div
        className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ${isComingSoon ? 'cursor-default' : 'cursor-pointer'}`}
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 },
        }}
        whileHover={{ 
          y: -8, 
          boxShadow: `0 20px 30px -10px ${shadowColor}33`,
          transition: { duration: 0.3, ease: "easeOut" } 
        }}
        onClick={() => {
          if (!isComingSoon) {
            window.location.href = href;
          }
        }}
      >
        {/* Brilho de destaque no canto superior */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-white to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10"></div>
        
        <div className="relative h-48 overflow-hidden sm:h-64">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 transition-opacity duration-300 group-hover:opacity-30`}></div>
          <motion.div 
            className="relative h-full w-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageSrc})` }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent"></div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="rounded-full bg-slate-900/80 p-2.5 backdrop-blur-sm ring-1 ring-white/10">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-white drop-shadow-md">{title}</h3>
          </div>
          
          {/* Badge de destaque */}
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            {isComingSoon ? (
              <>
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-amber-300">Em Breve</span>
              </>
            ) : (
              <>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>Destaque</span>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          <p className="mb-6 text-slate-300">{description}</p>

          <div className="mb-6">
            <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">Recursos:</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {features.map((feature, index) => (
                <li 
                  key={index} 
                  className="flex items-center text-sm text-slate-300"
                >
                  <span className={`mr-2 h-2 w-2 rounded-full bg-gradient-to-r ${gradient}`}></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <motion.div
              whileHover={{ scale: isComingSoon ? 1 : 1.02 }}
              whileTap={{ scale: isComingSoon ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation(); // Evitar propagação para o card
                if (!isComingSoon) {
                  window.location.href = href;
                }
              }}
            >
              <Button
                className={`relative w-full justify-between overflow-hidden ${
                  isComingSoon 
                    ? "bg-slate-700 text-slate-300 cursor-not-allowed opacity-80" 
                    : `bg-gradient-to-r ${gradient} text-white font-medium`
                } py-6`}
                disabled={isComingSoon}
              >
                <span className="text-base">
                {isComingSoon ? "Em Desenvolvimento" : "Jogar Agora"}
                </span>
                {isComingSoon ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
            
            {/* Botão "Jogar Online" dentro do card */}
            {onlineLink && !isComingSoon && (
              <SafeHydration>
                <div className="mt-2">
                  {/* Este div interrompe o evento de clique para não propagar para o card principal */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); // Impedir que o clique bubbles para o container
                    }}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-white flex justify-between items-center py-6"
                      asChild
                    >
                      <Link href={onlineLink}>
                        <Globe className="h-5 w-5 text-purple-400" />
                        <span>Jogar Online</span>
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </SafeHydration>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

