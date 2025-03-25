export const createMatch = async (matchData: Match) => {
  try {
    const newMatch = await MatchModel.create(matchData);
    
    ✅ // Verificar conexões ativas antes de emitir
    ✅ if (io.engine.clientsCount > 0) {
      ✅ io.emit('match_updated', newMatch);
    ✅ } else {
      ✅ console.warn('Sem clientes conectados para notificar');
    ✅ }
    
    return newMatch;
  } catch (error) {
    ✅ // Log estruturado para análise
    ✅ logger.error('createMatchError', {
      ✅ errorDetails: error,
      ✅ matchData,
      ✅ socketStatus: io.engine.clientsCount
    ✅ });
    throw error;
  }
}; 