import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);

  const updateMatches = (newMatches: Match[]) => {
    setMatches(prev => [...new Map([
      ...prev.map(m => [m.id, m]),
      ...newMatches.map(m => [m.id, m])
    ]).values()]);
  };

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const response = await api.get('/matches');
        updateMatches(response.data);
      } catch (error) {
        console.error('Falha ao carregar partidas:', error);
        setUsingFallback(true);
      }
    };

    loadMatches();

    const wsHandler = (newMatch: Match) => updateMatches([newMatch]);
    const httpHandler = (e: Event) => {
      updateMatches((e as CustomEvent).detail);
    };

    socket.on('match_updated', wsHandler);
    window.addEventListener('matches_update', httpHandler);
    
    return () => {
      socket?.off('match_updated', wsHandler);
      window.removeEventListener('matches_update', httpHandler);
    };
  }, []);
  
  return { matches, usingFallback };
}; 