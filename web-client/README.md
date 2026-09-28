# Vietnam ParaSports — Web Client

Frontend cho hệ thống **Vietnam ParaSports Portal**, xây dựng trên **Next.js 16** với App Router và kiến trúc đa ngôn ngữ.

---

## Công nghệ / Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 16 | React framework với App Router |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Radix UI | Latest | UI primitives (Dialog, Slot, etc.) |
| next-intl | 4.x | Đa ngôn ngữ với path-based routing (vi/en) |
| NextAuth.js | 4.x | Xác thực (Credentials + Google OAuth) |
| SWR | 2.x | Client-side data fetching + caching |
| Zustand | 5.x | Lightweight global state management |
| react-hook-form | 7.x | Form state management + validation |
| @hookform/resolvers | Latest | Zod schema → react-hook-form bridge |
| TipTap | 3.x | Rich text editor (bài viết) |
| Recharts | 3.x | Biểu đồ và data visualization |
| Sonner | 2.x | Toast notifications |
| next-themes | 0.x | Dark/light theme toggle |
| Socket.io Client | 4.x | WebSocket client cho live scores |
| Lucide React | 1.x | Icon library |

---

## Cấu trúc dự án / Project Structure

```
web-client/
├── src/
│   ├── middleware.ts              # i18n routing + API proxy → backend
│   ├── app/
│   │   └── [locale]/              # App Router đa ngôn ngữ (vi/en)
│   │       ├── layout.tsx         # Root layout (providers, header, footer)
│   │       ├── page.tsx           # Trang chủ
│   │       ├── about/             # Giới thiệu
│   │       ├── accessibility/     # Trang trợ năng
│   │       ├── admin/             # Admin dashboard
│   │       │   └── marketplace/   # Quản lý sản phẩm, danh mục, cửa hàng
│   │       ├── bookmarks/         # Bài viết đã lưu
│   │       ├── clubs/             # Câu lạc bộ / Tổ chức
│   │       ├── companion/         # Người đồng hành
│   │       ├── courses/           # Khóa học LMS
│   │       ├── creator-lab/       # Creator Lab (tài liệu, CapCut)
│   │       ├── faq/               # Câu hỏi thường gặp
│   │       ├── forgot-password/   # Quên mật khẩu
│   │       ├── login/             # Đăng nhập
│   │       ├── marketplace/       # Sàn thương mại (sản phẩm, cửa hàng)
│   │       │   └── [slug]/        # Chi tiết sản phẩm
│   │       ├── matches/           # Trận đấu
│   │       ├── news/              # Tin tức
│   │       ├── privacy/           # Chính sách bảo mật
│   │       ├── profile/           # Hồ sơ cá nhân
│   │       │   └── AffiliateTab.tsx # Tab tiếp thị liên kết
│   │       ├── rankings/          # Bảng xếp hạng
│   │       ├── register/          # Đăng ký
│   │       ├── reset-password/    # Đặt lại mật khẩu
│   │       ├── search/            # Tìm kiếm
│   │       ├── settings/          # Cài đặt
│   │       ├── sports/            # Môn thể thao
│   │       ├── stores/            # Cửa hàng tài trợ
│   │       │   └── [slug]/        # Chi tiết cửa hàng
│   │       ├── terms/             # Điều khoản sử dụng
│   │       └── tournaments/       # Giải đấu
│   │       ├── error.tsx          # Error boundary
│   │       └── loading.tsx        # Loading state
│   ├── components/
│   │   ├── ui/                    # Shared UI primitives (Button, Card, Dialog, Toaster, ...)
│   │   ├── admin/                 # Admin dashboard components
│   │   ├── map/                   # Map/Google Maps components
│   │   ├── shared/                # Shared reusable components
│   │   ├── Header.tsx             # Site header (a11y aware)
│   │   ├── Footer.tsx             # Site footer
│   │   ├── AuthProvider.tsx       # NextAuth SessionProvider wrapper
│   │   ├── ThemeProvider.tsx      # next-themes (dark/light mode)
│   │   ├── SettingsProvider.tsx   # Global settings context
│   │   ├── AccessibilityProvider.tsx # Accessibility context
│   │   ├── TextToSpeech.tsx       # Text-to-speech accessibility
│   │   └── TiptapEditor.tsx       # Rich text editor wrapper
│   ├── hooks/
│   │   ├── useApi.ts              # SWR wrapper cho API calls
│   │   ├── useDebounce.ts         # Debounce utility
│   │   └── useTranslation.ts      # next-intl wrapper
│   ├── i18n/
│   │   ├── routing.ts             # Locale routing config
│   │   └── request.ts             # Server-side locale detection
│   ├── lib/
│   │   ├── api-client.ts          # Universal fetch client (browser + server)
│   │   └── utils.ts               # cn(), generateSlug()
│   ├── services/                  # Business logic wrappers
│   │   ├── course.service.ts
│   │   ├── event.service.ts
│   │   ├── post.service.ts
│   │   ├── setting.service.ts
│   │   └── user.service.ts
│   ├── store/
│   │   └── useModalStore.ts       # Zustand global modal state
│   ├── types/                     # TypeScript type definitions
│   └── utils/                     # Utility functions
├── messages/                      # i18n translation files
│   ├── vi.json                    # Vietnamese translations
│   └── en.json                    # English translations
├── public/                        # Static assets
│   ├── logo.png
│   └── ...
├── .env                           # Biến môi trường local
├── .env.example                   # Mẫu biến môi trường
├── .prettierrc                    # Prettier config
├── eslint.config.mjs              # ESLint 9 flat config
├── next.config.mjs                # Next.js config
├── postcss.config.mjs             # PostCSS config (Tailwind CSS 4)
├── next-sitemap.config.cjs        # Sitemap generation
├── tsconfig.json                  # TypeScript config
└── package.json
```

---

## Kiến trúc Frontend / Frontend Architecture

### i18n & Routing

- **Library:** `next-intl` v4 với path-based routing (`/[locale]/...`)
- **Locales:** `vi` (mặc định), `en`
- **Messages:** `/messages/{locale}.json`
- **Server-side detection:** `request.ts` với `getRequestConfig`
- **Client-side navigation:** `createNavigation(routing)` exports `Link`, `usePathname`, `useRouter`, `getPathname`

### Layout Providers

Thứ tự nested từ root:

```
<html lang={locale}>
  <NextIntlClientProvider>
    <AuthProvider>              ← NextAuth SessionProvider
      <ThemeProvider>           ← next-themes (dark mode)
        <SettingsProvider>      ← Global settings context
          <AccessibilityProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <AccessibilityPanel />
            <Toaster />         ← sonner toast notifications
            <GlobalModal />     ← Zustand-driven modal
```

### API Client & Data Fetching

**`api-client.ts`** — Universal API layer:

- **Browser-side:** `getBaseUrl()` trả về `/api/v1` (relative, qua Next.js middleware proxy sang backend)
- **Server-side (SSR):** `getBaseUrl()` dùng `INTERNAL_API_URL` hoặc `NEXT_PUBLIC_API_URL`
- Tự động gắn `Authorization: Bearer <accessToken>` header
- Token source: browser lấy từ `getSession()`, server lấy từ `getServerSession()`
- Tự động `signOut()` khi nhận 401 trên browser
- Retry: tối đa 2 lần với ENOTFOUND/ECONNREFUSED/ETIMEDOUT

**`useApi.ts`** — SWR hook layer:

- `useApi(path)` — Generic SWR fetcher cho GET requests
- `usePaginatedApi(path, page, limit, extraParams)` — Paginated GET với typed `PaginatedResponse<T>`
- SWR config: automatic revalidation on focus, customizable cache TTL

### Middleware Proxy

Middleware (`src/middleware.ts`) tự động proxy các request `/api/*` sang backend:

- `/api/auth/*`, `/api/upload`, `/api/media/*`, `/api/tts` → Next.js xử lý nội bộ
- Tất cả `/api/*` khác → proxy sang `http://127.0.0.1:3001` (development) hoặc `http://api:3001` (Docker)
- Production: retry tối đa 3 lần với exponential backoff (500ms, 1000ms, 1500ms) để xử lý DNS propagation delay trong Docker

### State Management

- **SWR cache:** Hầu hết server state nằm trong SWR's in-memory cache, tự động revalidate
- **Zustand:** Global modal dialog state (confirm, prompt, custom content)
- **Context providers:** Auth, Theme, Settings, Accessibility — mỗi cái scoped trong React context riêng

### Accessibility (a11y)

- Điều chỉnh cỡ chữ
- Chế độ tương phản cao
- Text-to-speech (Web Speech API)
- Điều hướng bằng bàn phím
- Semantic HTML + ARIA attributes

---

## Cài đặt & Khởi chạy / Setup & Run

### Yêu cầu / Prerequisites

- Node.js 22+
- npm 10+
- Backend API server đang chạy (xem [api-server README](../api-server/README.md))

### Cài đặt / Installation

```bash
# Từ thư mục gốc monorepo
npm install --legacy-peer-deps --force

# Hoặc từ thư mục web-client
cd web-client
npm install --legacy-peer-deps
```

### Cấu hình / Configuration

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế
```

Các biến môi trường chính:

| Biến | Mô tả | Giá trị mặc định |
|------|-------|-----------------|
| `NEXT_PUBLIC_API_URL` | URL kết nối tới Backend (client-side) | `http://localhost:3001` |
| `NEXTAUTH_SECRET` | Khóa bảo mật của NextAuth | Phải tạo bằng `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL gốc của Web Client | `http://localhost:3000` |
| `NEXT_PUBLIC_MEDIA_SIGNATURE_SECRET` | Khóa HMAC (phải khớp với api-server) | Phải đổi ở production |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | (tùy chọn) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | (tùy chọn) |
| `INTERNAL_API_URL` | API URL nội bộ Docker (server-side) | `http://api:3001/api/v1` |

### Khởi chạy / Running

```bash
# Development (HMR)
npm run dev

# Production build
npm run build

# Production start
npm start

# Truy cập tại:
# - http://localhost:3000/vi (Tiếng Việt)
# - http://localhost:3000/en (English)
```

> **Lưu ý:** Frontend và Backend cần chạy trên 2 terminal riêng biệt. Frontend tự động proxy các request `/api/*` sang backend qua Next.js middleware.

---

## Testing

Hiện chưa có test runner cho frontend. Kế hoạch tương lai: Vitest + React Testing Library.

---

## Linting & Formatting

```bash
# ESLint (flat config)
npm run lint

# Prettier
npm run format
```

**ESLint config:** Dựa trên `eslint-config-next` core-web-vitals + typescript. Relaxed rules: `no-explicit-any: off`, `no-unused-vars: off`, `no-img-element: off`.

---

## Docker

```bash
# Build Web image
docker build -f Dockerfile.web --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 -t vn-parasports-web .

# Chạy trong Docker Compose
docker compose up -d --build web

# Xem logs
docker compose logs -f web
```

---

## Tài liệu liên quan / Related Documentation

- **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** — Kiến trúc hệ thống chi tiết
- **[docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)** — Hướng dẫn phát triển
- **[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)** — Hướng dẫn triển khai
- **[docs/ECOMMERCE_DESIGN.md](../docs/ECOMMERCE_DESIGN.md)** — Thiết kế e-commerce & affiliate
