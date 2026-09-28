import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { authenticate } from '../middlewares/auth.js';
import { eq } from 'drizzle-orm';

const createProductSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  stock: z.number().int().nonnegative().default(0),
  categoryName: z.string().default('Geral'),
});

export async function productRoutes(app: FastifyInstance) {
  // Rota pública: Listar produtos
  app.get('/products', async (request, reply) => {
    const allProducts = await db.select().from(products);
    return reply.send({ products: allProducts });
  });

  // Rota protegida: Criar um produto (exige autenticação)
  app.post('/products', { onRequest: [authenticate] }, async (request, reply) => {
    const { name, description, price, stock, categoryName } = createProductSchema.parse(request.body);

    // Garante que existe uma categoria válida para associar ao produto
    let [category] = await db.select().from(categories).where(eq(categories.name, categoryName));
    if (!category) {
      [category] = await db
        .insert(categories)
        .values({ name: categoryName, slug: categoryName.toLowerCase().replace(/\s+/g, '-') })
        .returning();
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        description,
        price: price.toFixed(2),
        stock,
        categoryId: category.id,
      })
      .returning();

    return reply.status(201).send({ product: newProduct });
  });
}