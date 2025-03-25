import { NextApiRequest, NextApiResponse } from 'next';
import { getMemoryGame, joinMemoryGame } from '@/lib/memory-game/memoryGameService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { gameId } = req.query;
    
    if (!gameId || typeof gameId !== 'string') {
      return res.status(400).json({ error: 'ID de jogo inválido' });
    }
    
    if (req.method === 'GET') {
      // Obter jogo específico
      const game = await getMemoryGame(gameId);
      return res.status(200).json(game);
    }
    
    if (req.method === 'POST') {
      // Entrar em jogo existente
      const { playerId, playerNickname } = req.body;
      
      if (!playerId || !playerNickname) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
      
      const updatedGame = await joinMemoryGame(gameId, playerId, playerNickname);
      return res.status(200).json(updatedGame);
    }
    
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error(`Erro na API de jogo ${req.query.gameId}:`, error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
} 