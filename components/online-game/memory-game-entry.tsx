'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemoryGameEntryProps {
  onSubmit: (nickname: string) => void;
}

export default function MemoryGameEntry({ onSubmit }: MemoryGameEntryProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Por favor, insira um apelido');
      return;
    }
    
    if (nickname.length < 3) {
      setError('O apelido deve ter pelo menos 3 caracteres');
      return;
    }
    
    onSubmit(nickname);
    setNickname('');
    setError('');
  };

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto rounded-xl overflow-hidden shadow-xl"
    >
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 p-6 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-3 rounded-full shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Entre no Jogo da Memória</h2>
        <p className="text-purple-200 mb-6">
          Para jogar online, você precisa criar um perfil temporário.
        </p>
      </div>
      
      <div className="bg-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-slate-300">
              Seu apelido
            </Label>
            <Input
              id="nickname"
              placeholder="Digite seu apelido"
              className="bg-slate-900 border border-slate-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-6"
          >
            ENTRAR
          </Button>
        </form>
      </div>
    </motion.div>
  );
} 