const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // your OpenRouter API key
  baseURL: "https://openrouter.ai/api/v1" // fixed camelCase
});

async function createEmbedding(text) {

  const response = await client.embeddings.create({
    model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
    input: text
  });

  return response.data[0].embedding;
}

module.exports = createEmbedding;