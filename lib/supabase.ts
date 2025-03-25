import { createClient } from '@supabase/supabase-js';
import { generateUUID } from './utils';

// Usar variáveis de ambiente para configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Verifique seu arquivo .env.local');
}

// Criar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Armazenamento local temporário para jogos simulados (contorna problema de RLS)
// Substituindo por uma versão persistente usando localStorage
const LOCAL_STORAGE_KEY = 'memory_games_data';

// Função para salvar jogos no localStorage
const saveGamesToLocalStorage = (games: Record<string, MemoryGameSession>) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
    } catch (error) {
      console.error('Erro ao salvar jogos no localStorage:', error);
    }
  }
};

// Função para carregar jogos do localStorage
const loadGamesFromLocalStorage = (): Record<string, MemoryGameSession> => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao carregar jogos do localStorage:', error);
      return {};
    }
  }
  return {};
};

// Inicializar o armazenamento local com os dados do localStorage
let localMemoryGames: Record<string, MemoryGameSession> = loadGamesFromLocalStorage();

// Sincronizar jogos entre abas/janelas usando BroadcastChannel API
let broadcastChannel: BroadcastChannel | null = null;

// Configurar canal de comunicação entre abas/janelas se suportado pelo navegador
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('memory_games_sync');
    
    // Receber atualizações de outras abas/janelas
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_GAMES') {
        localMemoryGames = { ...localMemoryGames, ...event.data.games };
        saveGamesToLocalStorage(localMemoryGames);
        console.log('Jogos sincronizados de outra aba/janela');
      }
    };
  } catch (error) {
    console.error('Erro ao configurar BroadcastChannel:', error);
    // Continuar sem BroadcastChannel
    broadcastChannel = null;
  }
}

// Função para sincronizar jogos com outras abas/janelas
const syncGamesWithOtherTabs = (games: Record<string, MemoryGameSession>) => {
  if (!broadcastChannel) return; // Evitar erro se broadcastChannel não estiver disponível
  
  try {
    broadcastChannel.postMessage({
      type: 'SYNC_GAMES',
      games
    });
  } catch (error) {
    console.error('Erro ao sincronizar jogos com outras abas:', error);
    // Se ocorrer erro, desativa o broadcast para evitar erros futuros
    broadcastChannel = null;
  }
};

// Função para atualizar o armazenamento local
const updateLocalGame = (gameId: string, game: MemoryGameSession) => {
  localMemoryGames[gameId] = game;
  saveGamesToLocalStorage(localMemoryGames);
  syncGamesWithOtherTabs({ [gameId]: game });
};

// Tipos
export interface Player {
  id: string;
  nickname: string;
}

export interface GameSession {
  id: string;
  created_at: string;
  last_move_at: string;
  current_player_id: string;
  player_x_id: string;
  player_x_nickname: string;
  player_o_id: string | null;
  player_o_nickname: string | null;
  winner_id: string | null;
  board: string[];
  status: 'waiting' | 'playing' | 'finished';
  rematch_requested_by: string | null;
  rematch_game_id: string | null;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  isReady?: boolean;
}

export interface MemoryCard {
  id: number;
  iconName: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryMatch {
  cardIds: number[];
  playerId: string;
}

export interface MemoryGameSession {
  id: string;
  created_at: string;
  last_move_at: string;
  current_player_id: string;
  player_1_id: string;
  player_1_nickname: string;
  player_2_id: string | null;
  player_2_nickname: string | null;
  cards: MemoryCard[];
  matches: MemoryMatch[];
  player_1_matches: number;
  player_2_matches: number;
  winner_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  grid_config: { rows: number; cols: number };
  rematch_requested_by: string | null;
  rematch_game_id: string | null;
  rematch_accepted?: boolean;
  reset_pending?: boolean;
  cards_to_reset?: number[];
  reset_scheduled_at?: string;
  last_reset?: string;
}

// Função para criar uma nova sessão de jogo
export async function createGameSession(player: Player): Promise<GameSession | null> {
  try {
    console.log(`Criando nova sessão de jogo para o jogador: ${player.nickname} (${player.id})`);
    
    // Criar um tabuleiro vazio (9 células vazias)
    const emptyBoard = Array(9).fill('');
    
    // Resetar estados de cartas
    const flippedCards: number[] = [];
    const matchedCards: number[] = [];
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        current_player_id: player.id,
        player_x_id: player.id,
        player_x_nickname: player.nickname,
        board: emptyBoard,
        status: 'waiting'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar sessão de jogo:', error.message);
      return null;
    }
    
    if (!data) {
      console.error('Nenhum dado retornado ao criar sessão de jogo');
      return null;
    }
    
    console.log('Sessão de jogo criada com sucesso:', data.id);
    return data as GameSession;
  } catch (error) {
    console.error('Erro inesperado ao criar sessão de jogo:', error);
    return null;
  }
}

// Função para obter uma sessão de jogo pelo ID
export async function getGameById(gameId: string): Promise<GameSession | null> {
  try {
    console.log(`Buscando jogo com ID: ${gameId}`);
    
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (error) {
      console.error(`Erro ao buscar jogo ${gameId}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`Jogo com ID ${gameId} não encontrado`);
      return null;
    }
    
    console.log(`Jogo ${gameId} encontrado`);
    return data as GameSession;
  } catch (error) {
    console.error(`Erro inesperado ao buscar jogo ${gameId}:`, error);
    return null;
  }
}

// Função para obter jogos disponíveis
export async function getAvailableGames(): Promise<GameSession[]> {
  try {
    console.log('Buscando jogos disponíveis...');
    
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar jogos disponíveis:', error.message);
      return [];
    }
    
    console.log(`Encontrados ${data?.length || 0} jogos disponíveis`);
    return data as GameSession[] || [];
  } catch (error) {
    console.error('Erro inesperado ao buscar jogos disponíveis:', error);
    return [];
  }
}

// Função para entrar em uma sessão de jogo
export async function joinGameSession(gameId: string, player: Player): Promise<boolean> {
  try {
    console.log(`Jogador ${player.nickname} (${player.id}) tentando entrar no jogo ${gameId}`);
    
    // Primeiro, verificar se o jogo existe e está disponível
    const game = await getGameById(gameId);
    
    if (!game) {
      console.error(`Jogo ${gameId} não encontrado`);
      return false;
    }
    
    if (game.status !== 'waiting') {
      console.error(`Jogo ${gameId} não está disponível (status: ${game.status})`);
      return false;
    }
    
    // Verificar se o jogador já é o jogador X
    if (game.player_x_id === player.id) {
      console.error(`Jogador ${player.id} já é o jogador X neste jogo`);
      return false;
    }
    
    const { error } = await supabase
      .from('game_sessions')
      .update({
        player_o_id: player.id,
        player_o_nickname: player.nickname,
        status: 'playing'
      })
      .eq('id', gameId)
      .eq('status', 'waiting'); // Garantir que o jogo ainda está disponível
    
    if (error) {
      console.error(`Erro ao entrar no jogo ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Jogador ${player.nickname} entrou com sucesso no jogo ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao entrar no jogo ${gameId}:`, error);
    return false;
  }
}

// Função para fazer uma jogada
export const makeMove = async (gameId: string, playerId: string, position: number): Promise<boolean> => {
  try {
    console.log(`Jogador ${playerId} tentando fazer jogada na posição ${position} no jogo ${gameId}`);
    
    // Obter o estado atual do jogo
    const game = await getGameById(gameId);
    
    if (!game) {
      console.error(`Jogo ${gameId} não encontrado`);
      return false;
    }
    
    // Verificar se é a vez do jogador
    if (game.current_player_id !== playerId) {
      console.error(`Não é a vez do jogador ${playerId}`);
      return false;
    }
    
    // Verificar se o jogo está em andamento
    if (game.status !== 'playing') {
      console.error(`Jogo ${gameId} não está em andamento (status: ${game.status})`);
      return false;
    }
    
    // Verificar se a posição é válida
    if (position < 0 || position >= 9) {
      console.error(`Posição ${position} inválida`);
      return false;
    }
    
    // Verificar se a posição está vazia
    if (game.board[position] !== '') {
      console.error(`Posição ${position} já está ocupada`);
      return false;
    }
    
    // Determinar o símbolo do jogador
    const symbol = playerId === game.player_x_id ? 'X' : 'O';
    
    // Criar uma cópia do tabuleiro e atualizar
    const newBoard = [...game.board];
    newBoard[position] = symbol;
    
    // Verificar se o jogador venceu
    const hasWon = checkWinner(newBoard, symbol);
    
    // Verificar se é empate (se o tabuleiro está cheio)
    const isDraw = !hasWon && newBoard.every(cell => cell !== '');
    
    // Determinar o próximo jogador
    const nextPlayerId = playerId === game.player_x_id 
      ? game.player_o_id 
      : game.player_x_id;
    
    // Determinar o novo status do jogo
    let newStatus = 'playing';
    let winnerId = null;
    
    if (hasWon) {
      newStatus = 'finished';
      winnerId = playerId;
      console.log(`Jogador ${playerId} venceu o jogo ${gameId}`);
    } else if (isDraw) {
      newStatus = 'finished';
      console.log(`Jogo ${gameId} terminou em empate`);
    }
    
    // Atualizar o jogo no banco de dados
    try {
      // Primeiro, verificamos se o jogador atual ainda é o mesmo (evita condições de corrida)
      const { data: currentGame, error: checkError } = await supabase
        .from('game_sessions')
        .select('current_player_id, status')
        .eq('id', gameId)
        .single();
      
      if (checkError) {
        console.error(`Erro ao verificar estado atual do jogo ${gameId}:`, checkError.message);
        return false;
      }
      
      // Se o estado do jogo mudou (outro jogador já fez uma jogada ou o jogo terminou)
      if (currentGame.current_player_id !== playerId || currentGame.status !== 'playing') {
        console.error(`Estado do jogo mudou. Não é mais a vez do jogador ${playerId}`);
        return false;
      }
      
      // Agora fazemos a atualização
      const { error } = await supabase
        .from('game_sessions')
        .update({
          board: newBoard,
          current_player_id: nextPlayerId,
          status: newStatus,
          winner_id: winnerId,
          last_move_at: new Date().toISOString()
        })
        .eq('id', gameId);
        
      if (error) {
        console.error(`Erro ao atualizar jogo ${gameId}:`, error.message);
        return false;
      }
        
      console.log(`Jogada realizada com sucesso no jogo ${gameId}`);
      return true;
    } catch (error) {
      console.error(`Erro inesperado ao fazer jogada no jogo ${gameId}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Erro inesperado ao fazer jogada no jogo ${gameId}:`, error);
    return false;
  }
}

// Função para verificar se um jogador venceu
function checkWinner(board: string[], symbol: string): boolean {
  // Combinações vencedoras (linhas, colunas e diagonais)
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
    [0, 4, 8], [2, 4, 6]             // Diagonais
  ];
  
  // Verificar se alguma combinação vencedora está completa
  return winningCombinations.some(combination => {
    return combination.every(index => board[index] === symbol);
  });
}

// Função para assinar atualizações em tempo real de um jogo
export function subscribeToGame(gameId: string, callback: (game: GameSession) => void) {
  console.log(`Assinando atualizações para o jogo ${gameId}`);
  
  const channel = supabase
    .channel(`game_${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log(`Recebida atualização para o jogo ${gameId}:`, payload);
        
        // Verificar se a atualização inclui campos relacionados à revanche
        const newData = payload.new as GameSession;
        if (newData.rematch_requested_by !== undefined || newData.rematch_game_id !== undefined) {
          console.log("Atualização inclui dados de revanche:", {
            rematch_requested_by: newData.rematch_requested_by,
            rematch_game_id: newData.rematch_game_id
          });
        }
        
        callback(newData);
      }
    )
    .subscribe((status) => {
      console.log(`Status da inscrição para o jogo ${gameId}:`, status);
    });
  
  // Retornar a função para cancelar a assinatura
  return () => {
    console.log(`Cancelando assinatura para o jogo ${gameId}`);
    supabase.removeChannel(channel);
  };
}

// Função para solicitar uma revanche
export async function requestRematch(gameId: string, playerId: string): Promise<boolean> {
  try {
    console.log(`Jogador ${playerId} solicitando revanche para o jogo ${gameId}`);
    
    // Verificar se o jogo existe e está finalizado
    const game = await getGameById(gameId);
    
    if (!game) {
      console.error(`Jogo ${gameId} não encontrado`);
      return false;
    }
    
    // Verificar se o jogador é um dos participantes do jogo
    if (playerId !== game.player_x_id && playerId !== game.player_o_id) {
      console.error(`Jogador ${playerId} não é participante do jogo ${gameId}`);
      return false;
    }
    
    // Verificar se já existe um jogo de revanche
    if (game.rematch_game_id) {
      console.log(`Jogo de revanche já existe: ${game.rematch_game_id}`);
      
      // Atualizar para garantir que o campo rematch_accepted está definido
      const { error: updateError } = await supabase
        .from('memory_game_sessions')
        .update({ 
          rematch_accepted: true,
          rematch_requested_by: null  // Limpar o solicitante para não ficar bloqueado no modal
        })
        .eq('id', gameId);
      
      if (updateError) {
        console.warn('Erro ao atualizar status de revanche aceita:', updateError);
      }
      
      // Sempre enviar broadcast de revanche aceita
      try {
        const channel = supabase.channel('memory-game');
        // Enviar broadcast específico de revanche
        await channel.send({
          type: 'broadcast',
          event: 'rematch_accepted',
          payload: {
            original_game_id: gameId,
            new_game_id: game.rematch_game_id,
            timestamp: new Date().toISOString()
          }
        });
        console.log('Broadcast de revanche existente enviado');
        
        // Enviar um segundo broadcast como backup
        setTimeout(async () => {
          try {
            await channel.send({
              type: 'broadcast',
              event: 'rematch_accepted',
              payload: {
                original_game_id: gameId,
                new_game_id: game.rematch_game_id,
                timestamp: new Date().toISOString(),
                is_retry: true
              }
            });
            console.log('Broadcast de revanche existente (retry) enviado');
          } catch (retryError) {
            console.warn('Erro ao enviar retry do broadcast:', retryError);
          }
        }, 1000); // Enviar um segundo depois como garantia
      } catch (error) {
        console.warn('Erro ao enviar broadcast de revanche existente:', error);
      }
      
      return {
        ...game,
        rematch_accepted: true,
        rematch_game_id: game.rematch_game_id
      };
    }
    
    // Atualizar o jogo para indicar que uma revanche foi solicitada
    const { error } = await supabase
      .from('game_sessions')
      .update({
        rematch_requested_by: playerId
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao solicitar revanche para o jogo ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Revanche solicitada com sucesso para o jogo ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao solicitar revanche para o jogo ${gameId}:`, error);
    return false;
  }
}

// Função para aceitar uma revanche
export async function acceptRematch(gameId: string, playerId: string): Promise<string | null> {
  try {
    console.log(`Jogador ${playerId} aceitando revanche para o jogo ${gameId}`);
    
    // Verificar se o jogo existe e tem uma solicitação de revanche
    const game = await getGameById(gameId);
    
    if (!game) {
      console.error(`Jogo ${gameId} não encontrado`);
      return null;
    }
    
    // Verificar se o jogador é um dos participantes do jogo
    if (playerId !== game.player_x_id && playerId !== game.player_o_id) {
      console.error(`Jogador ${playerId} não é participante do jogo ${gameId}`);
      return null;
    }
    
    // Verificar se o jogador não é quem solicitou a revanche
    if (playerId === game.rematch_requested_by) {
      console.error(`Jogador ${playerId} não pode aceitar sua própria solicitação de revanche`);
      return null;
    }
    
    // Criar um novo jogo com os jogadores invertidos
    const requestingPlayer = game.rematch_requested_by === game.player_x_id
      ? { id: game.player_x_id, nickname: game.player_x_nickname }
      : { id: game.player_o_id!, nickname: game.player_o_nickname! };

    const acceptingPlayer = playerId === game.player_x_id
      ? { id: game.player_x_id, nickname: game.player_x_nickname }
      : { id: game.player_o_id!, nickname: game.player_o_nickname! };
    
    // Criar um tabuleiro vazio
    const emptyBoard = Array(9).fill('');
    
    // Inserir o novo jogo
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        // Inverter os jogadores X e O
        player_x_id: game.rematch_requested_by === game.player_x_id ? game.player_o_id : game.player_x_id,
        player_x_nickname: game.rematch_requested_by === game.player_x_id ? game.player_o_nickname : game.player_x_nickname,
        player_o_id: game.rematch_requested_by,
        player_o_nickname: game.rematch_requested_by === game.player_x_id ? game.player_x_nickname : game.player_o_nickname,
        current_player_id: game.rematch_requested_by === game.player_x_id ? game.player_o_id : game.player_x_id,
        board: emptyBoard,
        status: 'playing'
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao criar jogo de revanche:`, error.message);
      return null;
    }
    
    if (!data) {
      console.error('Nenhum dado retornado ao criar jogo de revanche');
      return null;
    }
    
    // Atualizar o jogo original com o ID do jogo de revanche
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        rematch_game_id: data.id
      })
      .eq('id', gameId);
    
    if (updateError) {
      console.error(`Erro ao atualizar jogo original ${gameId}:`, updateError.message);
      // Não retornar null aqui, pois o jogo de revanche já foi criado
    }
    
    console.log(`Revanche aceita com sucesso. Novo jogo criado: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error(`Erro inesperado ao aceitar revanche para o jogo ${gameId}:`, error);
    return null;
  }
}

// Função para recusar uma revanche
export async function declineRematch(gameId: string): Promise<boolean> {
  try {
    console.log(`Recusando revanche para o jogo ${gameId}`);
    
    // Atualizar o jogo para limpar a solicitação de revanche
    const { error } = await supabase
      .from('game_sessions')
      .update({
        rematch_requested_by: null
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao recusar revanche para o jogo ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Revanche recusada com sucesso para o jogo ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao recusar revanche para o jogo ${gameId}:`, error);
    return false;
  }
}

// Função para criar uma nova sessão de jogo da memória
export const createMemoryGame = async (
  playerId: string,
  playerNickname: string,
  gridConfig: { rows: number; cols: number } = { rows: 4, cols: 4 }
): Promise<MemoryGameSession | null> => {
  try {
    console.log('Iniciando criação de jogo da memória com configuração:', gridConfig);
    
    // Cria um array de cartas baseado no tamanho do grid
    const totalPairs = (gridConfig.rows * gridConfig.cols) / 2;
    
    // Modelo de carta inicial (sem estado)
    const initialCards: MemoryCard[] = Array.from({ length: gridConfig.rows * gridConfig.cols }, (_, index) => ({
      id: index,
      iconName: '', // Será preenchido pelo jogo após iniciar
      color: '',    // Será preenchido pelo jogo após iniciar
      isFlipped: false,
      isMatched: false
    }));

    // Primeiro tentamos criar no Supabase (para compatibilidade entre dispositivos)
    try {
      console.log('Tentando criar jogo no Supabase...');
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .insert({
          player_1_id: playerId,
          player_1_nickname: playerNickname,
          current_player_id: playerId,
          status: 'waiting',
          player_1_matches: 0,
          player_2_matches: 0,
          cards: initialCards,
          matches: [],
          grid_config: gridConfig
        })
        .select()
        .single();

      if (error) {
        console.warn('Erro ao criar jogo no Supabase (usando fallback local):', error);
        // Se falhar, continuaremos com a versão local
      } else if (data) {
        console.log('Jogo criado com sucesso no Supabase:', data.id);
        return data as MemoryGameSession;
      }
    } catch (supabaseError) {
      console.warn('Exceção ao criar jogo no Supabase (usando fallback local):', supabaseError);
      // Continua para o fallback local em caso de exceção
    }

    // Fallback: Solução utilizando localStorage para persistência
    const gameId = generateUUID();
    const mockGameSession: MemoryGameSession = {
      id: gameId,
      created_at: new Date().toISOString(),
      last_move_at: new Date().toISOString(),
      current_player_id: playerId,
      player_1_id: playerId,
      player_1_nickname: playerNickname,
      player_2_id: null,
      player_2_nickname: null,
      cards: initialCards,
      matches: [],
      player_1_matches: 0,
      player_2_matches: 0,
      winner_id: null,
      status: 'waiting',
      grid_config: gridConfig,
      rematch_requested_by: null,
      rematch_game_id: null
    };

    console.log('Criando jogo localmente com persistência em localStorage');
    
    // Atualizar o registro de jogos locais
    updateLocalGame(gameId, mockGameSession);
    
    return mockGameSession;
  } catch (error) {
    console.error('Erro inesperado ao criar jogo da memória:', error);
    return null;
  }
};

// Função para obter uma sessão de jogo da memória específica
export const getMemoryGame = async (gameId: string): Promise<MemoryGameSession | null> => {
  try {
    console.log(`Buscando jogo com ID: ${gameId}`);
    
    // Primeiro, tentamos buscar do Supabase para garantir dados mais atualizados
    try {
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        console.warn(`Erro ao buscar jogo ${gameId} do Supabase (verificando localStorage):`, error);
      } else if (data) {
        console.log('Jogo encontrado no Supabase');
        
        // Se o jogo for encontrado no Supabase, atualiza o localStorage para sincronização
        if (typeof window !== 'undefined') {
          updateLocalGame(gameId, data as MemoryGameSession);
        }
        
        return data as MemoryGameSession;
      }
    } catch (supabaseError) {
      console.warn(`Exceção ao buscar jogo ${gameId} do Supabase:`, supabaseError);
    }
    
    // Fallback: Verificar no localStorage
    // Recarregar do localStorage para garantir dados mais recentes
    localMemoryGames = loadGamesFromLocalStorage();
    
    if (localMemoryGames[gameId]) {
      console.log('Jogo encontrado no armazenamento local');
      return localMemoryGames[gameId];
    }
    
    console.log(`Jogo ${gameId} não encontrado em nenhuma fonte de dados`);
    return null;
  } catch (error) {
    console.error('Erro inesperado ao buscar jogo da memória:', error);
    return null;
  }
};

// Função para obter jogos da memória disponíveis para entrar
export const getAvailableMemoryGames = async (): Promise<MemoryGameSession[]> => {
  try {
    console.log('Buscando jogos disponíveis...');
    
    let allGames: MemoryGameSession[] = [];
    
    // Primeiro tentamos buscar jogos do Supabase
    try {
      console.log('Tentando buscar jogos disponíveis do Supabase...');
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .select('*')
        .eq('status', 'waiting')
        .is('player_2_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar jogos do Supabase (verificando localStorage):', error);
      } else if (data && data.length > 0) {
        console.log(`Encontrados ${data.length} jogos no Supabase`);
        allGames = [...data as MemoryGameSession[]];
        
        // Atualiza o localStorage com os jogos do Supabase para sincronização
        if (typeof window !== 'undefined') {
          const gamesMap: Record<string, MemoryGameSession> = {};
          data.forEach(game => {
            gamesMap[game.id] = game as MemoryGameSession;
          });
          
          // Sincronizar com o localStorage
          Object.entries(gamesMap).forEach(([id, game]) => {
            updateLocalGame(id, game);
          });
        }
      }
    } catch (supabaseError) {
      console.warn('Exceção ao buscar jogos do Supabase:', supabaseError);
    }
    
    // Em seguida, obter jogos locais que não estão no Supabase
    // Recarregar do localStorage para garantir dados mais recentes
    localMemoryGames = loadGamesFromLocalStorage();
    
    // Filtrar jogos locais disponíveis que não estejam já na lista do Supabase
    const supabaseGameIds = new Set(allGames.map(game => game.id));
    const localOnlyGames = Object.values(localMemoryGames).filter(
      game => game.status === 'waiting' && 
             game.player_2_id === null && 
             !supabaseGameIds.has(game.id)
    );
    
    if (localOnlyGames.length > 0) {
      console.log(`Encontrados ${localOnlyGames.length} jogos adicionais no localStorage`);
      allGames = [...allGames, ...localOnlyGames];
    }
    
    // Ordenar todos os jogos por data de criação (mais recentes primeiro)
    allGames.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return allGames;
  } catch (error) {
    console.error('Erro inesperado ao buscar jogos da memória:', error);
    return [];
  }
};

// Função para entrar em uma sessão de jogo da memória existente
export const joinMemoryGame = async (
  gameId: string,
  playerId: string,
  playerNickname: string
): Promise<MemoryGameSession | null> => {
  try {
    console.log(`Tentando entrar no jogo ${gameId} com jogador ${playerNickname}`);
    
    // Primeiro buscar o jogo para ver onde ele está armazenado
    const existingGame = await getMemoryGame(gameId);
    if (!existingGame) {
      console.error('Jogo não encontrado');
      return null;
    }
    
    // Verificar se o jogo está em espera
    if (existingGame.status !== 'waiting') {
      console.error('Este jogo não está aceitando novos jogadores');
      return existingGame;
    }
    
    // Verificar se o jogador é diferente do jogador 1
    if (existingGame.player_1_id === playerId) {
      console.error('Você já está neste jogo como Jogador 1');
      return existingGame;
    }
    
    // Dados atualizados para o jogo
    const updatedGameData = {
      player_2_id: playerId,
      player_2_nickname: playerNickname,
      status: 'playing' as 'waiting' | 'playing' | 'finished'
    };
    
    // Tentar atualizar no Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .update(updatedGameData)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.warn(`Erro ao atualizar jogo ${gameId} no Supabase (usando fallback local):`, error);
      } else if (data) {
        console.log('Jogo atualizado com sucesso no Supabase');
        
        // Atualizar também no localStorage para sincronização
        if (typeof window !== 'undefined') {
          updateLocalGame(gameId, data as MemoryGameSession);
        }
        
        // Verificar se ambos os jogadores já estão presentes
        const updatedGame = await getMemoryGame(gameId);
        
        // Se ambos jogadores estão presentes, iniciar o jogo automaticamente
        if (
          updatedGame && 
          updatedGame.player_1_id && 
          updatedGame.player_2_id && 
          updatedGame.status === 'waiting'
        ) {
          console.log('Dois jogadores presentes, iniciando o jogo automaticamente');
          return startMemoryGame(gameId);
        }
        
        return data as MemoryGameSession;
      }
    } catch (supabaseError) {
      console.warn(`Exceção ao atualizar jogo ${gameId} no Supabase:`, supabaseError);
    }
    
    // Fallback: Atualizar localmente se o Supabase falhar
    const updatedGame: MemoryGameSession = {
      ...existingGame,
      ...updatedGameData
    };
    
    // Salvar no localStorage e sincronizar
    updateLocalGame(gameId, updatedGame);
    
    // Verificar se ambos os jogadores já estão presentes
    const updatedGameAfterLocal = await getMemoryGame(gameId);
    
    // Se ambos jogadores estão presentes, iniciar o jogo automaticamente
    if (
      updatedGameAfterLocal && 
      updatedGameAfterLocal.player_1_id && 
      updatedGameAfterLocal.player_2_id && 
      updatedGameAfterLocal.status === 'waiting'
    ) {
      console.log('Dois jogadores presentes, iniciando o jogo automaticamente');
      return startMemoryGame(gameId);
    }
    
    console.log('Jogador entrou com sucesso no jogo local');
    return updatedGame;
  } catch (error) {
    console.error('Erro ao entrar no jogo da memória:', error);
    return null;
  }
};

// Função para verificar se um jogo da memória existe
export const checkMemoryGameExists = async (gameId: string): Promise<boolean> => {
  try {
    console.log(`Verificando existência do jogo: ${gameId}`);
    
    // Primeiro verificar no Supabase
    try {
      const { data, error, count } = await supabase
        .from('memory_game_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('id', gameId);

      if (error) {
        console.warn(`Erro ao verificar jogo ${gameId} no Supabase (verificando localStorage):`, error);
      } else if (count && count > 0) {
        console.log('Jogo encontrado no Supabase');
        return true;
      }
    } catch (supabaseError) {
      console.warn(`Exceção ao verificar jogo ${gameId} no Supabase:`, supabaseError);
    }
    
    // Fallback: Verificar no armazenamento local
    // Recarregar do localStorage para garantir dados mais recentes
    localMemoryGames = loadGamesFromLocalStorage();
    
    if (localMemoryGames[gameId]) {
      console.log('Jogo encontrado no armazenamento local');
      return true;
    }
    
    console.log(`Jogo ${gameId} não encontrado em nenhuma fonte de dados`);
    return false;
  } catch (error) {
    console.error('Erro inesperado ao verificar jogo da memória:', error);
    return false;
  }
};

// Inscreve-se para atualizações em tempo real de um jogo da memória
export const subscribeToMemoryGame = (
  gameId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`memory_game_${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'memory_game_sessions',
        filter: `id=eq.${gameId}`,
      },
      callback
    )
    .subscribe();
};

// Limpa a inscrição a um canal do Supabase
export const unsubscribeFromChannel = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

// Função para fazer uma jogada no jogo da memória
export const flipMemoryCard = async (
  gameId: string,
  playerId: string,
  cardIndex: number
): Promise<MemoryGameSession> => {
  try {
    console.log(`Virando carta ${cardIndex} no jogo ${gameId} pelo jogador ${playerId}`);
    
    // Buscar o jogo para obter o estado mais atual
    const game = await getMemoryGame(gameId);
    if (!game) {
      console.error('Jogo não encontrado');
      return {} as MemoryGameSession;
    }
    
    // Verifica se é a vez do jogador atual
    if (game.current_player_id !== playerId) {
      console.error(`Não é a vez do jogador ${playerId}, é a vez de ${game.current_player_id}`);
      return game;
    }
    
    // Verifica se o jogo ainda está em andamento
    if (game.status !== 'playing') {
      console.error(`Jogo não está em andamento. Status atual: ${game.status}`);
      
      // Se o jogo estiver em 'waiting' e ambos os jogadores estiverem presentes, iniciar o jogo
      if (game.status === 'waiting' && game.player_1_id && game.player_2_id) {
        console.log('Tentando iniciar o jogo automaticamente...');
        try {
          game = await startMemoryGame(gameId);
          
          // Verificar novamente o status após a tentativa de iniciar
          if (game && game.status !== 'playing') {
            console.error(`Não foi possível iniciar o jogo. Permanece como: ${game.status}`);
            return game;
          }
          
          console.log('Jogo iniciado com sucesso:', game.id);
        } catch (startError) {
          console.error('Erro ao iniciar o jogo automaticamente:', startError);
          return game;
        }
      } else {
        return game;
      }
    }
    
    if (!game) {
      console.error('Jogo ainda é nulo após tentativa de inicialização');
      return {} as MemoryGameSession;
    }
    
    // Verifica se a carta é válida e não está já virada ou combinada
    if (!game.cards || cardIndex < 0 || cardIndex >= game.cards.length) {
      console.error(`Índice de carta inválido: ${cardIndex}`);
      return game;
    }
    
    const card = game.cards[cardIndex];
    if (!card) {
      console.error(`Carta não encontrada no índice ${cardIndex}`);
      return game;
    }
    
    if (card.isFlipped || card.isMatched) {
      console.log(`Carta ${cardIndex} já está virada ou combinada - clique ignorado`);
      return game;
    }
    
    // Atualiza o estado da carta para virada
    const updatedCards = [...game.cards];
    updatedCards[cardIndex] = {
      ...card,
      isFlipped: true
    };
    
    // Verificar se há cartas pendentes de reset e desvirá-las primeiro
    if (game.reset_pending && game.cards_to_reset && game.cards_to_reset.length > 0) {
      console.log(`Desvirando cartas pendentes antes da nova jogada: ${game.cards_to_reset.join(', ')}`);
      
      game.cards_to_reset.forEach(index => {
        if (index >= 0 && index < updatedCards.length) {
          updatedCards[index].isFlipped = false;
        }
      });
    }
    
    // Contar cartas já viradas antes desta (excluindo as já combinadas)
    // Importante: após desvirar as cartas pendentes de reset
    const alreadyFlippedCards = updatedCards
      .filter(c => c.isFlipped && !c.isMatched && c.id !== card.id);
    
    console.log(`Cartas já viradas: ${alreadyFlippedCards.length}, virando agora: ${cardIndex}`);
    
    // Verificar se já existem 2 cartas viradas (não combinadas)
    if (alreadyFlippedCards.length >= 2) {
      // Em vez de retornar erro, vamos desvirar todas as cartas não combinadas
      console.log(`Detectadas ${alreadyFlippedCards.length} cartas viradas. Desvirando automaticamente...`);
      
      updatedCards.forEach((c, idx) => {
        if (c.isFlipped && !c.isMatched) {
          updatedCards[idx].isFlipped = false;
        }
      });
      
      // Agora viramos a carta atual
      updatedCards[cardIndex].isFlipped = true;
      
      // Zerar o contador de cartas viradas após desvirar todas
      alreadyFlippedCards.length = 0;
    }
    
    // Prepara as atualizações para o jogo
    const updates: Partial<MemoryGameSession> = {
      cards: updatedCards,
      last_move_at: new Date().toISOString(),
      // Limpar o estado de reset pendente
      reset_pending: false,
      cards_to_reset: []
    };
    
    // Se já temos 1 carta virada (excluindo a atual), verificamos se são um par
    if (alreadyFlippedCards.length === 1) {
      const previousCard = alreadyFlippedCards[0];
      
      // Verificar se as cartas formam um par
      const isMatch = previousCard.iconName === card.iconName;
      console.log(`Verificando par: ${previousCard.iconName} e ${card.iconName} - Match: ${isMatch}`);
      
      if (isMatch) {
        // Se as cartas combinam (mesmo ícone)
        // Marcar as duas cartas como combinadas
        updatedCards[previousCard.id].isMatched = true;
        updatedCards[cardIndex].isMatched = true;
        
        // Adicionar a combinação na lista de matches
        const updatedMatches = [...(game.matches || []), {
          cardIds: [previousCard.id, cardIndex],
          playerId
        }];
        
        updates.matches = updatedMatches;
        
        // Atualizar a pontuação do jogador atual
        if (playerId === game.player_1_id) {
          updates.player_1_matches = (game.player_1_matches || 0) + 1;
        } else if (playerId === game.player_2_id) {
          updates.player_2_matches = (game.player_2_matches || 0) + 1;
        }
        
        // O jogador atual continua jogando quando acerta um par
        updates.current_player_id = playerId;
        
        // Verificar se o jogo terminou (todas as cartas combinadas)
        const allMatched = updatedCards.every(c => c.isMatched);
        if (allMatched) {
          updates.status = 'finished' as const;
          
          // Determinar o vencedor (quem tem mais pares)
          const player1Score = (game.player_1_matches || 0) + (playerId === game.player_1_id ? 1 : 0);
          const player2Score = (game.player_2_matches || 0) + (playerId === game.player_2_id ? 1 : 0);
          
          if (player1Score > player2Score) {
            updates.winner_id = game.player_1_id;
          } else if (player2Score > player1Score) {
            updates.winner_id = game.player_2_id;
          } else {
            updates.winner_id = null; // Empate
          }
        }
      } else {
        // As cartas não combinam, passar a vez para o outro jogador
        const nextPlayerId = (playerId === game.player_1_id && game.player_2_id) 
          ? game.player_2_id 
          : game.player_1_id;
        
        // Atualizar as cartas imediatamente, mas programar a desvirada
        updates.current_player_id = nextPlayerId;
        
        // Marcar que estas cartas precisam ser resetadas após um tempo
        updates.reset_pending = true;
        updates.cards_to_reset = [previousCard.id, cardIndex];
        updates.reset_scheduled_at = new Date().toISOString();
        
        console.log(`Par não encontrado, marcando cartas para reset e passando para: ${nextPlayerId}`);
      }
    } else {
      // Primeira carta sendo virada nesta jogada, manter o jogador atual
      updates.current_player_id = playerId;
    }
    
    // Tenta atualizar no Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.warn(`Erro ao atualizar jogo ${gameId} no Supabase (usando fallback local):`, error);
      } else if (data) {
        console.log('Movimento salvo com sucesso no Supabase');
        
        // Atualizar também no localStorage para sincronização
        if (typeof window !== 'undefined') {
          updateLocalGame(gameId, data as MemoryGameSession);
        }
        
        return data as MemoryGameSession;
      }
    } catch (supabaseError) {
      console.warn(`Exceção ao atualizar jogo ${gameId} no Supabase:`, supabaseError);
    }
    
    // Durante o jogo ativo, não fazer fallback local para evitar estados divergentes
    if (game.status === 'playing') {
      console.error('Não foi possível sincronizar movimento com o servidor durante o jogo ativo');
      return game;
    }
    
    // Fallback apenas para jogos não ativos
    const updatedGame: MemoryGameSession = {
      ...game,
      ...updates
    } as MemoryGameSession;
    updateLocalGame(gameId, updatedGame);

    // Enviar broadcast para garantir que ambos os jogadores recebam a atualização
    try {
      const channel = supabase.channel('memory-game');
      const broadcastPayload = {
        id: gameId,
        rematch_game_id: updatedGame.rematch_game_id,
        rematch_accepted: updatedGame.rematch_accepted,
        rematch_requested_by: null, // Limpar o solicitante quando aceito
        last_update: new Date().toISOString()
      };
      
      // Realizar dois broadcasts separados para garantir redundância
      await channel.send({
        type: 'broadcast',
        event: 'game_update',
        payload: broadcastPayload
      });
      
      // Enviar um broadcast específico de revanche para reforçar
      await channel.send({
        type: 'broadcast',
        event: 'rematch_accepted',
        payload: {
          original_game_id: gameId,
          new_game_id: updatedGame.rematch_game_id,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Broadcasts de jogo de revanche enviados com sucesso');
    } catch (broadcastError) {
      console.warn('Erro ao enviar broadcasts do jogo de revanche:', broadcastError);
    }
    
    return updatedGame;
  } catch (error) {
    console.error('Erro ao virar carta no jogo da memória:', error);
    // Recuperar o jogo mesmo em caso de erro para evitar estado indefinido
    const fallbackGame = await getMemoryGame(gameId);
    return fallbackGame || { 
      id: gameId,
      status: 'error' as any,
      current_player_id: playerId
    } as MemoryGameSession;
  }
};

// Solicita uma revanche no jogo da memória
export const requestMemoryRematch = async (
  gameId: string,
  playerId: string
): Promise<MemoryGameSession | null> => {
  try {
    console.log(`[REVANCHE] Solicitando revanche no jogo ${gameId} pelo jogador ${playerId}`);
    
    // Buscar o jogo para obter o estado mais atual
    const game = await getMemoryGame(gameId);
    if (!game) {
      console.error('[REVANCHE] Jogo não encontrado');
      return {} as MemoryGameSession;
    }
    
    // Verifica se o jogo terminou
    if (game.status !== 'finished') {
      console.error('[REVANCHE] O jogo ainda não terminou para solicitar revanche');
      return game;
    }
    
    // Verifica se o jogador faz parte do jogo
    if (playerId !== game.player_1_id && playerId !== game.player_2_id) {
      console.error('[REVANCHE] Jogador não pertence a este jogo');
      return game;
    }
    
    // Verificar se já existe um jogo de revanche
    if (game.rematch_game_id) {
      console.log(`[REVANCHE] Jogo de revanche já existe: ${game.rematch_game_id}`);
      
      // Atualizar para garantir que o campo rematch_accepted está definido
      const { error: updateError } = await supabase
        .from('memory_game_sessions')
        .update({ 
          rematch_accepted: true,
          rematch_requested_by: null  // Limpar o solicitante para não ficar bloqueado no modal
        })
        .eq('id', gameId);
      
      if (updateError) {
        console.warn('[REVANCHE] Erro ao atualizar status de revanche aceita:', updateError);
      }
      
      // Sempre enviar broadcast de revanche aceita
      try {
        const channel = supabase.channel('memory-game');
        // Enviar broadcast específico de revanche
        await channel.send({
          type: 'broadcast',
          event: 'rematch_accepted',
          payload: {
            original_game_id: gameId,
            new_game_id: game.rematch_game_id,
            timestamp: new Date().toISOString()
          }
        });
        console.log('[REVANCHE] Broadcast de revanche existente enviado');
        
        // Enviar um segundo broadcast como backup
        setTimeout(async () => {
          try {
            await channel.send({
              type: 'broadcast',
              event: 'rematch_accepted',
              payload: {
                original_game_id: gameId,
                new_game_id: game.rematch_game_id,
                timestamp: new Date().toISOString(),
                is_retry: true
              }
            });
            console.log('[REVANCHE] Broadcast de revanche existente (retry) enviado');
          } catch (retryError) {
            console.warn('[REVANCHE] Erro ao enviar retry do broadcast:', retryError);
          }
        }, 1000); // Enviar um segundo depois como garantia
      } catch (error) {
        console.warn('[REVANCHE] Erro ao enviar broadcast de revanche existente:', error);
      }
      
      console.log('[REVANCHE] Retornando jogo com ID de revanche existente:', game.rematch_game_id);
      return {
        ...game,
        rematch_accepted: true,
        rematch_game_id: game.rematch_game_id
      };
    }
    
    // Se já há uma solicitação de revanche, cria um novo jogo
    if (game && game.rematch_requested_by) {
      console.log('[REVANCHE] Processando solicitação de revanche...');
      
      // Cria um novo jogo com os jogadores trocados (1 vira 2 e vice-versa)
      const initialCards: MemoryCard[] = Array.from(
        { length: game.grid_config.rows * game.grid_config.cols }, 
        (_, index) => ({
          id: index,
          iconName: '', // Será preenchido pelo jogo após iniciar
          color: '',    // Será preenchido pelo jogo após iniciar
          isFlipped: false,
          isMatched: false
        })
      );
      
      // Determinar quem começa na revanche (quem perdeu ou, em caso de empate, o segundo jogador)
      let starterPlayerId = game.player_2_id;
      if (game.winner_id) {
        // O perdedor começa
        starterPlayerId = game.winner_id === game.player_1_id ? game.player_2_id : game.player_1_id;
      }
      
      // Dados para o novo jogo
      const newGameData = {
        player_1_id: game.player_2_id as string,
        player_1_nickname: game.player_2_nickname as string,
        player_2_id: game.player_1_id,
        player_2_nickname: game.player_1_nickname,
        current_player_id: starterPlayerId as string,
        cards: initialCards,
        matches: [],
        player_1_matches: 0,
        player_2_matches: 0,
        status: 'playing' as const,
        grid_config: game.grid_config,
        winner_id: null,
        rematch_requested_by: null,
        rematch_game_id: null
      };
      
      // Tenta criar o novo jogo no Supabase
      let newGameId: string;
      try {
        const { data: newGame, error: createError } = await supabase
          .from('memory_game_sessions')
          .insert([newGameData])
          .select()
          .single();
        
        if (createError) {
          console.warn('[REVANCHE] Erro ao criar revanche no Supabase (usando fallback local):', createError);
        } else if (newGame) {
          console.log('[REVANCHE] Revanche criada com sucesso no Supabase, ID:', newGame.id);
          newGameId = newGame.id;
          
          // Atualiza o jogo original no Supabase com o ID da revanche
          console.log('[REVANCHE] Atualizando jogo original com ID de revanche:', {
            originalGameId: gameId,
            rematchGameId: newGame.id
          });
          
          // Atualizar o jogo original
          const { error: updateError } = await supabase
            .from('memory_game_sessions')
            .update({ 
              rematch_game_id: newGame.id,
              rematch_accepted: true,
              rematch_requested_by: null // Limpar o solicitante ao aceitar
            })
            .eq('id', gameId);
          
          if (updateError) {
            console.warn('[REVANCHE] Erro ao atualizar jogo original com ID de revanche:', updateError);
          }
          
          // Enviar broadcasts independentemente de erros no update
          console.log('[REVANCHE] Enviando broadcasts de revanche aceita...');
          
          try {
            const channel = supabase.channel('memory-game');
            
            // Enviar broadcast específico de revanche (o mais importante)
            await channel.send({
              type: 'broadcast',
              event: 'rematch_accepted',
              payload: {
                original_game_id: gameId,
                new_game_id: newGame.id,
                timestamp: new Date().toISOString()
              }
            });
            
            // Broadcast do jogo atualizado como backup
            await channel.send({
              type: 'broadcast',
              event: 'game_update',
              payload: {
                id: gameId,
                rematch_game_id: newGame.id,
                rematch_accepted: true,
                rematch_requested_by: null,
                last_update: new Date().toISOString()
              }
            });
            
            // Enviar um segundo broadcast como garantia após pequeno atraso
            setTimeout(async () => {
              try {
                await channel.send({
                  type: 'broadcast',
                  event: 'rematch_accepted',
                  payload: {
                    original_game_id: gameId,
                    new_game_id: newGame.id,
                    timestamp: new Date().toISOString(),
                    is_retry: true
                  }
                });
                console.log('[REVANCHE] Broadcast de revanche aceita (retry) enviado');
              } catch (retryError) {
                console.warn('[REVANCHE] Erro ao enviar retry do broadcast:', retryError);
              }
            }, 1000); // Enviar um segundo depois como garantia
            
            console.log('[REVANCHE] Broadcasts de jogo de revanche enviados com sucesso');
          } catch (broadcastError) {
            console.warn('[REVANCHE] Erro ao enviar broadcasts do jogo de revanche:', broadcastError);
          }
          
          // Atualizar também no localStorage
          if (typeof window !== 'undefined') {
            updateLocalGame(newGame.id, newGame as MemoryGameSession);
            
            // Atualizar o jogo original no localStorage
            const updatedOriginalGame: MemoryGameSession = {
              ...game,
              rematch_game_id: newGame.id,
              rematch_accepted: true,
              rematch_requested_by: null // Limpar o solicitante para evitar confusão
            };
            
            updateLocalGame(gameId, updatedOriginalGame);
          }
          
          console.log('[REVANCHE] Retornando jogo de revanche com ID:', newGame.id);
          return {
            ...newGame as MemoryGameSession,
            rematch_game_id: newGame.id,
            rematch_accepted: true
          };
        }
      } catch (supabaseError) {
        console.warn('[REVANCHE] Exceção ao criar revanche no Supabase:', supabaseError);
      }
      
      // Fallback: Criar jogo localmente
      newGameId = generateUUID();
      console.log('[REVANCHE] Usando fallback local com ID:', newGameId);
      
      const mockNewGame: MemoryGameSession = {
        id: newGameId,
        created_at: new Date().toISOString(),
        last_move_at: new Date().toISOString(),
        ...newGameData
      };
      
      // Atualiza o jogo original no localStorage e adiciona o broadcast de fallback
      if (typeof window !== 'undefined') {
        // Salvar o novo jogo no localStorage
        updateLocalGame(newGameId, mockNewGame);
        
        // Atualizar o jogo original no localStorage com o ID de revanche
        if (game) {  // Verificar se game não é null antes de usar
          const updatedOriginalGame: MemoryGameSession = {
            ...game,
            rematch_game_id: newGameId,
            rematch_accepted: true,
            rematch_requested_by: null // Limpar o solicitante para evitar confusão
          };
          
          updateLocalGame(gameId, updatedOriginalGame);
        }

        // Tenta enviar o broadcast de revanche mesmo no fallback local
        try {
          const channel = supabase.channel('memory-game');
          
          // Enviar broadcast específico de revanche
          await channel.send({
            type: 'broadcast',
            event: 'rematch_accepted',
            payload: {
              original_game_id: gameId,
              new_game_id: newGameId,
              timestamp: new Date().toISOString()
            }
          });
          
          console.log('[REVANCHE] Broadcast de revanche enviado com sucesso (fallback)');
        } catch (broadcastError) {
          console.warn('[REVANCHE] Erro ao enviar broadcast de revanche (fallback):', broadcastError);
        }
      }
      
      console.log('[REVANCHE] Retornando jogo de revanche fallback com ID:', newGameId);
      return {
        ...mockNewGame,
        rematch_game_id: newGameId,
        rematch_accepted: true
      };
    } else {
      // Registra a solicitação de revanche
      const updatedGameData = {
        rematch_requested_by: playerId
      };
      
      console.log(`[REVANCHE] Registrando solicitação de revanche pelo jogador ${playerId}`);
      
      // Tenta atualizar no Supabase
      try {
        const { data, error } = await supabase
          .from('memory_game_sessions')
          .update(updatedGameData)
          .eq('id', gameId)
          .select()
          .single();
        
        if (error) {
          console.warn(`Erro ao solicitar revanche no Supabase (usando fallback local):`, error);
        } else if (data) {
          console.log('Solicitação de revanche registrada com sucesso no Supabase');
          
          // Atualizar também no localStorage
          if (typeof window !== 'undefined') {
            updateLocalGame(gameId, data as MemoryGameSession);
          }
          
          return data as MemoryGameSession;
        }
      } catch (supabaseError) {
        console.warn(`Exceção ao solicitar revanche no Supabase:`, supabaseError);
      }
      
      // Fallback: Atualizar localmente
      const updatedGame: MemoryGameSession = {
        ...game,
        ...updatedGameData
      };
      
      // Salvar no localStorage
      updateLocalGame(gameId, updatedGame);
      
      console.log('Solicitação de revanche registrada localmente');
      return updatedGame;
    }
  } catch (error) {
    console.error('Erro inesperado ao solicitar revanche:', error);
    return null;
  }
};

// Função para iniciar um jogo da memória que está em estado de espera
export const startMemoryGame = async (gameId: string): Promise<MemoryGameSession | null> => {
  try {
    console.log(`Iniciando jogo da memória ${gameId}...`);
    
    // Verificar se o jogo existe e está em estado de espera
    const game = await getMemoryGame(gameId);
    
    if (!game) {
      console.error(`Jogo ${gameId} não encontrado`);
      return null;
    }
    
    if (game.status !== 'waiting') {
      console.log(`Jogo ${gameId} já foi iniciado ou finalizado (status: ${game.status})`);
      return game;
    }
    
    // Verificar se ambos os jogadores estão presentes
    if (!game.player_1_id || !game.player_2_id) {
      console.error(`Jogo ${gameId} não tem dois jogadores para iniciar`);
      return game;
    }
    
    // Atualizar o status do jogo para 'playing'
    const updates = {
      status: 'playing' as const,
      current_player_id: game.player_1_id, // O jogador 1 sempre começa
      last_move_at: new Date().toISOString()
    };
    
    // Tentar atualizar no Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('memory_game_sessions')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();
        
      if (error) {
        console.warn(`Erro ao iniciar jogo ${gameId} no Supabase (usando fallback local):`, error);
      } else if (data) {
        console.log(`Jogo ${gameId} iniciado com sucesso no Supabase`);
        
        // Atualizar o localStorage
        if (typeof window !== 'undefined') {
          updateLocalGame(gameId, data as MemoryGameSession);
        }
        
        return data as MemoryGameSession;
      }
    } catch (supabaseError) {
      console.warn(`Exceção ao iniciar jogo ${gameId} no Supabase:`, supabaseError);
    }
    
    // Fallback: Atualizar localmente
    const updatedGame: MemoryGameSession = {
      ...game,
      ...updates
    };
    
    // Salvar no localStorage
    updateLocalGame(gameId, updatedGame);
    
    console.log(`Jogo ${gameId} iniciado com sucesso localmente`);
    return updatedGame;
  } catch (error) {
    console.error(`Erro inesperado ao iniciar jogo ${gameId}:`, error);
    return null;
  }
};