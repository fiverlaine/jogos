'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface RematchModalProps {
  isOpen: boolean;
  isRequesting: boolean;
  isReceiving: boolean;
  opponentNickname: string | null;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRequest: () => void;
}

export function RematchModal({
  isOpen,
  isRequesting,
  isReceiving,
  opponentNickname,
  onClose,
  onAccept,
  onDecline,
  onRequest
}: RematchModalProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Resetar o timer quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(30);
    }
  }, [isOpen]);
  
  // Iniciar o contador regressivo quando o modal está aberto
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Redirecionar para o lobby quando o tempo acabar
          if (isOpen) {
            onDecline();
            router.push('/');
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, onDecline, router]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => {
            // Fechar apenas se clicar no fundo
            if (e.target === e.currentTarget && !isRequesting && !isReceiving) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl w-full max-w-md m-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Temporizador no topo */}
            <div className="flex justify-center mb-3">
              <div className={`text-sm px-3 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red-900/60 text-red-200' : 'bg-slate-700/60 text-slate-200'}`}>
                Tempo restante: {timeLeft}s
              </div>
            </div>
            
            {isRequesting ? (
              <>
                <h2 className="text-xl font-bold text-indigo-300 mb-4">Solicitação de Revanche Enviada</h2>
                <div className="flex justify-center mb-6">
                  <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-400" />
                    <p className="text-slate-300">Aguardando resposta de {opponentNickname}...</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                    onClick={() => {
                      onClose();
                      router.push('/');
                    }}
                  >
                    Voltar para o lobby
                  </Button>
                </div>
              </>
            ) : isReceiving ? (
              <>
                <h2 className="text-xl font-bold text-indigo-300 mb-2">Solicitação de Revanche</h2>
                <p className="text-slate-300 mb-6">
                  {opponentNickname} está solicitando uma revanche. Aceitar?
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    onClick={() => {
                      onDecline();
                      router.push('/');
                    }}
                  >
                    Recusar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={onAccept}
                  >
                    Aceitar Revanche
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-indigo-300 mb-3">Jogo Finalizado</h2>
                <p className="text-slate-300 mb-6">
                  Deseja solicitar uma revanche contra {opponentNickname}?
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                    onClick={() => {
                      onClose();
                      router.push('/');
                    }}
                  >
                    Voltar para o lobby
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onClick={onRequest}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Solicitar Revanche
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 