import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.js';

export async function authRoutes(app: FastifyInstance) {
  // 1. Registro de Usuário
  app.post('/auth/register', async (request, reply) => {
    if (!request.body) {
      return reply.status(400).send({ message: 'O corpo da requisição é obrigatório.' });
    }

    const { name, email, password, role } = registerSchema.parse(request.body);

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return reply.status(400).send({ message: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 8);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role,
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return reply.status(201).send({ user: newUser });
  });

  // 2. Login
  app.post('/auth/login', async (request, reply) => {
    if (!request.body) {
      return reply.status(400).send({ message: 'O corpo da requisição é obrigatório.' });
    }

    const { email, password } = loginSchema.parse(request.body);

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' });
    }

    const token = app.jwt.sign(
      { role: user.role },
      { sub: user.id, expiresIn: '15m' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [refreshTokenRecord] = await db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt,
      })
      .returning();

    return reply.send({
      token,
      refreshToken: refreshTokenRecord.token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  // 3. Refresh Token
  app.post('/auth/refresh', async (request, reply) => {
    if (!request.body) {
      return reply.status(400).send({ message: 'O corpo da requisição é obrigatório.' });
    }

    const { refreshToken } = refreshTokenSchema.parse(request.body);

    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return reply.status(401).send({ message: 'Refresh token inválido ou expirado.' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, storedToken.userId));

    const newToken = app.jwt.sign(
      { role: user.role },
      { sub: user.id, expiresIn: '15m' }
    );

    return reply.send({ token: newToken });
  });
}