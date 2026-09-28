'use client';

import { useEffect, useState } from 'react';

export interface NotificationEvent {
  event: string;
  orderId?: string;
  title?: string;
  message?: string;
  timestamp?: string;
  productId?: string;
  newStock?: number;
}

export function useWebSocket(
  userId: string | null,
  onStockUpdate?: (productId: string, newStock: number) => void
) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:3333/ws?userId=${userId}`);

    ws.onopen = () => {
      console.log('⚡ Conectado ao WebSocket do Fastify');
    };

    ws.onmessage = (event) => {
      try {
        const data: NotificationEvent = JSON.parse(event.data);

        if (data.event === 'STOCK_UPDATED' && data.productId && data.newStock !== undefined) {
          onStockUpdate?.(data.productId, data.newStock);
        } else if (data.event === 'ORDER_COMPLETED') {
          setNotifications((prev) => [data, ...prev]);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WS:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId, onStockUpdate]);

  return { notifications };
}