import { createClient } from 'redis';
import config from '../utils/config';

const client = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    ...(config.redisUrl?.startsWith('rediss://') ? { tls: true } : {})
  }
});

client.on('error', (err) => console.error('❌ Redis Error:', err));

async function connect() {
  if (!client.isOpen) {
    console.log('🔄 Connecting to Redis...');
    try {
      await client.connect();
      console.log('✅ Redis Connected');
    } catch (err) {
      console.error('❌ Redis Connection Failed:', err);
      throw err;
    }
  }
}

export interface SessionData {
  partner1: number | null;
  partner1Name: string | null;
  partner2: number | null;
  partner2Name: string | null;
  history: { partner1: any[]; partner2: any[] };
  createdAt: string;
  relationshipId: number;
}

export async function getSession(code: string): Promise<SessionData | null> {
  await connect();
  const data = await client.get(`session:${code}`);
  return data ? JSON.parse(data) : null;
}

export async function saveSession(code: string, data: SessionData): Promise<void> {
  await connect();
  await client.set(`session:${code}`, JSON.stringify(data), {
    EX: 86400 // 24 hours
  });
}

export async function deleteSession(code: string): Promise<void> {
  await connect();
  await client.del(`session:${code}`);
}

export async function getUserSession(userId: number): Promise<string | null> {
  await connect();
  return await client.get(`user:${userId}`);
}

export async function saveUserSession(userId: number, code: string): Promise<void> {
  await connect();
  await client.set(`user:${userId}`, code, {
    EX: 86400
  });
}

export async function deleteUserSession(userId: number): Promise<void> {
  await connect();
  await client.del(`user:${userId}`);
}
