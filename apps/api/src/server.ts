import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { orderRoutes } from './routes/orders.js';
import { websocketRoutes } from './routes/ws.js';
import './queues/ordersQueue.js';
import 'dotenv/config';

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT) || 3333;

const start = async () => {
  try {
    await app.register(cors, { origin: true });
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'sua-chave-secreta-super-segura',
    });
    
    // Registrar suporte a WebSockets
    await app.register(websocket);

    // Healthcheck
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Registrar Rotas da Aplicação
    await app.register(authRoutes);
    await app.register(productRoutes);
    await app.register(orderRoutes);
    await app.register(websocketRoutes);

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();