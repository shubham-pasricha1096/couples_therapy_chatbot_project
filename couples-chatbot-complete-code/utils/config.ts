import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  webhookUrl?: string;
  webhookSecret?: string;
  telegramToken: string;
  botUsername: string;
  openRouterApiKey: string;
  databaseUrl: string;
  redisUrl?: string;
  messageSecret?: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  webhookUrl: process.env.WEBHOOK_URL,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: process.env.BOT_USERNAME || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL,
  messageSecret: process.env.MESSAGE_SECRET
};

const requiredVars: (keyof NodeJS.ProcessEnv)[] = [
  'TELEGRAM_BOT_TOKEN',
  'OPENROUTER_API_KEY',
  'DATABASE_URL',
  'REDIS_URL'
];

requiredVars.forEach(v => {
  if (!process.env[v]) {
    console.warn(`⚠️ Warning: Environment variable ${v} is missing!`);
  }
});

if (!config.webhookSecret) {
  console.warn('⚠️ TELEGRAM_WEBHOOK_SECRET is not set. Webhook endpoints are unauthenticated.');
}

export default config;
