import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// 1. Usuários
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).default('customer').notNull(), // 'admin' | 'customer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Sessões / Refresh Tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Categorias
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});

// 4. Produtos
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Pedidos
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Itens do Pedido
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
});

// 7. Pagamentos / Transações
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'paid' | 'failed' | 'refunded'
  method: varchar('method', { length: 50 }).notNull(), // 'credit_card' | 'pix'
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Log de Filas / Jobs (Histórico BullMQ)
export const jobLogs = pgTable('job_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobType: varchar('job_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 50 }).default('queued').notNull(), // 'queued' | 'active' | 'completed' | 'failed'
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// 9. Dead Letter Queue (Jobs com Falha Permanente)
export const failedJobs = pgTable('failed_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobLogId: uuid('job_log_id').references(() => jobLogs.id),
  errorStack: text('error_stack'),
  failedAt: timestamp('failed_at').defaultNow().notNull(),
});

// 10. Notificações (WebSockets Feed)
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});