const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // your OpenRouter API key
  baseURL: "https://openrouter.ai/api/v1" // fixed camelCase
});

async function generateSummary(messages) {

  const prompt = `
Summarize this couple conversation neutrally.

Do not blame anyone.
Focus on both perspectives.

Messages:
${messages}
`;

  const response = await client.chat.completions.create({
    model: "arcee-ai/trinity-large-preview:free",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
}

module.exports = generateSummary;