import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Função para corrigir a tabela memory_game_sessions
export async function GET() {
  try {
    // Criar cliente Supabase com as variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Credenciais do Supabase não configuradas' 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar se a tabela existe
    const { error: tableError } = await supabase
      .from('memory_game_sessions')
      .select('id')
      .limit(1);
    
    if (tableError) {
      // Dropamos e recriamos a tabela se ela não existir ou tiver problemas
      const { data: recreateData, error: recreateError } = await supabase
        .rpc('recreate_memory_table');
      
      if (recreateError) {
        // Se falhar, tentamos executar SQL direto
        try {
          const { error: dropError } = await supabase
            .from('memory_game_sessions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (dropError && dropError.code !== '42P01') {
            return NextResponse.json({
              error: 'Não foi possível limpar a tabela',
              details: dropError.message
            }, { status: 500 });
          }
          
          // Vamos tentar inserir um registro vazio para criar a tabela
          const { error: insertError } = await supabase
            .from('memory_game_sessions')
            .insert({
              player_1_id: '00000000-0000-0000-0000-000000000000',
              player_1_nickname: 'Dummy',
              cards: [],
              current_turn: 1,
              grid_size: 4,
              difficulty: 'medium',
              status: 'waiting_for_player',
              player_1_score: 0,
              player_2_score: 0,
              started_at: new Date().toISOString()
            });
          
          if (insertError && insertError.code !== '23505') {
            return NextResponse.json({
              error: 'Não foi possível inserir um registro de teste',
              details: insertError.message
            }, { status: 500 });
          }
          
          return NextResponse.json({
            message: 'Tabela reconfigurada com sucesso',
            success: true
          });
        } catch (error: any) {
          return NextResponse.json({
            error: 'Erro ao recriar a tabela',
            details: error.message
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({
        message: 'Tabela memory_game_sessions recriada com sucesso',
        success: true
      });
    }
    
    // A tabela existe, mas pode ter problemas com o schema
    // Vamos tentar modificá-la para garantir que todas as colunas existam
    try {
      // Executar um SQL personalizado para garantir que todas as colunas existam
      const { error: alterError } = await supabase.rpc('ensure_memory_table_columns');
      
      if (alterError) {
        return NextResponse.json({
          error: 'Erro ao modificar a tabela',
          details: alterError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: 'Tabela memory_game_sessions verificada e atualizada com sucesso',
        success: true
      });
    } catch (error: any) {
      return NextResponse.json({
        error: 'Erro ao verificar/atualizar colunas da tabela',
        details: error.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao corrigir tabela Supabase:', error);
    return NextResponse.json({ 
      error: 'Erro ao corrigir tabela Supabase',
      details: error.message 
    }, { status: 500 });
  }
} 