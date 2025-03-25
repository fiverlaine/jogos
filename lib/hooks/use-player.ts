'use client';

import { useState, useEffect } from 'react';
import { generateUUID } from '../utils';

type Player = {
  id: string;
  nickname: string;
};

export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  
  // Verificar se localStorage está disponível
  const checkStorageAvailability = () => {
    try {
      if (typeof window === 'undefined') return false;
      
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage não está disponível:', e);
      return false;
    }
  };
  
  // Efeito para recuperar o jogador do localStorage no carregamento inicial
  useEffect(() => {
    const loadPlayer = () => {
      try {
        // Verificar disponibilidade de localStorage
        const isStorageAvailable = checkStorageAvailability();
        setStorageAvailable(isStorageAvailable);
        
        if (!isStorageAvailable) {
          console.warn('localStorage não está disponível, usando memória local apenas');
          setIsLoading(false);
          return;
        }
        
        // Recuperar do localStorage
        const storedId = localStorage.getItem('jogoVelhaUserId');
        const storedNickname = localStorage.getItem('jogoVelhaNickname');
        
        if (storedId && storedNickname) {
          setPlayer({
            id: storedId,
            nickname: storedNickname
          });
          console.log('Jogador recuperado do localStorage:', { id: storedId, nickname: storedNickname });
        } else {
          console.log('Nenhum jogador encontrado no localStorage');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do jogador:', error);
        setStorageAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Verificar se estamos no navegador (client-side)
    if (typeof window !== 'undefined') {
      // Usar setTimeout para evitar problemas com hidratação
      setTimeout(loadPlayer, 0);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Função para definir as informações do jogador
  const setPlayerInfo = (nickname: string, id?: string) => {
    try {
      if (!nickname) {
        console.error('Nickname não pode ser vazio');
        return null;
      }
      
      const playerId = id || generateUUID();
      
      // Salvar no localStorage se disponível
      if (storageAvailable) {
        try {
          localStorage.setItem('jogoVelhaUserId', playerId);
          localStorage.setItem('jogoVelhaNickname', nickname);
        } catch (storageError) {
          console.warn('Não foi possível salvar no localStorage:', storageError);
        }
      }
      
      // Atualizar o estado
      const playerData = {
        id: playerId,
        nickname: nickname
      };
      
      console.log('Definindo informações do jogador:', playerData);
      setPlayer(playerData);
      
      return playerId;
    } catch (error) {
      console.error('Erro ao salvar dados do jogador:', error);
      return null;
    }
  };
  
  // Função para limpar as informações do jogador
  const clearPlayerInfo = () => {
    try {
      if (storageAvailable) {
        localStorage.removeItem('jogoVelhaUserId');
        localStorage.removeItem('jogoVelhaNickname');
      }
      setPlayer(null);
      console.log('Informações do jogador limpadas');
    } catch (error) {
      console.error('Erro ao limpar dados do jogador:', error);
    }
  };
  
  // Detectar mudanças em localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'jogoVelhaUserId' || event.key === 'jogoVelhaNickname') {
        console.log('Detectada mudança em localStorage de outra aba');
        
        const storedId = localStorage.getItem('jogoVelhaUserId');
        const storedNickname = localStorage.getItem('jogoVelhaNickname');
        
        if (storedId && storedNickname) {
          setPlayer({
            id: storedId,
            nickname: storedNickname
          });
        } else {
          setPlayer(null);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);
  
  return { 
    player, 
    isLoading, 
    setPlayerInfo,
    clearPlayerInfo,
    isAuthenticated: !!player,
    storageAvailable
  };
} 