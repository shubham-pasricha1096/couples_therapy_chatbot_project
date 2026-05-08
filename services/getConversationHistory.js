const Message = require("../models/Message");

async function getConversationHistory(sessionId, limit = 10) {

  const messages = await Message.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse(); // oldest → newest

}

module.exports = getConversationHistory;