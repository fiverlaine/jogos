let socket: Socket | null = null;
let reconnectAttempts = 0;

export const initSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      transports: ['websocket']
    });

    socket.on('connect_error', (err) => {
      console.error('Falha na conexão WebSocket:', err.message);
      if (reconnectAttempts++ > 4) switchToHttpPolling();
    });
    
    socket.on('match_updated', (match) => {
      console.debug('Nova partida recebida:', match.id);
    });
  }
  return socket;
};

const switchToHttpPolling = () => {
  setInterval(async () => {
    const response = await api.get('/matches');
    window.dispatchEvent(new CustomEvent('matches_update', {
      detail: response.data
    }));
  }, 10000);
}; 