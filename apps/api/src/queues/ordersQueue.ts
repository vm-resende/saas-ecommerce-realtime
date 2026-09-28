import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import { db } from '../db/index.js';
import { orders, orderItems, products, jobLogs, notifications } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { sendNotificationToUser, broadcastEvent } from '../lib/websocket.js';

export const ordersQueue = new Queue('orders-queue', {
  connection: redisConnection,
});

export const ordersWorker = new Worker(
  'orders-queue',
  async (job) => {
    console.log(`📦 Processando Job #${job.id} - Tipo: ${job.name}`);
    const { orderId, userId, amount } = job.data;

    // 1. Log de início
    const [log] = await db
      .insert(jobLogs)
      .values({
        jobType: job.name,
        payload: job.data,
        status: 'active',
      })
      .returning();

    // Simula 2 segundos de processamento do gateway de pagamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Atualiza o status do pedido
    await db
      .update(orders)
      .set({ status: 'completed' })
      .where(eq(orders.id, orderId));

    // 3. Busca os itens do pedido para decrementar o estoque no banco
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));

      // Emite atualização do novo estoque para todos os clientes conectados
      const [updatedProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (updatedProduct) {
        broadcastEvent({
          event: 'STOCK_UPDATED',
          productId: updatedProduct.id,
          newStock: updatedProduct.stock,
        });
      }
    }

    // 4. Registra notificação no banco de dados
    const notificationTitle = 'Pedido Aprovado!';
    const notificationMessage = `Seu pedido #${orderId.slice(0, 8)} foi processado e o estoque foi atualizado.`;

    await db.insert(notifications).values({
      userId,
      title: notificationTitle,
      message: notificationMessage,
    });

    // 5. Atualiza o histórico do log
    await db
      .update(jobLogs)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(jobLogs.id, log.id));

    console.log(`✅ Pedido ${orderId} concluído e estoque atualizado!`);

    // 6. Notifica o usuário do pedido via WebSocket
    sendNotificationToUser(userId, {
      event: 'ORDER_COMPLETED',
      orderId,
      title: notificationTitle,
      message: notificationMessage,
      timestamp: new Date().toISOString(),
    });
  },
  { connection: redisConnection }
);