"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./utils/config"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const axios_1 = __importDefault(require("axios"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./database/db"));
const messageStore_1 = require("./services/messageStore");
const ai_service_1 = require("./services/ai.service");
const emotion_1 = require("./ai/emotion");
const conflict_1 = require("./ai/conflict");
const guardrails_1 = require("./ai/guardrails");
const safety_1 = require("./services/safety");
const sessionService = __importStar(require("./services/session.service"));
const vectorMemory_service_1 = require("./services/vectorMemory.service");
const TELEGRAM_BOT_TOKEN = config_1.default.telegramToken;
const BOT_USERNAME = config_1.default.botUsername;
const PORT = config_1.default.port;
const WEBHOOK_URL = config_1.default.webhookUrl;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
const webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
function generateSessionCode() {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
}
function createSession(relationshipId) {
    return {
        partner1: null,
        partner1Name: null,
        partner2: null,
        partner2Name: null,
        history: { partner1: [], partner2: [] },
        createdAt: new Date().toISOString(),
        relationshipId
    };
}
function getPartnerId(session, userId) {
    if (session.partner1 === userId)
        return 'partner1';
    if (session.partner2 === userId)
        return 'partner2';
    return null;
}
async function sendTelegramMessage(chatId, text) {
    await axios_1.default.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
    });
}
app.get('/qr/:sessionCode', async (req, res) => {
    const { sessionCode } = req.params;
    const botLink = `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;
    const qr = await qrcode_1.default.toBuffer(botLink);
    res.type('png').send(qr);
});
app.get('/join/:sessionCode', (req, res) => {
    const { sessionCode } = req.params;
    const botLink = `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;
    res.send(`
  <html>
  <body style="font-family:sans-serif;text-align:center;padding:40px">
  <h2>Join Couples Therapy Session</h2>
  <p>Session Code: <b>${sessionCode}</b></p>
  <img src="/qr/${sessionCode}" width="250"/>
  <br><br>
  <a href="${botLink}">Open in Telegram</a>
  </body>
  </html>
  `);
});
app.post('/webhook', webhookLimiter, async (req, res) => {
    try {
        if (config_1.default.webhookSecret) {
            const secretTokenHeader = req.headers['x-telegram-bot-api-secret-token'];
            if (secretTokenHeader !== config_1.default.webhookSecret) {
                console.warn('⚠️ Webhook request rejected: Invalid or missing secret token.');
                return res.sendStatus(403);
            }
        }
        const update = req.body;
        if (!update.message || !update.message.text) {
            return res.sendStatus(200);
        }
        const chatId = update.message.chat.id;
        const userId = update.message.from.id;
        const firstName = update.message.from.first_name || 'User';
        const messageText = update.message.text.trim();
        const command = messageText.split(' ')[0].split('@')[0];
        console.log('Message:', messageText);
        if (command === '/start') {
            const parts = messageText.split(' ');
            if (parts.length === 1) {
                await sendTelegramMessage(chatId, `👋 Hi ${firstName}\n\nUse /create to start a couples session.\n\nCommands:\n/create\n/status\n/leave\n/help`);
                return res.sendStatus(200);
            }
            const sessionCode = parts[1];
            const session = await sessionService.getSession(sessionCode);
            if (!session) {
                await sendTelegramMessage(chatId, 'Session not found.');
                return res.sendStatus(200);
            }
            if (!session.partner1) {
                session.partner1 = userId;
                session.partner1Name = firstName;
            }
            else if (!session.partner2) {
                session.partner2 = userId;
                session.partner2Name = firstName;
                await db_1.default.query(`UPDATE relationships
          SET partner2 = $1
          WHERE relationship_code = $2`, [userId, sessionCode]);
            }
            else {
                await sendTelegramMessage(chatId, 'Session full.');
                return res.sendStatus(200);
            }
            await sessionService.saveSession(sessionCode, session);
            await sessionService.saveUserSession(userId, sessionCode);
            await sendTelegramMessage(chatId, 'You joined the session.');
            return res.sendStatus(200);
        }
        if (command === '/create') {
            const sessionCode = generateSessionCode();
            const result = await db_1.default.query(`INSERT INTO relationships
        (relationship_code, partner1)
        VALUES ($1, $2)
        RETURNING id`, [sessionCode, userId]);
            const relationshipId = result.rows[0].id;
            const session = createSession(relationshipId);
            session.partner1 = userId;
            session.partner1Name = firstName;
            await sessionService.saveSession(sessionCode, session);
            await sessionService.saveUserSession(userId, sessionCode);
            const joinUrl = `${WEBHOOK_URL}/join/${sessionCode}`;
            await sendTelegramMessage(chatId, `✅ Session Created\n\nCode: ${sessionCode}\n\nShare this link with your partner:\n${joinUrl}`);
            return res.sendStatus(200);
        }
        if (command === '/status') {
            const sessionCode = await sessionService.getUserSession(userId);
            if (!sessionCode) {
                await sendTelegramMessage(chatId, 'You are not in a session.');
                return res.sendStatus(200);
            }
            const session = await sessionService.getSession(sessionCode);
            if (!session)
                return res.sendStatus(200);
            const partnerId = getPartnerId(session, userId);
            const msgCount = partnerId ? (session.history[partnerId]?.length || 0) : 0;
            await sendTelegramMessage(chatId, `Session Code: ${sessionCode}\n\nMessages Sent: ${msgCount}\n\nPartner1: ${session.partner1Name || 'Waiting'}\nPartner2: ${session.partner2Name || 'Waiting'}`);
            return res.sendStatus(200);
        }
        if (command === '/leave') {
            const sessionCode = await sessionService.getUserSession(userId);
            if (!sessionCode) {
                await sendTelegramMessage(chatId, 'You are not in a session.');
                return res.sendStatus(200);
            }
            const session = await sessionService.getSession(sessionCode);
            if (session) {
                const partnerId = getPartnerId(session, userId);
                if (partnerId) {
                    if (partnerId === 'partner1') {
                        session.partner1 = null;
                        session.partner1Name = null;
                    }
                    else {
                        session.partner2 = null;
                        session.partner2Name = null;
                    }
                    await sessionService.saveSession(sessionCode, session);
                }
            }
            await sessionService.deleteUserSession(userId);
            await sendTelegramMessage(chatId, 'You left the session.');
            return res.sendStatus(200);
        }
        if (command === '/help') {
            await sendTelegramMessage(chatId, 'Commands:\n\n/create - start session\n/status - view session\n/leave - exit session');
            return res.sendStatus(200);
        }
        const sessionCode = await sessionService.getUserSession(userId);
        if (!sessionCode) {
            await sendTelegramMessage(chatId, 'Join or create a session first with /create');
            return res.sendStatus(200);
        }
        const session = await sessionService.getSession(sessionCode);
        if (!session)
            return res.sendStatus(200);
        const partnerId = getPartnerId(session, userId);
        if (!partnerId) {
            await sendTelegramMessage(chatId, 'You are not part of this session.');
            return res.sendStatus(200);
        }
        const history = [
            ...session.history.partner1.slice(-5),
            ...session.history.partner2.slice(-5)
        ];
        const emotion = (0, emotion_1.detectEmotion)(messageText);
        const conflictLevel = (0, conflict_1.detectConflict)(messageText);
        const safetyResult = safety_1.safetyService.checkMessage(messageText);
        const messageId = await (0, messageStore_1.saveMessage)(session.relationshipId, userId, emotion, conflictLevel, messageText, {
            isCrisis: safetyResult.isCrisis,
            crisisType: safetyResult.crisisType,
            isEscalation: safetyResult.isEscalation,
            severity: safetyResult.severity
        });
        if (safetyResult.isCrisis) {
            const crisisMsg = safety_1.safetyService.getCrisisResponse(safetyResult.crisisType);
            await sendTelegramMessage(chatId, crisisMsg);
            return res.sendStatus(200);
        }
        if (messageId) {
            (0, vectorMemory_service_1.storeMessageEmbedding)(messageId, messageText).catch(console.error);
        }
        const similarMessages = await (0, vectorMemory_service_1.findSimilarMessages)(session.relationshipId, messageText);
        const ragContext = similarMessages.length > 0
            ? `\n\nPast relevant context:\n${similarMessages.join('\n')}`
            : '';
        let processedMessage = messageText + ragContext;
        if (safetyResult.isEscalation) {
            processedMessage = safety_1.safetyService.getDeEscalationPrompt(messageText) + ragContext;
        }
        const aiReply = await (0, ai_service_1.callAI)(history, processedMessage);
        const safeReply = (0, guardrails_1.applyGuardrails)(aiReply);
        const userEntry = { role: 'user', content: messageText };
        const assistantEntry = { role: 'assistant', content: safeReply };
        session.history[partnerId].push(userEntry);
        session.history[partnerId].push(assistantEntry);
        session.history[partnerId] = session.history[partnerId].slice(-20);
        await sessionService.saveSession(sessionCode, session);
        await sendTelegramMessage(chatId, safeReply);
        res.sendStatus(200);
    }
    catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});
async function setWebhook(url, secret) {
    try {
        const payload = { url: `${url}/webhook` };
        if (secret) {
            payload.secret_token = secret;
        }
        const resp = await axios_1.default.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, payload);
        console.log('Webhook set:', resp.data);
    }
    catch (err) {
        console.log('Webhook error:', err.response?.data || err.message);
    }
}
app.listen(PORT, async () => {
    console.log('Server running on port', PORT);
    // Pre-connect to Redis to avoid first-request timeout
    try {
        console.log('🔄 Initializing Redis connection...');
        await sessionService.getSession('startup_check');
    }
    catch (err) {
        console.error('❌ Redis initialization failed');
    }
    if (WEBHOOK_URL) {
        await setWebhook(WEBHOOK_URL, config_1.default.webhookSecret);
    }
});
