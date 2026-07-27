# CoupleConnect

AI-powered couples therapy chatbot built with Next.js. CoupleConnect gives each partner a private space to talk with an AI counselor, pair with their partner, and access guided relationship exercises focused on communication, empathy, and conflict resolution.

## Demo

Live demo: Not deployed yet.

Local demo:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Features

- User signup and login with NextAuth credentials.
- Partner pairing through unique pair codes.
- Private AI counselor chat for each partner.
- Message history stored per couple.
- **Wired Safety Layer & Crisis Short-Circuit**: Real-time crisis detection (suicide, domestic violence, abuse) that bypasses AI completion to immediately dispatch official 988/hotline resources.
- **De-Escalation & Output Guardrails**: Reframes venting & high-conflict messages via system prompt injection and enforces output guardrails.
- **Audit Trail Persistence**: Safety metadata subdocument (`isCrisis`, `crisisType`, `isEscalation`, `severity`) saved to PostgreSQL database.
- Guided relationship exercises by category.
- Dashboard for pairing status, navigation, and account actions.
- PostgreSQL database schema managed with Prisma & `pgvector` RAG memory.

## Tech Stack

- Next.js 16
- React 19
- NextAuth.js
- Prisma ORM
- PostgreSQL
- Azure OpenAI / OpenAI SDK
- bcryptjs
- ESLint

## Installation

Clone the repository:

```bash
git clone https://github.com/shubham-pasricha1096/couples-therapy-ai.git
cd couples-therapy-ai
```

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply database migrations or push the Prisma schema:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

## Architecture & Systems

This repository contains two main subsystems:
1. **Next.js Web Application** (`/app`, `/lib`, `/prisma`): React 19 web interface with NextAuth, Prisma ORM, and Azure OpenAI integration.
2. **Telegram Counselor Bot** (`/couples-chatbot-complete-code`): Express/TypeScript bot service with Redis session caching, PostgreSQL `pgvector` RAG memory, OpenRouter model completions, and hardened webhook endpoints.

### Webhook Security & Rate Limiting

The Telegram Bot webhook (`POST /webhook`) includes:
- **Secret-Token Verification**: Validates incoming `x-telegram-bot-api-secret-token` headers against `TELEGRAM_WEBHOOK_SECRET`. If left unset, a startup warning is displayed and unauthenticated requests are allowed for backward compatibility.
- **Rate Limiting**: Uses `express-rate-limit` to restrict incoming requests to 60 requests per minute per IP.

## Environment Variables

Create a `.env.local` or `.env` file in the project root:

```env
# Next.js Web App
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
AZURE_OPENAI_API_VERSION="2024-08-01-preview"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"

# Telegram Counselor Bot Subsystem
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
BOT_USERNAME="your-bot-username"
TELEGRAM_WEBHOOK_SECRET="your-secret-token"
WEBHOOK_URL="https://your-domain-or-ngrok.dev"
OPENROUTER_API_KEY="your-openrouter-api-key"
REDIS_URL="redis://localhost:6379"
MESSAGE_SECRET="your-encryption-secret"
```

## Implementation Notes

- **Safety & Crisis Interventions**: Safety checks are fully wired into message storage, webhook handlers, crisis short-circuiting, de-escalation prompting, and post-processing output guardrails.
- **Legacy Code Cleanup**: Obsolete scripts (`npm run db:init`, duplicate JS session/cooldown managers) have been removed in favor of `node scripts/setup-db.js` for `pgvector` initialization.

## Usage

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Create an account or log in.
4. Share your pair code with your partner, or enter your partner's pair code.
5. After pairing, open the chat page to talk with the AI counselor.
6. Use the exercises page for guided relationship activities.

Available scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```
