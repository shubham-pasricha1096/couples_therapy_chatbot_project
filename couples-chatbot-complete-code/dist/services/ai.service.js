"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAI = callAI;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../utils/config"));
const SYSTEM_PROMPT = `You are a compassionate neutral relationship counselor.

Rules:
- Never take sides
- Validate both perspectives
- Ask clarifying questions
- Encourage empathy
- Keep responses short (2-3 paragraphs)
`;
async function callAI(history, message) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
    ];
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: messages,
            max_tokens: 400
        }, {
            headers: {
                'Authorization': `Bearer ${config_1.default.openRouterApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    }
    catch (err) {
        console.log('AI error', err.response?.data || err.message);
        return "I'm here to listen. Could you share more about what you're feeling?";
    }
}
