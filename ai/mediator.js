const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // your OpenRouter API key
  baseURL: "https://openrouter.ai/api/v1" // fixed camelCase
});

async function getMediatorResponse(prompt) {
  const response = await client.chat.completions.create({
    model: "arcee-ai/trinity-large-preview:free", // make sure this model exists in OpenRouter
    messages: [
      { role: "system", content: prompt }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = getMediatorResponse;