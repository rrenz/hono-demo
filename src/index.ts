// hono-app/src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'

const prisma = new PrismaClient();

const app = new Hono();

const userschema = z.object({
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  address:z.string()
})

// Basic route
app.get('/', (c) => {
  return c.text('Hello Hono! Your app is running.');
});

// Example route to show environment variable usage (for database connection later)
app.get('/config', (c) => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbUser = process.env.DB_USER || 'user';
  const dbName = process.env.DB_NAME || 'database';

  return c.json({
    message: 'Hono app configuration:',
    db_host: dbHost,
    db_port: dbPort,
    db_user: dbUser,
    db_name: dbName,
    env_test: process.env.TEST_ENV_VAR || 'Not set'
  });
});

app.post('/users', zValidator('json',userschema),async (c) => {
  try {
    const body = await c.req.json();
    const user = await prisma.user.create({
      data: body,
    });
    console.log(user)
    return c.json({user});
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Internal Server Error' }) as Response;
  }
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});

