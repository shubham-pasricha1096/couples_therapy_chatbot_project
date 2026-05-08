// services/messageStore.js
const Message = require("../models/Message");

async function saveMessage({ sessionId, sender, content, emotion, conflictLevel }) {
  if (!sessionId) {
    throw new Error("sessionId is required to save a message.");
  }
  if (sender === undefined || sender === null) {
    throw new Error("sender is required to save a message.");
  }
  if (!content) {
    throw new Error("content is required to save a message.");
  }

  try {
    const message = await Message.create({
      sessionId,
      sender,
      content,
      emotion,
      conflictLevel
    });

    return message;
  } catch (err) {
    console.error("Error saving message:", err);
    throw err;
  }
}

module.exports = saveMessage;