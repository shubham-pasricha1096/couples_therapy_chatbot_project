const mongoose = require("../database/mongo");

const messageSchema = new mongoose.Schema({
  sessionId: String,
  sender: Number,
  content: String,
  emotion: String,
  conflictLevel: String
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);