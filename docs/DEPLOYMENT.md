# DEPLOYMENT.md -- Vietnam ParaSports Deployment Guide

The Vietnam ParaSports project uses Docker Compose to orchestrate 4 services:
PostgreSQL 15 Alpine, Redis Alpine, NestJS 11 API server, and Next.js 16 web client.
All containers run with non-root users.

---

## 1. VPS Requirements

| Component          | Minimum Requirement |
|-------------------|-----------------------------|
| OS                | Ubuntu 22.04+ / Debian 12+  |
| RAM               | 2 GB                        |
| CPU               | 2 cores                     |
| Disk              | 20 GB SSD                   |
| Docker            | 26+                         |
| Docker Compose    | v2 (comes with Docker)      |
| Git               | latest stable               |

Install Docker & Docker Compose on Ubuntu:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker  # or logout/login

# Verify
docker --version
docker compose version
```

---

## 2. Environment Variables Checklist

Copy the repository's `.env.example` to `.env` and fill in the actual values.
See the root README for the current Docker Compose deployment steps.

### 2.1 JWT & Security

| Variable               | Description                                   | Default Value           |
|-------------------------|-----------------------------------------------|--------------------------|
| `JWT_SECRET`            | Secret key to sign JWT tokens                 | `super-secret-key`       |
| `NEXTAUTH_SECRET`       | Secret key for NextAuth.js session encryption | `super-secret-nextauth-key-at-least-32-characters` |
| `NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET` | Key to sign signed media URLs  | Must be changed in production |
| `MEDIA_SIGNATURE_SECRET`| Server-side media signature secret for e-commerce modules | Same as above |

Generate a secure JWT secret:

```bash
openssl rand -hex 32
```

### 2.2 SMTP (Email sending)

| Variable     | Description                            | Default Value                                 |
|--------------|----------------------------------------|------------------------------------------------|
| `SMTP_HOST`  | SMTP server hostname                   | `smtp.gmail.com`                               |
| `SMTP_PORT`  | SMTP server port                       | `587`                                          |
| `SMTP_USER`  | SMTP username                          | `dummy@gmail.com`                              |
| `SMTP_PASS`  | SMTP password / app password           | `dummy`                                        |
| `SMTP_FROM`  | From address for outgoing emails       | `Vietnam ParaSports <noreply@vietnamparasports.org>` |

Note: If using Gmail, you need to create an **App Password** from Google Account Security settings.

### 2.3 URLs

| Variable              | Description                                                   | Default Value                                  |
|-----------------------|---------------------------------------------------------------|------------------------------------------------|
| `NEXTAUTH_URL`        | Public URL of the frontend (used for NextAuth callbacks)      | `https://vietnamparasports.com`                |
| `NEXT_PUBLIC_API_URL` | Public-facing API URL (used on client-side Next.js)           | `https://vietnamparasports.com/api/v1`         |
| `FRONTEND_URL`        | Frontend URL (used in API for CORS + email links)             | `https://vietnamparasports.com`                |
| `NODE_OPTIONS`        | Node.js runtime options                                       | `--dns-result-order=ipv4first` (set in compose) |

### 2.4 Google OAuth (NextAuth)

| Variable               | Description                        |
|------------------------|------------------------------------|
| `GOOGLE_CLIENT_ID`     | Google Cloud Console OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret           |

### 2.5 Internal (set in docker-compose.yml, not needed in .env)

| Variable          | Value                                                         | Where used    |
|-------------------|---------------------------------------------------------------|---------------|
| `DATABASE_URL`    | `postgresql://postgres:password123@db:5432/vn_paralympic_sport?schema=public` | API container  |
| `REDIS_HOST`      | `redis`                                                       | API container  |
| `REDIS_PORT`      | `6379`                                                        | API container  |
| `INTERNAL_API_URL`| `http://api:3001/api/v1`                                      | Web container  |

---

## 3. Production Setup -- Step by Step

### Step 1: Clone repo & setup .env

```bash
# Clone repository
git clone https://github.com/hainguyenvie/vietnam-parasport-web.git
cd vietnam-parasport-web

# Create .env from the safe template
cp .env.example .env

# Edit .env file with actual values
nano .env
```

**Important:** `NEXT_PUBLIC_API_URL` must point to your public API URL (e.g., `https://your-domain.example/api/v1`).
Docker Compose passes this variable into the Next.js image at build time through `build.args`; rebuild the web image after changing it.

### Step 2: Build images

```bash
# Build all images from scratch (no cache)
docker compose build --no-cache
```

Build process:
- `Dockerfile.api` (Node 26 bookworm-slim): installs dependencies, generates Prisma client, builds NestJS, copies production artifacts, creates `nestjs` user
- `Dockerfile.web` (Node 26 bookworm-slim): installs dependencies, builds Next.js with standalone output, copies public/static files, creates `nextjs` user

### Step 3: Start infrastructure services

```bash
# Start db and redis, wait for health check to pass
docker compose up -d --wait db redis
```

The `--wait` flag will block until the health checks of both containers pass.
DB health check: `pg_isready -U postgres -d vn_paralympic_sport`.
Redis health check: `redis-cli ping`.

### Step 4: Push database schema

```bash
# Run prisma db push to sync schema with PostgreSQL
docker compose run --rm api npx prisma db push
```

Prisma db push does not need migration files -- it directly syncs `prisma/schema.prisma`
with the database. Suitable for quick deployment. If you want to use migrations:

```bash
docker compose run --rm api npx prisma migrate deploy
```

**Important -- Seed data is NOT run automatically on deploy.** After the first deploy (or whenever you need fresh demo data), trigger seeding manually:

```bash
# Run seed data (creates 15 interconnected athletes, tournaments, achievements, etc.)
docker compose run --rm api npx prisma db seed
```

Do not run `db:fresh` against an existing database: it uses a forced schema reset and deletes data. Review migrations and take a backup before updating a database that already contains data.

### Step 5: Start all services

```bash
# Start the entire stack, wait for health check to pass
docker compose up -d --wait
```

After completion, 4 containers will be running:
- `vn_paralympic_db` (PostgreSQL port 5433 on host)
- `vn_paralympic_redis` (Redis port 6379 on host)
- `vn_paralympic_api` (NestJS port 3001 on host)
- `vn_paralympic_web` (Next.js port 3000 on host)

Verify:

```bash
# Check all containers are running
docker compose ps

# Check health status
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Check API health check
curl http://localhost:3001/api/v1/health

# Check frontend
curl -I http://localhost:3000
```

---

## 4. SSL/TLS with Reverse Proxy

By default, containers only expose HTTP ports. To serve HTTPS, a reverse proxy is needed.
Below are 2 options.

### 4.1 Use Nginx + Certbot (Let's Encrypt)

Install Nginx:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create Nginx configuration file `/etc/nginx/sites-available/vietnamparasports`:

```nginx
server {
    listen 80;
    server_name vietnamparasports.com www.vietnamparasports.com;

    # Proxy to frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Uploads directory (static files served by API)
    location /uploads/ {
        alias /var/www/VietNam-Paralympic-Sport/api-server/uploads/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site & run Certbot:

```bash
sudo ln -s /etc/nginx/sites-available/vietnamparasports /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d vietnamparasports.com -d www.vietnamparasports.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 4.2 Use Caddy (automatic HTTPS)

Caddy automatically obtains and renews Let's Encrypt certificates. Install:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

Create `/etc/caddy/Caddyfile`:

```caddy
vietnamparasports.com, www.vietnamparasports.com {
    # Frontend
    handle {
        reverse_proxy localhost:3000
    }

    # API
    handle_path /api/* {
        reverse_proxy localhost:3001
    }

    # Uploads
    handle_path /uploads/* {
        root * /var/www/VietNam-Paralympic-Sport/api-server/uploads/public
        file_server
    }
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

---

## 5. Database Backup Strategy

### 5.1 Manual backup

```bash
# Backup to gzip file
docker compose exec -T db pg_dump -U postgres vn_paralympic_sport \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 5.2 Automated backup with cron job

Create script `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/vn_paralympic"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

cd /var/www/VietNam-Paralympic-Sport

# Perform backup
docker compose exec -T db pg_dump -U postgres vn_paralympic_sport \
  | gzip > "$BACKUP_FILE"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
```

Make executable:

```bash
chmod +x /opt/scripts/backup-db.sh
```

Add to crontab (run daily at 2 AM UTC):

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup-db.sh >> /var/log/vn-paralympic-backup.log 2>&1") | crontab -
```

### 5.3 Restore from backup

```bash
# Stop API to avoid conflicts
docker compose stop api web

# Drop & recreate database
docker compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS vn_paralympic_sport"
docker compose exec -T db psql -U postgres -c "CREATE DATABASE vn_paralympic_sport"

# Restore
gunzip -c backup_20260628_020000.sql.gz \
  | docker compose exec -T db psql -U postgres -d vn_paralympic_sport

# Start services
docker compose up -d --wait
```

### 5.4 Copy backup to local machine (optional)

```bash
# From local machine
scp user@vps-ip:/var/backups/vn_paralympic/backup_20260628_020000.sql.gz ./
```

---

## 6. CI/CD Pipeline

### 6.1 CI Pipeline (`.github/workflows/ci.yml`)

Triggered by: push and pull request to `main`.

Steps:

| Step                 | Description                                                         |
|----------------------|---------------------------------------------------------------------|
| Checkout Repository  | Clone code                                                          |
| Setup Node.js        | Node 22, npm cache from package-lock.json                           |
| Install Dependencies | `npm ci`                                                            |
| Generate Prisma      | `npx prisma generate` in `api-server`                               |
| Lint Backend         | `npm run lint -w api-server`                                        |
| Build Backend        | `npm run build -w api-server`                                       |
| Lint Frontend        | `npm run lint -w web-client`                                        |
| Build Frontend       | `npm run build -w web-client`                                       |

Pull requests should only merge when CI passes all steps.

### 6.2 Deploy Pipeline (`.github/workflows/deploy.yml`)

Triggered by: push to `main`.

Required GitHub Secrets:

| Secret               | Description                               |
|----------------------|--------------------------------------------|
| `SERVER_IP`          | IP address of the VPS                      |
| `SERVER_USER`        | SSH user on VPS (usually `root`)           |
| `SSH_PRIVATE_KEY`    | SSH private key to SSH into VPS            |
| `NEXT_PUBLIC_API_URL`| Public API URL for client-side Next.js     |

**Deploy steps:**

1. **Checkout code** -- clone repository into GitHub Actions runner.

2. **SSH into VPS** (using `appleboy/ssh-action@v1.0.3`):
   ```bash
   # Setup Node path
   export PATH="/root/.nvm/versions/node/v26.4.0/bin:$PATH"
   
   # Navigate to project directory
   cd /var/www/VietNam-Paralympic-Sport
   
   # Fetch & reset to the latest commit on main
   git fetch --all
   git reset --hard origin/main
   
   # Export build-time env variable for Next.js
   export NEXT_PUBLIC_API_URL="https://vietnamparasports.com/api/v1"
   
   # Stop entire stack
   docker compose down
   
   # Build images from scratch (no cache)
   docker compose build --no-cache
   
   # Start infrastructure (db + redis)
   docker compose up -d --wait db redis
   
   # Sync database schema
   docker compose run --rm api npx prisma db push
   
   # Start entire stack
   docker compose up -d --wait
   ```

**Zero-downtime limitation:** Currently, the deploy pipeline uses `docker compose down`
before building & starting. This causes a short downtime (usually 1-3 minutes).
To achieve zero-downtime, rolling updates with multiple instance scaling or
blue-green deployment is needed. This is an improvement to consider in the future.

---

## 7. Monitoring

### 7.1 Container logs

```bash
# View logs for all services
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# Logs for a specific service
docker compose logs api
docker compose logs web
docker compose logs db

# Logs with timestamp, last 100 lines
docker compose logs --tail 100 --timestamps api
```

### 7.2 Health checks

All 4 services have health checks. Check status:

```bash
# View health status table
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Check individual health checks
docker inspect vn_paralympic_api --format='{{json .State.Health}}' | python3 -m json.tool
```

Health check definitions:

| Service | Check                                                              | Interval | Retries | Start Period |
|---------|--------------------------------------------------------------------|----------|---------|-------------|
| db      | `pg_isready -U postgres -d vn_paralympic_sport`                    | 10s      | 5       | -           |
| redis   | `redis-cli ping`                                                   | 10s      | 5       | -           |
| api     | HTTP GET `http://localhost:3001/api/v1/health` (expect 200)        | 15s      | 5       | 45s         |
| web     | HTTP GET `http://localhost:3000` (expect 200)                      | 15s      | 3       | 45s         |

### 7.3 Resource monitoring

```bash
# CPU & memory of containers
docker stats --no-stream

# Disk usage of volumes
docker system df -v
```

### 7.4 System monitoring (recommended)

Install a simple monitoring agent:

```bash
# htop -- process monitor
sudo apt install htop -y

# Netdata (real-time system monitoring, accessible at http://vps-ip:19999)
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --non-interactive
```

---

## 8. Troubleshooting

### 8.1 class-validator not found error (ENOTFOUND / Cannot find module)

**Symptom:** API container crashes with error:
```
Error: Cannot find module 'class-validator'
```

**Cause:** NestJS PackageLoader resolves modules from the directory of `@nestjs/common`,
not from the API's `node_modules`. If `class-validator` is not in `node_modules`
of `@nestjs/common`, NestJS cannot call ValidationPipe.

**Fix:** Ensure `npm install --legacy-peer-deps` is run in `Dockerfile.api`
after copying the `shared` package. Use `--legacy-peer-deps` so npm installs all
dependencies in the same `node_modules` instead of nested. `class-validator` has been verified
in the Dockerfile build process (lines 75-77 of `Dockerfile.api`):

```dockerfile
RUN node -e "require('class-validator'); require('class-transformer'); require('@prisma/client')"
```

### 8.2 DNS error in Next.js (ENOTFOUND)

**Symptom:** Next.js cannot resolve `api` hostname in Docker network.

**Fix:** `NODE_OPTIONS=--dns-result-order=ipv4first` is already set in `docker-compose.yml`
for the web service. This variable forces Node.js to prioritize IPv4 DNS over IPv6, resolving the lookup error.

### 8.3 Prisma Client not generated

**Symptom:** `@prisma/client did not initialize yet. Please run "prisma generate"`

**Fix:** Prisma client is already generated in the Dockerfile build stage. If you encounter this error
in development:

```bash
docker compose exec api npx prisma generate
# or
docker compose run --rm api npx prisma generate
```

### 8.4 Database connection refused

**Symptom:** API cannot connect to PostgreSQL.
```
Can't reach database server at `db:5432`
```

**Check:**
```bash
# Check if db container is running
docker compose ps db

# Check db health
docker inspect vn_paralympic_db --format='{{json .State.Health}}'

# Check logs
docker compose logs db --tail 20
```

**Fix:** If db container crashes, try restarting:
```bash
docker compose restart db
docker compose up -d --wait db
```

### 8.5 Next.js build fails (dns / fetch error)

**Symptom:** Next.js build in Dockerfile.web crashes with DNS errors.

**Fix:** All server-side fetch requests in Next.js have used `INTERNAL_API_URL`
(`http://api:3001/api/v1`) instead of public URL. Check that `INTERNAL_API_URL` is set
in `docker-compose.yml`.

### 8.6 Container crashes with "Permission denied"

**Symptom:** Container cannot start due to file access permissions.

**Check:** All containers run as non-root user (`nestjs` with uid 1001, `nextjs` with uid 1001).
The volume `./api-server/uploads` must have write permissions for user `1001`.

**Fix:**
```bash
# Set permissions for uploads directory
sudo chown -R 1001:1001 ./api-server/uploads
```

### 8.7 Disk full

**Symptom:** PostgreSQL crashes due to running out of disk space.

**Fix:**
```bash
# Check disk usage
df -h

# Clean up docker build cache
docker builder prune -a -f

# Remove unused docker images
docker image prune -a -f

# Remove unused docker volumes
docker volume prune -f
```

### 8.8 Puppeteer / Chromium errors

**Symptom:** API cannot generate PDF (if using Puppeteer).

**Check:** Chromium is already installed in Dockerfile.api (lines 42-46).

```bash
# Check if Chromium is installed in API container
docker compose exec api chromium --version

# Or
docker compose exec api ls -la /usr/bin/chromium
```

---

## 9. Rolling Back Deployments

### 9.1 Rollback to previous Git commit

```bash
cd /var/www/VietNam-Paralympic-Sport

# View commit history
git log --oneline -10

# Go back to previous commit (e.g., go back 1 commit)
git reset --hard HEAD~1

# Rebuild & redeploy
docker compose down
docker compose build --no-cache
docker compose up -d --wait db redis
docker compose run --rm api npx prisma db push
docker compose up -d --wait
```

### 9.2 Rollback database (restore from backup)

```bash
# Stop API container
docker compose stop api web

# Drop current database
docker compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS vn_paralympic_sport"
docker compose exec -T db psql -U postgres -c "CREATE DATABASE vn_paralympic_sport"

# Restore from backup
gunzip -c /var/backups/vn_paralympic/backup_20260627_020000.sql.gz \
  | docker compose exec -T db psql -U postgres -d vn_paralympic_sport

# Start services again
docker compose start api web
docker compose up -d --wait
```

### 9.3 Prisma migrate rollback

If using Prisma Migrate (instead of `db push`):

```bash
# Rollback 1 migration step
docker compose run --rm api npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-migrations prisma/migrations \
  --script > rollback.sql

# View rollback script
cat rollback.sql

# Apply rollback (be careful!)
docker compose exec -T db psql -U postgres -d vn_paralympic_sport < rollback.sql
```

---

## 10. Architecture Overview

```
                          internet
                              |
                     +--------+--------+
                     |  Reverse Proxy  |
                     |  (Nginx/Caddy)  |
                     |  Port 80 / 443  |
                     +--------+--------+
                              |
              +---------------+---------------+
              |                               |
      +-------v-------+               +-------v-------+
      |  Next.js Web  |               |  NestJS API   |
      |  (Port 3000)  |---internal-->|  (Port 3001)   |
      |  nextjs user  |   API calls  |  nestjs user   |
      +---------------+               +-------+-------+
                                              |
                               +--------------+--------------+
                               |                             |
                       +-------v-------+             +-------v-------+
                       |  PostgreSQL   |             |     Redis     |
                       |  (Port 5433)  |             |  (Port 6379)  |
                       +---------------+             +---------------+

Network: vn_paralympic_network (bridge)
Volumes: postgres_data, redis_data, ./api-server/uploads
```

## 11. Useful Commands Cheat Sheet

```bash
# === STATUS & LOGS ===
docker compose ps                                    # List all containers + status
docker compose ps --format "table {{.Name}}\t{{.Health}}"  # Health status table
docker compose logs -f --tail 50                     # Follow last 50 lines of all logs
docker compose logs api --tail 100                   # API logs only

# === RESTART ===
docker compose restart api                           # Restart API only
docker compose restart                               # Restart all services
docker compose up -d --force-recreate                # Recreate all containers

# === DATABASE ===
docker compose exec db psql -U postgres -d vn_paralympic_sport   # DB shell
docker compose run --rm api npx prisma db push      # Push schema changes
docker compose run --rm api npx prisma studio       # Open Prisma Studio (dev only)
docker compose run --rm api npm run seed            # Run seed data manually on an empty database

# === CLEANUP ===
docker compose down                                  # Stop + remove containers + network
docker compose down -v                               # ALSO remove volumes (destructive!)
docker system prune -a -f                            # Clean unused images/containers
docker builder prune -a -f                           # Clean build cache

# === SCALING (experimental) ===
docker compose up -d --scale api=2                   # Run 2 API instances (needs load balancer)
```

---

## 12. Security Considerations

1. **Do not commit `.env` file:** `.env` is already in `.gitignore`. Do not commit real secrets.
2. **Change default passwords:** `POSTGRES_PASSWORD`, `JWT_SECRET`, `NEXTAUTH_SECRET` in `.env` must be changed from default values.
3. **SSH key:** Use a dedicated SSH key for CI/CD deploy (do not use personal key).
4. **Firewall:** Only open ports 80, 443, 22. Internal ports (3000, 3001, 5433, 6379) should only be accessible from localhost or trusted IPs.
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
5. **Non-root containers:** All containers run as non-root user:
   - API: `nestjs` (uid 1001)
   - Web: `nextjs` (uid 1001)
6. **Docker socket security:** Do not mount `/var/run/docker.sock` into any container.
