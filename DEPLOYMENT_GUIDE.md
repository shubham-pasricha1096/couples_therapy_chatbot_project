# Self-Hosted Deployment Guide - Couples Therapy Chatbot

## 🚀 Quick Start (30 Minutes)

### Option 1: Docker Deployment (Recommended)

**Step 1: Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Step 2: Clone & Configure**
```bash
git clone <your-repo>
cd couples-chatbot
cp .env.example .env
nano .env  # Add your API keys
```

**Step 3: Deploy**
```bash
docker-compose up -d
docker-compose logs -f
```

**Done!** Your bot is running on port 3000.

---

### Option 2: Manual Deployment

**Requirements:**
- Ubuntu 20.04+ (2GB RAM, 1 CPU)
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

**Quick Install:**
```bash
# Install everything
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib redis-server

# Setup database
sudo -u postgres psql -c "CREATE DATABASE couples_chatbot;"
sudo -u postgres psql -c "CREATE USER chatbot WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE couples_chatbot TO chatbot;"

# Clone and install
git clone <your-repo>
cd couples-chatbot
npm install
npm run build

# Configure
cp .env.example .env
nano .env

# Run with PM2
sudo npm install -g pm2
pm2 start dist/app.js --name couples-chatbot
pm2 save
pm2 startup
```

---

## 🔐 SSL Setup (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

**Check Status:**
```bash
# Docker
docker-compose ps
docker-compose logs app

# Manual
pm2 status
pm2 logs couples-chatbot
```

**Database:**
```bash
docker exec -it couples-chatbot-db psql -U postgres couples_chatbot
# Or manually:
psql -U chatbot -d couples_chatbot
```

**Redis:**
```bash
docker exec -it couples-chatbot-redis redis-cli
# Or manually:
redis-cli
AUTH your_password
KEYS session_*
```

---

## 🔧 Troubleshooting

**Bot not responding?**
```bash
# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Check logs
docker-compose logs -f app
```

**Database issues?**
```bash
# Check connection
docker exec couples-chatbot-db pg_isready

# View tables
docker exec -it couples-chatbot-db psql -U postgres couples_chatbot -c "\dt"
```

**Redis issues?**
```bash
# Test connection
docker exec couples-chatbot-redis redis-cli PING

# Check keys
docker exec couples-chatbot-redis redis-cli KEYS "*"
```

---

## 💾 Backups

**Automated Daily Backups:**
```bash
# Create backup script
cat > /home/backup_chatbot.sh << 'SCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec couples-chatbot-db pg_dump -U postgres couples_chatbot > /backups/db_$DATE.sql
docker exec couples-chatbot-redis redis-cli --rdb /data/dump.rdb
cp /var/lib/docker/volumes/couples-chatbot_redis_data/_data/dump.rdb /backups/redis_$DATE.rdb
SCRIPT

chmod +x /home/backup_chatbot.sh

# Schedule daily at 2 AM
crontab -e
# Add: 0 2 * * * /home/backup_chatbot.sh
```

---

## 📈 Scaling

**Increase Resources:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

**Load Balancer:**
```nginx
upstream chatbot_cluster {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}
```

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Strong passwords for DB and Redis
- [ ] Firewall configured (only 80, 443, SSH open)
- [ ] Regular backups enabled
- [ ] Environment variables secured
- [ ] Rate limiting enabled
- [ ] Logs rotated
- [ ] Security updates automated

---

## 📞 Support

- Check logs first: `docker-compose logs -f`
- Database issues: Check `/var/log/postgresql`
- Redis issues: Check `redis-cli INFO`
- App issues: Check `logs/app.log`

---

**Total Cost:** ~$5-20/month for VPS + ~$3-10/month for Claude API = **$8-30/month**
