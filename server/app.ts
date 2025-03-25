io.on('connection', (socket) => {
  ✅ console.log(`Cliente conectado: ${socket.id}`);
  ✅ socket.on('disconnect', (reason) => {
    ✅ console.log(`Cliente desconectado (${reason}): ${socket.id}`);
  });
  ✅ socket.on('error', (error) => {
    ✅ console.error(`Erro no socket ${socket.id}:`, error);
  });
}); 