<div align="center">
  <img src="web-client/public/assets/brand/vietnam-parasports-2026-full.png" alt="Vietnam ParaSports Logo" width="200" />

  # Vietnam ParaSports Portal

  **Nền tảng thể thao toàn diện dành cho cộng đồng người khuyết tật tại Việt Nam**
  *Comprehensive sports platform for the disabled community in Vietnam*

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
  [![Docker](https://img.shields.io/badge/Docker-26-2496ED?logo=docker)](https://www.docker.com/)
</div>

---

## Mục lục / Table of Contents

- [Giới thiệu / Introduction](#-giới-thiệu-introduction)
- [Tính năng / Features](#-tính-năng-nổi-bật-key-features)
- [Kiến trúc / Architecture](#-kiến-trúc-công-nghệ-tech-stack--architecture)
- [Cấu trúc thư mục / Directory Structure](#-cấu-trúc-thư-mục-directory-structure)
- [Clone & triển khai trên hạ tầng riêng](#-clone--triển-khai-trên-hạ-tầng-riêng)
- [Biến môi trường / Environment Variables](#-bảng-biến-môi-trường-environment-variables)
- [Tài liệu / Documentation](#-tài-liệu-hệ-thống)
- [Giấy phép / License](#-giấy-phép-license)
- [Liên hệ / Contact](#-liên-hệ-contact)

---

## 📖 Giới thiệu (Introduction)

**Vietnam ParaSports Portal** là hệ sinh thái kỹ thuật số đầu tiên được thiết kế chuyên biệt để hỗ trợ cộng đồng người khuyết tật tại Việt Nam. Nền tảng giúp người dùng dễ dàng tiếp cận các hoạt động thể thao, cập nhật tin tức, tìm kiếm câu lạc bộ, tham gia giải đấu, theo dõi các chương trình huấn luyện trực tuyến (LMS), và kiếm thu nhập thông qua hệ thống tiếp thị liên kết (Affiliate Marketing).

> **💡 Tôn chỉ cốt lõi:** Dự án đặt **Khả năng tiếp cận (Accessibility - a11y)** lên hàng đầu. Mọi thành phần giao diện đều được tối ưu hóa để đảm bảo trải nghiệm tốt nhất cho người khiếm thị, khiếm thính và khuyết tật vận động.

---

## ✨ Tính năng nổi bật (Key Features)

### 👤 Dành cho Người dùng (Users)

- **Hỗ trợ Tiếp cận Cao (Accessibility):** Tùy chỉnh cỡ chữ, độ tương phản cao, Dark mode, và Trợ lý đọc báo bằng giọng nói (Text-to-Speech).
- **Hệ thống Đa ngôn ngữ (i18n):** Tự động định tuyến `/vi` và `/en` chuẩn SEO với `next-intl`.
- **Tin tức & Mạng xã hội:** Cập nhật diễn biến Paralympic, bình luận (comments), reactions, bookmark bài viết và các mẫu CapCut.
- **Bản đồ Tổ chức / Câu lạc bộ:** Tra cứu CLB thể thao khuyết tật theo từng khu vực và bộ môn qua Google Maps tích hợp.
- **Nền tảng Học trực tuyến (LMS):** Các khóa học thể thao qua video (chapters, lessons), làm bài kiểm tra trắc nghiệm (quizzes) và bài tập (assignments) có chấm điểm.
- **Hệ thống Giải đấu (Tournaments):** Đăng ký tham gia giải đấu, theo dõi lịch thi đấu (matches), nhánh đấu (sub-tournaments), bảng xếp hạng (rankings) và tỉ số trực tiếp (live scores).
- **Người Đồng hành & Phân loại y tế:** Kết nối tình nguyện viên (companion-requests) hỗ trợ người khuyết tật, cung cấp thông tin phân loại thương tật (sport-classifications).
- **Sàn Thương mại Điện tử (Marketplace):** Duyệt và tìm kiếm sản phẩm từ các nhà tài trợ, xem chi tiết sản phẩm và cửa hàng, hỗ trợ phân loại sản phẩm theo danh mục.
- **Tiếp thị Liên kết (Affiliate):** Vận động viên tạo link tiếp thị rút gọn, theo dõi lượt click với phân tích thiết bị/UTM, kiếm hoa hồng và yêu cầu thanh toán qua ngân hàng/MoMo/ZaloPay.
- **Hồ sơ Công khai (Public Profile):** Trang `/users/:id` phong cách Steam — ảnh bìa (cover image), avatar, huy hiệu vai trò (role badges), thống kê, các tab Thành tích, Giải đấu, CLB, Nhà tài trợ, Người đồng hành.
- **UserHoverCard:** Popup kiểu Steam hiển thị mini profile khi hover lên username, bao gồm avatar, thống kê nhanh và role badge.
- **Upload Ảnh bìa (Cover Image):** Người dùng tải lên ảnh bìa cá nhân (base64, giới hạn 2MB) trong trang hồ sơ riêng tư.
- **Điểm Hoàn thiện Hồ sơ (Profile Completeness Score):** Thanh tiến trình (progress bar) hiển thị phần trăm hoàn thiện hồ sơ người dùng.

### 🛡️ Dành cho Quản trị viên (Admins)

- **CMS Đa năng:** Quản lý bài viết, danh mục, tags, và sự kiện.
- **LMS Management:** Soạn thảo khóa học, bài học, câu hỏi trắc nghiệm và bài tập.
- **Phân quyền Động (RBAC):** Quản lý Role & Permissions trực quan (Super Admin, Admin, Editor, Instructor, Tournament Manager, User, Athlete, Coach, Assistant).
- **Tournament Engine:** Quản lý giải đấu, đội thi đấu (teams), lịch thi đấu, tự động chia nhánh và sinh lịch.
- **Thống kê (Statistics):** Bảng điều khiển trực quan thống kê dữ liệu toàn hệ thống.
- **Quản lý Marketplace:** Quản lý sản phẩm, danh mục, cửa hàng tài trợ với giao diện DataTable và modal CRUD.
- **Quản lý Hoa hồng & Thanh toán:** Phê duyệt/từ chối hoa hồng (commissions), xử lý yêu cầu thanh toán (payouts) của vận động viên.
- **Trang Quản trị Chuẩn hóa (Admin Pages Standardized):** Tất cả trang admin sử dụng chung component DataTable với sort, filter, search, và onCreate, mang lại giao diện nhất quán trên toàn bộ CMS.

### 🚀 Tính năng Nâng cao (Advanced Features)

- **Tỉ số Trực tiếp (Live Score):** Cập nhật tỉ số trận đấu theo thời gian thực (Real-time) qua Socket.io namespace `/live-scores`.
- **Báo cáo Tự động (Export Automation):** Tự động trích xuất bảng xếp hạng, nhánh đấu ra định dạng PDF (Puppeteer) và Excel (ExcelJS).
- **Đồng bộ Lịch thi đấu (Calendar Sync):** Hỗ trợ xuất file `.ics` và đồng bộ một chạm vào Google Calendar.
- **Hỗ trợ Khả tiếp cận Đa phương tiện (Accessible Media):** Trình phát Video bài giảng (LMS) có tích hợp Phụ đề (CC) và Audio Descriptions chuẩn WCAG. Upload file hỗ trợ SVG sanitization (DOMPurify), HMAC-signed URLs cho file bảo mật.
- **Bản đồ Cơ sở vật chất (Facilities Map):** Tích hợp Google Maps đánh dấu rõ ràng các điểm thi đấu có hỗ trợ xe lăn, lối đi chuyên dụng cho người khuyết tật.
- **Xác thực 2 Yếu tố (2FA):** Hỗ trợ TOTP (Time-based One-Time Password) qua Google Authenticator/Authy.
- **Đăng nhập Mạng xã hội (OAuth):** Hỗ trợ đăng nhập qua Google.
- **Theo dõi Click Chi tiết:** Ghi nhận IP, User-Agent, Referer, UTM parameters, loại thiết bị cho mỗi click vào link tiếp thị.
- **BullMQ Job Queue:** Hàng đợi công việc (job queue) dựa trên Redis, xử lý việc sinh báo cáo (report generation) bất đồng bộ, không chặn luồng chính.
- **API Auto-Unwrap:** `apiClient.json()` tự động trích xuất `.data` từ API response envelope của NestJS, giảm boilerplate ở frontend.

---

## 🏗️ Kiến trúc Công nghệ (Tech Stack & Architecture)

Hệ thống được xây dựng theo mô hình **Monorepo** (npm workspaces) với 3 packages: `api-server`, `web-client`, và `shared`. Triển khai qua **Docker Compose** với 4 services.

### Tổng quan Hạ tầng (Infrastructure Overview)

```
                         Internet (HTTPS)
                               |
             +---------------------------------------+
             |      Nginx / Cloud LB (production)    |
             +------------------+--------------------+
                                |
             +------------------+--------------------+
             |           Docker Bridge                |
             |        (vn_paralympic_network)         |
             |                                       |
             |  +-----------+     +--------------+   |
             |  |  web      |     |    api       |   |
             |  |  :3000    |+--->|    :3001     |   |
             |  |  Next.js  |     |  NestJS 11   |   |
             |  |  16       |     |              |   |
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

### 🌐 Frontend (`/web-client`)

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 16 (App Router) | React framework với Server Components |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Radix UI | Latest | UI primitives (Dialog, Slot, etc.) |
| next-intl | 4.x | Đa ngôn ngữ (vi/en) với path-based routing |
| SWR | 2.x | Client-side data fetching + caching |
| Zustand | 5.x | Lightweight global state management |
| NextAuth.js | 4.x | Xác thực (Credentials + Google OAuth) |
| Socket.io Client | 4.x | WebSocket client cho live scores |
| TipTap | 3.x | Rich text editor (bài viết) |
| Recharts | 3.x | Biểu đồ và data visualization |
| Sonner | 2.x | Toast notifications |

### ⚙️ Backend (`/api-server`)

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| NestJS | 11 | Node.js framework kiến trúc module |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| Prisma | 7.8 | ORM với type-safe queries |
| PostgreSQL | 15 | Cơ sở dữ liệu quan hệ |
| Redis | 7.x | Cache và session store |
| Socket.io | 4.x | WebSocket server cho live scores |
| Passport JWT | Latest | JWT authentication strategy |
| otplib | Latest | TOTP cho xác thực 2 yếu tố |
| Helmet | Latest | HTTP security headers |
| Throttler | Latest | Rate limiting (100 req/phút toàn cục) |
| Puppeteer | Latest | PDF generation cho báo cáo |
| ExcelJS | Latest | Excel export |
| Nodemailer | Latest | Gửi email (SMTP) |
| Handlebars | Latest | Email template rendering |
| Pino | Latest | Structured JSON logging |
| Swagger | Latest | API documentation tại `/api/docs` |
| BullMQ | Latest | Redis-backed job queue (báo cáo bất đồng bộ) |

### 📦 Shared (`/shared`)

Package `@vietnam-parasports/shared` chứa các Zod validation schemas và TypeScript types dùng chung giữa frontend và backend. Bao gồm: auth schemas (login, register, 2FA, OAuth), pagination schema, media schema, organization schema, và các DTOs (ApiResponseEnvelope, UserSessionDto, GlobalSettingsDto, v.v.).

---

## 📂 Cấu trúc Thư mục (Directory Structure)

```text
VietNam-Paralympic-Sport/
├── .github/workflows/            # CI/CD pipelines (ci.yml, deploy.yml)
├── docs/                         # Tài liệu chi tiết
│   ├── API.md                    # API reference đầy đủ
│   ├── ARCHITECTURE.md           # Kiến trúc hệ thống
│   ├── DATABASE.md               # Tài liệu cơ sở dữ liệu
│   ├── DEPLOYMENT.md             # Hướng dẫn triển khai
│   ├── DEVELOPMENT.md            # Hướng dẫn phát triển
│   └── ECOMMERCE_DESIGN.md       # Tài liệu thiết kế e-commerce
│
├── api-server/                   # Backend (NestJS 11)
│   ├── prisma/
│   │   ├── schema.prisma         # Database Schema (50+ models)
│   │   ├── migrations/           # Migration history
│   │   ├── seed.ts               # Main seed (users, posts, courses, ...)
│   │   └── seed-events.ts        # Events & classifications seed
│   ├── src/
│   │   ├── common/               # decorators, filters, interceptors, utils
│   │   ├── modules/              # 45+ feature modules
│   │   │   ├── auth/             # JWT + 2FA + OAuth
│   │   │   ├── users/            # User profiles & management
│   │   │   ├── posts/            # CMS: bài viết, bình luận
│   │   │   ├── courses/          # LMS: khóa học, chương, bài giảng
│   │   │   ├── tournaments/      # Giải đấu, nhánh đấu
│   │   │   ├── matches/          # Trận đấu + live score gateway
│   │   │   ├── products/         # E-commerce: sản phẩm, cửa hàng
│   │   │   ├── affiliate/        # Affiliate: link, click tracking
│   │   │   ├── commissions/      # Hoa hồng & thanh toán
│   │   │   └── ...               # 35+ modules khác
│   │   ├── prisma/               # PrismaService (global provider)
│   │   └── main.ts               # Entry point
│   ├── test/                     # E2E tests
│   └── package.json
│
├── web-client/                   # Frontend (Next.js 16)
│   ├── src/
│   │   ├── app/[locale]/         # App Router đa ngôn ngữ (vi/en)
│   │   │   ├── admin/            # Admin dashboard
│   │   │   ├── marketplace/      # Sàn thương mại
│   │   │   ├── tournaments/      # Giải đấu
│   │   │   ├── courses/          # Khóa học
│   │   │   ├── news/             # Tin tức
│   │   │   ├── profile/          # Hồ sơ cá nhân + Affiliate
│   │   │   └── ...               # 25+ route groups
│   │   ├── components/           # UI components (ui/, admin/, shared/)
│   │   ├── hooks/                # useApi (SWR), useDebounce, ...
│   │   ├── lib/                  # api-client, utils
│   │   ├── services/             # Business logic wrappers
│   │   ├── store/                # Zustand stores
│   │   └── i18n/                 # next-intl configuration
│   ├── messages/                 # Translation files (vi.json, en.json)
│   ├── public/                   # Static assets
│   └── package.json
│
├── shared/                       # Shared package
│   ├── src/
│   │   ├── index.ts              # Types & interfaces
│   │   └── validation.ts         # Zod schemas
│   └── package.json
│
├── docker-compose.yml            # Docker orchestration (4 services)
├── Dockerfile.api                # Multi-stage NestJS build
├── Dockerfile.web                # Multi-stage Next.js build
├── .env.example                  # Mẫu cấu hình triển khai (không có bí mật thật)
├── API_DOCUMENTATION.md          # Danh sách API endpoints
└── README.md                     # Tài liệu dự án (file này)
```

---

## 🚀 Clone & triển khai trên hạ tầng riêng

Repo chứa **mã nguồn**, không chứa database Production hoặc tài khoản/người dùng hiện đang có trên Replit. Không cần Supabase: `docker-compose.yml` có sẵn PostgreSQL 15, Redis, API NestJS và web Next.js. Hướng dẫn dưới đây dành cho máy chủ Linux/VPS có Git, Docker Engine và Docker Compose v2 (nên có ít nhất 4 GB RAM để build).

Repo GitHub không kèm workflow tự động triển khai tới VPS cũ. Người vận hành hạ tầng mới cần tự cấu hình CI/CD và quyền truy cập máy chủ nếu muốn tự động deploy.

### 1. Clone và tạo cấu hình

```bash
git clone https://github.com/hainguyenvie/vietnam-parasport-web.git
cd vietnam-parasport-web
cp .env.example .env
```

Sửa **`.env` tại thư mục gốc** trước khi chạy. Đổi `DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `NEXTAUTH_SECRET` và các giá trị ký media sang giá trị ngẫu nhiên riêng; ví dụ chạy `openssl rand -hex 32` cho từng giá trị cần thay. Không commit `.env`. Đặt `NEXTAUTH_URL`, `FRONTEND_URL` và `NEXT_PUBLIC_API_URL` theo tên miền của chính bạn (hoặc `http://localhost:3000`, `http://localhost:3000`, `http://localhost:3000/api/v1` khi thử cục bộ). **Không dùng tên miền `vietnamparasports.com`** nếu bạn không quản lý nó.

| Nhóm biến trong `.env` | Cần làm gì |
|------------------------|------------|
| `DB_PASSWORD`, `REDIS_PASSWORD` | Mật khẩu PostgreSQL và Redis của Docker Compose |
| `JWT_SECRET`, `NEXTAUTH_SECRET` | Khóa ký phiên đăng nhập; dùng hai giá trị mạnh, riêng biệt |
| `MEDIA_SIGNATURE_SECRET`, `NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET` | Cấu hình ký URL media của ứng dụng; đồng bộ theo yêu cầu code hiện tại |
| `NEXTAUTH_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` | URL public của web và API; biến `NEXT_PUBLIC_API_URL` được ghi vào **lúc build web**, đổi URL phải build lại |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP thực nếu cần gửi email; giá trị mẫu/giả không gửi được mail |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Chỉ cần khi bật đăng nhập Google |

Compose tự thiết lập `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT` và `INTERNAL_API_URL` cho các container. Không dùng chuỗi kết nối database Production trên Replit trong máy chủ mới.

### 2. Tạo database mới và chạy ứng dụng

```bash
mkdir -p api-server/uploads/public api-server/uploads/settings
sudo chown -R 1001:1001 api-server/uploads  # User `nestjs` trong Dockerfile.api
docker compose build
docker compose up -d --wait db redis
docker compose run --rm api npx prisma db push
docker compose up -d --wait
docker compose ps
curl http://localhost:3001/api/v1/health
curl -I http://localhost:3000/vi
```

`prisma db push` ở trên **chỉ dành cho database mới, trống**. Nếu đã có dữ liệu, hãy sao lưu rồi xem xét thay đổi schema/migrations trước khi áp dụng. Không chạy lệnh `db:fresh` hoặc reset trên database đang dùng vì chúng xóa dữ liệu.

Nếu muốn dữ liệu mẫu trên một môi trường **chưa mở ra Internet**, chạy `docker compose run --rm api npm run seed`. Seed tạo tài khoản mẫu với mật khẩu mặc định: phải đổi hoặc vô hiệu hóa chúng trước khi công khai website. Seed **không** khôi phục dữ liệu Production của Replit.

### 3. Tên miền, HTTPS và dữ liệu bền vững

- Trỏ reverse proxy HTTPS tới web ở `localhost:3000` và `/api/` tới API ở `localhost:3001`; xem [hướng dẫn Nginx/Caddy](./docs/DEPLOYMENT.md) và thay mọi tên miền/đường dẫn VPS mẫu bằng của bạn. Đổi các URL trong `.env` sang tên miền thực rồi **build lại web**.
- Chặn truy cập công khai tới các cổng PostgreSQL `5433` và API `3001` nếu chỉ muốn truy cập API qua reverse proxy. Kiểm tra firewall của máy chủ.
- Dữ liệu Postgres nằm ở volume `postgres_data`; file tải lên nằm trong `api-server/uploads` (bind mount của Compose). Hãy sao lưu **cả hai**. Repo GitHub không phải bản sao lưu database hoặc file upload Production.
- Asset tĩnh dùng chung được đóng gói trong `web-client/public/assets` (và ba ảnh carousel mẫu trong `web-client/public/uploads`). Những file tải lên trong quá trình sử dụng hoặc dữ liệu người dùng cần được chuyển riêng khi đổi hạ tầng.
- Xem log: `docker compose logs -f api web`. Cập nhật code: `git pull` rồi `docker compose up -d --build` (sao lưu database trước khi thay đổi schema).

Để chạy trực tiếp bằng Node.js thay vì Docker, xem [hướng dẫn phát triển](./docs/DEVELOPMENT.md); khi đó cần PostgreSQL, Redis và cấu hình biến môi trường riêng cho hai ứng dụng.

---

## 📚 Tài liệu Hệ thống

Dự án có hệ thống tài liệu toàn diện trong thư mục `docs/`:

| Tài liệu | Mô tả |
|----------|-------|
| **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** | Hướng dẫn phát triển: cài đặt môi trường, cấu trúc monorepo, quy ước code, CI/CD, troubleshooting |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Kiến trúc hệ thống: data flow, authentication (JWT/2FA/OAuth), RBAC, 44+ modules, WebSocket, file storage, shared validation |
| **[API.md](./docs/API.md)** | API reference đầy đủ: 15 sections, 200+ endpoints với request/response examples, error codes, rate limiting, WebSocket events |
| **[DATABASE.md](./docs/DATABASE.md)** | Tài liệu database: schema overview, 50+ models, relationships, migration workflow, seed data, backup/restore, e-commerce models |
| **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** | Hướng dẫn triển khai: VPS requirements, Docker setup, Nginx/Caddy reverse proxy, SSL, backup strategy, CI/CD, monitoring, rollback |
| **[ECOMMERCE_DESIGN.md](./docs/ECOMMERCE_DESIGN.md)** | Thiết kế e-commerce & affiliate: architecture, DB schema, API reference, click tracking flow, platform integration, roadmap |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | Danh sách nhanh tất cả API endpoints phân theo module |

---

## 📜 Giấy phép (License)

Repo hiện chưa có tệp `LICENSE`. Hãy xác nhận điều khoản cấp phép với chủ repo trước khi sử dụng lại hoặc phân phối mã nguồn.

## ✉️ Liên hệ (Contact)

- **Tổ chức:** Vietnam Paralympic Committee
- **Email Hỗ trợ:** support@paralympic.vn
- **Website:** [https://paralympic.vn](https://paralympic.vn)

---

*Được xây dựng với ❤️ nhằm mang lại một cộng đồng thể thao bình đẳng và không rào cản.*
