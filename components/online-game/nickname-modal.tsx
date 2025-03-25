'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2, User, Users, CheckCircle2, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
  gameType?: 'memory' | 'tictactoe';
}

export function NicknameModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  gameType = 'memory'
}: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Definir cores com base no tipo de jogo
  const colors = gameType === 'memory' 
    ? {
        gradientFrom: 'from-purple-900/95',
        gradientVia: 'via-indigo-900/95',
        gradientTo: 'to-purple-900/95',
        border: 'border-purple-700/50',
        iconGradientFrom: 'from-purple-500',
        iconGradientTo: 'to-indigo-500',
        iconShadow: 'shadow-purple-500/20',
        titleGradientFrom: 'from-purple-300',
        titleGradientVia: 'via-indigo-400',
        titleGradientTo: 'to-fuchsia-400',
        buttonGradientFrom: 'from-purple-600',
        buttonGradientTo: 'to-indigo-600',
        buttonHoverFrom: 'hover:from-purple-700',
        buttonHoverTo: 'hover:to-indigo-700',
        buttonShadow: 'shadow-purple-600/20',
        buttonHoverShadow: 'hover:shadow-purple-600/30',
      }
    : {
        gradientFrom: 'from-blue-900/95',
        gradientVia: 'via-cyan-900/95',
        gradientTo: 'to-blue-900/95',
        border: 'border-blue-700/50',
        iconGradientFrom: 'from-blue-500',
        iconGradientTo: 'to-cyan-500',
        iconShadow: 'shadow-blue-500/20',
        titleGradientFrom: 'from-cyan-300',
        titleGradientVia: 'via-blue-400',
        titleGradientTo: 'to-indigo-400',
        buttonGradientFrom: 'from-blue-600',
        buttonGradientTo: 'to-cyan-600',
        buttonHoverFrom: 'hover:from-blue-700',
        buttonHoverTo: 'hover:to-cyan-700',
        buttonShadow: 'shadow-blue-600/20',
        buttonHoverShadow: 'hover:shadow-blue-600/30',
      };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validar o nickname em tempo real
  useEffect(() => {
    if (nickname.trim().length >= 3 && nickname.trim().length <= 15) {
      setIsValid(true);
      setError('');
    } else {
      setIsValid(false);
    }
  }, [nickname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Por favor, insira um nickname');
      return;
    }
    
    if (nickname.length < 3) {
      setError('O nickname deve ter pelo menos 3 caracteres');
      return;
    }
    
    if (nickname.length > 15) {
      setError('O nickname deve ter no máximo 15 caracteres');
      return;
    }
    
    onSubmit(nickname);
    setNickname('');
    setError('');
  };

  // Impedir o fechamento do modal clicando fora ou pressionando ESC
  const handleOpenChange = (open: boolean) => {
    // Só permitir fechar se o modal estiver aberto e o usuário tiver um nickname
    if (isOpen && !open && nickname.length >= 3) {
      onClose();
    }
  };

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={`sm:max-w-md ${colors.border} bg-gradient-to-b ${colors.gradientFrom} ${colors.gradientVia} ${colors.gradientTo} backdrop-blur-sm shadow-xl rounded-xl`}
      >
        <div className="absolute right-4 top-4 hidden">
          {/* Escondendo o botão de fechar */}
        </div>
        
        <DialogHeader className="space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`mx-auto bg-gradient-to-br ${colors.iconGradientFrom} ${colors.iconGradientTo} p-3 rounded-full shadow-lg ${colors.iconShadow}`}
          >
            {gameType === 'memory' ? (
              <Brain className="h-8 w-8 text-white" />
            ) : (
              <Gamepad2 className="h-8 w-8 text-white" />
            )}
          </motion.div>
          <DialogTitle className={`text-center text-2xl font-bold bg-gradient-to-r ${colors.titleGradientFrom} ${colors.titleGradientVia} ${colors.titleGradientTo} bg-clip-text text-transparent`}>
            {gameType === 'memory' ? 'Jogo da Memória Online' : 'Jogo da Velha Online'}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300">
            Escolha um nome para ser identificado durante o jogo online.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="nickname" className="text-slate-300 flex items-center justify-between">
              <span>Seu nickname</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isValid ? 'bg-green-900/30 text-green-400' : 'text-slate-500'}`}>
                {nickname.length}/15
              </span>
            </Label>
            <div className="relative">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: JogadorX"
                className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-2 transition-all ${
                  isValid 
                    ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20" 
                    : error 
                      ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20" 
                      : `focus:border-${gameType === 'memory' ? 'purple' : 'blue'}-500 focus:ring-${gameType === 'memory' ? 'purple' : 'blue'}-500/20`
                }`}
                maxLength={15}
                autoFocus
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              
              {isValid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </motion.div>
              )}
            </div>
            {error ? (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-rose-500 font-medium flex items-center gap-1"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                {error}
              </motion.p>
            ) : (
              <p className="text-xs text-slate-500">
                O nickname deve ter entre 3 e 15 caracteres.
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <Button 
              type="submit" 
              disabled={!isValid}
              className={`w-full font-medium py-5 transition-all ${
                isValid 
                  ? `bg-gradient-to-r ${colors.buttonGradientFrom} ${colors.buttonGradientTo} ${colors.buttonHoverFrom} ${colors.buttonHoverTo} text-white shadow-lg ${colors.buttonShadow} ${colors.buttonHoverShadow} hover:-translate-y-0.5` 
                  : "bg-slate-700 text-slate-300 cursor-not-allowed"
              }`}
            >
              Começar a Jogar
            </Button>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-center text-slate-500">
                Este nickname será usado apenas para identificá-lo durante o jogo.
              </p>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 