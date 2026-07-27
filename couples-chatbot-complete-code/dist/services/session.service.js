"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = getSession;
exports.saveSession = saveSession;
exports.deleteSession = deleteSession;
exports.getUserSession = getUserSession;
exports.saveUserSession = saveUserSession;
exports.deleteUserSession = deleteUserSession;
const redis_1 = require("redis");
const config_1 = __importDefault(require("../utils/config"));
const client = (0, redis_1.createClient)({
    url: config_1.default.redisUrl,
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
        ...(config_1.default.redisUrl?.startsWith('rediss://') ? { tls: true } : {})
    }
});
client.on('error', (err) => console.error('❌ Redis Error:', err));
async function connect() {
    if (!client.isOpen) {
        console.log('🔄 Connecting to Redis...');
        try {
            await client.connect();
            console.log('✅ Redis Connected');
        }
        catch (err) {
            console.error('❌ Redis Connection Failed:', err);
            throw err;
        }
    }
}
async function getSession(code) {
    await connect();
    const data = await client.get(`session:${code}`);
    return data ? JSON.parse(data) : null;
}
async function saveSession(code, data) {
    await connect();
    await client.set(`session:${code}`, JSON.stringify(data), {
        EX: 86400 // 24 hours
    });
}
async function deleteSession(code) {
    await connect();
    await client.del(`session:${code}`);
}
async function getUserSession(userId) {
    await connect();
    return await client.get(`user:${userId}`);
}
async function saveUserSession(userId, code) {
    await connect();
    await client.set(`user:${userId}`, code, {
        EX: 86400
    });
}
async function deleteUserSession(userId) {
    await connect();
    await client.del(`user:${userId}`);
}
