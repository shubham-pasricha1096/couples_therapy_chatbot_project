const mongoose = require("../database/mongo");

const sessionSchema = new mongoose.Schema({
  sessionCode: String,
  partner1: Number,
  partner2: Number,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);