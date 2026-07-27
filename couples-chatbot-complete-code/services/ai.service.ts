import axios from 'axios';
import config from '../utils/config';

const SYSTEM_PROMPT = `You are a compassionate neutral relationship counselor.

Rules:
- Never take sides
- Validate both perspectives
- Ask clarifying questions
- Encourage empathy
- Keep responses short (2-3 paragraphs)
`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callAI(history: ChatMessage[], message: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message }
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: messages,
        max_tokens: 400
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (err: any) {
    console.log('AI error', err.response?.data || err.message);
    return "I'm here to listen. Could you share more about what you're feeling?";
  }
}
