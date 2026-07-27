"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
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
const requiredVars = [
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
exports.default = config;
