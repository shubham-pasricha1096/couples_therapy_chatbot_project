// couples-chatbot.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');
const crypto = require('crypto');
// const fs = require('fs');
const path = require('path');
const saveMessage = require("./services/messageStore");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BOT_USERNAME = process.env.BOT_USERNAME;
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
// const getRelationship = require("./services/sessionManager");
const getSession = require("./services/sessionManager");
const getConversationHistory = require("./services/getConversationHistory");
const detectEmotion = require("./ai/emotion");
const detectConflict = require("./ai/conflict");
// const buildPrompt = require("./ai/promptBuilder");
const { saveSession, getSession: getRedisSession, deleteSession } = require("./services/redisSession");
const Session = require("./models/Session");
const Message = require("./models/Message");
require("./database/mongo");

// const sessions = new Map();
// const userSessions = new Map();

const SYSTEM_PROMPT = `You are a compassionate neutral relationship counselor.

Rules:
- Never take sides
- Validate both perspectives
- Ask clarifying questions
- Encourage empathy
- Keep responses short (2-3 paragraphs)
`;

const AI_FALLBACK_MESSAGE = "I'm here to listen. Could you share more about what you're feeling?";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// async function ensureSchema() {
//   const schemaPath = path.join(__dirname, "database", "schema.sql");
//   const schemaSql = fs.readFileSync(schemaPath, "utf8");

//   await pool.query(schemaSql);
//   console.log("PostgreSQL schema is ready.");
// }

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

function generateSessionCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// function createSession() {
//   return {
//     partner1: null,
//     partner1Name: null,
//     partner2: null,
//     partner2Name: null,
//     history: { partner1: [], partner2: [] },
//     createdAt: new Date().toISOString()
//   };
// }

function getPartnerId(session, userId) {
  if (!session) return null;
  if (session.partner1 === userId) return "partner1";
  if (session.partner2 === userId) return "partner2";
  return null;
}

// function getPartnerName(session, partnerId) {
//   return session?.[`${partnerId}Name`] || (partnerId === "partner1" ? "Partner 1" : "Partner 2");
// }

function getOtherPartnerId(partnerId) {
  return partnerId === "partner1" ? "partner2" : "partner1";
}

function buildMediatorSystemPrompt({ userName, partnerName }) {
  return `${SYSTEM_PROMPT}

Mediator context:
- You are mediating between two romantic partners in one shared session.
- You can see private conversation context from both partners.
- Never reveal, quote, or paraphrase what one partner said to the other partner.
- Do not disclose partner identity, partner names, or whether a partner joined through a link unless the current user already stated that information in the current message.
- Do not claim you cannot access the partner's messages when session context is available.
- Respond privately to the current user with neutral guidance.
- Do not guess names or facts. If a name is unknown, say so briefly instead of assuming.
- Use the known names when they are provided.
- Output only the final message to the user.
- Do not include labels such as "counselor ->", "private reply", "Counselor response", or any other internal formatting.
- Respond only to the user who is speaking now.
- Respond naturally like a supportive mediator.
- Avoid repetitive therapy phrasing or rigid templates.

Session facts:
- User speaking now: ${userName || "Unknown"}
- Partner name on file: ${partnerName || "Unknown"}

If the user asks for their partner's identity or name, do not reveal it. Give a privacy-preserving answer and redirect to relationship support.`;
}

// function buildMediatorContext(session) {
//   const combinedHistory = [
//     ...session.history.partner1,
//     ...session.history.partner2
//   ];

  // return combinedHistory
  //   .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
  //   .slice(-12)
  //   .map((entry) => ({
  //     role: entry.role,
  //     content: entry.content
  //   }));


// function appendConversationTurn(session, partnerId, userName, userMessage, aiReply) {
//   const partnerName = getPartnerName(session, partnerId);
//   const timestamp = new Date().toISOString();
//   const otherPartnerName = getPartnerName(session, getOtherPartnerId(partnerId));

//   const updatedHistory = [
//     ...session.history[partnerId],
//     {
//       role: "user",
//       content: `Session note: ${partnerName} said privately: "${userMessage}"`,
//       timestamp
//     },
//     {
//       role: "assistant",
//       content: `Session note: The counselor replied privately to ${partnerName} without quoting ${otherPartnerName}.`,
//       timestamp
//     }
//   ];

//   session.history[partnerId] = updatedHistory.slice(-20);
// }

function sanitizeAIReply(aiReply) {
  if (!aiReply) return AI_FALLBACK_MESSAGE;

  const cleaned = aiReply
    .replace(/^(counselor\s*->.*|private reply.*|counselor response.*|partner \d+ recent messages:.*)$/gim, "")
    .replace(/\b(counselor\s*->|private reply to|counselor response to)\b/gi, "")
    .replace(/\bpartner\d+\b/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || AI_FALLBACK_MESSAGE;
}

async function sendTelegramMessage(chatId, text) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
      parse_mode: "Markdown"
    }
  );
}

async function callAI(history, message, prompt) {

  const messages = [
    { role: "system", content: prompt },
    ...history,
    { role: "user", content: message }
  ];

  try {

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "arcee-ai/trinity-large-preview:free",
        messages: messages,
        max_tokens: 400
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return sanitizeAIReply(response?.data?.choices?.[0]?.message?.content);

  } catch (err) {

    console.log("AI error", err.response?.data || err.message);
    return AI_FALLBACK_MESSAGE;
  }
}

app.get("/qr/:sessionCode", async (req, res) => {

  const { sessionCode } = req.params;

  const botLink = `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;

  const qr = await QRCode.toBuffer(botLink);

  res.type("png").send(qr);

});

app.get("/join/:sessionCode", (req, res) => {

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

app.post("/webhook", async (req, res) => {

  try {

    const update = req.body;

    if (!update.message || !update.message.text) {
      return res.sendStatus(200);
    }

    const chatId = update.message.chat.id;
    const userId = update.message?.from?.id;
    if (!userId) {
      console.log("No sender id in message");
      return res.sendStatus(200);
    }
    const firstName = update.message.from.first_name || "User";

    const messageText = update.message.text.trim();

    const command = messageText.split(" ")[0].split("@")[0];

    console.log("Saving message:", {
      sender: userId,
      content: messageText
    });

    // console.log("Message:", messageText);

    const { saveSession } = require("./services/redisSession");

    console.log(`[${userId}] ${messageText}`);

    if (command === "/start") {

      const parts = messageText.split(" ");

      await session.save();

      // ✅ ALSO update Redis
      await saveSession({
        sessionCode: session.sessionCode,
        partner1: session.partner1,
        partner2: session.partner2,
        active: session.active
      });

      if (parts.length === 1) {

        await sendTelegramMessage(
          chatId,
          `‹ Hi ${firstName}

          Use /create to start a couples session.

          Commands:
          /create
          /status
          /leave
          /help`
        );

        return res.sendStatus(200);
      }

      // const session = sessions.get(sessionCode);

      const sessionCode = parts[1];

      const session = await Session.findOne({ sessionCode });

      if (!session) {
        await sendTelegramMessage(chatId, "Session not found.");
        return res.sendStatus(200);
      }

      if (!session.partner1) {
        session.partner1 = userId;
      } else if (!session.partner2) {
        session.partner2 = userId;
      } else {
        await sendTelegramMessage(chatId, "Session full.");
        return res.sendStatus(200);
      }

      await session.save();

      await sendTelegramMessage(chatId, "You joined the session.");

      return res.sendStatus(200);
  }
        // await pool.query(
        //   `UPDATE relationships
        //   SET partner2 = $1
        //   WHERE relationship_code = $2`,
        //   [userId, sessionCode]
        // );


      // } else {

      //   await sendTelegramMessage(chatId, "Session full.");
      //   return res.sendStatus(200);
      // }

      // userSessions.set(userId, sessionCode);

    //   await sendTelegramMessage(chatId, "You joined the session.");

    //   return res.sendStatus(200);

    // const Session = require("./models/Session");

    // if (command === "/create") {
    //   const sessionCode = generateSessionCode();

    //   const session = new Session({
    //     sessionCode,
    //     partner1: userId,
    //     active: true,
    //   });
    //   await session.save();

    //  const joinUrl = `${WEBHOOK_URL}/join/${sessionCode}`;

    //  await sendTelegramMessage(
    //     chatId,
    //     `Session created!
    //     Code: ${sessionCode}
    //     Share this link with your partner:
    //     ${joinUrl}`
    //   );

    //   return res.sendStatus(200);
    // }

    if (command === "/create") {
      try {
        const sessionCode = generateSessionCode();

        // MongoDB
        await Session.create({
          sessionCode,
          partner1: userId,
          active: true
        });

        // Redis
        await saveSession({
          sessionCode,
          partner1: userId,
          partner2: null,
          active: true
        });

        const joinUrl = `${WEBHOOK_URL}/join/${sessionCode}`;
        const botLink = `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;

        await sendTelegramMessage(
          chatId,
          `Session created ✅

    Code: ${sessionCode}

    🔗 Open in Telegram:
    ${botLink}

    🌐 Share link:
    ${joinUrl}`
        );

        return res.sendStatus(200);

      } catch (err) {
        console.error(err);
        return res.sendStatus(500);
      }
    }

    // const result = await pool.query(
    //   `INSERT INTO relationships
    //   (relationship_code, partner1, active)
    //   VALUES ($1,$2,TRUE)
    //   RETURNING id`,
    //   [sessionCode, userId]
    // );

    // const relationshipId = result.rows[0].id;
    

    // const session = createSession();
    // session.partner1 = userId;
    // session.partner1Name = firstName;
    // session.relationshipId = relationshipId;

    // sessions.set(sessionCode, session);
    // userSessions.set(userId, sessionCode);

    // const joinUrl = `${WEBHOOK_URL}/join/${sessionCode}`;

    // await sendTelegramMessage(
    //   chatId,
    //   `Session created
    //   Code: ${sessionCode}
    //   Share this link with your partner:
    //   ${joinUrl}`
    // );

    // return res.sendStatus(200);
    // }

    if (command === "/status") {

    // const session = await getSession(userId);

    let session = null;

// 1. Try Redis (fast)
    const keys = await require("./cache/redisClient").keys("session:*");

    for (let key of keys) {
      const data = JSON.parse(await require("./cache/redisClient").get(key));

      if (data.partner1 === userId || data.partner2 === userId) {
        session = data;
        break;
      }
    }

    // 2. Fallback Mongo
    if (!session) {
      session = await getSession(userId);
    }

    if (!session) {
      await sendTelegramMessage(chatId, "You are not in a session.");
      return res.sendStatus(200);
    }

    await sendTelegramMessage(
      chatId,
      `Session Code: ${session.sessionCode}

    Partner1: ${session.partner1 || "Waiting"}
    Partner2: ${session.partner2 || "Waiting"}`
    );

    return res.sendStatus(200);
  }

    //   // const sessionCode = userSessions.get(userId);
    //   const session = await getSession(userId);

    //   if (!session) {
    //     await sendTelegramMessage(chatId, "Join or create a session first with /create");
    //     return res.sendStatus(200);
    //   }

    //   if (!sessionCode) {
    //     await sendTelegramMessage(chatId, "You are not in a session.");
    //     return res.sendStatus(200);
    //   }

    //   // const session = sessions.get(sessionCode);

    //   const partnerId = getPartnerId(session, userId);

    //   const msgCount =
    //     session.history?.[partnerId]?.length
    //       ? Math.floor(session.history[partnerId].length / 2)
    //       : 0;

    //   await sendTelegramMessage(
    //     chatId,
    //     `Session Code: ${sessionCode}

    //   Messages Sent: ${msgCount}

    //   Partner1: ${session.partner1Name || "Waiting"}
    //   Partner2: ${session.partner2Name || "Waiting"}`
    //   );

    //   return res.sendStatus(200);
    // }

    // if (command === "/leave") {

    //   const session = await getSession(userId);

    //   if (!session) {
    //     await sendTelegramMessage(chatId, "No active session.");
    //     return res.sendStatus(200);
    //   }

    //   await Message.deleteMany({ sessionId: session.sessionCode });

    //   session.active = false;
    //   await session.save();

    //   await sendTelegramMessage(
    //     chatId,
    //     "Session ended. Data deleted."
    //   );

    //   return res.sendStatus(200);
    // }

    if (command === "/leave") {
      const session = await getSession(userId);

      if (!session) {
        await sendTelegramMessage(chatId, "No active session.");
        return res.sendStatus(200);
      }

      // Mongo cleanup
      await Message.deleteMany({ sessionId: session.sessionCode });

      session.active = false;
      await session.save();

      // Redis cleanup ✅
      await deleteSession(session.sessionCode);

      await sendTelegramMessage(chatId, "Session ended. Data cleared.");

      return res.sendStatus(200);
    }

    // await pool.query(
    //   `DELETE FROM messages WHERE relationship_id=$1`,
    //   [relationship.id]
    // );

    // await pool.query(
    //   `UPDATE relationships
    //   SET active=false
    //   WHERE id=$1`,
    //   [relationship.id]
    // );

  //   await sendTelegramMessage(
  //     chatId,
  //     "Session ended. Conversation history deleted."
  //   );

  //   return res.sendStatus(200);
  // }

    if (command === "/help") {

      await sendTelegramMessage(
        chatId,
        `Commands:

        /create - start session
        /status - view session
        /leave - exit session`
      );

      return res.sendStatus(200);
    }

    // const sessionCode = userSessions.get(userId);

    // if (!sessionCode) {

    //   await sendTelegramMessage(
    //     chatId,
    //     "Join or create a session first with /create"
    //   );

    //   return res.sendStatus(200);
    // }

    const session = await getSession(userId);

    if (!session) {
      await sendTelegramMessage(chatId, "Join or create a session first with /create");
      return res.sendStatus(200);
    }

    // const session = sessions.get(sessionCode);

    const partnerId = getPartnerId(session, userId);

    if (!partnerId) {
      await sendTelegramMessage(chatId, "You are not part of this session.");
      return res.sendStatus(200);
    }

    const otherPartnerId = getOtherPartnerId(partnerId);

    // session[`${partnerId}Name`] = firstName;

    const aiPrompt = buildMediatorSystemPrompt({
      userName: firstName,
      partnerName: session[`${otherPartnerId}Name`] || "Unknown"
    });

    const emotion = detectEmotion(messageText);
    const conflictLevel = detectConflict(messageText);

    await saveMessage({
      sessionId: session.sessionCode,
      sender: userId,
      content: messageText,
      emotion,
      conflictLevel
    });

    // THEN fetch history
    const historyData = await getConversationHistory(session.sessionCode);

    const history = historyData.map(msg => ({
      role: msg.sender === 0 ? "assistant" : "user",
      content: msg.content
    }));

    // if (!relationship) {
    //   await sendTelegramMessage(chatId, "No active session.");
    //   return res.sendStatus(200);
    // }

    const aiReply = await callAI(history, messageText, aiPrompt);

    // await saveMessage({
    //   relationshipId: relationship.id,
    //   sender: 0,
    //   content: aiReply,
    //   emotion: "neutral",
    //   conflictLevel: "low"
    // });

    await saveMessage({
      sessionId: session.sessionCode,
      sender: 0,
      content: aiReply,
      emotion: "neutral",
      conflictLevel: "low"
    });

    // appendConversationTurn(session, partnerId, firstName, messageText, aiReply);

    await sendTelegramMessage(chatId, aiReply);

    res.sendStatus(200);

  } catch (err) {

    console.log(err);
    res.sendStatus(500);
  }

});

async function setWebhook(url) {

  try {

    const resp = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      { url: `${url}/webhook` }
    );

    console.log("Webhook set:", resp.data);

  } catch (err) {

    console.log("Webhook error:", err.response?.data || err.message);
  }
}

// setInterval(() => {

//   const now = Date.now();

//   for (const [code, session] of sessions.entries()) {

//     const age = now - new Date(session.createdAt).getTime();

//     if (age > 86400000) {

//       sessions.delete(code);

//       console.log("Session expired:", code);
//     }
//   }

// }, 3600000);

// app.listen(PORT, async () => {
//   try {
//     await pool.ready;
//     await ensureSchema();
//   } catch (err) {
//     console.error("Unable to start without PostgreSQL:", err.message);
//     process.exit(1);
//   }

  // console.log("Server running on port", PORT);

app.listen(PORT, async () => {
  console.log("Server running on port", PORT);

  if (WEBHOOK_URL) {
    await setWebhook(WEBHOOK_URL);
  }
});