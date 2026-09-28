# Vietnam ParaSports — API Server

Backend REST API cho hệ thống **Vietnam ParaSports Portal**, xây dựng trên **NestJS 11** với kiến trúc module hóa.

---

## Công nghệ / Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| NestJS | 11 | Node.js framework kiến trúc module |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| Prisma | 7.8 | ORM, type-safe database queries |
| PostgreSQL | 15 | Cơ sở dữ liệu quan hệ |
| Redis | 7.x | Cache và session store |
| Socket.io | 4.x | WebSocket cho live scores |
| Passport JWT | Latest | JWT authentication strategy |
| otplib | Latest | TOTP cho xác thực 2 yếu tố (2FA) |
| bcrypt | Latest | Password hashing (10 salt rounds) |
| Helmet | Latest | HTTP security headers |
| Throttler | Latest | Rate limiting (100 req/phút toàn cục) |
| Puppeteer | Latest | PDF generation |
| ExcelJS | Latest | Excel export |
| Nodemailer | Latest | Gửi email (SMTP) |
| Handlebars | Latest | Email template rendering |
| Pino | Latest | Structured JSON logging |
| Swagger | Latest | API documentation tại `/api/docs` |

---

## Cấu trúc dự án / Project Structure

```
api-server/
├── prisma/
│   ├── schema.prisma             # Database schema (50+ models)
│   ├── migrations/               # Migration history
│   ├── seed.ts                   # Main seed: users, posts, courses, ...
│   └── seed-events.ts            # Supplementary seed: events & classifications
├── src/
│   ├── main.ts                   # Entry point (bootstrap NestJS)
│   ├── app.module.ts             # Root module (imports all sub-modules)
│   ├── app.controller.ts         # Root controller
│   ├── common/                   # Shared NestJS utilities
│   │   ├── decorators/           # @Roles() decorator
│   │   ├── filters/              # AllExceptionsFilter (global exception handler)
│   │   ├── interceptors/         # AuditInterceptor, TransformInterceptor
│   │   └── utils/                # security.ts (HMAC, DOMPurify, hashing)
│   ├── modules/                  # 45+ feature modules
│   │   ├── auth/                 # JWT + 2FA (TOTP) + OAuth (Google)
│   │   ├── users/                # User profiles (athlete, coach, assistant)
│   │   ├── roles/                # Role & Permission management (RBAC)
│   │   ├── posts/                # Bài viết CMS
│   │   ├── categories/           # Danh mục bài viết
│   │   ├── tags/                 # Thẻ bài viết
│   │   ├── comments/             # Bình luận (polymorphic)
│   │   ├── bookmarks/            # Đánh dấu bài viết
│   │   ├── courses/              # Khóa học LMS
│   │   ├── chapters/             # Chương học
│   │   ├── lessons/              # Bài giảng
│   │   ├── quizzes/              # Quiz trắc nghiệm
│   │   ├── assignments/          # Bài tập + nộp bài + chấm điểm
│   │   ├── course-progress/      # Tiến độ học tập
│   │   ├── documents/            # Tài liệu (Creator Lab)
│   │   ├── document-topics/      # Chủ đề tài liệu
│   │   ├── sports/               # Môn thể thao
│   │   ├── tournaments/          # Giải đấu
│   │   ├── sub-tournaments/      # Giải đấu phụ / nhánh đấu
│   │   ├── matches/              # Trận đấu + LiveScoreGateway
│   │   ├── teams/                # Đội thi đấu
│   │   ├── rankings/             # Bảng xếp hạng
│   │   ├── sport-events/         # Sự kiện thể thao
│   │   ├── sport-classifications/# Phân loại thể thao theo khuyết tật
│   │   ├── athlete-achievements/ # Thành tích vận động viên
│   │   ├── disability-types/     # Loại khuyết tật
│   │   ├── organizations/        # Tổ chức / Câu lạc bộ
│   │   ├── partners/            # Đối tác
│   │   ├── companion-requests/   # Yêu cầu người đồng hành
│   │   ├── assistant-profiles/  # Hồ sơ trợ lý
│   │   ├── social-links/        # Liên kết mạng xã hội
│   │   ├── events/              # Sự kiện cộng đồng
│   │   ├── products/            # E-commerce: sản phẩm, cửa hàng
│   │   ├── affiliate/           # Affiliate: link, click tracking
│   │   ├── commissions/         # Hoa hồng & thanh toán (payouts)
│   │   ├── media/               # Upload file, signed URLs, SVG sanitization
│   │   ├── search/              # Tìm kiếm toàn văn
│   │   ├── statistics/          # Thống kê dashboard
│   │   ├── reports/             # Báo cáo PDF/Excel
│   │   ├── calendar/            # Lịch (.ics, Google Calendar)
│   │   ├── settings/            # Cấu hình hệ thống
│   │   ├── email-templates/     # Mẫu email
│   │   ├── capcut-templates/    # Mẫu video CapCut
│   │   └── mail/                # Dịch vụ gửi email (Nodemailer)
│   └── prisma/                   # PrismaService (global provider)
├── test/                         # E2E tests
├── uploads/                      # File uploads
│   ├── public/                   # Files công khai
│   ├── private/                  # Files bảo mật (signed URLs)
│   ├── settings/                 # Site settings files
│   └── sports/                   # Sport-related assets
├── .env                          # Biến môi trường local
├── .env.example                  # Mẫu biến môi trường
├── .prettierrc                   # Prettier config
├── eslint.config.mjs             # ESLint 9 flat config
├── nest-cli.json                 # NestJS CLI config
├── tsconfig.json                 # TypeScript config
├── tsconfig.build.json           # TypeScript build config
└── package.json
```

---

## Module Patterns

Mỗi module tuân theo cấu trúc NestJS chuẩn:

```
modules/<module-name>/
├── <name>.module.ts          # NestJS Module definition
├── <name>.controller.ts      # REST endpoints (@Get, @Post, ...)
├── <name>.service.ts         # Business logic
├── <name>.gateway.ts         # (tùy chọn) WebSocket gateway (Socket.io)
├── dto/
│   ├── create-<name>.dto.ts
│   └── update-<name>.dto.ts
└── <name>.service.spec.ts    # Unit tests
```

**Global components trong `src/common/`:**
- `decorators/roles.decorator.ts` — `@Roles(Role.ADMIN)` decorator
- `filters/http-exception.filter.ts` — Global exception handler
- `interceptors/audit.interceptor.ts` — Ghi log tất cả requests
- `interceptors/transform.interceptor.ts` — Bọc response trong `ApiResponseEnvelope`
- `utils/security.ts` — Hash, verify, sanitize input (DOMPurify)

**Global configuration (`src/app.module.ts`):**
- `ConfigModule.forRoot()` — Load `.env`
- `ThrottlerModule` — Rate limit 100 requests/phút
- `LoggerModule` — Pino logger (pretty print ở dev)
- Global guards, interceptors, filters

---

## API Conventions

- **Base path:** `/api/v1/`
- **Response envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 },
    "message": "Success"
  }
  ```
- **Pagination:** Query params `?page=1&limit=20` (tối đa 100 mỗi trang)
- **Authentication:** Header `Authorization: Bearer <jwt_token>`
- **Error response:**
  ```json
  {
    "success": false,
    "message": "Mô tả lỗi bằng tiếng Việt",
    "statusCode": 400,
    "errorCode": "VALIDATION_ERROR"
  }
  ```
- **Swagger docs:** `/api/docs` (development only)
- **Health check:** `GET /api/v1/health`

---

## Cài đặt & Khởi chạy / Setup & Run

### Yêu cầu / Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 15
- Redis 7.x

### Cài đặt / Installation

```bash
# Từ thư mục gốc monorepo
npm install --legacy-peer-deps --force

# Hoặc từ thư mục api-server
cd api-server
npm install --legacy-peer-deps
```

### Cấu hình / Configuration

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế
```

Các biến môi trường chính:

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | Khóa bí mật mã hóa JWT |
| `PORT` | Cổng chạy server (mặc định: 3001) |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Cấu hình SMTP cho gửi email |
| `FRONTEND_URL` | URL frontend cho CORS |
| `NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET` | Khóa HMAC cho signed URLs |
| `REDIS_HOST` | Redis hostname (mặc định: localhost) |
| `REDIS_PORT` | Redis port (mặc định: 6379) |

### Khởi chạy / Running

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod

# Swagger docs tại http://localhost:3001/api/docs
# Health check tại http://localhost:3001/api/v1/health
```

---

## Database

### Schema

Schema Prisma tại `prisma/schema.prisma` chứa **50+ models** phân thành 7 domains:

| Domain | Models chính |
|--------|-------------|
| Users & RBAC | User, Role, Permission, Account, PasswordResetToken |
| CMS | Post, Category, Tag, Comment, Bookmark, Event |
| LMS | Course, Chapter, Lesson, Quiz, Question, Assignment, AssignmentSubmission, UserCourseProgress |
| Sports & Tournaments | Sport, Tournament, SubTournament, Match, MatchEvent, Ranking, Team, TeamMember, AthleteProfile, AthleteAchievement, SportClassification, SportEvent, DisabilityType, Medal, CoachProfile, AssistantProfile |
| Community | Organization, CompanionRequest, Partner, SocialLink |
| System | AuditLog, SystemSetting, EmailTemplate |
| E-Commerce & Affiliate | SponsorStore, Product, ProductCategory, AffiliateLink, AffiliateClick, Commission, Payout |
| Creator Lab | DocumentTopic, Document, DocumentAttachment, CapcutTemplate |

### Prisma Commands

```bash
npx prisma generate          # Generate Prisma Client
npx prisma db push           # Đồng bộ schema với DB (development)
npx prisma migrate dev       # Tạo migration mới
npx prisma migrate deploy    # Áp dụng migrations (production)
npx prisma db seed           # Seed dữ liệu mẫu
npx prisma studio            # Mở Prisma Studio GUI
npx prisma validate          # Validate schema
```

---

## Xác thực / Authentication

### JWT Flow

- **Strategy:** Passport JWT (`passport-jwt`)
- **Guard:** `JwtAuthGuard` extends `AuthGuard('jwt')`
- **Roles guard:** `RolesGuard` kiểm tra `@Roles()` decorator metadata
- **Token TTL:** 7 ngày
- **Password hashing:** bcrypt với 10 salt rounds

### 2FA (Two-Factor Authentication)

- **Library:** `otplib` (TOTP)
- **Config:** step=30s, window=1, digits=6
- **Flow:** Generate secret → QR code → Verify token → Enable/Disable

### RBAC (Role-Based Access Control)

- **Models:** User → Role → Permission (many-to-many implicit)
- **Roles:** SUPER_ADMIN, ADMIN, EDITOR, INSTRUCTOR, TOURNAMENT_MANAGER, USER, ATHLETE, COACH, ASSISTANT
- **Permissions:** action (READ/CREATE/UPDATE/DELETE) × resource (POST/COURSE/USER/COMMENT/...)
- **Guard chain:** ThrottlerGuard (global) → JwtAuthGuard → RolesGuard (per-route)

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

**Test config:** Jest 30, pattern `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e), root dir `src/`, transform `ts-jest`.

---

## Linting & Formatting

```bash
# ESLint (flat config)
npm run lint

# Prettier
npm run format
```

**Rules chính:**
- Indentation: 2 spaces
- Quotes: Single quotes
- Semicolons: Required
- Trailing commas: ES5
- Line endings: Auto (LF/CRLF)

---

## Docker

```bash
# Build API image
docker build -f Dockerfile.api -t vn-parasports-api .

# Chạy trong Docker Compose
docker compose up -d --build api

# Prisma commands trong container
docker compose exec api npx prisma db push
docker compose exec api npx prisma db seed
docker compose run --rm api npx prisma studio
```

---

## Tài liệu liên quan / Related Documentation

- **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** — Kiến trúc hệ thống chi tiết
- **[docs/API.md](../docs/API.md)** — API reference đầy đủ (200+ endpoints)
- **[docs/DATABASE.md](../docs/DATABASE.md)** — Tài liệu database
- **[docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)** — Hướng dẫn phát triển
- **[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)** — Hướng dẫn triển khai
- **[docs/ECOMMERCE_DESIGN.md](../docs/ECOMMERCE_DESIGN.md)** — Thiết kế e-commerce & affiliate
