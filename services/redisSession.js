const redis = require("../cache/redisClient");

//
// 🔹 SESSION FUNCTIONS
//

// Save session
async function saveSession(session) {
  const key = `session:${session.sessionCode}`;
  await redis.set(key, JSON.stringify(session));
}

// Get session
async function getSession(sessionCode) {
  const key = `session:${sessionCode}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// Delete session
async function deleteSession(sessionCode) {
  const key = `session:${sessionCode}`;
  await redis.del(key);
}

//
// 🔹 CHAT MESSAGE FUNCTIONS
//

// Save chat message
async function addMessage(sessionCode, message) {
  const key = `chat:${sessionCode}`;

  await redis.rPush(key, JSON.stringify(message));

  // keep only last 10 messages
  await redis.lTrim(key, -10, -1);
}

// Get chat history
async function getMessages(sessionCode) {
  const key = `chat:${sessionCode}`;

  const messages = await redis.lRange(key, 0, -1);

  return messages.map(msg => JSON.parse(msg));
}

// Delete chat
async function deleteMessages(sessionCode) {
  const key = `chat:${sessionCode}`;
  await redis.del(key);
}

module.exports = {
  // session
  saveSession,
  getSession,
  deleteSession,

  // chat
  addMessage,
  getMessages,
  deleteMessages
};