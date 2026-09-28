import { WebSocket } from 'ws';

const connectedClients = new Map<string, WebSocket>();

export function registerClient(userId: string, socket: WebSocket) {
  connectedClients.set(userId, socket);
  console.log(`🔌 Cliente WebSocket conectado: ${userId}`);
}

export function removeClient(userId: string) {
  connectedClients.delete(userId);
  console.log(`❌ Cliente WebSocket desconectado: ${userId}`);
}

export function sendNotificationToUser(userId: string, data: object) {
  const socket = connectedClients.get(userId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    console.log(`📡 Notificação enviada em tempo real para: ${userId}`);
  }
}

export function broadcastEvent(data: object) {
  const payload = JSON.stringify(data);
  connectedClients.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  });
  console.log('📢 Broadcast enviado para todos os clientes conectados');
}