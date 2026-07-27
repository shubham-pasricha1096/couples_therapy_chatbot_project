import config from './utils/config';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import QRCode from 'qrcode';
import crypto from 'crypto';
import path from 'path';
import pool from './database/db';
import { saveMessage } from './services/messageStore';
import { callAI, ChatMessage } from './services/ai.service';

import { detectEmotion } from './ai/emotion';
import { detectConflict } from './ai/conflict';
import { applyGuardrails } from './ai/guardrails';
import { safetyService } from './services/safety';

import * as sessionService from './services/session.service';

import { storeMessageEmbedding, findSimilarMessages } from './services/vectorMemory.service';

const TELEGRAM_BOT_TOKEN = config.telegramToken;
const BOT_USERNAME = config.botUsername;
const PORT = config.port;
const WEBHOOK_URL = config.webhookUrl;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

function generateSessionCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function createSession(relationshipId: number): sessionService.SessionData {
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

function getPartnerId(session: sessionService.SessionData, userId: number): 'partner1' | 'partner2' | null {
  if (session.partner1 === userId) return 'partner1';
  if (session.partner2 === userId) return 'partner2';
  return null;
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    }
  );
}

app.get('/qr/:sessionCode', async (req: Request, res: Response) => {
  const { sessionCode } = req.params;
  const botLink = `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;
  const qr = await QRCode.toBuffer(botLink);
  res.type('png').send(qr);
});

app.get('/join/:sessionCode', (req: Request, res: Response) => {
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

app.post('/webhook', webhookLimiter, async (req: Request, res: Response) => {
  try {
    if (config.webhookSecret) {
      const secretTokenHeader = req.headers['x-telegram-bot-api-secret-token'];
      if (secretTokenHeader !== config.webhookSecret) {
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
        await sendTelegramMessage(
          chatId,
          `👋 Hi ${firstName}\n\nUse /create to start a couples session.\n\nCommands:\n/create\n/status\n/leave\n/help`
        );
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
      } else if (!session.partner2) {
        session.partner2 = userId;
        session.partner2Name = firstName;
        await pool.query(
          `UPDATE relationships
          SET partner2 = $1
          WHERE relationship_code = $2`,
          [userId, sessionCode]
        );
      } else {
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
      
      const result = await pool.query(
        `INSERT INTO relationships
        (relationship_code, partner1)
        VALUES ($1, $2)
        RETURNING id`,
        [sessionCode, userId]
      );

      const relationshipId = result.rows[0].id;
      const session = createSession(relationshipId);
      session.partner1 = userId;
      session.partner1Name = firstName;

      await sessionService.saveSession(sessionCode, session);
      await sessionService.saveUserSession(userId, sessionCode);

      const joinUrl = `${WEBHOOK_URL}/join/${sessionCode}`;
      await sendTelegramMessage(
        chatId,
        `✅ Session Created\n\nCode: ${sessionCode}\n\nShare this link with your partner:\n${joinUrl}`
      );
      return res.sendStatus(200);
    }

    if (command === '/status') {
      const sessionCode = await sessionService.getUserSession(userId);
      if (!sessionCode) {
        await sendTelegramMessage(chatId, 'You are not in a session.');
        return res.sendStatus(200);
      }
      const session = await sessionService.getSession(sessionCode);
      if (!session) return res.sendStatus(200);

      const partnerId = getPartnerId(session, userId);
      const msgCount = partnerId ? (session.history[partnerId]?.length || 0) : 0;

      await sendTelegramMessage(
        chatId,
        `Session Code: ${sessionCode}\n\nMessages Sent: ${msgCount}\n\nPartner1: ${session.partner1Name || 'Waiting'}\nPartner2: ${session.partner2Name || 'Waiting'}`
      );
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
          } else {
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
      await sendTelegramMessage(
        chatId,
        'Commands:\n\n/create - start session\n/status - view session\n/leave - exit session'
      );
      return res.sendStatus(200);
    }

    const sessionCode = await sessionService.getUserSession(userId);
    if (!sessionCode) {
      await sendTelegramMessage(chatId, 'Join or create a session first with /create');
      return res.sendStatus(200);
    }

    const session = await sessionService.getSession(sessionCode);
    if (!session) return res.sendStatus(200);

    const partnerId = getPartnerId(session, userId);
    
    if (!partnerId) {
       await sendTelegramMessage(chatId, 'You are not part of this session.');
       return res.sendStatus(200);
    }

    const history = [
      ...session.history.partner1.slice(-5),
      ...session.history.partner2.slice(-5)
    ];

    const emotion = detectEmotion(messageText);
    const conflictLevel = detectConflict(messageText);

    const safetyResult = safetyService.checkMessage(messageText);

    const messageId = await saveMessage(
      session.relationshipId,
      userId,
      emotion,
      conflictLevel,
      messageText,
      {
        isCrisis: safetyResult.isCrisis,
        crisisType: safetyResult.crisisType,
        isEscalation: safetyResult.isEscalation,
        severity: safetyResult.severity
      }
    );

    if (safetyResult.isCrisis) {
      const crisisMsg = safetyService.getCrisisResponse(safetyResult.crisisType);
      await sendTelegramMessage(chatId, crisisMsg);
      return res.sendStatus(200);
    }

    if (messageId) {
      storeMessageEmbedding(messageId, messageText).catch(console.error);
    }

    const similarMessages = await findSimilarMessages(session.relationshipId, messageText);
    const ragContext = similarMessages.length > 0 
      ? `\n\nPast relevant context:\n${similarMessages.join('\n')}`
      : '';

    let processedMessage = messageText + ragContext;
    if (safetyResult.isEscalation) {
      processedMessage = safetyService.getDeEscalationPrompt(messageText) + ragContext;
    }

    const aiReply = await callAI(history, processedMessage);
    const safeReply = applyGuardrails(aiReply);

    const userEntry: ChatMessage = { role: 'user', content: messageText };
    const assistantEntry: ChatMessage = { role: 'assistant', content: safeReply };

    session.history[partnerId].push(userEntry);
    session.history[partnerId].push(assistantEntry);
    session.history[partnerId] = session.history[partnerId].slice(-20);

    await sessionService.saveSession(sessionCode, session);

    await sendTelegramMessage(chatId, safeReply);
    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function setWebhook(url: string, secret?: string): Promise<void> {
  try {
    const payload: { url: string; secret_token?: string } = { url: `${url}/webhook` };
    if (secret) {
      payload.secret_token = secret;
    }
    const resp = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      payload
    );
    console.log('Webhook set:', resp.data);
  } catch (err: any) {
    console.log('Webhook error:', err.response?.data || err.message);
  }
}

app.listen(PORT, async () => {
  console.log('Server running on port', PORT);
  
  // Pre-connect to Redis to avoid first-request timeout
  try {
    console.log('🔄 Initializing Redis connection...');
    await sessionService.getSession('startup_check');
  } catch (err) {
    console.error('❌ Redis initialization failed');
  }

  if (WEBHOOK_URL) {
    await setWebhook(WEBHOOK_URL, config.webhookSecret);
  }
});
