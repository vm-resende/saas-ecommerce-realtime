import { FastifyInstance } from 'fastify';
import { registerClient, removeClient } from '../lib/websocket.js';

export async function websocketRoutes(app: FastifyInstance) {
  // Conexão WebSocket na rota /ws
  app.get('/ws', { websocket: true }, (socket, req) => {
    // Para simplificar o teste, podemos receber o userId via Query Param: /ws?userId=XXX
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      socket.close(1008, 'userId é obrigatório');
      return;
    }

    registerClient(userId, socket);

    socket.on('close', () => {
      removeClient(userId);
    });
  });
}