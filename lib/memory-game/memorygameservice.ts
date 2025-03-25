import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

// Tipos
export interface MemoryGame {
  id: string;
  createdAt: string;
  creatorId: string;
  creatorNickname: string;
  rows: number;
  cols: number;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  cards?: Card[];
  currentTurn?: string;
  winner?: string;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
}

export interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

// Clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache local
const gamesCache = new Map<string, MemoryGame>();

// PUBSUB Channels
const MEMORY_GAME_CHANNEL = 'memory_game_updates';

/**
 * Cria um novo jogo da memória
 */
export const createMemoryGame = async (creatorId: string, creatorNickname: string, rows: number, cols: number): Promise<MemoryGame> => {
  try {
    console.log(`Iniciando criação de jogo da memória com configuração: {rows: ${rows}, cols: ${cols}}`);
    
    // Gerar cartas
    const symbols = '🍎,🍌,🍒,🍓,🍊,🍋,🍍,🥝,🍇,🍉,🥭,🍑,🥥,🥑,🌽,🥕'.split(',');
    const cards: Card[] = [];
    
    const pairsCount = (rows * cols) / 2;
    const gameSymbols = symbols.slice(0, pairsCount);
    
    let id = 0;
    gameSymbols.forEach(symbol => {
      // Adicionar cada símbolo duas vezes (para formar pares)
      cards.push({ id: id++, symbol, flipped: false, matched: false });
      cards.push({ id: id++, symbol, flipped: false, matched: false });
    });
    
    // Embaralhar cartas
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    // Criar estrutura do jogo
    const gameId = uuidv4();
    const newGame: MemoryGame = {
      id: gameId,
      createdAt: new Date().toISOString(),
      creatorId,
      creatorNickname,
      rows,
      cols,
      status: 'waiting',
      players: [{ id: creatorId, nickname: creatorNickname, score: 0 }],
      cards,
      currentTurn: creatorId
    };
    
    // Salvar no Supabase
    const { data, error } = await supabase
      .from('memory_games')
      .insert(newGame)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao salvar jogo: ${error.message}`);
    
    console.log(`Jogo criado com sucesso no servidor: ${gameId}`);
    
    // Atualizar cache
    gamesCache.set(gameId, newGame);
    
    // Publicar evento de novo jogo
    publishGameUpdate({
      type: 'game_created',
      gameId,
      game: newGame
    });
    
    return newGame;
  } catch (error) {
    console.error('Erro ao criar jogo da memória:', error);
    throw new Error('Falha ao criar jogo da memória');
  }
};

/**
 * Busca um jogo específico
 */
export const getMemoryGame = async (gameId: string): Promise<MemoryGame> => {
  // Verificar cache primeiro
  if (gamesCache.has(gameId)) {
    console.log(`Jogo encontrado no cache local`);
    return gamesCache.get(gameId)!;
  }
  
  try {
    console.log(`Buscando jogo com ID: ${gameId}`);
    
    // Buscar no Supabase
    const { data, error } = await supabase
      .from('memory_games')
      .select('*')
      .eq('id', gameId)
      .single();
      
    if (error) throw new Error(`Erro ao buscar jogo: ${error.message}`);
    if (!data) throw new Error('Jogo não encontrado');
    
    // Atualizar cache
    gamesCache.set(gameId, data);
    
    return data;
  } catch (error) {
    console.error(`Erro ao buscar jogo ${gameId}:`, error);
    throw new Error('Falha ao buscar jogo do servidor');
  }
};

/**
 * Lista todos os jogos disponíveis
 */
export const listAvailableMemoryGames = async (): Promise<MemoryGame[]> => {
  try {
    const { data, error } = await supabase
      .from('memory_games')
      .select('*')
      .eq('status', 'waiting')
      .order('createdAt', { ascending: false });
      
    if (error) throw new Error(`Erro ao listar jogos: ${error.message}`);
    
    // Atualizar cache
    data.forEach(game => gamesCache.set(game.id, game));
    
    return data;
  } catch (error) {
    console.error('Erro ao listar jogos disponíveis:', error);
    return [];
  }
};

/**
 * Entra em um jogo existente
 */
export const joinMemoryGame = async (gameId: string, playerId: string, playerNickname: string): Promise<MemoryGame> => {
  try {
    const game = await getMemoryGame(gameId);
    
    // Verificar se já está no jogo
    if (game.players.some(p => p.id === playerId)) {
      return game;
    }
    
    // Verificar se o jogo está cheio
    if (game.status !== 'waiting') {
      throw new Error('Este jogo não está disponível');
    }
    
    // Adicionar jogador
    const updatedPlayers = [
      ...game.players,
      { id: playerId, nickname: playerNickname, score: 0 }
    ];
    
    // Atualizar status se agora tiver 2 jogadores
    const newStatus = updatedPlayers.length >= 2 ? 'playing' : 'waiting';
    
    // Atualizar no Supabase
    const { data, error } = await supabase
      .from('memory_games')
      .update({ 
        players: updatedPlayers,
        status: newStatus 
      })
      .eq('id', gameId)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao entrar no jogo: ${error.message}`);
    
    // Atualizar cache
    gamesCache.set(gameId, data);
    
    // Publicar evento
    publishGameUpdate({
      type: 'player_joined',
      gameId,
      playerId,
      playerNickname,
      game: data
    });
    
    return data;
  } catch (error) {
    console.error(`Erro ao entrar no jogo ${gameId}:`, error);
    throw new Error('Falha ao entrar no jogo');
  }
};

/**
 * Publica uma atualização de jogo via Redis
 */
export const publishGameUpdate = async (update: any) => {
  try {
    await redis.publish(MEMORY_GAME_CHANNEL, JSON.stringify(update));
  } catch (error) {
    console.error('Erro ao publicar atualização:', error);
  }
};

/**
 * Assina atualizações de jogos via Redis (lado servidor)
 */
export const subscribeToGameUpdates = (callback: (message: any) => void) => {
  const subscriber = redis.duplicate();
  
  subscriber.subscribe(MEMORY_GAME_CHANNEL, (err) => {
    if (err) {
      console.error('Erro ao assinar canal de jogos:', err);
      return;
    }
  });
  
  subscriber.on('message', (channel, message) => {
    if (channel === MEMORY_GAME_CHANNEL) {
      try {
        const update = JSON.parse(message);
        callback(update);
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    }
  });
  
  return () => {
    subscriber.unsubscribe(MEMORY_GAME_CHANNEL);
    subscriber.quit();
  };
};

/**
 * Solicita revanche em um jogo
 */
export const requestMemoryRematch = async (gameId: string, playerId: string): Promise<void> => {
  try {
    publishGameUpdate({
      type: 'rematch_requested',
      gameId,
      playerId
    });
  } catch (error) {
    console.error('Erro ao solicitar revanche:', error);
    throw new Error('Falha ao solicitar revanche');
  }
};

/**
 * Aceita revanche em um jogo
 */
export const flipCard = async (gameId: string, playerId: string, cardId: number): Promise<MemoryGame> => {
  const FLIP_DURATION = 1500; // 1.5 seconds for card display

  try {
    const game = await getMemoryGame(gameId);
    
    if (game.currentTurn !== playerId) {
      throw new Error('Não é seu turno');
    }

    // Add server-side timestamp for synchronization
    const serverTimestamp = new Date().toISOString();

    // Lock game state during update
    const updatedGame = await supabase
      .from('memory_game_sessions')
      .update({
        cards: game.cards.map(card => 
          card.id === cardId ? {...card, isFlipped: true, flippedAt: serverTimestamp} : card
        ),
        last_move_at: serverTimestamp
      })
      .eq('id', gameId)
      .select()
      .single();

    // Broadcast update through realtime channel
    supabase.channel('memory-game')
      .send({
        type: 'broadcast',
        event: 'card-flipped',
        payload: { gameId, cardId, playerId, serverTimestamp }
      });

    return updatedGame.data as MemoryGame;
    const { data, error } = await supabase.rpc('atomic_turn_transition', {
      game_id: gameId,
      new_player_id: game.players.find(p => p.id !== playerId)?.id
    });

    if (error) throw new Error(`Falha na transição de turno: ${error.message}`);

    // Publicar atualização com timestamp
    publishGameUpdate({
      type: 'card_flipped',
      gameId,
      cardId,
      playerId,
      timestamp: Date.now()
    });

    // Forçar sincronização imediata via Socket.IO
    redis.publish(MEMORY_GAME_CHANNEL, JSON.stringify({
      type: 'game_sync',
      gameId,
      game: updatedGame
    }));

    return data;
  } catch (error) {
    console.error('Erro ao virar carta:', error);
    throw new Error('Falha ao processar movimento');
  }
};

export const acceptMemoryRematch = async (gameId: string, playerId: string): Promise<MemoryGame> => {
  try {
    const oldGame = await getMemoryGame(gameId);
    
    // Criar novo jogo com os mesmos jogadores
    const newGame: MemoryGame = {
      ...oldGame,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: 'playing',
      players: oldGame.players.map(p => ({ ...p, score: 0 })),
      currentTurn: oldGame.players[0].id,
      winner: undefined
    };
    
    // Gerar novas cartas
    const symbols = '🍎,🍌,🍒,🍓,🍊,🍋,🍍,🥝,🍇,🍉,🥭,🍑,🥥,🥑,🌽,🥕'.split(',');
    const cards: Card[] = [];
    
    const pairsCount = (oldGame.rows * oldGame.cols) / 2;
    const gameSymbols = symbols.slice(0, pairsCount);
    
    let id = 0;
    gameSymbols.forEach(symbol => {
      cards.push({ id: id++, symbol, flipped: false, matched: false });
      cards.push({ id: id++, symbol, flipped: false, matched: false });
    });
    
    // Embaralhar cartas
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    newGame.cards = cards;
    
    // Salvar no Supabase
    const { data, error } = await supabase
      .from('memory_games')
      .insert(newGame)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao criar revanche: ${error.message}`);
    
    // Atualizar cache
    gamesCache.set(newGame.id, newGame);
    
    // Publicar evento
    publishGameUpdate({
      type: 'rematch_accepted',
      oldGameId: gameId,
      newGameId: newGame.id,
      acceptedBy: playerId,
      game: newGame
    });
    
    return newGame;
  } catch (error) {
    console.error('Erro ao aceitar revanche:', error);
    throw new Error('Falha ao iniciar revanche');
  }
};