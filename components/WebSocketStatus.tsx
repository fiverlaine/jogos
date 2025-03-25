"use client";

import React, { useState, useEffect } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Check, Close, SignalCellularAlt } from '@mui/icons-material';

export const WebSocketStatus = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastPing, setLastPing] = useState<number>(0);

  // Simular a conexão WebSocket
  useEffect(() => {
    // Simulação da conexão após 1 segundo
    const timer = setTimeout(() => {
      setStatus('connected');
      
      // Simular pings periódicos para medir latência
      const pingInterval = setInterval(() => {
        const pingStart = Date.now();
        setLastPing(pingStart);
        
        // Simular resposta entre 30-150ms
        setTimeout(() => {
          const delay = Date.now() - pingStart;
          setLatency(delay);
        }, Math.random() * 120 + 30);
      }, 5000);
      
      return () => clearInterval(pingInterval);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <Check />;
      case 'connecting': return <SignalCellularAlt />;
      case 'disconnected': return <Close />;
      default: return <SignalCellularAlt />;
    }
  };

  const getLatencyText = () => {
    if (latency === null) return 'Medindo...';
    return `${latency}ms`;
  };

  const getTooltipTitle = () => {
    return `Status: ${status}${latency ? ` - Latência: ${latency}ms` : ''}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Tooltip title={getTooltipTitle()}>
        <Chip
          icon={getStatusIcon()}
          label={status === 'connected' ? getLatencyText() : status}
          color={getStatusColor() as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    </div>
  );
}; 