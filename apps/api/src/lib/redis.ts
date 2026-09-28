import { Redis } from 'ioredis';
import 'dotenv/config';

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6380,
  maxRetriesPerRequest: null, // Obrigatório para o BullMQ
});

redisConnection.on('connect', () => {
  console.log('⚡ Conectado ao Redis com sucesso!');
});

redisConnection.on('error', (err) => {
  console.error('❌ Erro de conexão com o Redis:', err);
});