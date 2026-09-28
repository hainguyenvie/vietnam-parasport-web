# ARCHITECTURE.md -- Vietnam ParaSports (English)

> Digital platform for disabled sports in Vietnam.

Last updated: 2026-06-28

---

## 1. System Overview

```
                          Internet (HTTPS)
                                |
              +---------------------------------------+
              |      Nginx / Cloud LB (production)    |
              +------------------+--------------------+
                                 |
              +------------------+--------------------+
              |            Docker Bridge              |
              |           (vn_paralympic_network)     |
              |                                       |
              |  +-----------+     +--------------+   |
              |  |  web      |     |    api       |   |
              |  |  :3000    |+--->|    :3001     |   |
              |  |  Next.js  |     |  NestJS 11   |   |
              |  |  16        |     |              |   |
              |  +-----+-----+     +------+-------+   |
              |        |                   |           |
              |        |      +-------+    |           |
              |        +----->| redis |<---+           |
              |               | :6379 |                |
              |               +-------+                |
              |                          |              |
              |               +----------+-------+     |
              |               |        db         |     |
              |               |  PostgreSQL 15   |     |
              |               |     :5433        |     |
              |               +------------------+     |
              +---------------------------------------+
```

**4 Docker Compose services:**

| Service | Container Name       | Port Map   | Image / Build              |
|---------|---------------------|------------|-----------------------------|
| db      | vn_paralympic_db    | 5433:5432  | postgres:15-alpine          |
| redis   | vn_paralympic_redis | 6379:6379  | redis:alpine                |
| api     | vn_paralympic_api   | 3001:3001  | Built from `Dockerfile.api` |
| web     | vn_paralympic_web   | 3000:3000  | Built from `Dockerfile.web` |

- **Network**: `vn_paralympic_network` (bridge driver, service-to-service communication)
- **Healthchecks**: Every service has `depends_on` + `condition: service_healthy` to enforce correct startup order
- **Volumes**: `postgres_data`, `redis_data` for persistent storage; `api-server/uploads` mounted as bind volume to API container

---

## 2. Data Flow

### Browser -> API (direct proxying via Next.js middleware)

```
+---------+         +---------------+          +-----------------+         +-----------+
| Browser |  HTTP   |  Next.js 16   |  rewrite |  NestJS 11 API   |  Prisma |  Postgres |
|         +-------->|  middleware   +--------->|  (port 3001)     +-------->|  15       |
|         |         |  (proxy)      |          |  Global Prefix:  |         |           |
|         |         |               |          |  /api/v1         |         |           |
+---------+         +---------------+          +-----------------+         +-----------+
```

**Middleware proxy logic** (`web-client/src/middleware.ts`):

- All `/api/*` requests are proxied to the NestJS backend (except `/api/auth/*`, `/api/upload`, `/api/media/*`, `/api/tts` -- these routes are handled internally by NextAuth / Next.js)
- **Development**: uses `NextResponse.rewrite(url)` -- transparent rewrite
- **Production**: retries up to 3 times with exponential backoff (500ms, 1000ms, 1500ms) to handle DNS propagation delay in Docker; fallback returns 502 if backend is unreachable
- **Server-side fetches**: web container uses `INTERNAL_API_URL=http://api:3001/api/v1` (docker DNS); browser-side uses relative path `/api/v1` to go through middleware

### Typical request path:

1. `GET /vi/news` -> Next.js App Router, SSR/SSG page
2. `GET /api/v1/posts?page=1` -> Next.js middleware rewrite -> NestJS controller -> PrismaService -> PostgreSQL
3. `POST /api/auth/login` -> Next.js middleware rewrite -> NestJS AuthController -> bcrypt compare -> JWT sign

---

## 3. Authentication Flow

### 3.1 Overall auth architecture

```
+--------------------+     JWT (7-day)     +--------------------+
|   NextAuth.js      | <-----------------> |   NestJS Auth API  |
|   (Next.js client) |                     |   (JWT + bcrypt)   |
|                     |                     |                     |
| - Credentials       |  POST /auth/login   | - validateUser()    |
|   (email+password)  | ------------------> | - login() -> JWT    |
|                     |                     |                     |
| - Credentials       |  POST /auth/login   | - 2FA flow if       |
|   (email+2FA token) |   /2fa              |   twoFactorEnabled  |
|                     | ------------------> |                     |
| - Google OAuth      |  signIn callback    | - oauthLogin()      |
|                     |  POST /auth/        |   upsert user +     |
|                     |   oauth-login       |   link account      |
+--------------------+                     +--------------------+
```

### 3.2 JWT Structure & Flow (Details)

**NestJS side (`api-server/src/modules/auth/`)**:
- **Strategy**: `passport-jwt` (file: `jwt.strategy.ts`)
- **Guard**: `JwtAuthGuard` extends `AuthGuard('jwt')` (file: `jwt-auth.guard.ts`)
- **Roles guard**: `RolesGuard` checks `@Roles()` decorator metadata
- **Token payload**:
  ```json
  {
    "email": "user@example.com",
    "sub": "<user-uuid>",
    "role": "USER | ADMIN | SUPER_ADMIN | INSTRUCTOR",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```
- **Token TTL**: 7 days via `JwtModule.register({ secret, signOptions: { expiresIn: '7d' } })`
- **Password hashing**: `bcrypt` with 10 salt rounds

**NextAuth side (`web-client/src/app/api/auth/[...nextauth]/route.ts`)**:
- **Providers**: `CredentialsProvider` + `GoogleProvider`
- **Credentials flow**: POST to `/api/v1/auth/login`; if response contains `twoFactorRequired`, switch to 2FA form -> POST to `/api/v1/auth/login/2fa`
- **Google OAuth flow**: `signIn` callback -> POST to `/api/v1/auth/oauth-login` to register/link account
- **Session enrichment**: JWT callback attaches `role` + `accessToken` to token; session callback copies them to session object
- **Session invalidation**: On 401 response from API, `api-client.ts` calls `signOut()` to clear session

### 3.3 Two-Factor Authentication (2FA TOTP)

```
+--------+                                    +-----------------------+
| Client |  1. POST /auth/login/2fa           | NestJS AuthService     |
|        |  { email, token: "123456" }        |                        |
|        +----------------------------------->| Totp.verify(token,     |
|        |                                    |   user.twoFactorSecret)|
|        |  2. Response: { access_token,      |                        |
|        |     user: { ... } }                +-----------------------+
|        |<-----------------------------------+
+--------+
```

- **Library**: `otplib` (file: `api-server/src/modules/auth/totp.ts`)
- **Config**: step=30s, window=1, digits=6
- **Storage**: `User.twoFactorSecret` (encrypted seed); `User.isTwoFactorEnabled` (boolean flag)
- **Verification**: `Totp.verify(token, secret)` using `authenticator.check()`

### 3.4 Password Reset Flow

```
Client -> POST /auth/forgot-password { email }
       -> Server generates crypto.randomBytes(32) token
       -> Token hashed (SHA-256) + stored in PasswordResetToken (expires 15 min)
       -> Sends email via Handlebars template ("forgot-password")
Client -> POST /auth/reset-password { email, token, newPassword }
       -> Server hashes token, looks up PasswordResetToken
       -> Validates expiry, updates User.passwordHash
       -> Deletes all tokens for that email
```

### 3.5 Role-Based Access Control (RBAC)

- **Models**: `User -> Role -> Permission` (many-to-many via implicit join)
- **Roles**: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `INSTRUCTOR`, `USER`
- **Permissions**: action (READ/CREATE/UPDATE/DELETE) x resource (POST/COURSE/USER/COMMENT)
- **Guard chain**: `ThrottlerGuard` (global) -> `JwtAuthGuard` -> `RolesGuard` (per-route via `@Roles()` decorator)

---

## 4. Module map (44 NestJS Modules)

### 4.1 Users & Auth -- 6 modules

| Module               | Endpoint Prefix     | Prisma Models Used                              |
|----------------------|---------------------|-------------------------------------------------|
| auth                 | /auth               | User, Role, Account, PasswordResetToken, EmailTemplate |
| users                | /users              | User, AthleteProfile, CoachProfile, AssistantProfile |
| roles                | /roles              | Role, Permission                                |
| mail                 | /mail               | EmailTemplate (Nodemailer)                      |
| email-templates      | /email-templates    | EmailTemplate                                   |
| settings             | /settings           | SystemSetting                                   |

### 4.2 Content / CMS -- 7 modules

| Module               | Endpoint Prefix     | Prisma Models Used                              |
|----------------------|---------------------|-------------------------------------------------|
| posts                | /posts              | Post, Category, Tag, Comment, Bookmark          |
| categories           | /categories         | Category                                        |
| tags                 | /tags               | Tag                                             |
| comments             | /comments           | Comment                                         |
| bookmarks            | /bookmarks          | Bookmark                                        |
| search               | /search             | Post, Course, Sport (full-text)                 |
| events               | /events             | Event                                           |

### 4.3 Learning / LMS -- 6 modules

| Module               | Endpoint Prefix     | Prisma Models Used                              |
|----------------------|---------------------|-------------------------------------------------|
| courses              | /courses            | Course                                          |
| chapters             | /chapters           | Chapter                                         |
| lessons              | /lessons            | Lesson                                          |
| quizzes              | /quizzes            | Quiz, Question                                  |
| assignments          | /assignments        | Assignment, AssignmentSubmission                |
| course-progress      | /course-progress    | UserCourseProgress                              |

### 4.4 Sports -- 10 modules

| Module               | Endpoint Prefix         | Prisma Models Used                          |
|----------------------|-------------------------|---------------------------------------------|
| sports               | /sports                 | Sport, DisabilityType                       |
| sport-events         | /sport-events           | SportEvent                                  |
| sport-classifications| /sport-classifications  | SportClassification                         |
| tournaments          | /tournaments            | Tournament                                  |
| sub-tournaments      | /sub-tournaments        | SubTournament                               |
| matches              | /matches                | Match, MatchEvent (incl. LiveScoreGateway)  |
| rankings             | /rankings               | Ranking                                     |
| teams                | /teams                  | Team, TeamMember                            |
| athlete-achievements | /athlete-achievements   | AthleteAchievement, Medal                   |
| disability-types     | /disability-types       | DisabilityType                              |

### 4.5 Community & Organizations -- 6 modules

| Module               | Endpoint Prefix         | Prisma Models Used                              |
|----------------------|-------------------------|-------------------------------------------------|
| organizations        | /organizations          | Organization                                    |
| companion-requests   | /companion-requests     | CompanionRequest                                |
| partners             | /partners               | Partner                                         |
| assistant-profiles   | /assistant-profiles     | AssistantProfile                                |
| social-links         | /social-links           | SocialLink                                      |
| calendar             | /calendar               | Event, Match (iCal generation via `ical-generator`) |

### 4.6 System & Utilities -- 6 modules

| Module               | Endpoint Prefix         | Purpose                                        |
|----------------------|-------------------------|-------------------------------------------------|
| media                | /media                  | File upload (multer), HMAC-signed private URLs, SVG sanitization, STT/TTS mock |
| reports              | /reports                | PDF report generation (Puppeteer), Excel export (ExcelJS) |
| statistics           | /statistics             | Dashboard analytics                             |
| documents            | /documents              | Document (Creator Lab)                          |
| document-topics      | /document-topics        | DocumentTopic                                   |
| capcut-templates     | /capcut-templates       | CapcutTemplate (video editing templates)        |

### 4.7 E-Commerce & Affiliate -- 3 modules

| Module               | Endpoint Prefix         | Prisma Models Used                              |
|----------------------|-------------------------|-------------------------------------------------|
| products             | /products               | SponsorStore, Product, ProductCategory          |
| affiliate            | /affiliate              | AffiliateLink, AffiliateClick                   |
| commissions          | /commissions            | Commission, Payout                              |

---

## 5. Prisma Schema Overview (Data Model)

### 5.1 User & RBAC

```
User ----+---- Role ----+---- Permission
         |  (roleId)    |  (many-to-many implicit)
         |
         +---- AthleteProfile (1-1, optional)
         |       +---- Sport (N-1)
         |       +---- DisabilityType (N-1)
         |       +---- Organization (N-1, optional)
         |       +---- SportClassification (N-1, optional)
         |
         +---- CoachProfile (1-1, optional)
         |       +---- Sport (N-1)
         |
         +---- AssistantProfile (1-1, optional)
         |       +---- AthleteProfile (N-1, optional)
         |
         +---- Account[] (OAuth provider links)
         |       @@unique([provider, providerAccountId])
```

### 5.2 Content & LMS (CMS & Learning)

```
Category ----< Post ----< Comment
                |  (authorId -> User)
                +----< Tag (many-to-many)
                +----< Bookmark (userId, postId)

Course ----< Chapter (order) ----< Lesson (order)
  |                                      +---- Quiz (1-1)
  |                                      |      +----< Question[]
  |                                      +---- Assignment (1-1)
  |                                             +----< AssignmentSubmission[]
  +----< UserCourseProgress
           @@unique([userId, courseId])
```

### 5.3 Sports & Tournaments

```
Sport ----< Match
  |         +---- Tournament? (N-1)
  |         +---- SubTournament? (N-1)
  |         +---- SportClassification? (N-1)
  |         +---- Match -> NextMatch (self-ref) -- bracket progression
  |         +----< MatchEvent[]
  |
  +----< SportEvent (e.g. "100m Sprint", "50m Freestyle")
  |       +---- Match[]
  |       +---- Ranking[]
  |
  +----< SportClassification (e.g. T11, F20, S1)
  |       +---- AthleteProfile[]
  |       +---- Match[]
  |       +---- Ranking[]
  |
  +----< Ranking
  |       +---- AthleteProfile? (N-1)
  |       +---- Team? (N-1)
  |       +---- Tournament? (N-1)
  |
  +----< Team
          +---- Organization? (N-1)
          +---- Tournament? (N-1)
          +----< TeamMember
                  @@unique([teamId, athleteId])

Tournament ----< Match
  |            +---- SubTournament[]
  |            +---- Ranking[]
  |            +---- Team[]
  |            +---- AthleteAchievement[]
  |            +---- Medal[]
  |            +---- AthleteProfile[] (many-to-many)
  |
  +----< SubTournament
           +---- Sport (N-1)
           +---- SportClassification? (N-1)
           +----< Match[]

AthleteProfile ----< AthleteAchievement
                         +---- Tournament? (N-1)
                         +---- SportEvent? (N-1)
                         +---- SportClassification? (N-1)

Medal ---- AthleteProfile (N-1)
  +---- Tournament (N-1)
```

### 5.4 E-Commerce & Affiliate

```
SponsorStore ---- Partner (1-1)
  +---- Product (1-N)
           +---- ProductCategory (N-1)
           +---- AffiliateLink (1-N)
                    +---- AthleteProfile (N-1)
                    +---- AffiliateClick (1-N)
                              [IP, UA, referer, UTM params, device fingerprint, isConverted flag]

Commission ---- AthleteProfile (N-1)
  +---- AffiliateLink (N-1)
  +---- Payout (N-1)
```

### 5.5 System & Media

```
SystemSetting (key-value JSON config)
AuditLog (userId -> User, action, entityId, details JSON, ipAddress)
PasswordResetToken (@@index([email]))
EmailTemplate (key unique, subject, content @db.Text, variables JSON string)

DocumentTopic ----< Document ----< DocumentAttachment
CapcutTemplate
SocialLink
Partner
CompanionRequest
Event (standalone community events)
```

**Key design notes:**
- `Match.nextMatchId` is a self-referencing foreign key for tournament bracket progression (winner advances)
- `Tournament.athletes` is a many-to-many pivot for tournament participant registration
- `Lesson` uses optional 1-1 relations to `Quiz` and `Assignment` via unique `lessonId` field
- `Comment` can relate to `Post`, `Match`, or be a reply to another `Comment` (polymorphic via nullable FKs)
- `SystemSetting` stores arbitrary JSON values -- used for hero carousel, footer content, menu configuration, etc.

---

## 6. WebSocket Architecture (Live Score)

```
+------------------+                    +-------------------------------+
|  Browser Client  |  Socket.IO v4      |  NestJS WebSocket Gateway     |
|  (socket.io-     | <----------------> |  (LiveScoreGateway)           |
|   client v4.8.3) |  ws://host:3001    |                               |
|                  |  /live-scores      |  @WebSocketGateway({          |
|                  |                    |    namespace: '/live-scores', |
|                  |                    |    cors: { origin: [...] }    |
|                  |                    |  })                           |
+------------------+                    |                               |
                                        |  Methods:                     |
  Events listened:                      |  - emitScoreUpdate(matchId,   |
  - SCORE_UPDATED                       |    payload)                   |
    { matchId, score, ... }             |                               |
                                        |  Lifecycle hooks:             |
                                        |  - handleConnection()         |
                                        |  - handleDisconnect()         |
                                        +-------------------------------+
                                                  |
                                                  | Called from
                                                  v
                                        +-------------------------------+
                                        |  MatchesService               |
                                        |  - create(match) triggers     |
                                        |    emitScoreUpdate()          |
                                        |  - (extensible for real-time  |
                                        |    score changes)             |
                                        +-------------------------------+
```

- **Gateway**: `api-server/src/modules/matches/live-score.gateway.ts`
- **Namespace**: `/live-scores` (separate from default `/` to avoid conflicts)
- **CORS**: Configured from `FRONTEND_URL` env var (comma-separated for multi-origin)
- **Events**: Currently emits `SCORE_UPDATED` on match creation; extensible for per-match score delta updates
- **Transport**: WebSocket (with Socket.IO auto-upgrade from HTTP long-polling)

---

## 7. Frontend Architecture

### 7.1 Directory Structure

```
web-client/src/
  app/
    [locale]/                    <-- Next.js App Router (param: vi | en)
      page.tsx                   <-- Home page
      about/
      accessibility/
      admin/                     <-- Admin dashboard routes
      bookmarks/
      clubs/
      companion/
      courses/
      creator-lab/
      faq/
      forgot-password/
      login/
      matches/
      news/
      privacy/
      profile/
      rankings/
      register/
      reset-password/
      search/
      settings/
      sports/
      terms/
      tournaments/
      layout.tsx                 <-- Root layout (providers, header, footer)
      error.tsx, loading.tsx
    api/
      auth/[...nextauth]/        <-- NextAuth.js API route handler
      media/                     <-- Media proxy
      tts/                       <-- Text-to-Speech endpoint
      upload/                    <-- Upload handler
  components/
    ui/                          <-- Shared UI primitives (Button, Card, Dialog, Toaster)
    admin/                       <-- Admin dashboard components
    map/                         <-- Map/D3 components (organizations, sports)
    shared/                      <-- Shared components
    Header.tsx, Footer.tsx, AuthProvider.tsx, ThemeProvider.tsx,
    AccessibilityProvider.tsx, SettingsProvider.tsx, ...
  hooks/
    useApi.ts                    <-- SWR-based data fetching
    useDebounce.ts               <-- Debounce utility
    useTranslation.ts            <-- next-intl wrapper
  i18n/
    routing.ts                   <-- Locale routing (vi, en)
    request.ts                   <-- Server-side locale detection
  lib/
    api-client.ts                <-- Universal fetch client (browser + server)
    utils.ts                     <-- cn(), generateSlug()
  services/
    course.service.ts            <-- Business logic wrappers
    event.service.ts
    post.service.ts
    setting.service.ts
    user.service.ts
  store/
    useModalStore.ts             <-- Zustand global modal state
  messages/
    vi.json                      <-- Vietnamese translations
    en.json                      <-- English translations
```

### 7.2 App Router & i18n

- **Localization**: `next-intl` v4 with path-based routing (`/[locale]/...`)
  - Supported locales: `vi` (default), `en`
  - Messages in `/messages/{locale}.json`
  - Server-side detection: `request.ts` with `getRequestConfig`
  - Client-side navigation: `createNavigation(routing)` exports `Link`, `usePathname`, `useRouter`, `getPathname`
- **Routing**: All pages under `[locale]` dynamic segment
- **Layout providers** (nested from root):
  ```
  <html lang={locale}>
    <NextIntlClientProvider>
      <AuthProvider>           <-- NextAuth SessionProvider
        <ThemeProvider>        <-- next-themes (dark mode)
          <SettingsProvider>   <-- Global settings context
            <AccessibilityProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <AccessibilityPanel />
              <Toaster />        <-- sonner toast notifications
              <GlobalModal />    <-- Zustand-driven modal
  ```
- **Build output**: `standalone` mode (for Docker deployment)

### 7.3 API Client & Data Fetching

**`api-client.ts`** -- the universal API layer:

```
+--------------------+     +---------------------+     +------------------+
|  Browser-side      |     |  Server-side (SSR)   |     |  NestJS API      |
|  (useApi / SWR)    |     |  (getServerSession)  |     |  /api/v1/*       |
+--------+-----------+     +----------+-----------+     +--------+---------+
         |                            |                          |
         |  getBaseUrl() returns       |  getBaseUrl() uses       |
         |  '/api/v1'                |  INTERNAL_API_URL or     |
         |  (relative, goes thru    |  NEXT_PUBLIC_API_URL     |
         |   Next.js middleware)     |  (Docker: http://api:3001)|
         |                            |                          |
         v                            v                          v
    +----+----------------------------+--------------------------+----+
    |                     request(path, options)                       |
    |  - Auto-attaches Authorization: Bearer <accessToken> header      |
    |  - Token source: browser=getSession(), server=getServerSession()  |
    |  - On 401: auto signOut() on browser, throw on server           |
    |  - Retry: up to 2 retries on ENOTFOUND/ECONNREFUSED/ETIMEDOUT   |
    +-----------------------------------------------------------------+
```

**`useApi.ts`** -- the SWR hook layer:

- `useApi(path)` -- generic SWR fetcher for GET requests
- `usePaginatedApi(path, page, limit, extraParams)` -- paginated GET with typed `PaginatedResponse<T>` return
- SWR config: automatic revalidation on focus, customizable cache TTL

### 7.4 State Management

- **Zustand** (`useModalStore`): Global modal dialog state (confirm, prompt, custom content). Lightweight -- only used for cross-cutting UI concerns
- **SWR cache**: Most server-state lives in SWR's in-memory cache, revalidated automatically
- **Context providers**: Auth (NextAuth SessionProvider), Theme (next-themes), Settings, Accessibility -- each scoped to its own React context

### 7.5 Key Frontend Dependencies

| Package              | Purpose                                    |
|----------------------|--------------------------------------------|
| next 16.2.7          | React framework with App Router            |
| next-auth 4.24.14    | Authentication (Google OAuth + credentials)|
| next-intl 4.13.0     | Internationalization (vi/en)               |
| swr 2.4.1            | Client-side data fetching + caching        |
| zustand 5.0.14       | Lightweight global state                   |
| react-hook-form 7.80 | Form state management + validation         |
| @hookform/resolvers   | Zod schema -> react-hook-form bridge       |
| @tiptap/react 3.26   | Rich text editor (post content)            |
| recharts 3.8         | Charts and data visualization              |
| sonner 2.0.7         | Toast notifications                        |
| next-themes 0.4.6    | Dark/light theme toggle                    |
| tailwindcss 4        | Utility-first CSS framework                |
| lucide-react 1.17    | Icon library                               |
| socket.io-client 4.8 | WebSocket client for live scores           |

---

## 8. E-Commerce & Affiliate

The platform supports an e-commerce sponsor marketplace with an integrated affiliate marketing system. Athletes earn commissions by promoting sponsor products through tracked affiliate links.

### 8.1 Modules

| Module      | Endpoint Prefix | Purpose                                                    |
|-------------|-----------------|------------------------------------------------------------|
| products    | /products       | Sponsor marketplace: stores, product catalog, categories   |
| affiliate   | /affiliate      | Affiliate link generation + click tracking                 |
| commissions | /commissions   | Commission calculation, approval, and payout management    |

### 8.2 Sponsorship Marketplace

```
SponsorStore (1) ---- Partner (1-1, required)
                   +---- Product (1-N)
                            +---- ProductCategory (N-1)
                            +---- AffiliateLink (1-N)

ProductCategory -- hierarchical (self-referencing parentId)
```

**SponsorStore**: Each store links 1:1 to a Partner record from the community domain. A partner with an active SponsorStore is considered a "sponsor" whose products appear in the marketplace.

**Product**: Products belong to a SponsorStore and a ProductCategory. Key fields: `title`, `slug`, `description`, `price`, `compareAtPrice`, `currency`, `images` (JSON array), `inventory`, `isActive`, `isFeatured`.

**ProductCategory**: Hierarchical category tree via `parentId` self-reference. Used to organize the product catalog for browsing.

### 8.3 Affiliate System

```
AffiliateLink ---- AthleteProfile (N-1)
              +---- AffiliateClick (1-N)
                       [IP, userAgent, referer, utmSource/Medium/Campaign, deviceType, isConverted]
```

**AffiliateLink**: Each link is tied to a specific AthleteProfile (the athlete earning commission) and a Product. Contains a `shortCode` (unique, 8-char alphanumeric), `platform` enum (WEBSITE, FACEBOOK, TIKTOK, INSTAGRAM, YOUTUBE, ZALO, OTHER), and optional `utmSource`/`utmMedium`/`utmCampaign` for campaign-level tracking.

**AffiliateClick**: Every click on an affiliate link is recorded. Fields tracked: `ipAddress`, `userAgent`, `referer`, `utmSource/Medium/Campaign/Content/Term`, `deviceType`, `browser`, `os`, `isConverted` (whether this click led to a commissionable event).

### 8.4 Click Tracking Flow

```
Browser                    App Server
  |                            |
  | GET /go/:shortCode         |
  |--------------------------->|
  |                            | 1. Lookup AffiliateLink by shortCode
  |                            | 2. Parse request headers:
  |                            |    - IP from X-Forwarded-For
  |                            |    - UA from User-Agent
  |                            |    - Referer from Referer header
  |                            | 3. Parse UTM query params
  |                            | 4. Device fingerprint (user-agent parser)
  |                            | 5. INSERT AffiliateClick record
  |                            | 6. Increment AffiliateLink.clickCount
  |                            |
  | 302 Redirect to targetUrl |
  |<---------------------------|
  |                            |
  | (browser loads target)     |
```

The `GET /go/:shortCode` endpoint performs a **302 Found** redirect after recording the click. This is a fire-and-forget operation: the redirect happens immediately while click recording runs asynchronously (via NestJS events or a queue) to avoid adding latency to the redirect.

### 8.5 Commission & Payout Engine

```
Commission ---- AthleteProfile (N-1)
           +---- AffiliateLink (N-1)
           +---- Payout (N-1)

Payout --- Commission (1-N), payment via BANK_TRANSFER / MOMO / ZALOPAY
```

**Commission**: Represents earnings for a conversion. Status lifecycle: `PENDING -> APPROVED -> PAID` (or `REJECTED`). Stores `amount`, `currency`, `rate` (commission percentage), `conversionData` (JSON -- order details), and links to both the AthleteProfile and AffiliateLink.

**Payout**: A batch payment to an athlete covering one or more commissions. Has a `status` enum (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED), a `paymentMethod` enum (BANK_TRANSFER, MOMO, ZALOPAY), and stores `paymentReference` (external transaction ID) and `paymentNote`. One Payout captures multiple Commissions; a Commission can only belong to one Payout (preventing double-payment).

### 8.6 New Models Summary

| Model              | Key Relations                                  |
|--------------------|-----------------------------------------------|
| SponsorStore       | Partner (1-1), Product (1-N)                   |
| Product            | SponsorStore, ProductCategory, AffiliateLink   |
| ProductCategory    | self (hierarchy), Product                      |
| AffiliateLink      | AthleteProfile, Product, AffiliateClick (1-N)  |
| AffiliateClick     | AffiliateLink                                  |
| Commission         | AthleteProfile, AffiliateLink, Payout          |
| Payout             | Commission (1-N)                               |

### 8.7 New Enums

| Enum                  | Values                                                    |
|-----------------------|-----------------------------------------------------------|
| AffiliatePlatform     | WEBSITE, FACEBOOK, TIKTOK, INSTAGRAM, YOUTUBE, ZALO, OTHER|
| CommissionStatus      | PENDING, APPROVED, REJECTED, PAID                         |
| PayoutStatus          | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED         |
| PaymentMethod         | BANK_TRANSFER, MOMO, ZALOPAY                              |

---

## 9. Shared Validation (Package @vietnam-parasports/shared)

### 9.1 Package structure

```
shared/
  package.json       (name: "@vietnam-parasports/shared", main: dist/index.js)
  tsconfig.json
  src/
    index.ts         <-- Re-exports everything from validation.ts + shared types
    validation.ts    <-- Zod schemas
```

**Dependencies**: only `zod ^3.24.0` -- zero runtime dependencies beyond zod.

**Build**: `tsc` compiles to `dist/`; consumed by both `api-server` and `web-client` via `"@vietnam-parasports/shared": "*"` in their respective `package.json` (monorepo workspace resolution).

### 9.2 Shared Zod Schemas

| Schema                   | Purpose                                   |
|--------------------------|-------------------------------------------|
| `loginSchema`            | email + password validation               |
| `login2FASchema`         | email + 6-digit TOTP token                |
| `registerSchema`         | email + password + fullName + optional role/dob/gender |
| `forgotPasswordSchema`   | email only                                |
| `resetPasswordSchema`    | email + token + newPassword               |
| `changePasswordSchema`   | currentPassword + newPassword             |
| `updateUserSchema`       | Profile fields (all optional)             |
| `oauthLoginSchema`       | email + fullName + avatarUrl + provider + providerAccountId |
| `paginationSchema`       | page + limit (coerced numbers, max 100)   |
| `mediaViewSchema`        | file + expires + signature                |
| `organizationSchema`     | name + type + location + ...              |
| `companionRequestSchema` | fullName + email + type + message         |

### 9.3 Shared TypeScript Types

| Type / Interface          | Description                              |
|---------------------------|------------------------------------------|
| `ApiResponseEnvelope<T>`  | Standard `{ success, data, meta?, message? }` wrapper |
| `UserRole` (enum)         | `SUPER_ADMIN`, `ADMIN`, `USER`, `ATHLETE`, `COACH` |
| `UserSessionDto`          | `{ id, email, name, role, accessToken }` |
| `GlobalSettingsDto`       | Typed system settings (logo, hero, footer, menus) |
| `SocialLinkDto`           | Social link entry                        |
| `CarouselItem`            | Hero carousel item                       |
| `PaginatedResponse<T>`    | Paginated list envelope                  |

---

## 10. File Storage

### 10.1 Directory Layout

```
api-server/uploads/
  public/                  <-- Serve static qua Express (prefix: /uploads/public)
    images/                <-- Public images (e.g. articles, thumbnails)
    documents/             <-- Public documents
    svgs/                  <-- SVG files (auto-sanitized for XSS)
  private/                 <-- Protected files, access via HMAC-signed URLs only
    images/
    pdfs/
    documents/
  settings/                <-- Site settings files (logo, favicon)
  sports/                  <-- Sport-related assets
```

### 10.2 Upload Flow

```
Browser -> POST /api/v1/media/upload (multipart/form-data)
          Headers: Authorization: Bearer <token>
          Query: ?isPublic=true|false
          Body: file=<binary>
              |
              v
          MediaController.uploadFile()
              |
              +-- Validate extension (.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.vtt,.srt,.mp4,.webm,.mov)
              +-- Validate size (10MB default, 50MB video, 100MB PDF, 20MB office docs)
              +-- If SVG: sanitize via DOMPurify (XSS prevention)
              +-- Save to uploads/public/* or uploads/private/* based on isPublic
              +-- Generate UUID filename
              +-- Return url:
                    - Public: /uploads/public/images/<uuid>.ext
                    - Private: /api/v1/media/view?file=...&expires=...&signature=...
```

### 10.3 HMAC-Signed Private URLs

**File**: `api-server/src/common/utils/security.ts`

```
Algorithm:  HMAC-SHA256(secret, "filePath:expiresTimestamp")
Secret:     NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET env var
Expiry:     15 minutes (configurable via expiresInMs param)

generate:   const sig = hmac(fileName + ":" + expires, secret)
verify:     timingSafeEqual(computed, provided) AND Date.now() < expires
path check: resolved path MUST start with uploads/private (path traversal prevention)
```

**Security properties**:
- `timingSafeEqual` prevents timing side-channel attacks on signature comparison
- Timestamp check prevents replay of expired URLs
- Path prefix check prevents directory traversal (e.g. `../../etc/passwd`)
- Same secret shared between api and web containers via env var

### 10.4 Supported File Types & Size Limits

| Category   | Extensions                                    | Max Size |
|------------|-----------------------------------------------|----------|
| Images     | .png, .jpg, .jpeg, .webp                      | 10 MB    |
| Videos     | .mp4, .webm, .mov                             | 50 MB    |
| PDF        | .pdf                                          | 100 MB   |
| Office     | .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt   | 20 MB    |
| Subtitles  | .vtt, .srt                                    | 10 MB    |
| SVG        | .svg (auto-sanitized via DOMPurify)           | 10 MB    |

### 10.5 SVG Sanitization

All SVG uploads are processed through `DOMPurify` with SVG-specific profiles before storage:
- Allowed tags: standard SVG elements + `animate`, `animateMotion`, `animateTransform`
- Allowed attributes: standard SVG attrs + animation attrs (`dur`, `repeatCount`, `fill`, `values`, `attributeName`)
- Prevents XSS via embedded scripts, event handlers, and foreignObject elements

---

## 11. Infrastructure & DevOps

### 11.1 Docker Configuration

```
Dockerfile.api          <-- Multi-stage: build (Node) -> production (Node slim)
                            CMD: node dist/src/main
Dockerfile.web          <-- Multi-stage: build (Node) -> production (Node slim)
                            CMD: node server.js (Next.js standalone output)
docker-compose.yml      <-- 4 services, bridge network, healthchecks, named volumes
```

### 11.2 NestJS Server Config (`main.ts`)

| Setting            | Value                                      |
|---------------------|--------------------------------------------|
| Global prefix       | `/api/v1`                                  |
| Body parser         | Disabled default; custom `json({ limit: '10mb' })` + `urlencoded({ limit: '10mb' })` |
| CORS                | Origins from `FRONTEND_URL` env (comma-separated), credentials enabled |
| Helmet              | Security headers (XSS, CSP, etc.)          |
| Compression         | gzip/brotli response compression           |
| Static assets       | `uploads/public` served at `/uploads/public` |
| Swagger             | `/api/docs` (OpenAPI 3.0)                  |
| Logger              | `nestjs-pino` (pretty-print in dev, JSON in prod) |
| Rate limiting       | `@nestjs/throttler` - 100 req/min global    |
| Trust proxy         | `app.set('trust proxy', 1)` for reverse proxy (Nginx/LB) |

### 11.3 Environment Variables (Key Ones)

| Variable                            | Service | Purpose                                    |
|-------------------------------------|---------|--------------------------------------------|
| `DATABASE_URL`                      | api     | PostgreSQL connection string               |
| `JWT_SECRET`                        | api     | JWT signing key                            |
| `SMTP_HOST/PORT/USER/PASS/FROM`     | api     | Nodemailer SMTP config                     |
| `FRONTEND_URL`                      | api     | CORS origin(s) + redirect base URL         |
| `NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET`| api,web | HMAC key for private file URLs             |
| `NEXTAUTH_SECRET`                   | web     | NextAuth.js encryption key                 |
| `NEXTAUTH_URL`                      | web     | Canonical base URL for NextAuth callbacks  |
| `GOOGLE_CLIENT_ID/SECRET`           | web     | Google OAuth credentials                   |
| `NEXT_PUBLIC_API_URL`               | web     | Public API URL (browser-side)              |
| `INTERNAL_API_URL`                  | web     | Docker-internal API URL (server-side)      |

---

## 12. Security Summary

| Layer               | Mechanism                                                 |
|----------------------|-----------------------------------------------------------|
| Transport           | HTTPS in production (terminated at Nginx/LB)              |
| Auth                | JWT (7-day) + NextAuth session + Google OAuth + TOTP 2FA |
| Password storage    | bcrypt (10 salt rounds)                                   |
| Reset tokens        | SHA-256 hashed, 15-min expiry, single-use (deleted after use) |
| Rate limiting       | 100 req/min global (ThrottlerGuard)                       |
| File upload         | Extension whitelist, size limits, SVG XSS sanitization    |
| Private files       | HMAC-SHA256 signed URLs, path traversal prevention        |
| CORS                | Whitelisted origins from env config                       |
| HTTP headers        | Helmet (CSP, X-Frame-Options, etc.)                       |
| Input validation    | Zod schemas (shared) + class-validator DTOs (NestJS)      |
| XSS prevention      | DOMPurify (SVG + HTML content), isomorphic-dompurify      |
| Audit logging       | AuditInterceptor records user actions to AuditLog table   |
| SQL injection       | Prisma parameterized queries (no raw SQL)                 |

---

## 13. API Conventions

- **Base path**: `/api/v1/`
- **Response envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 },
    "message": "Success"
  }
  ```
- **Pagination**: Query params `?page=1&limit=20` (max 100 per page)
- **Authentication header**: `Authorization: Bearer <jwt_token>`
- **Error response**:
  ```json
  {
    "success": false,
    "message": "Error description",
    "statusCode": 400
  }
  ```
- **Swagger docs**: Available at `/api/docs` (development only)
- **File downloads**: Private files via `/api/v1/media/view?file=...&expires=...&signature=...`; public files direct from `/uploads/public/...`

---

## 14. ETL & PDF Generation

- **Puppeteer** (`api-server`): PDF report generation in ReportsModule (launches headless Chromium in Docker)
- **ExcelJS** (`api-server`): Spreadsheet export for reports and data exports
- **iCal** (`api-server`): `.ics` calendar feed generation via `ical-generator` package in CalendarModule
- **Handlebars** (`api-server`): Email template rendering with dynamic variables
- **Pino HTTP** (`api-server`): Structured JSON logging in production, pretty-print in development

---

*This document describes the current architecture of the Vietnam ParaSports platform as of June 2026.*
