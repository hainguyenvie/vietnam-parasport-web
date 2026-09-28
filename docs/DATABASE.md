# DATABASE.md -- Vietnam ParaSports

Database documentation for the **Vietnam ParaSports** project.
The project uses **PostgreSQL 15** as its database management system, combined with **Prisma 7.8** as the ORM (Object-Relational Mapper)
and **@prisma/adapter-pg** to manage connection pooling.

---

## 1. Schema Overview

The schema is organized into 6 main domains, each handling a part of the system:

| Domain | Description | Key Models |
|---|---|---|
| **Users & RBAC** | User management, roles, permissions, authentication | `User`, `Role`, `Permission`, `Account`, `PasswordResetToken` |
| **CMS (Content)** | Posts, categories, tags, events | `Category`, `Post`, `Tag`, `Event` |
| **LMS (Learning)** | Courses, chapters, lessons, quizzes, assignments | `Course`, `Chapter`, `Lesson`, `Quiz`, `Question`, `Assignment`, `AssignmentSubmission`, `UserCourseProgress` |
| **Sports & Competitions** | Sports, tournaments, matches, rankings, athlete/coach profiles | `Sport`, `Tournament`, `SubTournament`, `Match`, `MatchEvent`, `Ranking`, `AthleteProfile`, `CoachProfile`, `AthleteAchievement`, `SportClassification`, `SportEvent`, `Team`, `TeamMember`, `Medal`, `DisabilityType` |
| **Community** | Clubs, partners, companion requests, comments, bookmarks | `Organization`, `CompanionRequest`, `Partner`, `Comment`, `Bookmark` |
| **System** | System: audit log, settings, email templates | `AuditLog`, `SystemSetting`, `EmailTemplate` |
| **Creator Lab** | Creative content: documents, Capcut templates, social links | `DocumentTopic`, `Document`, `DocumentAttachment`, `CapcutTemplate`, `SocialLink` |

Total: **~45 models**. All models use `id: String @id @default(uuid())` for UUID generation.

---

## 2. Key Models & Relationships

### 2.1 Users & RBAC

```
User (many) ────> Role (one)         [via roleId]
Role  (many) <──> Permission (many)  [many-to-many implicit]
User (one) ────> Account (many)      [OAuth providers: google, facebook]
```

**User** is the central model. Each User has:
- **roleId** linking to **Role** (many-to-one). A User has only 1 Role.
- **Role** can have many **Permissions** such as `READ POST`, `CREATE COURSE`, `UPDATE USER`, etc. This relationship is many-to-many implicit (Prisma manages the join table automatically).
- Default Roles in seed: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `INSTRUCTOR`, `TOURNAMENT_MANAGER`, `USER`.
- `Account` model stores OAuth information (Google, Facebook). Unique constraint: `[provider, providerAccountId]`.
- **avatarUrl** and **coverUrl**: Optional string fields for profile images. Both accept base64-encoded data or a URL.

### 2.2 Profiles

```
User (one) ────> AthleteProfile  (one-to-one)   [userId unique]
User (one) ────> CoachProfile    (one-to-one)   [userId unique]
User (one) ────> AssistantProfile (one-to-one)  [userId unique]

AthleteProfile (many) ────> Sport           (one)
AthleteProfile (many) ────> DisabilityType  (one)   [disability type]
AthleteProfile (one)  ────> Organization    (one?)  [club]
AthleteProfile (one)  ────> SportClassification (one?)  [sport class]
```

Each User has at most 1 profile of each type (one-to-one). AthleteProfile links to Sport, DisabilityType, Organization, and SportClassification.

### 2.3 LMS -- Learning

```
Course (one) ────> Chapter (many)  [onDelete: Cascade]
Chapter (one) ───> Lesson (many)   [onDelete: Cascade]
Lesson (one) ────> Quiz (one?)      [unique lessonId]
Lesson (one) ────> Assignment (one?) [unique lessonId]

Quiz (one) ──────> Question (many)  [onDelete: Cascade]
Assignment (one) ─> AssignmentSubmission (many) [onDelete: Cascade]
```

Main relationship chain: **Course -> Chapter -> Lesson**. Each Lesson can have 1 Quiz or 1 Assignment (optional).

**UserCourseProgress** tracks learning progress:
- `@@unique([userId, courseId])` -- each User has only 1 progress record per Course.
- `progressPct` (Float, 0-100) and `isCompleted` (Boolean).

### 2.4 Sports & Competitions

```
Sport (one) ────> SportClassification (many)   [sport class]
Sport (one) ────> SportEvent (many)            [competition events: 100m, 200m...]
Sport (one) ────> SubTournament (many)
Sport (one) ────> Match (many)
Sport (one) ────> Ranking (many)
Sport (one) ────> Team (many)

Tournament (one) ──> SubTournament (many)  [onDelete: Cascade]
Tournament (one) ──> Match (many)
Tournament (one) ──> Ranking (many)
Tournament (one) ──> Medal (many)          [onDelete: Cascade]

SubTournament (one) ──> Match (many)

Match (one) ──> MatchEvent (many)      [onDelete: Cascade]
Match (one) ──> Comment (many)         [match comments]
```

#### Self-referencing Match (Bracket)

Match has a self-referencing relationship to handle tournament brackets:

```
Match.nextMatchId (nullable) ──> Match (self)  [onDelete: SetNull]
Match.previousMatches           <── Match[]     [reverse relation]
```

When a match ends, the winner is advanced to `nextMatch`. This allows building bracket trees:
- `SINGLE_ELIMINATION`
- `DOUBLE_ELIMINATION`
- `ROUND_ROBIN`
- `GROUP_KNOCKOUT`

### 2.5 Comment -- Polymorphic

Comment is a polymorphic model: it can attach to **Post**, **Lesson**, or **Match** via nullable foreign keys:

| Field | Target |
|---|---|
| `postId` | Post (nullable) |
| `lessonId` | Lesson (nullable) |
| `matchId` | Match (nullable) |

Additionally, Comment supports **threading** (nested replies) via:

```
Comment.parentId (nullable) ──> Comment (self)   [self-referencing]
Comment.replies              <── Comment[]        [reverse relation]
```

Other features: `imageAttachments` (Json), `reactions` (Json), `editHistory` (Json).

### 2.6 Ranking & Achievements

```
AthleteProfile (one) ──> Ranking (many)
AthleteProfile (one) ──> AthleteAchievement (many)   [onDelete: Cascade]
Tournament (one) ────> Ranking (many)
Tournament (one) ────> AthleteAchievement (many)
Tournament (one) ────> Medal (many)                  [onDelete: Cascade]
```

- **Ranking**: Stores ranking position, score, `seed`, and `hasCheckedIn` for tournaments.
- **AthleteAchievement**: Stores athlete achievements (medals, results, classification).
- **Medal**: Medal table specific to each Tournament.

### 2.7 AuditLog

`AuditLog` records every important user action in the system:

| Field | Type | Description |
|---|---|---|
| `userId` | String | User who performed the action |
| `action` | String | Action name (e.g., CREATE_POST, DELETE_USER) |
| `entityId` | String | ID of the affected entity |
| `details` | Json | Action details (e.g., old values, new values) |
| `ipAddress` | String? | User's IP address |

### 2.8 Creator Lab

```
DocumentTopic (one) ──> Document (many)
Document (one) ──────> DocumentAttachment (many)  [onDelete: Cascade]
```

- **DocumentTopic**: Document topic (e.g., "Training guide", "Communication skills")
- **Document**: Document article, can have attached files via **DocumentAttachment**
- **CapcutTemplate**: Capcut video template for Creator Lab
- **SocialLink**: Social media links (Facebook, TikTok, Zalo...)

---

## 3. PostgreSQL Connection Pool

The project uses **@prisma/adapter-pg** to manage PostgreSQL connection pools.
The connection is configured via the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://postgres:password123@db:5432/vn_paralympic_sport?schema=public
```

In docker-compose, PostgreSQL maps port `5433` externally to `5432` inside the container.

Initializing PrismaClient in the application:

```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**Connection pool** is managed by `pg.Pool` and the Prisma adapter. The pool uses `pg` defaults (typically 10 connections).

---

## 4. Migration Workflow

Databases are managed via Prisma Migrate. All SQL migrations are located in:

```
api-server/prisma/migrations/
  ├── 20260607014701_init/
  ├── 20260612000000_add_lesson_slug/
  ├── 20260612000001_add_missing_tables/
  ├── 20260621012824_document_article_update/
  ├── 20260626062005_expand_user_profiles/
  └── migration_lock.toml
```

### Development

After modifying `prisma/schema.prisma`, run:

```bash
# Create a new migration
npx prisma migrate dev --name "description_of_change"

# Sync schema with database (without creating migration file)
npx prisma db push

# Regenerate Prisma Client (runs automatically after postinstall)
npx prisma generate
```

### Production

In the production environment (Docker), use:

```bash
# Auto-sync schema, no approval required (suitable for CI/CD)
docker compose run --rm api npx prisma db push

# Or run migrate deploy (requires migration files)
docker compose run --rm api npx prisma migrate deploy
```

`prisma db push` does not require confirmation, suitable for containerized environments.
`prisma migrate deploy` is safer but requires committed migration files.

### Reset database (Development only)

```bash
# Delete entire database and re-run all migrations + seed
npx prisma migrate reset
```

---

## 5. Seed Data

Two main seed files are located in the `api-server/prisma/` directory:

| File | Description |
|---|---|
| `seed.ts` | Main seed: Roles, Permissions, Users (103 users), Courses (3 courses, 6 chapters, 12 lessons), Posts (10 posts + 50 posts/sport x 15 sports = 760 posts), Clubs (18 clubs), Partners (10), Events (20), Comments (20), SportClassifications (~80 classes), Sports (15 sports) |
| `seed-events.ts` | Supplementary seed: SportEvents (specific competition events such as 100m Sprint, 50m Freestyle...) and additional SportClassifications for Athletics, Weightlifting, Swimming |

Additionally, the seed system includes a realistic interconnected data pipeline:

| File | Description |
|---|---|
| `06-realistic/seed-interconnected.ts` | Creates **15 interconnected athletes** with full profiles, spanning multiple sports and disability types. Each athlete is linked to a complete data pipeline: User -> AthleteProfile -> Tournament -> Ranking -> AthleteAchievement -> AffiliateLink. This provides realistic demo data for testing tournaments, rankings, achievements, and the affiliate system in one cohesive dataset. |

The seed files are structured in sequential order under `api-server/prisma/seeds/`:
- `01-core/` — Base data (roles, permissions, users)
- `02-cms/` — Content (posts, categories, tags, events)
- `03-lms/` — Learning (courses, chapters, lessons)
- `04-sports/` — Sports, classifications, sport events
- `05-community/` — Clubs, partners, companion requests
- `06-realistic/` — Interconnected athletes + full pipeline

### Running seed

Seed is configured in `package.json`:

```json
"prisma": {
  "seed": "npx ts-node prisma/seed.ts"
}
```

Run seed:

```bash
# Run main seed
npx prisma db seed

# Or directly
npx ts-node prisma/seed.ts

# Run supplementary seed (events & classifications)
npx ts-node prisma/seed-events.ts

# In Docker
docker compose run --rm api npx prisma db seed
docker compose run --rm api npx ts-node prisma/seed-events.ts
```

### Default data (Test accounts)

| Email | Role | Password |
|---|---|---|
| `admin@paralympic.vn` | SUPER_ADMIN | `password123` |
| `giangvien@paralympic.vn` | INSTRUCTOR | `password123` |
| `user@paralympic.vn` | USER | `password123` |

The seed also creates **100 simulated users** using Faker.js.

---

## 6. Backup & Restore

### Manual backup

```bash
# Backup PostgreSQL from Docker container
docker compose exec db pg_dump -U postgres vn_paralympic_sport > backup.sql

# Backup with compression
docker compose exec db pg_dump -U postgres vn_paralympic_sport | gzip > backup.sql.gz
```

### Restore

```bash
# Restore from backup file
docker compose exec -T db psql -U postgres vn_paralympic_sport < backup.sql

# Restore from compressed file
gunzip < backup.sql.gz | docker compose exec -T db psql -U postgres vn_paralympic_sport
```

### Docker volumes

The PostgreSQL volume is defined in `docker-compose.yml`:

```yaml
volumes:
  postgres_data:
```

To back up directly from the volume:

```bash
# Volume location (depends on Docker driver)
docker volume inspect vietnam-paralympic-sport_postgres_data
```

### Automated backup cron job (example)

Add to crontab on the server:

```bash
# Daily backup at 2:00 AM
0 2 * * * cd /path/to/project && docker compose exec -T db pg_dump -U postgres vn_paralympic_sport | gzip > /backups/vn_paralympic_$(date +\%Y\%m\%d).sql.gz

# Delete backups older than 30 days
0 3 * * * find /backups -name "vn_paralympic_*.sql.gz" -mtime +30 -delete
```

Or use a bash script:

```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/backups/vn-paralympic"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cd /path/to/project
docker compose exec -T db pg_dump -U postgres vn_paralympic_sport | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
# Keep the 30 most recent backups
ls -t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +31 | xargs -r rm
echo "[$TIMESTAMP] Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

---

## 7. E-Commerce & Affiliate Models

The e-commerce and affiliate system enables sponsor product marketplaces and athlete affiliate marketing. These 7 new models form a self-contained commerce domain integrated with the existing `Partner` and `AthleteProfile` models.

### 7.1 Sponsor Marketplace

```
SponsorStore (1) ──── Partner (1-1, required)
SponsorStore (1) ──── Product (1-N)

Product (N-1) ──── ProductCategory (N-1)
Product (1-N) ──── AffiliateLink (1-N)
```

| Model | Key Fields | Indexes |
|---|---|---|
| **SponsorStore** | `id`, `partnerId` (unique 1-1), `storeName`, `slug` (unique), `description`, `logo`, `banner`, `isActive` | `@@index([partnerId])`, `@@index([slug])` |
| **Product** | `id`, `storeId`, `categoryId`, `title`, `slug` (unique), `description`, `price`, `compareAtPrice`, `currency`, `images` (Json), `inventory`, `isActive`, `isFeatured` | `@@index([storeId])`, `@@index([categoryId])`, `@@index([slug])`, `@@index([isActive, isFeatured])`, `@@index([price])` |
| **ProductCategory** | `id`, `parentId` (self-ref), `name`, `slug` (unique), `description`, `image`, `sortOrder` | `@@index([parentId])`, `@@index([slug])` |

**SponsorStore**: Each store links 1:1 to a Partner record. A partner with an active SponsorStore is considered a "sponsor" whose products appear in the marketplace.

**Product**: Products belong to a SponsorStore and a ProductCategory. Supports `compareAtPrice` for sale pricing display and `inventory` for stock tracking.

**ProductCategory**: Hierarchical category tree via `parentId` self-reference for organizing the product catalog.

### 7.2 Affiliate System

```
AffiliateLink (N-1) ──── AthleteProfile (1)
AffiliateLink (N-1) ──── Product (1)
AffiliateLink (1-N) ──── AffiliateClick (N)

AffiliateClick: IP, UA, referer, UTM params, device fingerprint, isConverted flag
```

| Model | Key Fields | Indexes |
|---|---|---|
| **AffiliateLink** | `id`, `athleteId`, `productId`, `shortCode` (unique), `platform` (AffiliatePlatform enum), `targetUrl`, `utmSource`, `utmMedium`, `utmCampaign`, `clickCount`, `isActive`, `expiresAt` | `@@index([athleteId])`, `@@index([productId])`, `@@index([shortCode])`, `@@index([platform])`, `@@index([isActive])` |
| **AffiliateClick** | `id`, `linkId`, `ipAddress`, `userAgent`, `referer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `deviceType`, `browser`, `os`, `isConverted` | `@@index([linkId])`, `@@index([createdAt])`, `@@index([isConverted])`, `@@index([ipAddress])`, `@@index([deviceType])`, `@@index([linkId, createdAt])` |

**AffiliateLink**: Each link is tied to an AthleteProfile (the athlete earning commission) and a Product. Contains a `shortCode` (unique, 8-char alphanumeric), `platform` enum (WEBSITE, FACEBOOK, TIKTOK, INSTAGRAM, YOUTUBE, ZALO, OTHER), and optional UTM parameters for campaign-level tracking.

**AffiliateClick**: Every click on an affiliate link is recorded with full tracking data: `ipAddress`, `userAgent`, `referer`, all 5 UTM params (`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`), `deviceType`, `browser`, `os`, and `isConverted` (whether this click led to a commissionable event).

### 7.3 Commission & Payout Engine

```
Commission (N-1) ──── AthleteProfile (1)
Commission (N-1) ──── AffiliateLink (1)
Commission (N-1) ──── Payout (N, optional)

Payout (1-N) ──── Commission (N)
```

| Model | Key Fields | Indexes |
|---|---|---|
| **Commission** | `id`, `athleteId`, `linkId`, `payoutId`, `amount`, `currency`, `rate`, `status` (CommissionStatus enum), `conversionData` (Json), `approvedAt`, `paidAt` | `@@index([athleteId])`, `@@index([linkId])`, `@@index([payoutId])`, `@@index([status])`, `@@index([createdAt])`, `@@index([athleteId, status])` |
| **Payout** | `id`, `athleteId`, `amount`, `currency`, `status` (PayoutStatus enum), `paymentMethod` (PaymentMethod enum), `paymentReference`, `paymentNote`, `processedAt` | `@@index([athleteId])`, `@@index([status])`, `@@index([paymentMethod])`, `@@index([createdAt])`, `@@index([athleteId, status])` |

**Commission**: Represents earnings for a conversion. Status lifecycle: `PENDING -> APPROVED -> PAID` (or `REJECTED`). Stores `amount`, `currency`, `rate` (commission percentage), and `conversionData` (JSON -- order details). Links to AthleteProfile and AffiliateLink. Optionally links to a Payout once paid out.

**Payout**: A batch payment to an athlete covering one or more commissions. Status: `PENDING -> PROCESSING -> COMPLETED` (or `FAILED`/`CANCELLED`). Supports three payment methods: `BANK_TRANSFER`, `MOMO`, `ZALOPAY`. Stores `paymentReference` (external transaction ID) and `paymentNote`. One Payout contains multiple Commissions; a Commission can only belong to one Payout (preventing double-payment).

### 7.4 New Enums

| Enum | Values |
|---|---|
| `AffiliatePlatform` | WEBSITE, FACEBOOK, TIKTOK, INSTAGRAM, YOUTUBE, ZALO, OTHER |
| `CommissionStatus` | PENDING, APPROVED, REJECTED, PAID |
| `PayoutStatus` | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED |
| `PaymentMethod` | BANK_TRANSFER, MOMO, ZALOPAY |

### 7.5 Index Summary

The 7 new models introduce a total of **42 indexes**:

| Model | Index Count | Details |
|---|---|---|
| SponsorStore | 2 | `partnerId`, `slug` |
| Product | 5 | `storeId`, `categoryId`, `slug`, `[isActive, isFeatured]` composite, `price` |
| ProductCategory | 2 | `parentId`, `slug` |
| AffiliateLink | 5 | `athleteId`, `productId`, `shortCode`, `platform`, `isActive` |
| AffiliateClick | 6 | `linkId`, `createdAt`, `isConverted`, `ipAddress`, `deviceType`, `[linkId, createdAt]` composite |
| Commission | 6 | `athleteId`, `linkId`, `payoutId`, `status`, `createdAt`, `[athleteId, status]` composite |
| Payout | 5 | `athleteId`, `status`, `paymentMethod`, `createdAt`, `[athleteId, status]` composite |

---

## 8. Common Queries & Performance Tips

### 8.1 Use `select` instead of `include`

`select` only fetches the needed fields, reducing returned data:

```typescript
// GOOD: Only fetch what you need
const users = await prisma.user.findMany({
  select: {
    id: true,
    fullName: true,
    email: true,
    role: { select: { name: true } },
  },
});

// AVOID: include fetches everything
const users = await prisma.user.findMany({
  include: { role: true, posts: true, comments: true }, // Too much data!
});
```

### 8.2 Add indexes for frequently-filtered fields

Fields that should have indexes (`@@index`) for query optimization:

| Model | Fields to index |
|---|---|
| `Post` | `status`, `publishedAt`, `categoryId` |
| `User` | `email` (already @unique), `roleId` |
| `Match` | `status`, `startTime`, `tournamentId`, `sportId` |
| `Comment` | `postId`, `updatedAt` |
| `AthleteProfile` | `sportId`, `disabilityId`, `organizationId` |
| `Course` | `instructorId` |
| `AuditLog` | `createdAt`, `userId` |
| `Ranking` | `sportId`, `tournamentId`, `athleteId` |

Add indexes to `schema.prisma`:

```prisma
model Post {
  // ...
  @@index([status])
  @@index([publishedAt])
  @@index([categoryId])
}
```

After changes, run `npx prisma migrate dev --name add_post_indexes`.

### 8.3 Use transactions for multi-step operations

```typescript
// Example: Create User + AthleteProfile in the same transaction
const [user, profile] = await prisma.$transaction([
  prisma.user.create({
    data: { email, fullName, passwordHash, roleId },
  }),
  prisma.athleteProfile.create({
    data: { userId: /* from new user */, sportId, disabilityId },
  }),
]);

// Or use interactive transactions
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  const profile = await tx.athleteProfile.create({
    data: { userId: user.id, ... },
  });
  return { user, profile };
});
```

### 8.4 Efficient pagination

```typescript
// Use cursor-based pagination for large datasets
const posts = await prisma.post.findMany({
  take: 20,
  skip: 0,           // or cursor: { id: lastId }
  orderBy: { createdAt: 'desc' },
  select: {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    publishedAt: true,
    author: { select: { fullName: true } },
  },
});
```

### 8.5 Other best practices

- **Avoid N+1 queries**: Use `select` or `include` instead of looping and querying individually.
- **Use batch queries**: `createMany()`, `updateMany()`, `deleteMany()` for bulk operations.
- **Log queries in development**: Set `DEBUG=prisma:*` to see all SQL queries.
- **Connection pool size**: Adjust `max` in Pool if needed (default 10 connections):

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase pool size for high-traffic applications
});
```

---

## 9. Prisma Studio (GUI Database Browser)

Prisma Studio provides a graphical interface to browse and edit data:

```bash
# Open Prisma Studio
npx prisma studio

# Default runs on http://localhost:5555
```

Studio allows:
- Browsing all data tables
- Adding, editing, deleting records
- Viewing relationships between tables
- Filtering and sorting data

**Note**: Prisma Studio should only be used in development environments. Do not expose port 5555 in production.

---

## 10. Connection String & Environment Variables

Database-related environment variables:

| Variable | Value (Docker) | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:password123@db:5432/vn_paralympic_sport?schema=public` | PostgreSQL connection string |

**CLI access**:

```bash
# Connect directly to PostgreSQL in the container
docker compose exec db psql -U postgres -d vn_paralympic_sport

# Useful psql commands
\l                    # List databases
\dt                   # List tables
\d "TableName"        # Describe table
\q                    # Quit
```

---

## 11. Database Diagram

### Simplified Entity Relationship

```
┌──────────────────────────────────────────────────────────────────┐
│  USERS & RBAC                                                    │
│  ┌──────┐    ┌──────┐    ┌────────────┐                         │
│  │ User │───>│ Role │<──>│ Permission │                         │
│  └──┬───┘    └──────┘    └────────────┘                         │
│     │ 1:1                                                        │
│     ├──── AthleteProfile ──── Sport                              │
│     ├──── CoachProfile     ──── Sport                            │
│     └──── AssistantProfile                                       │
├──────────────────────────────────────────────────────────────────┤
│  CMS                                                             │
│  ┌──────────┐    ┌──────┐    ┌─────┐                            │
│  │ Category │───>│ Post │<──>│ Tag │                            │
│  └──────────┘    └──┬───┘    └─────┘                            │
│                     │                                            │
├─────────────────────┼────────────────────────────────────────────┤
│  LMS                │                                            │
│  ┌────────┐        │                                            │
│  │ Course │        │                                            │
│  └───┬────┘        │                                            │
│      │ 1:N         │                                            │
│  ┌───┴─────┐       │                                            │
│  │ Chapter │       │                                            │
│  └───┬─────┘       │                                            │
│      │ 1:N         │                                            │
│  ┌───┴────┐        │                                            │
│  │ Lesson ├────────┤ Quiz ──── Question                         │
│  └───┬────┘        │ Assignment ──── AssignmentSubmission      │
│      │             │                                            │
├──────┼─────────────┼────────────────────────────────────────────┤
│  COMMENTS (Polymorphic)                                          │
│  ┌─────────┐                                                     │
│  │ Comment │──> Post (nullable)                                  │
│  │         │──> Lesson (nullable)                                │
│  │         │──> Match (nullable)                                 │
│  │         │──> Comment (parentId, self-ref)                     │
│  └─────────┘                                                     │
├──────────────────────────────────────────────────────────────────┤
│  SPORTS & COMPETITIONS                                           │
│  ┌───────┐    ┌────────────┐    ┌───────────┐                   │
│  │ Sport │───>│ Tournament │───>│ Match     │                   │
│  └──┬────┘    └─────┬──────┘    └─────┬─────┘                   │
│     │               │                 │                          │
│     │         ┌─────┴──────┐    ┌─────┴──────┐                  │
│     │         │SubTournament│   │ MatchEvent │                  │
│     │         └────────────┘    └────────────┘                  │
│     │                                                            │
│     ├── SportClassification                                     │
│     ├── SportEvent                                               │
│     ├── Ranking                                                  │
│     └── Team ──── TeamMember ──── AthleteProfile                │
├──────────────────────────────────────────────────────────────────┤
│  COMMUNITY                                                       │
│  ┌──────────────┐   ┌───────────────────┐   ┌─────────┐        │
│  │ Organization │   │ CompanionRequest  │   │ Partner │        │
│  └──────────────┘   └───────────────────┘   └─────────┘        │
├──────────────────────────────────────────────────────────────────┤
│  CREATOR LAB                                                     │
│  ┌───────────────┐   ┌──────────┐   ┌───────────────┐          │
│  │ DocumentTopic │──>│ Document │──>│DocumentAttach.│          │
│  └───────────────┘   └──────────┘   └───────────────┘          │
│  ┌───────────────┐   ┌────────────┐                             │
│  │ CapcutTemplate│   │ SocialLink │                             │
│  └───────────────┘   └────────────┘                             │
├──────────────────────────────────────────────────────────────────┤
│  SYSTEM                                                          │
│  ┌──────────┐   ┌───────────────┐   ┌──────────────┐           │
│  │ AuditLog │   │ SystemSetting │   │ EmailTemplate│           │
│  └──────────┘   └───────────────┘   └──────────────┘           │
├──────────────────────────────────────────────────────────────────┤
│  E-COMMERCE & AFFILIATE                                           │
│  ┌───────────────┐   ┌─────────┐   ┌───────────────┐           │
│  │ SponsorStore  │──>│ Product │──>│ ProductCategory│           │
│  └───────┬───────┘   └────┬────┘   └───────────────┘           │
│          │ 1:1 Partner     │                                     │
│          │                 │ 1:N                                 │
│          │          ┌──────┴───────────┐                        │
│          │          │ AffiliateLink    │                        │
│          │          └──────┬───────────┘                        │
│          │                 │ 1:N                                 │
│          │          ┌──────┴───────────┐                        │
│          │          │ AffiliateClick   │                        │
│          │          └──────────────────┘                        │
│          │                                                       │
│  AthleteProfile ──── Commission ──── Payout                     │
│  (affiliate)        (earnings)      (BANK/MOMO/ZALOPAY)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 12. Quick Reference

| Task | Command |
|---|---|
| Create new migration | `npx prisma migrate dev --name migration_name` |
| Sync schema (no file) | `npx prisma db push` |
| Generate Prisma Client | `npx prisma generate` |
| Run seed | `npx prisma db seed` |
| Open Prisma Studio | `npx prisma studio` |
| View migration status | `npx prisma migrate status` |
| Reset database (dev) | `npx prisma migrate reset` |
| Backup DB | `docker compose exec db pg_dump -U postgres vn_paralympic_sport > backup.sql` |
| Restore DB | `docker compose exec -T db psql -U postgres vn_paralympic_sport < backup.sql` |
| Connect psql | `docker compose exec db psql -U postgres -d vn_paralympic_sport` |
| Prisma version | `npx prisma --version` |
| Prisma in Docker | `docker compose run --rm api npx prisma <command>` |

---

## 13. File Structure

```
api-server/
├── prisma/
│   ├── schema.prisma              # Schema definition (45 models + 7 e-commerce models)
│   ├── seed.ts                    # Main seed data (orchestrator)
│   ├── seed-events.ts             # Supplementary seed: events & classifications
│   ├── seeds/                     # Structured seed modules
│   │   ├── 01-core/               # Roles, permissions, users
│   │   ├── 02-cms/                # Posts, categories, tags, events
│   │   ├── 03-lms/                # Courses, chapters, lessons
│   │   ├── 04-sports/             # Sports, classifications, sport events
│   │   ├── 05-community/          # Clubs, partners, companion requests
│   │   └── 06-realistic/          # Interconnected athletes + full pipeline
│   └── migrations/                # Migration history
│       ├── 20260607014701_init/
│       ├── 20260612000000_add_lesson_slug/
│       ├── 20260612000001_add_missing_tables/
│       ├── 20260621012824_document_article_update/
│       ├── 20260626062005_expand_user_profiles/
│       └── migration_lock.toml
├── src/
│   └── modules/                   # NestJS modules using PrismaClient
│       ├── users/
│       ├── auth/
│       ├── posts/
│       ├── courses/
│       ├── tournaments/
│       ├── products/              # E-commerce product/sponsor management
│       ├── affiliate/             # Affiliate link & click tracking
│       ├── commissions/           # Commission & payout processing
│       ├── ...
│       └── prisma/                # PrismaService (provider)
└── docker-compose.yml             # PostgreSQL container configuration
```

---

*Document updated on 28/06/2026. Vietnam ParaSports project.*
*Database: PostgreSQL 15 + Prisma 7.8 + @prisma/adapter-pg.*
