# Self-Hosted Couples Therapy Chatbot - Complete System Architecture

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Design](#architecture-design)
4. [Backend Implementation](#backend-implementation)
5. [Database Design](#database-design)
6. [Deployment Guide](#deployment-guide)
7. [Scaling & Production](#scaling--production)

---

## System Overview

### What We're Building

A **self-hosted, production-ready** couples therapy chatbot with:

✅ **Full control** - Everything runs on your infrastructure  
✅ **Cost-effective** - Pay only for server & API costs  
✅ **Scalable** - Handles thousands of concurrent users  
✅ **Privacy-first** - Your data stays on your servers  
✅ **Customizable** - Modify anything you want  
✅ **Production-ready** - Includes monitoring, logging, backups  

### High-Level Flow

```
Telegram Bot
     ↓
Your Server (Node.js + Express)
     ↓
├─→ Safety Layer (Crisis Detection)
├─→ Redis (Session Management)
├─→ PostgreSQL (Message Storage)
├─→ Claude API (AI Responses)
└─→ Telegram API (Send Response)
```

---

## Technology Stack

### Core Technologies

| Component | Technology | Why? |
|-----------|-----------|------|
| **Backend** | Node.js + Express | Fast, scalable, JavaScript ecosystem |
| **Language** | TypeScript | Type safety, better DX |
| **Database** | PostgreSQL 15+ | Reliable, powerful, JSON support |
| **Cache/Sessions** | Redis 7+ | Fast session storage, pub/sub |
| **AI** | Claude API | Best-in-class language model |
| **Chat Interface** | Telegram Bot API | 700M+ users, rich features |
| **Process Manager** | PM2 | Keep server running, clustering |
| **Reverse Proxy** | Nginx | SSL, load balancing |
| **Containerization** | Docker + Docker Compose | Easy deployment, isolation |

### Optional (Recommended)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Monitoring** | Prometheus + Grafana | Metrics & dashboards |
| **Logging** | Winston + Loki | Centralized logs |
| **Error Tracking** | Sentry | Error monitoring |
| **Backups** | pg_dump + cron | Automated backups |

---

## Architecture Design

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS (443)
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                          NGINX                                   │
│              (Reverse Proxy, SSL Termination)                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP (3000)
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS APPLICATION                           │
│                      (Express Server)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MAIN ROUTES                            │  │
│  │                                                            │  │
│  │  POST /webhook/telegram  → Telegram messages             │  │
│  │  GET  /health            → Health check                  │  │
│  │  GET  /metrics           → Prometheus metrics            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MIDDLEWARE LAYERS                        │  │
│  │                                                            │  │
│  │  1. Request Validation                                    │  │
│  │  2. Rate Limiting                                         │  │
│  │  3. Authentication (Telegram signature)                   │  │
│  │  4. Logging                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  BUSINESS LOGIC                           │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Safety     │  │   Session    │  │  Neutrality  │   │  │
│  │  │   Layer      │  │   Manager    │  │   Checker    │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Command    │  │    Claude    │  │   Telegram   │   │  │
│  │  │   Handler    │  │   Service    │  │   Service    │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────┬──────────────────┬─────────┘
             │                      │                  │
             ↓                      ↓                  ↓
┌─────────────────┐    ┌─────────────────┐   ┌────────────────┐
│   POSTGRESQL    │    │      REDIS      │   │   CLAUDE API   │
│                 │    │                 │   │   (External)   │
│ • message_logs  │    │ • Sessions      │   └────────────────┘
│ • safety_events │    │ • Rate limits   │
│ • analytics     │    │ • Pub/Sub       │
└─────────────────┘    └─────────────────┘
```

### Request Flow

```
1. Telegram → Your server webhook
   ↓
2. Express middleware (validate, rate limit, log)
   ↓
3. Parse Telegram update
   ↓
4. Command Router
   ├─→ Is command? → Handle command → Send response
   └─→ Is message ↓
                  ↓
5. Safety Check (Crisis detection)
   ├─→ Crisis? → Send crisis resources → Log → End
   └─→ Safe ↓
           ↓
6. Get Session from Redis
   ↓
7. Assign Partner Role (1 or 2)
   ↓
8. Build Claude Prompt
   ↓
9. Call Claude API
   ↓
10. Neutrality Check (Bias detection & correction)
   ↓
11. Update Session History
   ↓
12. Save to Redis (24h TTL)
   ↓
13. Log to PostgreSQL
   ↓
14. Send Response to Telegram
   ↓
15. Return 200 OK to Telegram
```

---

## Backend Implementation

### Project Structure

```
couples-chatbot/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL config
│   │   ├── redis.ts             # Redis config
│   │   └── env.ts               # Environment variables
│   ├── services/
│   │   ├── safety.service.ts    # Crisis detection
│   │   ├── claude.service.ts    # Claude API integration
│   │   ├── session.service.ts   # Session management
│   │   ├── telegram.service.ts  # Telegram API
│   │   └── neutrality.service.ts # Neutrality checking
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Telegram signature validation
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── error.middleware.ts  # Error handling
│   ├── routes/
│   │   ├── webhook.routes.ts    # Telegram webhook
│   │   ├── health.routes.ts     # Health check
│   │   └── metrics.routes.ts    # Prometheus metrics
│   ├── models/
│   │   ├── message.model.ts     # Message entity
│   │   ├── session.model.ts     # Session entity
│   │   └── safetyEvent.model.ts # Safety event entity
│   ├── utils/
│   │   ├── logger.ts            # Winston logger
│   │   ├── prompts.ts           # System prompts
│   │   └── validators.ts        # Input validation
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── app.ts                   # Express app setup
├── migrations/
│   ├── 001_create_tables.sql
│   └── 002_create_indexes.sql
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── setup.sh                 # Initial setup script
│   └── backup.sh                # Backup script
├── docker-compose.yml           # Docker services
├── Dockerfile                   # App container
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

### Core Files Implementation

#### 1. `package.json`

```json
{
  "name": "couples-therapy-chatbot",
  "version": "1.0.0",
  "description": "Self-hosted couples therapy chatbot with Telegram",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "migrate": "node scripts/migrate.js",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "telegraf": "^4.15.0",
    "axios": "^1.6.2",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "joi": "^17.11.0",
    "compression": "^1.7.4",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "@types/pg": "^8.10.9",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 2. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### 3. `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: couples-chatbot-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/couples_chatbot
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - chatbot-network

  db:
    image: postgres:15-alpine
    container_name: couples-chatbot-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=couples_chatbot
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - chatbot-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: couples-chatbot-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - chatbot-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: couples-chatbot-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - chatbot-network

  # Optional: Monitoring with Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: couples-chatbot-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - chatbot-network

  # Optional: Dashboards with Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: couples-chatbot-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - chatbot-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  chatbot-network:
    driver: bridge
```

#### 4. `Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start app
CMD ["node", "dist/app.js"]
```

#### 5. `.env.example`

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook/telegram

# Claude API
ANTHROPIC_API_KEY=your_anthropic_key_here

# Database
POSTGRES_PASSWORD=your_secure_db_password
DATABASE_URL=postgresql://postgres:password@localhost:5432/couples_chatbot

# Redis
REDIS_PASSWORD=your_secure_redis_password
REDIS_URL=redis://:password@localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_256bit_encryption_key_in_hex

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
GRAFANA_PASSWORD=your_grafana_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_TTL_SECONDS=86400
```

#### 6. `src/app.ts` (Main Application)

```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { webhookRouter } from './routes/webhook.routes';
import { healthRouter } from './routes/health.routes';
import { metricsRouter } from './routes/metrics.routes';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { setTelegramWebhook } from './services/telegram.service';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.allowedOrigins,
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.use('/webhook', webhookRouter);
    this.app.use('/health', healthRouter);
    this.app.use('/metrics', metricsRouter);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();
      logger.info('Database connected');

      // Initialize Redis
      await initializeRedis();
      logger.info('Redis connected');

      // Set Telegram webhook
      await setTelegramWebhook();
      logger.info('Telegram webhook set');

      // Start server
      const server = this.app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
      });

      // Graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        logger.info(`${signal} received, starting graceful shutdown`);
        
        server.close(async () => {
          logger.info('HTTP server closed');
          
          // Close database connections
          // Close Redis connections
          
          logger.info('Graceful shutdown complete');
          process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start application', error);
      process.exit(1);
    }
  }
}

// Start application
const app = new App();
app.start();

export default app;
```

---

## Next Steps

I'll continue with the complete implementation of:
- All services (Safety, Claude, Session, Telegram, Neutrality)
- Database models and migrations
- Middleware implementation
- Testing setup
- Deployment scripts

Would you like me to continue with the complete code for all these components?
