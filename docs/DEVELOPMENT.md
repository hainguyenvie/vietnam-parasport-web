# Vietnam ParaSports — Development Guide

> **Language:** Vietnamese + English (primary: Vietnamese)
> **Last updated:** 2026-06-28
> **Target audience:** Developers contributing to the monorepo

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Environment Requirements](#environment-requirements)
3. [Monorepo Structure](#monorepo-structure)
4. [Dev Environment Setup](#dev-environment-setup)
5. [Environment Variable Configuration](#environment-variable-configuration)
6. [Running the Application](#running-the-application)
7. [Prisma & Database](#prisma--database)
8. [Docker](#docker)
9. [Testing](#testing)
10. [Linting & Formatting](#linting--formatting)
11. [Git Hooks (Husky)](#git-hooks-husky)
12. [CI/CD](#cicd)
13. [Detailed Folder Structure](#detailed-folder-structure)
14. [Shared Package](#shared-package)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

Vietnam ParaSports is a comprehensive sports platform for the disabled community in Vietnam. The system is built as a **monorepo** with 3 main workspaces:

| Workspace | Technology | Description |
|-----------|-----------|-------|
| `api-server` | NestJS 11 + Prisma 7.8 + PostgreSQL 15 | Backend REST API + WebSocket (Socket.io) |
| `web-client` | Next.js 16 (App Router) + Tailwind CSS 4 + NextAuth 4 | Multilingual frontend (vi/en) |
| `shared` | TypeScript + Zod | Shared types, validation schemas, constants |

**Other notable technologies:**
- **Logging:** Pino (structured JSON logging)
- **Rate Limiting:** `@nestjs/throttler`
- **Security:** Helmet, CORS, JWT, bcrypt, 2FA (OTP)
- **File uploads:** Local (uploads/public) + Signed URL for media access
- **Real-time:** Socket.io (live match scores)
- **PDF/Excel Export:** Puppeteer + ExcelJS
- **Calendar Sync:** ical-generator (`.ics` files)
- **Email:** Nodemailer + Handlebars templates
- **Realtime API docs:** Swagger UI at `/api/docs`

---

## Environment Requirements

### Windows (primary development)

| Tool | Minimum version | Notes |
|---------|---------------------|---------|
| Node.js | **22+** | Use LTS. Download from https://nodejs.org |
| npm | 10+ (bundled with Node 22) | Do not use pnpm/yarn |
| PostgreSQL | **15** | Default port: 5433 (Docker) / 5432 (local) |
| Redis | **7.x** | Default port: 6379 |
| Git | 2.40+ | |
| Docker Desktop | Latest | Optional — if you want to run via Docker |

> **Windows note:** Use Git Bash or WSL2 terminal. Do not use cmd.exe or PowerShell for npm commands.

### Linux / macOS (CI & production)

Similar to Windows, the only difference is PostgreSQL default port `5432`. Docker is the recommended method for a consistent environment.

---

## Monorepo Structure

```
VietNam-Paralympic-Sport/
|
|-- package.json              # Root workspace config (npm workspaces)
|-- package-lock.json
|-- docker-compose.yml        # Dev/Prod Docker setup
|-- Dockerfile.api            # Multi-stage build for NestJS
|-- Dockerfile.web            # Multi-stage build for Next.js
|-- .env.production           # Environment variables for Docker production
|
|-- api-server/               # ========== BACKEND ==========
|   |-- package.json
|   |-- tsconfig.json
|   |-- tsconfig.build.json
|   |-- eslint.config.mjs     # ESLint 9 flat config
|   |-- .env                  # Local environment variables
|   |-- prisma/
|   |   |-- schema.prisma     # Database schema (40+ models)
|   |   |-- migrations/       # Migration history
|   |   |-- seed.ts           # Database seeder (admin + sample data)
|   |   `-- seed-events.ts    # Events seed data
|   |-- src/
|   |   |-- main.ts          # Entry point (bootstrap NestJS)
|   |   |-- app.module.ts    # Root module (imports all sub-modules)
|   |   |-- app.controller.ts
|   |   |-- common/          # Shared NestJS utilities
|   |   |   |-- decorators/  # @Roles() decorator
|   |   |   |-- filters/     # AllExceptionsFilter
|   |   |   |-- interceptors/# AuditInterceptor, TransformInterceptor
|   |   |   `-- utils/       # security.ts
|   |   |-- modules/         # 40+ feature modules
|   |   |   |-- auth/        # JWT + 2FA + OAuth
|   |   |   |-- users/
|   |   |   |-- posts/
|   |   |   |-- courses/     # LMS: courses, chapters, lessons
|   |   |   |-- tournaments/
|   |   |   |-- matches/     # Match scoring + live updates
|   |   |   |-- products/    # E-commerce: products catalog
|   |   |   |-- affiliates/  # Affiliate program management
|   |   |   |-- commissions/ # Commission tracking & payouts
|   |   |   |-- ... (see full list below)
|   |   |-- prisma/
|   |       `-- prisma.module.ts  # Global Prisma service
|   `-- test/                 # E2E tests
|
|-- web-client/               # ========== FRONTEND ==========
|   |-- package.json
|   |-- next.config.ts
|   |-- eslint.config.mjs     # ESLint 9 flat config (Next.js)
|   |-- .env                  # Local environment variables
|   |-- src/
|   |   |-- middleware.ts    # i18n routing + API proxy -> backend
|   |   |-- app/
|   |   |   `-- [locale]/    # App Router with i18n (vi/en)
|   |   |       |-- layout.tsx
|   |   |       |-- page.tsx         # Homepage
|   |   |       |-- news/            # News
|   |   |       |-- tournaments/     # Tournaments
|   |   |       |-- products/        # Products (e-commerce)
|   |   |       |-- affiliates/      # Affiliate dashboard
|   |   |       |-- courses/         # LMS
|   |   |       |-- clubs/           # Clubs / Organizations
|   |   |       |-- admin/           # Admin dashboard
|   |   |       |-- profile/
|   |   |       |-- ...              # 25+ route groups
|   |   |       `-- api/             # Next.js API proxy routes
|   |   |-- components/
|   |   |   |-- Header.tsx           # Site header (a11y aware)
|   |   |   |-- Footer.tsx
|   |   |   |-- AccessibilityProvider.tsx
|   |   |   |-- TextToSpeech.tsx     # Text-to-speech accessibility
|   |   |   |-- TiptapEditor.tsx     # Rich text editor
|   |   |   |-- ui/                  # shadcn/ui-style components
|   |   |   |-- admin/               # Admin-specific components
|   |   |   `-- shared/              # Reusable shared components
|   |   |-- hooks/
|   |   |   |-- useApi.ts            # SWR wrapper for API calls
|   |   |   |-- useDebounce.ts
|   |   |   `-- useTranslation.ts
|   |   |-- lib/
|   |   |   |-- api-client.ts        # Centralized API client
|   |   |   `-- utils.ts
|   |   |-- i18n/
|   |   |   |-- routing.ts           # Locale routing config
|   |   |   `-- request.ts           # i18n request config
|   |   |-- services/                # Frontend service layer
|   |   |   |-- user.service.ts
|   |   |   |-- post.service.ts
|   |   |   |-- event.service.ts
|   |   |   |-- course.service.ts
|   |   |   `-- setting.service.ts
|   |   |-- store/
|   |   |   `-- useModalStore.ts     # Zustand store
|   |   |-- types/                   # TypeScript type definitions
|   |   `-- utils/
|   `-- public/                      # Static assets (logo, images)
|
`-- shared/                   # ========== SHARED PACKAGE ==========
    |-- package.json
    |-- tsconfig.json
    `-- src/
        |-- index.ts          # Exports: types, enums, interfaces
        `-- validation.ts     # Zod schemas: auth, user, org, pagination
```

### Full list of API modules (api-server/src/modules/)

```
assignments         athlete-achievements  assistant-profiles  auth
bookmarks           calendar               capcut-templates    categories
chapters            comments               companion-requests  course-progress
courses             disability-types       document-topics     documents
email-templates     events                 facilities          lessons
mail                matches                media               organizations
partners            posts                  quizzes             rankings
reports             roles                  search              settings
social-links        sport-classifications  sport-events        sports
statistics          sub-tournaments        tags                teams
tournaments         users
products            affiliates             commissions
```

**Total: 43+ modules**, each module follows the standard NestJS structure:
```
module-name/
|-- module-name.module.ts
|-- module-name.controller.ts
|-- module-name.service.ts
|-- dto/
|   |-- create-*.dto.ts
|   `-- update-*.dto.ts
`-- entities/   (optional)
```

---

## Dev Environment Setup

### Step 1: Clone + Install dependencies

```bash
git clone <repo-url> VietNam-Paralympic-Sport
cd VietNam-Paralympic-Sport

# Install dependencies for the ENTIRE monorepo
# IMPORTANT: Must use legacy-peer-deps and force
npm install --legacy-peer-deps --force
```

> **Why `--legacy-peer-deps --force`?**  
> Some packages (like `@nestjs-modules/mailer`, `next-auth`) have peer dependency conflicts between NestJS 11 and Next.js 16. `--legacy-peer-deps` skips strict peer dependency resolution. `--force` forces reinstallation of everything.

After installation, the `shared` package will be auto-built thanks to npm workspaces symlinks (no need to build separately in dev — TypeScript + Next.js resolve directly from source).

**If you need to build the shared package manually** (for production or checking):
```bash
npm run build -w shared
```

### Step 2: Start Database & Redis

**Option 1 — Docker (recommended):**
```bash
# Only start db + redis, not the app
docker compose up -d db redis
```

**Option 2 — Manual install:**
- Install PostgreSQL 15, create a database named `vn_paralympic_sport`
- Install Redis, run on port 6379

### Step 3: Configure .env files

Each workspace needs its own `.env` file. See details in [Environment Variable Configuration](#environment-variable-configuration).

### Step 4: Generate Prisma Client + Push schema

```bash
cd api-server

# Generate Prisma client (needed every time schema.prisma changes)
npx prisma generate

# Push schema to database (do NOT use migration in dev)
npx prisma db push

# (Optional) Seed sample data
npx prisma db seed
```

> **`prisma db push` vs `prisma migrate dev`:**  
> - `db push`: Syncs schema directly, does not create migration files. Use in **development**.  
> - `migrate dev`: Creates migration file + applies. Use when you want to **create a new migration** to commit to git.

---

## Environment Variable Configuration

### api-server/.env

```env
# === DATABASE ===
# Local Docker: postgresql://postgres:password123@localhost:5433/vn_paralympic_sport?schema=public
# Local manual:  postgresql://postgres:<yourpass>@localhost:5432/vn_paralympic_sport?schema=public
DATABASE_URL="postgresql://postgres:password123@localhost:5433/vn_paralympic_sport?schema=public"

# === JWT ===
# Generate random key: openssl rand -hex 32
JWT_SECRET="super-secret-key"

# === SERVER ===
PORT=3001

# === MEDIA (shared with web-client) ===
# Generate random key: openssl rand -hex 32
NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET="d83f4f1e56b4f7e2a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5"
# Also used by e-commerce media uploads (Products, Affiliates, Commissions modules)

# === SMTP (Email) ===
# Use Gmail App Password: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Vietnam ParaSports <noreply@vietnamparasports.org>"

# === OPTIONAL ===
# FRONTEND_URL=http://localhost:3000          # For CORS
# REDIS_HOST=localhost                         # Default
# REDIS_PORT=6379                              # Default
# GOOGLE_CLIENT_ID=...                         # For Google OAuth
# GOOGLE_CLIENT_SECRET=...                     # For Google OAuth
```

### web-client/.env

```env
# === NextAuth ===
# Generate key: openssl rand -base64 32
NEXTAUTH_SECRET="super-secret-nextauth-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# === API ===
NEXT_PUBLIC_API_URL="http://localhost:3001"
# In Docker, middleware uses INTERNAL_API_URL instead of NEXT_PUBLIC_API_URL

# === MEDIA (must match api-server) ===
NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET="d83f4f1e56b4f7e2a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5"

# === Google OAuth (optional) ===
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### .env.production (Docker Compose)

File at root, only used when deploying with Docker. See `docker-compose.yml` for the variables used.

---

## Running the Application

### Development (local)

Open **2 separate terminals**:

```bash
# Terminal 1: Backend (port 3001)
npm run start:dev -w api-server
# NestJS hot-reload: code changes -> auto restart
# This also starts the Products, Affiliates, and Commissions e-commerce modules

# Terminal 2: Frontend (port 3000)
npm run dev -w web-client
# Next.js hot-reload + HMR
```

> **Do not run in a single terminal.** Each workspace needs its own process.

After startup:
- **Frontend:** http://localhost:3000/vi (Vietnamese) or http://localhost:3000/en (English)
- **Backend API:** http://localhost:3001/api/v1
- **Swagger Docs:** http://localhost:3001/api/docs
- **Health Check:** http://localhost:3001/api/v1/health

### BullMQ Queue Setup (Local Dev)

The project uses **BullMQ** for background job processing (email sending, PDF generation, and other async tasks). BullMQ requires **Redis** as its backing store.

**Prerequisites:**
- Redis must be running (via Docker: `docker compose up -d redis`, or a local Redis installation on port 6379)

**Configuration:**

BullMQ connects to Redis using the `REDIS_HOST` and `REDIS_PORT` environment variables (defaults: `localhost` and `6379`). The connection is configured in the NestJS module setup. No additional configuration is needed if Redis is already running as described in Step 2.

**Verification:**

When the API server starts, BullMQ initializes its queues and workers automatically. Look for the following in the startup logs:
```
BullMQ queues initialized
```

If Redis is unreachable, the API will still start but background jobs will fail. Ensure `docker compose up -d redis` is running before starting the API.

**Common queues:**
- `email-queue` — Sends transactional emails (password reset, welcome, notifications)
- `export-queue` — Generates PDF and Excel reports

**Monitoring (optional):**

Install Bull Board for a UI dashboard at `/api/v1/admin/queues`:

```bash
# Already included in the project dependencies
# Access via: http://localhost:3001/api/v1/admin/queues
```

### API Proxy in Development

Web-client middleware (`src/middleware.ts`) automatically proxies `/api/*` requests to the backend:
- `/api/auth/*`, `/api/upload`, `/api/media/*`, `/api/tts` -> Next.js handles internally
- All other `/api/*` -> proxies to `http://127.0.0.1:3001` (rewrite)

This means the **frontend calls API via `/api/v1/...`**, no need for absolute URLs to the backend.

### Default accounts (after seed)

| Role | Email | Password |
|---------|-------|----------|
| Super Admin | `admin@paralympic.vn` | `Admin@123` |

Seed data includes: users, posts, categories, tags, tournaments, matches, courses, lessons, quizzes, organizations, sport classifications, etc.

---

## Prisma & Database

### Schema

The Prisma schema is at `api-server/prisma/schema.prisma`, containing 43+ models:

**Main models:**
- `User`, `Role`, `Permission` — RBAC system
- `Post`, `Category`, `Tag`, `Comment`, `Bookmark` — CMS
- `Course`, `Chapter`, `Lesson`, `Quiz`, `Assignment`, `CourseProgress` — LMS
- `Tournament`, `SubTournament`, `Team`, `Match`, `Ranking` — Tournament engine
- `Organization` (clubs/delegations) — Facilities map
- `Sport`, `SportClassification`, `SportEvent` — Sports data
- `CompanionRequest`, `AssistantProfile` — Companion system
- `DisabilityType`, `AthleteAchievement` — Athlete profiles
- `Document`, `DocumentTopic`, `CapcutTemplate` — Creator Lab
- `Media` — File uploads
- `EmailTemplate`, `Settings`, `SocialLink`, `Partner` — System config
- `AuditLog` — Audit trail
- `Product`, `Affiliate`, `Commission` — E-commerce modules

### Common Prisma commands

```bash
# Work in the api-server directory
cd api-server

# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema to DB (development)
npx prisma db push

# Create a new migration (when committing schema change)
npx prisma migrate dev --name <migration-name>

# Apply existing migrations (production / CI)
npx prisma migrate deploy

# Seed data
npx prisma db seed

# Open Prisma Studio (GUI database browser)
npx prisma studio

# Validate schema
npx prisma validate
```

### Migration workflow

1. **Edit `schema.prisma`** — add/edit/delete model or field
2. **Create migration:** `npx prisma migrate dev --name short_description`
3. **Check migration file** in `prisma/migrations/` — ensure valid SQL, no data loss
4. **Commit both schema.prisma AND the migration folder**
5. CI/CD will run `prisma migrate deploy` on deploy

### Seed Data Structure

Seed data is organized in structured modules under `api-server/prisma/seeds/`:

```
api-server/prisma/seeds/
├── 01-core/       # Roles, permissions, users, accounts
├── 02-cms/        # Posts, categories, tags, events
├── 03-lms/        # Courses, chapters, lessons
├── 04-sports/     # Sports, classifications, sport events
├── 05-community/  # Clubs, partners, companion requests
└── 06-realistic/  # Interconnected athletes + full tournament/achievement/affiliate pipeline
```

The `06-realistic/seed-interconnected.ts` file creates 15 interconnected athletes with complete profiles across multiple sports and disability types. Each athlete is wired into the full pipeline: User -> AthleteProfile -> Tournament -> Ranking -> AthleteAchievement -> AffiliateLink, providing realistic demo data for end-to-end testing.

Run seed:

```bash
cd api-server
npx prisma db seed
```

### Reset Database (Development)

To wipe all data and re-seed from scratch:

```bash
cd api-server
npm run db:reset
```

Requires `DATABASE_URL` to be set in `api-server/.env`. This runs `prisma migrate reset` internally -- it drops the database, re-applies all migrations, and runs the seed scripts.

In Docker:

```bash
docker compose run --rm api npm run db:reset
```

---

## Docker

### Start the entire stack (dev)

```bash
# Build and run all services (db, redis, api, web)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Start only database services

```bash
docker compose up -d db redis
```

### Build individual services

```bash
# Build API image
docker build -f Dockerfile.api -t vn-parasports-api .

# Build Web image
docker build -f Dockerfile.web --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 -t vn-parasports-web .
```

### Port mapping

| Service | Docker Port | Host Port |
|---------|-------------|-----------|
| PostgreSQL | 5432 | **5433** (avoids conflict with local PG) |
| Redis | 6379 | 6379 |
| API Server | 3001 | 3001 |
| Web Client | 3000 | 3000 |

### Docker Networking

Services communicate via internal network `vn_paralympic_network`:
- Web Client calls API via `http://api:3001/api/v1` (internal Docker DNS)
- API calls DB via `postgresql://postgres:password123@db:5432/...`
- API calls Redis via `redis:6379`

### Health checks

Each service has a health check:
- **db:** `pg_isready -U postgres -d vn_paralympic_sport`
- **redis:** `redis-cli ping`
- **api:** HTTP GET `/api/v1/health` -> 200 OK
- **web:** HTTP GET `/` -> 200 OK

`depends_on` with `condition: service_healthy` ensures correct startup order.

---

## Testing

### Backend (api-server)

```bash
# Run all unit tests
npm run test -w api-server

# Watch mode
npm run test:watch -w api-server

# Coverage report
npm run test:cov -w api-server

# E2E tests
npm run test:e2e -w api-server

# Debug tests
npm run test:debug -w api-server
```

**Test config:**
- Framework: Jest 30
- Test pattern: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)
- Root dir: `api-server/src`
- Coverage output: `coverage/`
- Transform: `ts-jest`

### Frontend (web-client)

There is currently no test runner for the frontend. Future plan: Vitest + React Testing Library.

---

## Linting & Formatting

### Backend (api-server)

```bash
# ESLint (flat config)
npm run lint -w api-server

# Prettier format
npm run format -w api-server
```

**ESLint config** (`api-server/eslint.config.mjs`):
- Base: `@eslint/js` recommended
- TypeScript: `typescript-eslint` recommended-type-checked
- Prettier integration: `eslint-plugin-prettier/recommended`
- Relaxed rules: `no-explicit-any: off`, `no-unused-vars: off`
- **CRLF safety:** `endOfLine: "auto"` (for Windows)

### Frontend (web-client)

```bash
# ESLint (flat config)
npm run lint -w web-client
```

**ESLint config** (`web-client/eslint.config.mjs`):
- Base: `eslint-config-next` core-web-vitals + typescript
- Relaxed rules: `no-explicit-any: off`, `no-unused-vars: off`, `no-img-element: off`

### Formatting rules (project-wide)

- **Indentation:** 2 spaces
- **Quotes:** Single quotes (TypeScript)
- **Semicolons:** Required
- **Trailing commas:** ES5
- **Line ending:** Auto (LF on Linux/Mac, CRLF on Windows)
- **Prettier plugin for Tailwind:** Auto-sort class names (`prettier-plugin-tailwindcss`)

---

## Git Hooks (Husky)

The project uses **Husky 9** for git hooks. Configuration is in `.husky/`.

### Current hooks

| Hook | Action |
|------|-----------|
| `pre-commit` | Runs `lint-staged` — ESLint + Prettier on staged files |

### lint-staged config

**api-server:**
```json
{
  "*.ts": ["eslint --fix", "prettier --write"]
}
```

**web-client:**
```json
{
  "*.{js,jsx,ts,tsx,css,md,json}": "prettier --write"
}
```

> **Windows note:** Husky requires Git Bash or WSL. If hooks are not running, check:
> ```bash
> git config core.hooksPath .husky
> npx husky install   # if needed
> ```

---

## CI/CD

### CI Pipeline (`.github/workflows/ci.yml`)

Trigger: push/PR to `main`

Steps:
1. Checkout code
2. Setup Node.js 22 with npm cache
3. `npm ci` (clean install)
4. `npx prisma generate` (api-server)
5. **Lint backend:** `npm run lint -w api-server`
6. **Build backend:** `npm run build -w api-server`
7. **Lint frontend:** `npm run lint -w web-client`
8. **Build frontend:** `npm run build -w web-client`

> **Note:** CI uses `npm ci` (not `npm install --legacy-peer-deps`). `npm ci` requires an up-to-date `package-lock.json`. If you modify dependencies, remember to run `npm install --legacy-peer-deps --force` to update the lock file, then commit `package-lock.json` as well.

### Deploy (`.github/workflows/deploy.yml`)

- Build Docker images
- Push to container registry
- SSH into server, pull images, restart containers

---

## Shared Package

The package `@vietnam-parasports/shared` is imported in both `api-server` and `web-client`.

### Contents

**Types & Interfaces** (`src/index.ts`):
- `ApiResponseEnvelope<T>` — Standard API response wrapper
- `UserRole` enum — `SUPER_ADMIN | ADMIN | USER | ATHLETE | COACH`
- `UserSessionDto` — User session data
- `GlobalSettingsDto` — Hero carousel, footer, menu config
- `SocialLinkDto` — Social media link data
- `CarouselItem` — Hero banner item

**Validation Schemas** (`src/validation.ts`) — Zod:
- Auth: `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `oauthLoginSchema`, `login2FASchema`, `changePasswordSchema`
- User: `updateUserSchema`
- Pagination: `paginationSchema`, `PaginatedResponse<T>`
- Media: `mediaViewSchema`
- Organization: `organizationSchema`
- Companion: `companionRequestSchema`

### Usage

```typescript
// In api-server or web-client
import { loginSchema, UserRole, ApiResponseEnvelope } from '@vietnam-parasports/shared';

// Validate input
const result = loginSchema.safeParse(req.body);
if (!result.success) {
  throw new BadRequestException(result.error.errors);
}
```

### Build shared package

In development, the TypeScript compiler of api-server and Next.js webpack resolve directly from source (via npm workspaces symlinks). No manual build needed.

When you need to build (e.g., checking type errors):
```bash
npm run build -w shared
# Output: shared/dist/
```

---

## Detailed Folder Structure

### API Server — Architecture Patterns

Each module follows the structure:

```
modules/<module-name>/
|-- <name>.module.ts       # NestJS Module definition
|-- <name>.controller.ts   # REST endpoints (@Get, @Post, ...)
|-- <name>.service.ts      # Business logic
|-- <name>.gateway.ts      # (optional) WebSocket gateway (Socket.io)
|-- dto/
|   |-- create-<name>.dto.ts
|   `-- update-<name>.dto.ts
`-- <name>.service.spec.ts # Unit tests
```

**Global components in `src/common/`:**
- `decorators/roles.decorator.ts` — `@Roles(Role.ADMIN)` decorator
- `filters/http-exception.filter.ts` — Global exception handler
- `interceptors/audit.interceptor.ts` — Logs all requests
- `interceptors/transform.interceptor.ts` — Wraps response in `ApiResponseEnvelope`
- `utils/security.ts` — Hash, verify, sanitize input (DOMPurify) functions

**Global configuration (src/app.module.ts):**
- `ConfigModule.forRoot()` — Load `.env`, validate with Joi
- `ThrottlerModule` — Rate limit 100 requests/minute
- `LoggerModule` — Pino logger (pretty print in dev)
- Global guards, interceptors, filters

### Public Profile System

The public profile system lets users view athlete profiles without authentication. Key files:

**Backend:**
- `api-server/src/modules/public-profiles/` — Public profile module (controller, service)
  - `public-profiles.controller.ts` — `GET /api/v1/public-profiles/:id` endpoint
  - `public-profiles.service.ts` — Fetches full athlete profile with tournaments, achievements, affiliate links

**Frontend:**
- `web-client/src/app/[locale]/profile/[id]/page.tsx` — Public profile page
- `web-client/src/app/[locale]/profile/[id]/loading.tsx` — Loading skeleton
- `web-client/src/app/[locale]/profile/[id]/error.tsx` — Error boundary
- `web-client/src/app/[locale]/profile/[id]/not-found.tsx` — 404 page

The profile page displays: athlete avatar and cover image, sport, disability type, club, head coach, tournament history, achievements/medals, and active affiliate links. All data is read-only and publicly accessible without authentication.

### Web Client — Architecture Patterns

**Routing (App Router):**
- `[locale]` dynamic segment for i18n (`/vi/...`, `/en/...`)
- `layout.tsx` at each level provides shared layout (Header, Footer, Providers)
- `loading.tsx`, `error.tsx` for loading and error states

**State Management:**
- **SWR** (`useApi` hook) — Data fetching with cache, revalidation
- **Zustand** (`useModalStore`) — Client-side UI state
- **NextAuth** — Authentication state

**i18n:**
- `next-intl` with 2 locales: `vi` (Vietnamese) and `en` (English)
- Route prefix strategy: `/vi/...` and `/en/...`
- Middleware auto-detects locale from browser `Accept-Language`

**Styling:**
- Tailwind CSS 4 with `@tailwindcss/postcss`
- `tailwind-merge` + `class-variance-authority` for component variants
- `next-themes` for dark/light mode
- Radix UI primitives (Dialog, Slot)

**API Communication:**
1. **Server Components** — Call `fetch` directly to backend (full URL)
2. **Client Components** — Use `useApi` hook (SWR) call `/api/v1/...` -> middleware proxy -> backend
3. **Server Actions** — For forms (login, register)
4. **WebSocket** — `socket.io-client` connects to backend for live scores

**apiClient Auto-Unwrap:** The centralized API client at `web-client/src/lib/api-client.ts` automatically unwraps the NestJS response envelope. Every API response from the backend is wrapped in `{ data: ..., meta: ... }`. The `apiClient` extracts `.data` transparently, so callers receive the payload directly without needing to destructure the envelope. If a request fails (non-2xx), the client throws an error with the message from the envelope.

**Accessibility (a11y):**
- Font size adjustment
- High contrast mode
- Text-to-speech (Web Speech API)
- Keyboard navigation
- Semantic HTML + ARIA attributes

---

## Troubleshooting

### `npm install` gets peer dependency errors

```bash
# Always use legacy-peer-deps
npm install --legacy-peer-deps --force

# If it still errors, delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
```

### Prisma: `Environment variable not found: DATABASE_URL`

Check that the `.env` file in `api-server/` exists and has `DATABASE_URL`. Prisma auto-loads `.env` from the directory containing `schema.prisma`.

### Prisma: `Can't reach database server`

```bash
# Check Docker containers are running
docker ps | grep vn_paralympic

# If not running, start DB
docker compose up -d db

# If running local PostgreSQL, check port
# Local PG port: 5433 (Docker) or 5432 (manual install)
```

### Next.js: `Module not found: @vietnam-parasports/shared` error

```bash
# Build shared package
npm run build -w shared

# Or if dependencies were not installed
npm install --legacy-peer-deps -w shared
```

### Docker: ENOTFOUND / DNS resolution error

Web-client middleware has retry logic (3 attempts, 500ms delay) for DNS lookups. If it still errors:
```bash
# Restart the entire stack
docker compose down
docker compose up -d
```

### Windows: Prettier endOfLine conflicts

ESLint config has set `endOfLine: "auto"` to avoid CRLF/LF conflicts. If you still get errors:
```bash
git config core.autocrlf true
```

### CORS errors when calling API from browser

API only allows origins configured in `FRONTEND_URL` (default `http://localhost:3000`). If the frontend runs on a different port, update this variable in `api-server/.env`.

### Socket.io cannot connect

Ensure:
1. Backend is running on port 3001
2. Frontend connects to the correct URL (via proxy `/api/v1` or directly)
3. WebSocket gateway is properly initialized in the module (matches module has a Gateway)

---

## Code Conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add live scores feature
fix: fix CORS error for new domain
refactor: extract auth logic into separate service
docs: update README
chore: update dependencies
```

### Branches

- `main` — Production branch
- `develop` — Integration branch
- `feature/<feature-name>` — Feature branches
- `fix/<description>` — Bug fix branches
- `hotfix/<description>` — Production hotfixes

### Pull Requests

- Clearly describe changes (in both Vietnamese and English)
- Screenshots if UI changes
- Ensure CI passes (lint + build)
- Review by at least 1 person before merging

---

## Useful Commands

```bash
# === MONOREPO ===
npm install --legacy-peer-deps --force     # Install all dependencies

# === BACKEND ===
npm run start:dev -w api-server            # Run backend (watch mode)
npm run build -w api-server                # Build backend
npm run lint -w api-server                 # Lint backend
npm run format -w api-server               # Format backend
npm run test -w api-server                 # Test backend
cd api-server && npx prisma generate       # Generate Prisma client
cd api-server && npx prisma db push        # Push schema to DB
cd api-server && npx prisma db seed        # Seed database
cd api-server && npx prisma studio         # Open Prisma Studio

# === FRONTEND ===
npm run dev -w web-client                  # Run frontend (HMR)
npm run build -w web-client                # Build frontend
npm run lint -w web-client                 # Lint frontend

# === SHARED ===
npm run build -w shared                    # Build shared package

# === DOCKER ===
docker compose up -d                       # Run entire stack
docker compose up -d db redis              # Only run DB + Redis
docker compose down                        # Stop entire stack
docker compose logs -f api                 # View API service logs
docker compose logs -f web                 # View Web service logs
docker compose build --no-cache            # Rebuild images
```

---

## Contact & Support

- **Repository:** GitHub (private)
- **CI/CD:** GitHub Actions
- **Production URL:** https://vietnamparasports.com
- **API Documentation:** http://localhost:3001/api/docs (Swagger)

---

*This document was written by the Vietnam ParaSports development team. All contributions, please create a Pull Request.*
