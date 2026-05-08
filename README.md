# Couples Therapy Chatbot Project

AI-powered Telegram chatbot that helps couples create private shared sessions and receive neutral, supportive relationship mediation.

## Demo

The bot runs as a Telegram webhook service.

1. Start the server.
2. Open your Telegram bot.
3. Send `/create` to generate a session code, invite link, and QR code.
4. Share the invite link with your partner.
5. Each partner can message the bot privately and receive AI-mediated responses.

Health check:

```bash
GET /health
```

Session invite page:

```bash
GET /join/:sessionCode
```

QR code image:

```bash
GET /qr/:sessionCode
```

## Features

- Telegram bot webhook integration
- Couple session creation with unique session codes
- Partner invite links and QR code generation
- Private AI mediator responses for each partner
- Privacy-aware prompt rules that avoid revealing one partner's private messages to the other
- Emotion and conflict detection helpers
- MongoDB storage for sessions and messages
- Redis cache for recent conversation history
- Session status and leave commands
- Environment-based configuration

## Tech Stack

- Node.js
- Express
- Telegram Bot API
- OpenRouter chat completions API
- MongoDB with Mongoose
- Redis
- Axios
- QRCode
- dotenv
- Winston

## Installation

Clone the repository:

```bash
git clone https://github.com/shubham-pasricha1096/couples_therapy_chatbot_project.git
cd couples_therapy_chatbot_project
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Fill in the required values in `.env`.

Initialize the database if needed:

```bash
npm run db:init
```

Start the app:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file based on `.env.example`.

```env
DATABASE_URL=
OPENROUTER_API_KEY=
MONGO_URI=
TELEGRAM_BOT_TOKEN=
BOT_USERNAME=
PORT=
WEBHOOK_URL=
REDIS_URL=
```

Variable notes:

- `OPENROUTER_API_KEY`: API key used for AI mediator responses.
- `MONGO_URI`: MongoDB connection string.
- `TELEGRAM_BOT_TOKEN`: Token from BotFather.
- `BOT_USERNAME`: Telegram bot username without `@`.
- `PORT`: Server port. Defaults to `3000`.
- `WEBHOOK_URL`: Public HTTPS URL used to register `/webhook` with Telegram.
- `REDIS_URL`: Redis connection string for session and recent chat cache.
- `DATABASE_URL`: PostgreSQL connection string for legacy or optional database scripts.

## Usage

Telegram commands:

```text
/start - show welcome message or join a session when used with a session code
/create - create a new couple session
/status - view current session status
/leave - end the session and clear stored chat data
/help - show available commands
```

Main server routes:

```text
GET  /health
GET  /join/:sessionCode
GET  /qr/:sessionCode
POST /webhook
```

When `WEBHOOK_URL` is set, the app automatically registers:

```text
WEBHOOK_URL/webhook
```

## TODO

- Add automated tests for Telegram command flows
- Add deployment examples for common hosting providers
- Add Docker Compose setup for MongoDB and Redis
- Improve session expiration and cleanup jobs
- Add admin-safe observability for webhook errors
- Review and remove legacy commented code

## License

ISC
