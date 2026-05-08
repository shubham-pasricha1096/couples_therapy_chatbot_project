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
- Safety checks for crisis, abuse, and self-harm related content.
- Guided relationship exercises by category.
- Dashboard for pairing status, navigation, and account actions.
- PostgreSQL database schema managed with Prisma.

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
git clone https://github.com/shubham-pasricha1096/couples_therapy_chatbot.git
cd couples_therapy_chatbot
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

## Environment Variables

Create a `.env.local` file in the project root and add:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource-name.openai.azure.com"
AZURE_OPENAI_API_VERSION="2024-08-01-preview"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"
```

`AZURE_OPENAI_API_VERSION` and `AZURE_OPENAI_DEPLOYMENT_NAME` have defaults in code, but setting them explicitly is recommended.

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

## TODO

- Deploy the app to a production hosting provider.
- Add a production migration workflow for Prisma.
- Add automated tests for auth, pairing, chat, and safety flows.
- Improve exercise completion tracking in the UI.
- Add rate limiting and monitoring for production API routes.
- Add a formal privacy policy and crisis resource page.
