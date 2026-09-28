import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { orders, orderItems } from '../db/schema.js';
import { authenticate } from '../middlewares/auth.js';
import { ordersQueue } from '../queues/ordersQueue.js';

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1, 'O pedido deve ter no mínimo 1 item'),
});

export async function orderRoutes(app: FastifyInstance) {
  app.post('/orders/checkout', { onRequest: [authenticate] }, async (request, reply) => {
    const { items } = checkoutSchema.parse(request.body);
    const userId = request.user.sub as string;

    const totalAmount = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    // 1. Grava o pedido com status 'pending'
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        status: 'pending',
        totalAmount: totalAmount.toFixed(2),
      })
      .returning();

    // 2. Grava os itens do pedido
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      });
    }

    // 3. Adiciona o job na fila do BullMQ
    await ordersQueue.add('process-payment', {
      orderId: newOrder.id,
      userId,
      amount: totalAmount,
    });

    // Retorna imediatamente com status 202 (Accepted)
    return reply.status(202).send({
      message: 'Pedido recebido e enviado para processamento.',
      orderId: newOrder.id,
      status: 'pending',
    });
  });
}