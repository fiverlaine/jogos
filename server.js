import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupMemoryGameSocket } from './server/socketio/memoryGameSocket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Configurar Socket.IO
  setupMemoryGameSocket(server);

  server.listen(3000, () => {
    console.log('> Servidor pronto na porta 3000');
  });
}); 