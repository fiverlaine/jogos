import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Tipo para as cartas do jogo da memória
interface MemoryCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

// Função para criar cartas embaralhadas
function generateShuffledCards(gridSize: number): MemoryCard[] {
  // Card symbols
  const CARD_SYMBOLS = [
    "🌈", "🚀", "💎", "🔮", "⚡", "🌟", "🔥", "🌊", "🎮", "🎯",
    "🎲", "🧩", "🎨", "🎭", "🎪", "🎡", "🦄", "🐉", "🦋", "🦜",
    "🐙", "🦚", "🐬", "🦢", "🍉", "🍓", "🥑", "🍍", "🥭", "🍕",
    "🧠", "👾"
  ];

  const totalPairs = (gridSize * gridSize) / 2;
  const symbols = [...CARD_SYMBOLS].slice(0, totalPairs);

  // Criar pares de cartas
  const cardPairs: MemoryCard[] = [];
  symbols.forEach((symbol, index) => {
    cardPairs.push(
      { id: index * 2, symbol, flipped: false, matched: false },
      { id: index * 2 + 1, symbol, flipped: false, matched: false }
    );
  });

  // Embaralhar cartas
  for (let i = cardPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
  }

  return cardPairs;
}

// POST: Cria uma nova sessão de jogo da memória
export async function POST(request: Request) {
  try {
    // Obter os dados da requisição
    const data = await request.json();
    const { player_id, player_nickname, grid_size = 4, difficulty = 'medium' } = data;

    if (!player_id || !player_nickname) {
      return NextResponse.json({ error: 'ID e nickname do jogador são obrigatórios' }, { status: 400 });
    }

    console.log(`Criando jogo da memória para jogador: ${player_nickname} (${player_id})`);

    // Gerar cartas embaralhadas
    const cards = generateShuffledCards(grid_size);

    // Tentar criar o registro com campos mínimos para evitar problemas de cache
    try {
      // Usar apenas campos essenciais para minimizar problemas
      const minimalData = {
        player_1_id: player_id,
        player_1_nickname: player_nickname,
        cards: cards,
        player_1_score: 0,
        player_2_score: 0,
        grid_size: grid_size,
        difficulty: difficulty,
        status: 'waiting_for_player',
        current_turn: 1
      };
      
      // Tentar inserir com o mínimo de campos
      const { data: gameData, error } = await supabase
        .from('memory_game_sessions')
        .insert(minimalData)
        .select()
        .single();

      if (error) {
        // Se o erro for relacionado à tabela não existir
        if (error.code === '42P01' || error.message.includes('relation "memory_game_sessions" does not exist')) {
          return NextResponse.json({ 
            error: 'A tabela memory_game_sessions não existe. Execute o script SQL no Supabase.',
            details: error.message 
          }, { status: 500 });
        }

        // Se o erro for relacionado ao cache do schema
        if (error.message.includes('schema cache')) {
          // Sugestão para limpar o cache do Supabase
          return NextResponse.json({ 
            error: 'Problema no cache do Supabase. Tente reiniciar o projeto no Supabase ou limpar o cache do esquema.',
            details: error.message 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          error: error.message,
          details: 'Erro ao criar sessão do jogo' 
        }, { status: 500 });
      }

      return NextResponse.json(gameData);
    } catch (error: any) {
      console.error('Erro ao criar jogo da memória:', error.message);
      return NextResponse.json({ 
        error: 'Erro ao criar jogo da memória', 
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro na API de criação de jogo da memória:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar requisição',
      details: error.message
    }, { status: 500 });
  }
}

// GET: Lista jogos da memória disponíveis
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memory_game_sessions')
      .select('*')
      .eq('status', 'waiting_for_player')
      .is('player_2_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      // Se o erro for relacionado à tabela não existir
      if (error.code === '42P01' || error.message.includes('relation "memory_game_sessions" does not exist')) {
        return NextResponse.json({ 
          error: 'A tabela memory_game_sessions não existe. Execute o script SQL no Supabase.',
          games: [] 
        }, { status: 200 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ games: data || [] });
  } catch (error: any) {
    console.error('Erro ao listar jogos da memória:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar jogos da memória',
      details: error.message,
      games: []
    }, { status: 500 });
  }
} 