# Couples Therapy Chatbot (Refactored)

A compassionate, neutral relationship counselor bot designed to help couples navigate conflicts, improve communication, and build empathy. This project has been refactored for high scalability, security, and type safety.

## Project Overview

### Technologies
- **Language:** TypeScript
- **Backend:** Node.js (Express)
- **Bot Platform:** Telegram Bot API
- **AI Models:** Accessed via OpenRouter (e.g., NVIDIA Nemotron)
- **Database:** PostgreSQL (with `pgvector` for RAG)
- **Session Store:** Redis (asynchronous, scalable)
- **Testing:** Jest

### Architecture
- `couples-chatbot.ts`: Main entry point handling Telegram webhooks and command processing.
- `ai/`: Modular logic for emotion detection, conflict analysis, and prompt construction.
- `services/`:
  - `ai.service.ts`: Centralized AI completion client.
  - `session.service.ts`: Redis-backed session management.
  - `safety.service.ts`: Comprehensive crisis detection and de-escalation logic.
  - `messageStore.ts`: PostgreSQL message persistence.
  - `vectorMemory.service.ts`: Embedding generation and RAG (vector search).
- `database/`: Type-safe database connection pool.
- `utils/`: Centralized configuration and encryption utilities.

## Building and Running

### Prerequisites
- Node.js 18+
- PostgreSQL (with `pgvector` extension)
- Redis
- A Telegram Bot Token
- An OpenRouter API Key

### Installation
```bash
npm install
npm run build
```

### Database Setup
Run the following script to initialize the schema and enable `pgvector`:
```bash
node scripts/setup-db.js
```

### Environment Setup
Create a `.env` file in the root directory based on `.env.example`.

### Running the Project
- **Production:** `npm start`
- **Development:** `npm run dev` (requires `nodemon` and `ts-node`)
- **Testing:** `npm test`

## Development Conventions

- **Type Safety:** All new code must be written in TypeScript. Avoid `any` where possible.
- **Safety First:** All incoming messages are automatically processed by the `SafetyService`. Crisis patterns (violence, suicide, abuse) trigger immediate professional resource referrals.
- **RAG Integration:** All partner messages are indexed via embeddings. The AI utilizes relevant past context for more informed mediation.
- **Neutrality:** The AI maintains an impartial stance, reframing issues neutrally and encouraging dialogue.
- **Encryption:** Sensitive message content should be considered for encryption before persistence.
- **Testing:** Core logic and security features must be accompanied by unit tests in the `tests/` directory.
