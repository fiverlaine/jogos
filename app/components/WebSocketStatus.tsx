import React, { useState, useEffect } from 'react';
import { getMemorySocket } from '@/lib/memory-game/useMemoryGame';

export const WebSocketStatus = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  useEffect(() => {
    const socket = getMemorySocket();
    
    const updateStatus = () => {
      setStatus(socket.connected ? 'connected' : 'disconnected');
    };
    
    socket.on('connect', updateStatus);
    socket.on('disconnect', updateStatus);
    socket.on('connect_error', updateStatus);
    
    updateStatus();
    
    return () => {
      socket.off('connect', updateStatus);
      socket.off('disconnect', updateStatus);
      socket.off('connect_error', updateStatus);
    };
  }, []);
  
  return (
    <div className="fixed bottom-2 right-2 p-2 rounded-full shadow-md">
      <div 
        className={`w-3 h-3 rounded-full ${
          status === 'connected' ? 'bg-green-500' : 
          status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        title={`WebSocket: ${status}`}
      />
    </div>
  );
}; 