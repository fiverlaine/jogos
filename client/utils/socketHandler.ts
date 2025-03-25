let heartbeatInterval: NodeJS.Timeout;

export const initSocket = () => {
  const socket = io(API_URL);
  
  socket.on('connect', () => {
    heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { userId: getCurrentUser()?.id });
    }, 15000);
  });

  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval);
  });

  return socket;
}; 