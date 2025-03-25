const { Server } = require('socket.io');
const { subscribeToGameUpdates } = require('../../lib/memory-game/memorygameservice');

const setupMemoryGameSocket = (httpServer) => {
  const io = new Server(httpServer, {
    path: '/api/socket/memory',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const memoryNamespace = io.of('/memory');

  memoryNamespace.on('connection', (socket) => {
    console.log(`Cliente conectado ao namespace de memória: ${socket.id}`);
    
    // Entrar em sala específica de jogo
    socket.on('join_game_room', (gameId) => {
      socket.join(`game:${gameId}`);
      console.log(`Cliente ${socket.id} entrou na sala do jogo ${gameId}`);
    });
    
    // Sair de sala específica de jogo
    socket.on('leave_game_room', (gameId) => {
      socket.leave(`game:${gameId}`);
      console.log(`Cliente ${socket.id} saiu da sala do jogo ${gameId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado do namespace de memória: ${socket.id}`);
    });
  });

  // Inscrever-se para atualizações do Redis e transmitir via Socket.IO
  subscribeToGameUpdates((update) => {
    if (update.type === 'game_created') {
      memoryNamespace.emit('game_created', update.game);
    } 
    else if (update.gameId) {
      // Transmitir para sala específica do jogo
      memoryNamespace.to(`game:${update.gameId}`).emit(update.type, update);
      
      // Para atualizações de status, também emitir evento global
      if (['player_joined', 'game_finished'].includes(update.type)) {
        memoryNamespace.emit('game_updated', update.game);
      }
    }
  });

  return memoryNamespace;
};

module.exports = { setupMemoryGameSocket }; 