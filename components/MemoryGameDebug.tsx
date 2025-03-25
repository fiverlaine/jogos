"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '@/contexts/AuthContext';

export const MemoryGameDebug = () => {
  const { user } = useAuth();
  
  const [gameId, setGameId] = useState('');
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar detalhes de um jogo específico
  const fetchGameDetails = async () => {
    if (!gameId.trim()) {
      setError('Por favor, informe um ID de jogo.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/memory-games/${gameId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar detalhes do jogo');
      }
      
      setJsonResult(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar o jogo');
      setJsonResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas gerais sobre jogos
  const fetchGameStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/memory-games/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar estatísticas');
      }
      
      setJsonResult(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar estatísticas');
      setJsonResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Limpar resultados
  const clearResults = () => {
    setJsonResult(null);
    setError(null);
  };

  // Mostrar informações do sistema
  const showSystemInfo = () => {
    setJsonResult({
      browser: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof window !== 'undefined' && window.localStorage ? 'Disponível' : 'Indisponível',
      sessionStorage: typeof window !== 'undefined' && window.sessionStorage ? 'Disponível' : 'Indisponível',
      online: navigator.onLine,
      platform: navigator.platform,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentUser: user
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ferramentas de Diagnóstico
          </Typography>
          
          <Alert severity="info" className="mb-4">
            Estas ferramentas são destinadas para depuração e diagnóstico do jogo.
          </Alert>
          
          <div className="space-y-4">
            <div>
              <Typography variant="subtitle1" gutterBottom>
                Buscar Detalhes de Jogo
              </Typography>
              <div className="flex gap-2">
                <TextField
                  label="ID do jogo"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchGameDetails}
                  disabled={loading}
                >
                  Buscar
                </Button>
              </div>
            </div>
            
            <Divider />
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outlined"
                color="primary"
                onClick={fetchGameStats}
                disabled={loading}
              >
                Estatísticas de Jogos
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={showSystemInfo}
                disabled={loading}
              >
                Informações do Sistema
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={clearResults}
                disabled={loading || (!jsonResult && !error)}
              >
                Limpar Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}
      
      {jsonResult && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Resultado</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                maxHeight: '400px',
                overflow: 'auto'
              }}
            >
              <pre className="text-sm">{JSON.stringify(jsonResult, null, 2)}</pre>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
}; 