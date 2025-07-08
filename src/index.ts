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
  address: z.string()
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

app.get('/users', async (c) => {
  try {
    // Get query parameters from the URL
    const { id, name, phone, address } = c.req.query();

    // Build a 'where' clause for Prisma based on provided query parameters
    const whereClause: any = {};
    if (id) {
      whereClause.id = id;
    }
    if (name) {
      whereClause.name = name;
    }
    if (phone) {
      whereClause.phone = phone;
    }
    if (address) {
      whereClause.address = address;
    }

    // Fetch users based on the constructed 'where' clause
    const users = await prisma.user.findMany({
      where: whereClause,
    });

    console.log(users);
    return c.json({ users });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Internal Server Error' }) as Response;
  }
});

app.put('/users/:id', async (c) => {
  try {
    const { id } = c.req.param(); // Get ID from URL parameter
    console.log("Request Headers:", c.req.header());
    const body = await c.req.json(); // Get the updated data from the request body
    console.log("Validated Body:", body);

    // First, check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id as any },
    });

    if (!existingUser) {
      // If the user doesn't exist, return a 404 Not Found
      return c.json({ message: 'User not found' }, 404);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: id as any },
      data: body, // Use the validated body data for the update
    });

    console.log(updatedUser);
    // Return the updated user, typically with a 200 OK or 204 No Content
    return c.json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    // Handle validation errors or database errors
    if (error instanceof z.ZodError) { // Example for Zod validation errors
      return c.json({ message: 'Validation failed', errors: error.issues }, 400);
    }
    return c.json({ message: 'Internal Server Error' }) as Response;
  }
});

app.delete('/users/:id', async (c) => {
  try {
    const { id } = c.req.param(); // Get ID from URL parameter

    // First, check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id as any },
    });

    if (!existingUser) {
      // If the user doesn't exist, return a 404 Not Found
      return c.json({ message: 'User not found' }, 404);
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: id as any },
    });

    // On successful deletion, it's common to return a 204 No Content status,
    // indicating that the action was successful but there's no content to send back.
    // Alternatively, you could return a 200 OK with a success message.
    return c.json({ message: 'User deleted successfully' }, 200);

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

