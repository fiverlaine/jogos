import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const RematchButton = ({ gameId, playerId, onRematchRequested }) => {
  const periodicCheckRef = useRef(null);

  const handleRequestRematch = async () => {
    try {
      setIsRequestingRematch(true);
      setRematchRequestError(null);

      console.log(`[REVANCHE] Solicitando revanche para o jogo ${gameId}`);
      const response = await fetch(`/api/memory-game/${gameId}/rematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao solicitar revanche');
      }

      console.log(`[REVANCHE] Resposta da solicitação de revanche:`, result);
      
      // Verificar se a revanche já foi aceita e temos um ID de revanche
      if (result.rematch_game_id) {
        console.log(`[REVANCHE] Revanche já aceita! ID do novo jogo: ${result.rematch_game_id}`);
        setRematchGameId(result.rematch_game_id);
        onRematchRequested(true, result.rematch_game_id);
        
        // Verificar explicitamente se a revanche foi aceita
        try {
          const acceptResponse = await fetch(`/api/memory-game/${gameId}/accept-rematch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rematch_game_id: result.rematch_game_id
            }),
          });
          
          if (acceptResponse.ok) {
            console.log(`[REVANCHE] Aceitação de revanche confirmada explicitamente`);
          }
        } catch (acceptError) {
          console.warn('[REVANCHE] Erro ao confirmar aceitação:', acceptError);
        }
        
        return;
      }

      // A revanche foi solicitada, mas ainda não foi aceita
      onRematchRequested(true);
      
      // Iniciar verificação periódica para ver se a revanche foi aceita
      startPeriodicCheck(result.game?.id || gameId);
      
      toast.success('Revanche solicitada! Aguardando resposta do oponente...', {
        id: 'rematch-request-sent',
        duration: 3000,
      });
    } catch (error) {
      console.error('[REVANCHE] Erro ao solicitar revanche:', error);
      setRematchRequestError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      toast.error('Erro ao solicitar revanche. Tente novamente.', {
        id: 'rematch-request-error',
        duration: 3000,
      });
    } finally {
      setIsRequestingRematch(false);
    }
  };

  // Função para verificar periodicamente se a revanche foi aceita
  const startPeriodicCheck = (targetGameId: string) => {
    console.log(`[REVANCHE] Iniciando verificação periódica para o jogo ${targetGameId}`);
    
    // Parar qualquer verificação anterior
    if (periodicCheckRef.current) {
      clearInterval(periodicCheckRef.current);
    }
    
    // Iniciar nova verificação
    periodicCheckRef.current = setInterval(async () => {
      try {
        console.log(`[REVANCHE] Verificando status de revanche para o jogo ${targetGameId}`);
        
        // Tentar múltiplas APIs para garantir que obteremos uma resposta
        let gameStatus = null;
        
        // Tentar primeiro com a API principal
        try {
          const response = await fetch(`/api/memory-game/${targetGameId}`);
          if (response.ok) {
            gameStatus = await response.json();
          }
        } catch (e) {
          console.warn('[REVANCHE] Erro ao verificar com API principal:', e);
        }
        
        // Se não funcionou, tentar com API alternativa
        if (!gameStatus) {
          try {
            const response = await fetch(`/api/memory-game/${targetGameId}/get`);
            if (response.ok) {
              gameStatus = await response.json();
            }
          } catch (e) {
            console.warn('[REVANCHE] Erro ao verificar com API alternativa:', e);
          }
        }
        
        // Se ainda não funcionou, tentar com API de diagnóstico
        if (!gameStatus) {
          try {
            const response = await fetch(`/api/memory-game/${targetGameId}/debug-rematch`);
            if (response.ok) {
              const debugData = await response.json();
              gameStatus = debugData.game;
            }
          } catch (e) {
            console.warn('[REVANCHE] Erro ao verificar com API de diagnóstico:', e);
          }
        }
        
        if (!gameStatus) {
          console.warn(`[REVANCHE] Não foi possível obter status do jogo ${targetGameId}`);
          return;
        }
        
        // Verificar se a revanche foi aceita e temos um ID de jogo de revanche
        if (gameStatus.rematch_accepted && gameStatus.rematch_game_id) {
          console.log(`[REVANCHE] Revanche aceita! ID do novo jogo: ${gameStatus.rematch_game_id}`);
          
          // Parar verificação periódica
          if (periodicCheckRef.current) {
            clearInterval(periodicCheckRef.current);
            periodicCheckRef.current = null;
          }
          
          // Atualizar estado e notificar componente pai
          setRematchGameId(gameStatus.rematch_game_id);
          onRematchRequested(true, gameStatus.rematch_game_id);
          
          // Notificar usuário
          toast.success('Revanche aceita! Redirecionando para o novo jogo...', {
            id: 'rematch-accepted',
            duration: 2000,
          });
          
          // Confirmar aceitação explicitamente como backup
          try {
            await fetch(`/api/memory-game/${targetGameId}/accept-rematch`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                rematch_game_id: gameStatus.rematch_game_id
              }),
            });
          } catch (e) {
            console.warn('[REVANCHE] Erro ao confirmar aceitação:', e);
          }
        }
      } catch (error) {
        console.warn('[REVANCHE] Erro na verificação periódica:', error);
      }
    }, 2000); // Verificar a cada 2 segundos
  };

  // Limpar intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (periodicCheckRef.current) {
        clearInterval(periodicCheckRef.current);
        periodicCheckRef.current = null;
      }
    };
  }, []);

  return (
    <button onClick={handleRequestRematch}>Solicitar Revanche</button>
  );
};

export default RematchButton; 