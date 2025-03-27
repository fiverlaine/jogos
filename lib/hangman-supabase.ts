import { supabase } from './supabase';
import { generateUUID } from './utils';

// Tipos
export interface Player {
  id: string;
  nickname: string;
}

export interface HangmanGameState {
  palavra: string;
  letrasAdivinhadas: string[];
  erros: number;
  status: "jogando" | "venceu" | "perdeu";
  jogadorAtual: string;
  vencedor: string | null;
  dica: string;
}

export interface HangmanGameSession {
  id: string;
  created_at: string;
  last_move_at: string;
  current_player_id: string;
  player_1_id: string;
  player_1_nickname: string;
  player_2_id: string | null;
  player_2_nickname: string | null;
  word: string;
  hint: string;
  guessed_letters: string[];
  errors: number;
  winner_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  rematch_requested_by: string | null;
  rematch_game_id: string | null;
  game_time: number;
}

// Função para criar uma nova sessão de jogo da forca
export async function createHangmanGameSession(player: Player): Promise<HangmanGameSession | null> {
  try {
    console.log(`Criando nova sessão de jogo da forca para o jogador: ${player.nickname} (${player.id})`);
    
    // Criar um jogo vazio
    const { data, error } = await supabase
      .from('hangman_game_sessions')
      .insert({
        current_player_id: player.id,
        player_1_id: player.id,
        player_1_nickname: player.nickname,
        word: "", // Será definida quando o segundo jogador entrar
        hint: "", // Será definida quando o segundo jogador entrar
        guessed_letters: [],
        errors: 0,
        status: 'waiting',
        game_time: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar sessão de jogo da forca:', error.message);
      return null;
    }
    
    if (!data) {
      console.error('Nenhum dado retornado ao criar sessão de jogo da forca');
      return null;
    }
    
    console.log('Sessão de jogo da forca criada com sucesso:', data.id);
    return data as HangmanGameSession;
  } catch (error) {
    console.error('Erro inesperado ao criar sessão de jogo da forca:', error);
    return null;
  }
}

// Função para obter uma sessão de jogo da forca pelo ID
export async function getHangmanGameById(gameId: string): Promise<HangmanGameSession | null> {
  try {
    console.log(`Buscando jogo da forca com ID: ${gameId}`);
    
    const { data, error } = await supabase
      .from('hangman_game_sessions')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (error) {
      console.error(`Erro ao buscar jogo da forca ${gameId}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`Jogo da forca com ID ${gameId} não encontrado`);
      return null;
    }
    
    console.log(`Jogo da forca ${gameId} encontrado`);
    return data as HangmanGameSession;
  } catch (error) {
    console.error(`Erro inesperado ao buscar jogo da forca ${gameId}:`, error);
    return null;
  }
}

// Função para obter jogos da forca disponíveis
export async function getAvailableHangmanGames(): Promise<HangmanGameSession[]> {
  try {
    console.log('Buscando jogos da forca disponíveis...');
    
    const { data, error } = await supabase
      .from('hangman_game_sessions')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar jogos da forca disponíveis:', error.message);
      return [];
    }
    
    console.log(`Encontrados ${data?.length || 0} jogos da forca disponíveis`);
    return data as HangmanGameSession[] || [];
  } catch (error) {
    console.error('Erro inesperado ao buscar jogos da forca disponíveis:', error);
    return [];
  }
}

// Função para entrar em uma sessão de jogo da forca
export async function joinHangmanGameSession(gameId: string, player: Player): Promise<boolean> {
  try {
    console.log(`Jogador ${player.nickname} (${player.id}) tentando entrar no jogo da forca ${gameId}`);
    
    // Primeiro, verificar se o jogo existe e está disponível
    const game = await getHangmanGameById(gameId);
    
    if (!game) {
      console.error(`Jogo da forca ${gameId} não encontrado`);
      return false;
    }
    
    if (game.status !== 'waiting') {
      console.error(`Jogo da forca ${gameId} não está disponível (status: ${game.status})`);
      return false;
    }
    
    // Verificar se o jogador já é o jogador 1
    if (game.player_1_id === player.id) {
      console.log(`Jogador ${player.id} já é o jogador 1 neste jogo, permitindo continuar`);
      return true; // Retornar true para permitir que o jogador continue no jogo
    }
    
    // Lista de palavras para o jogo da forca
    const palavras = [
      "ABACAXI", "BANANA", "LARANJA", "MORANGO", "UVA", "MELANCIA", "MANGA", 
      "CASA", "ESCOLA", "COMPUTADOR", "BRASIL", "FUTEBOL", "PRAIA", "FLORESTA",
      "CACHORRO", "GATO", "ELEFANTE", "GIRAFA", "MACACO", "LEAO", "TIGRE",
      "AMOR", "FELICIDADE", "ESPERANCA", "AMIZADE", "FAMILIA", "CORAGEM", "LIBERDADE",
      "TELEVISAO", "CELULAR", "INTERNET", "CINEMA", "MUSICA", "HISTORIA", "GEOGRAFIA",
      "AZUL", "VERMELHO", "AMARELO", "VERDE", "PRETO", "BRANCO", "ROXO"
    ];
    
    // Dicas para as palavras
    const dicas: Record<string, string> = {
      "ABACAXI": "Fruta tropical com coroa", 
      "BANANA": "Fruta amarela e curvada", 
      "LARANJA": "Fruta cítrica e redonda", 
      "MORANGO": "Fruta vermelha pequena", 
      "UVA": "Fruta usada para fazer vinho", 
      "MELANCIA": "Fruta grande e verde por fora, vermelha por dentro", 
      "MANGA": "Fruta tropical amarela e doce",
      "CASA": "Onde moramos", 
      "ESCOLA": "Lugar de aprendizado", 
      "COMPUTADOR": "Máquina eletrônica para processar dados", 
      "BRASIL": "País da América do Sul", 
      "FUTEBOL": "Esporte popular com bola", 
      "PRAIA": "Local com areia e mar", 
      "FLORESTA": "Área com muitas árvores",
      "CACHORRO": "Animal de estimação que late", 
      "GATO": "Animal de estimação que mia", 
      "ELEFANTE": "Animal grande com tromba", 
      "GIRAFA": "Animal com pescoço longo", 
      "MACACO": "Animal que se parece com humanos", 
      "LEAO": "Rei da selva", 
      "TIGRE": "Felino com listras",
      "AMOR": "Sentimento forte de afeto", 
      "FELICIDADE": "Estado de contentamento", 
      "ESPERANCA": "Sentimento de expectativa positiva", 
      "AMIZADE": "Relação de carinho entre pessoas", 
      "FAMILIA": "Grupo de pessoas unidas por laços de parentesco", 
      "CORAGEM": "Capacidade de enfrentar o medo", 
      "LIBERDADE": "Estado de poder agir conforme a própria vontade",
      "TELEVISAO": "Aparelho para assistir programas", 
      "CELULAR": "Dispositivo portátil de comunicação", 
      "INTERNET": "Rede global de computadores", 
      "CINEMA": "Local para assistir filmes", 
      "MUSICA": "Arte de combinar sons", 
      "HISTORIA": "Estudo do passado humano", 
      "GEOGRAFIA": "Estudo da Terra e seus fenômenos",
      "AZUL": "Cor do céu", 
      "VERMELHO": "Cor do sangue", 
      "AMARELO": "Cor do sol", 
      "VERDE": "Cor das plantas", 
      "PRETO": "Cor da ausência de luz", 
      "BRANCO": "Cor da neve", 
      "ROXO": "Cor entre o vermelho e o azul"
    };
    
    // Escolher uma palavra aleatória e sua dica
    const palavra = palavras[Math.floor(Math.random() * palavras.length)];
    const dica = dicas[palavra];
    
    // Atualizar o jogo com as informações do jogador 2 e iniciar o jogo
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        player_2_id: player.id,
        player_2_nickname: player.nickname,
        status: 'playing',
        word: palavra,
        hint: dica,
        guessed_letters: [],
        errors: 0,
        // O jogador que criou o jogo (player_1) começa
        current_player_id: game.player_1_id
      })
      .eq('id', gameId)
      .eq('status', 'waiting'); // Garantir que o jogo ainda está disponível
    
    if (error) {
      console.error(`Erro ao entrar no jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Jogador ${player.nickname} entrou com sucesso no jogo da forca ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao entrar no jogo da forca ${gameId}:`, error);
    return false;
  }
}

// Função para iniciar um jogo da forca (definir palavra e dica)
export async function startHangmanGame(gameId: string, word: string, hint: string, currentPlayerId: string): Promise<boolean> {
  try {
    console.log(`Iniciando jogo da forca ${gameId} com a palavra: ${word}`);
    
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        word: word,
        hint: hint,
        current_player_id: currentPlayerId,
        status: 'playing',
        last_move_at: new Date().toISOString()
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao iniciar jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Jogo da forca ${gameId} iniciado com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao iniciar jogo da forca ${gameId}:`, error);
    return false;
  }
}

// Função para atualizar o estado do jogo da forca
export async function updateHangmanState(gameId: string, gameState: HangmanGameState): Promise<boolean> {
  try {
    console.log(`Atualizando estado do jogo da forca ${gameId}`);
    
    // Mapear o estado do jogo para o formato da tabela
    let status: 'waiting' | 'playing' | 'finished' = 'playing';
    
    if (gameState.status === 'venceu' || gameState.status === 'perdeu') {
      status = 'finished';
    }
    
    // Atualizar o jogo no banco de dados
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        word: gameState.palavra,
        hint: gameState.dica,
        guessed_letters: gameState.letrasAdivinhadas,
        errors: gameState.erros,
        current_player_id: gameState.jogadorAtual,
        winner_id: gameState.vencedor,
        status: status,
        last_move_at: new Date().toISOString()
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao atualizar jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Estado do jogo da forca ${gameId} atualizado com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao atualizar estado do jogo da forca ${gameId}:`, error);
    return false;
  }
}

// Exportar como makeHangmanMove para compatibilidade
export const makeHangmanMove = updateHangmanState;

// Função para fazer uma jogada específica (tentar uma letra)
export async function makeHangmanLetterMove(gameId: string, playerId: string, letter: string): Promise<boolean> {
  try {
    console.log(`Jogador ${playerId} tentando a letra ${letter} no jogo da forca ${gameId}`);
    
    // Obter o estado atual do jogo
    const game = await getHangmanGameById(gameId);
    
    if (!game) {
      console.error(`Jogo da forca ${gameId} não encontrado`);
      return false;
    }
    
    // Verificar se é a vez do jogador
    if (game.current_player_id !== playerId) {
      console.error(`Não é a vez do jogador ${playerId}`);
      return false;
    }
    
    // Verificar se o jogo está em andamento
    if (game.status !== 'playing') {
      console.error(`Jogo da forca ${gameId} não está em andamento (status: ${game.status})`);
      return false;
    }
    
    // Verificar se a letra já foi tentada
    if (game.guessed_letters.includes(letter)) {
      console.error(`Letra ${letter} já foi tentada`);
      return false;
    }
    
    // Adicionar a letra às letras tentadas
    const newGuessedLetters = [...game.guessed_letters, letter];
    
    // Verificar se a letra está na palavra
    const letterInWord = game.word.includes(letter);
    
    // Atualizar o número de erros se a letra não estiver na palavra
    const newErrors = letterInWord ? game.errors : game.errors + 1;
    
    // Determinar o próximo jogador
    const nextPlayerId = playerId === game.player_1_id 
      ? game.player_2_id 
      : game.player_1_id;
    
    // Verificar se o jogo terminou
    let newStatus = 'playing';
    let winnerId = null;
    
    // Verificar se o jogador perdeu (6 erros)
    if (newErrors >= 6) {
      newStatus = 'finished';
      // Ninguém ganha quando o jogador perde
    }
    
    // Verificar se o jogador venceu (todas as letras da palavra foram adivinhadas)
    const allLettersGuessed = [...game.word].every(char => 
      newGuessedLetters.includes(char) || char === ' ' || char === '-'
    );
    
    if (allLettersGuessed) {
      newStatus = 'finished';
      winnerId = playerId;
    }
    
    // Atualizar o jogo no banco de dados
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        guessed_letters: newGuessedLetters,
        errors: newErrors,
        current_player_id: nextPlayerId,
        status: newStatus,
        winner_id: winnerId,
        last_move_at: new Date().toISOString()
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao atualizar jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Jogada realizada com sucesso no jogo da forca ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao fazer jogada no jogo da forca ${gameId}:`, error);
    return false;
  }
}

// Função para assinar atualizações em tempo real de um jogo da forca
export function subscribeToHangmanGame(gameId: string, callback: (game: HangmanGameSession) => void) {
  console.log(`Assinando atualizações para o jogo da forca ${gameId}`);
  
  const channel = supabase
    .channel(`hangman_game_${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'hangman_game_sessions',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log(`Recebida atualização para o jogo da forca ${gameId}:`, payload);
        callback(payload.new as HangmanGameSession);
      }
    )
    .subscribe((status) => {
      console.log(`Status da inscrição para o jogo da forca ${gameId}:`, status);
    });
  
  // Retornar a função para cancelar a assinatura
  return () => {
    console.log(`Cancelando assinatura para o jogo da forca ${gameId}`);
    supabase.removeChannel(channel);
  };
}

// Função para solicitar uma revanche
export async function requestHangmanRematch(gameId: string, playerId: string): Promise<boolean> {
  try {
    console.log(`Jogador ${playerId} solicitando revanche para o jogo da forca ${gameId}`);
    
    // Verificar se o jogo existe e está finalizado
    const game = await getHangmanGameById(gameId);
    
    if (!game) {
      console.error(`Jogo da forca ${gameId} não encontrado`);
      return false;
    }
    
    // Verificar se o jogador é um dos participantes do jogo
    if (playerId !== game.player_1_id && playerId !== game.player_2_id) {
      console.error(`Jogador ${playerId} não é participante do jogo da forca ${gameId}`);
      return false;
    }
    
    // Atualizar o jogo para indicar que uma revanche foi solicitada
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        rematch_requested_by: playerId
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao solicitar revanche para o jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Revanche solicitada com sucesso para o jogo da forca ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao solicitar revanche para o jogo da forca ${gameId}:`, error);
    return false;
  }
}

// Função para aceitar uma revanche
export async function acceptHangmanRematch(gameId: string, playerId: string): Promise<string | null> {
  try {
    console.log(`Jogador ${playerId} aceitando revanche para o jogo da forca ${gameId}`);
    
    // Verificar se o jogo existe e tem uma solicitação de revanche
    const game = await getHangmanGameById(gameId);
    
    if (!game) {
      console.error(`Jogo da forca ${gameId} não encontrado`);
      return null;
    }
    
    // Verificar se o jogador é um dos participantes do jogo
    if (playerId !== game.player_1_id && playerId !== game.player_2_id) {
      console.error(`Jogador ${playerId} não é participante do jogo da forca ${gameId}`);
      return null;
    }
    
    // Verificar se há uma solicitação de revanche
    if (!game.rematch_requested_by) {
      console.error(`Não há solicitação de revanche para o jogo da forca ${gameId}`);
      return null;
    }
    
    // Verificar se o jogador que está aceitando não é o mesmo que solicitou
    if (game.rematch_requested_by === playerId) {
      console.error(`Jogador ${playerId} não pode aceitar sua própria solicitação de revanche`);
      return null;
    }
    
    // Criar um novo jogo para a revanche
    const player1Id = game.player_2_id; // Inverter os jogadores
    const player1Nickname = game.player_2_nickname;
    const player2Id = game.player_1_id;
    const player2Nickname = game.player_1_nickname;
    
    const { data: newGame, error: createError } = await supabase
      .from('hangman_game_sessions')
      .insert({
        current_player_id: player1Id,
        player_1_id: player1Id,
        player_1_nickname: player1Nickname,
        player_2_id: player2Id,
        player_2_nickname: player2Nickname,
        word: "", // Será definida quando o jogo iniciar
        hint: "", // Será definida quando o jogo iniciar
        guessed_letters: [],
        errors: 0,
        status: 'playing',
        game_time: 0
      })
      .select()
      .single();
    
    if (createError) {
      console.error(`Erro ao criar jogo de revanche para o jogo da forca ${gameId}:`, createError.message);
      return null;
    }
    
    // Atualizar o jogo original com o ID do jogo de revanche
    const { error: updateError } = await supabase
      .from('hangman_game_sessions')
      .update({
        rematch_game_id: newGame.id
      })
      .eq('id', gameId);
    
    if (updateError) {
      console.error(`Erro ao atualizar jogo da forca ${gameId} com ID de revanche:`, updateError.message);
      // Não retornar null aqui, pois o jogo de revanche já foi criado
    }
    
    console.log(`Revanche aceita com sucesso para o jogo da forca ${gameId}, novo jogo: ${newGame.id}`);
    return newGame.id;
  } catch (error) {
    console.error(`Erro inesperado ao aceitar revanche para o jogo da forca ${gameId}:`, error);
    return null;
  }
}

// Função para recusar uma revanche
export async function declineHangmanRematch(gameId: string, playerId: string): Promise<boolean> {
  try {
    console.log(`Jogador ${playerId} recusando revanche para o jogo da forca ${gameId}`);
    
    // Verificar se o jogo existe e tem uma solicitação de revanche
    const game = await getHangmanGameById(gameId);
    
    if (!game) {
      console.error(`Jogo da forca ${gameId} não encontrado`);
      return false;
    }
    
    // Verificar se o jogador é um dos participantes do jogo
    if (playerId !== game.player_1_id && playerId !== game.player_2_id) {
      console.error(`Jogador ${playerId} não é participante do jogo da forca ${gameId}`);
      return false;
    }
    
    // Verificar se há uma solicitação de revanche
    if (!game.rematch_requested_by) {
      console.error(`Não há solicitação de revanche para o jogo da forca ${gameId}`);
      return false;
    }
    
    // Verificar se o jogador que está recusando não é o mesmo que solicitou
    if (game.rematch_requested_by === playerId) {
      console.error(`Jogador ${playerId} não pode recusar sua própria solicitação de revanche`);
      return false;
    }
    
    // Atualizar o jogo para indicar que a revanche foi recusada
    const { error } = await supabase
      .from('hangman_game_sessions')
      .update({
        rematch_requested_by: null // Limpar a solicitação de revanche
      })
      .eq('id', gameId);
    
    if (error) {
      console.error(`Erro ao recusar revanche para o jogo da forca ${gameId}:`, error.message);
      return false;
    }
    
    console.log(`Revanche recusada com sucesso para o jogo da forca ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Erro inesperado ao recusar revanche para o jogo da forca ${gameId}:`, error);
    return false;
  }
}