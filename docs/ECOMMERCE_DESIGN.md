# E-Commerce & Affiliate System — Development Reference

**Vietnam ParaSports Monetization Platform**

Version 1.0 | Last Updated 2026-06-28

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [Click Tracking Flow](#5-click-tracking-flow)
6. [Affiliate Platform Integration](#6-affiliate-platform-integration)
7. [Phase Roadmap](#7-phase-roadmap)
8. [Frontend Pages](#8-frontend-pages)
9. [Implementation Checklist](#9-implementation-checklist)
10. [Commission Tracking Guidelines](#10-commission-tracking-guidelines)

---

## 1. Overview

### 1.1 What This System Is

The E-Commerce & Affiliate System is a dual-revenue monetization platform built for Vietnam ParaSports. It empowers athletes with disabilities to earn income by promoting products through two complementary channels:

1. **Sponsor Marketplace** — Partner brands (sponsors) list their products in a curated storefront. Athletes select products with built-in commission rates and promote them via their personal channels. When a sale is attributed to an athlete, the athlete earns a percentage of the sale.

2. **Affiliate Hub** — Athletes generate tracked, shortened affiliate links targeting major Vietnamese e-commerce platforms (Shopee, TikTok Shop, Lazada). Every click is recorded with UTM parameters, device fingerprinting, and referrer data. Commissions are tracked manually by administrators in Phase 1, with plans for automated API integration in later phases.

### 1.2 How Athletes Earn Money

The athlete revenue lifecycle follows four stages:

```
Create Link → Share Link → Earn Commission → Request Payout
```

1. **Create** — An athlete (user with an `AthleteProfile`) registers on the platform, navigates to their profile's Affiliate tab, and creates an affiliate link by providing the original product URL, platform, title, and optional affiliate code. The system generates a unique short code (e.g., `abc123`) and a tracking URL (`/go/abc123`).

2. **Share** — The athlete copies the tracking URL and shares it on their social media channels (Facebook, TikTok, Zalo). Every person who clicks the link is redirected to the actual platform product page with UTM parameters and the athlete's `ref` code forwarded.

3. **Earn** — When a purchase occurs through the athlete's link, an admin creates a `Commission` record in the system, linked to the athlete and the original affiliate link. The commission goes through the statuses `PENDING` → `CONFIRMED` → `APPROVED` → `PAID`.

4. **Payout** — Once an athlete has accumulated enough approved commissions, they submit a payout request specifying the amount, payment method (BANK, MOMO, or ZALOPAY), and payment details. An admin processes the payout and marks it as `COMPLETED`.

### 1.3 Key Numbers

| Metric | Value |
|--------|-------|
| Supported platforms | Shopee, TikTok Shop, Lazada, Other |
| Short code length | 8 characters (base64url) |
| Default commission rate (sponsor products) | 5% |
| Payment methods supported | Bank Transfer, MoMo, ZaloPay |
| UTM parameters tracked | source, medium, campaign, term, content |
| Click data captured | IP, User-Agent, Referrer, UTM, Device type |

---

## 2. Architecture

### 2.1 System Diagram

```
+------------------------------------------------------------------+
|                        WEB CLIENT (Next.js)                        |
|  +----------------+  +----------------+  +---------------------+  |
|  | /marketplace   |  | /profile       |  | /admin/marketplace  |  |
|  | (Public)       |  | ?tab=affiliate |  | (Manage products,   |  |
|  | Browse products|  | (Athlete link  |  |  stores, categories)|  |
|  | by category    |  |  CRUD, earnings|  |                     |  |
|  +----------------+  |  dashboard,    |  +---------------------+  |
|                      |  payout req)   |                            |
|  +----------------+  +----------------+  +---------------------+  |
|  | /stores/[slug] |                      | /admin/commissions  |  |
|  | (Store detail  |                      | (Admin approve/     |  |
|  |  with products)|                      |  reject commissions)|  |
|  +----------------+                      +---------------------+  |
+----------------------------------+--------------------------------+
                                   |
                            HTTPS /api/v1
                                   |
+----------------------------------v--------------------------------+
|                       NESTJS API SERVER                            |
|                                                                   |
|  +------------------+  +------------------+  +------------------+  |
|  | Products Module  |  | Affiliate Module |  | Commissions      |  |
|  |                  |  |                  |  | Module           |  |
|  | ProductsController| | AffiliateController| | CommissionsCtrl  | |
|  | StoresController  | | AffiliateGoCtrl    | |                  |  |
|  |                  |  |                  |  |                  |  |
|  | - CRUD products  |  | - CRUD links     |  | - CRUD commissions|
|  | - CRUD stores    |  | - Earnings summary| | - Approve/reject  |  |
|  | - CRUD categories|  | - Payout request |  | - Payout mgmt     |  |
|  +------------------+  | - Click tracking |  +------------------+  |
|                        +------------------+                        |
|  +------------------------------------------------------------+   |
|  |              Auth Guards (JWT + Role-based)                 |   |
|  |  Public: /go/:shortCode, /products, /stores, /affiliate/   |   |
|  |          platforms                                          |   |
|  |  JWT-protected: /affiliate/links, /affiliate/earnings       |   |
|  |  Admin-only: /commissions/*, /payouts/*, POST/PUT/DELETE    |   |
|  |              /products/*, /stores/*                          |   |
|  +------------------------------------------------------------+   |
+----------------------------------+--------------------------------+
                                   |
                        Prisma ORM over TCP
                                   |
+----------------------------------v--------------------------------+
|                        POSTGRESQL                                  |
|                                                                   |
|  SponsorStore  ──< Product  ──< ProductCategory                  |
|                      |                                             |
|                      |                                             |
|  AthleteProfile ──< AffiliateLink ──< AffiliateClick              |
|       |                |                                           |
|       |                |                                           |
|       +───────< Commission >─────── Payout                        |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.2 Click Tracking Flow (Detailed)

```
STEP  ┌──────────────────────────────────────────────────────┐
      │ ATHLETE creates link via POST /affiliate/links       │
  1.  │   → System generates shortCode: "Xk7mP2qL"           │
      │   → Stores trackingUrl: "/go/Xk7mP2qL"               │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ ATHLETE shares tracking URL on social media          │
  2.  │   → https://vietnamparasports.com/go/Xk7mP2qL        │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ USER clicks the link                                 │
  3.  │   → Browser requests GET /go/Xk7mP2qL (no auth)     │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ AffiliateGoController receives request               │
  4.  │   → Looks up AffiliateLink by shortCode              │
      │   → Returns 404 if not found or inactive             │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ Record click asynchronously (non-blocking)           │
  5.  │   → Extract IP (x-forwarded-for header)              │
      │   → Extract User-Agent → detect device type          │
      │   → Extract Referer header                           │
      │   → Extract UTM params from query string             │
      │   → Create AffiliateClick record in DB               │
      │   → Increment AffiliateLink.clickCount by 1          │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ Preserve UTM params on target URL                    │
  6.  │   → Parse originalUrl (e.g. shopee.vn/product)       │
      │   → Append utm_source, utm_medium, utm_campaign       │
      │   → Append ref=<shortCode> as custom parameter       │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ HTTP 302 Redirect to target platform                 │
  7.  │   → https://shopee.vn/product?utm_source=...&ref=...  │
      │   → User's browser follows redirect                  │
      └──────────────────────────────────────────────────────┘
                              │
                              ▼
      ┌──────────────────────────────────────────────────────┐
      │ Conversion tracking (Phase 1: manual)                 │
  8.  │   → Admin POST /commissions with orderId, amount,    │
      │     commissionRate, commissionAmount                  │
      │   → Links to athlete + affiliateLink                  │
      │   → Commission status: PENDING → APPROVED → PAID     │
      └──────────────────────────────────────────────────────┘
```

### 2.3 Module Responsibilities

| Module | Path in Codebase | Responsibility |
|--------|-----------------|----------------|
| `products` | `api-server/src/modules/products/` | Product catalog, categories, sponsor stores. Public read + admin CRUD. |
| `affiliate` | `api-server/src/modules/affiliate/` | Affiliate link CRUD (athlete-scoped), earnings summary, payout requests, click tracking, public redirect handler. |
| `commissions` | `api-server/src/modules/commissions/` | Admin commission management (create, approve, reject), payout processing. All routes guarded by `Roles('SUPER_ADMIN', 'ADMIN')`. |

---

## 3. Database Schema

All models below are additions to the existing Prisma schema. They relate to the core `User`, `AthleteProfile`, and `Partner` models already present in the codebase.

### 3.1 SponsorStore

Stores represent sponsor brands that have a presence in the marketplace. Each store belongs to a `Partner` record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated unique identifier |
| `partnerId` | UUID (FK, unique) | Yes | Links to `Partner` record. Cascade delete. |
| `partner` | Relation | — | Belongs-to relation to `Partner` |
| `name` | String | Yes | Display name of the store |
| `slug` | String (unique) | Yes | URL-friendly identifier for `/stores/:slug` |
| `description` | String? | No | About text for the store page |
| `logoUrl` | String? | No | URL to store logo image |
| `bannerUrl` | String? | No | URL to store banner image |
| `isActive` | Boolean | Yes | Soft toggle; defaults to `true` |
| `products` | Product[] | — | One-to-many: all products in this store |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

### 3.2 Product

Products are items listed in the Sponsor Marketplace or linked via affiliate URLs. Each product belongs to one `SponsorStore` and optionally one `ProductCategory`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `storeId` | UUID (FK) | Yes | Links to `SponsorStore`. Cascade delete. |
| `store` | Relation | — | Belongs-to relation |
| `name` | String | Yes | Product display name |
| `slug` | String (unique) | Yes | URL-friendly identifier for `/marketplace/:slug` |
| `description` | Text | Yes | Full product description |
| `price` | Float | Yes | Regular price in `currency` |
| `salePrice` | Float? | No | Discounted price; nullable |
| `currency` | String | Yes | Default `"VND"` |
| `images` | JSON | Yes | Array of image URLs: `["url1", "url2"]`. Defaults to `[]`. |
| `categoryId` | UUID? (FK) | No | Links to `ProductCategory` |
| `category` | Relation? | — | Optional belongs-to relation |
| `isActive` | Boolean | Yes | Soft toggle; defaults to `true` |
| `isFeatured` | Boolean | Yes | Featured flag for homepage carousels; defaults to `false` |
| `stock` | Int | Yes | Available stock count; defaults to `0` |
| `commissionRate` | Float | Yes | Athlete commission percentage (0-100); defaults to `5.0` |
| `affiliateLinks` | AffiliateLink[] | — | One-to-many: links referencing this product |
| `commissions` | Commission[] | — | One-to-many: commissions on this product |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes:** `storeId`, `categoryId`, `[isActive, isFeatured]` (composite for filtering active featured products).

### 3.3 ProductCategory

Categories organize products in the marketplace for browsing and filtering.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `name` | String | Yes | Category display name |
| `slug` | String (unique) | Yes | URL-friendly identifier |
| `description` | String? | No | Optional description |
| `imageUrl` | String? | No | Category icon or image |
| `products` | Product[] | — | One-to-many: products in this category |
| `createdAt` | DateTime | Auto | |

### 3.4 AffiliateLink

The core entity of the affiliate system. Each link belongs to one athlete and targets one platform.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `athleteId` | UUID (FK) | Yes | Links to `AthleteProfile` |
| `athlete` | Relation | — | Belongs-to relation |
| `platform` | Enum | Yes | `SHOPEE`, `TIKTOK`, `LAZADA`, or `OTHER` |
| `productId` | UUID? (FK) | No | Optional link to a `Product` in the marketplace |
| `product` | Relation? | — | Optional belongs-to relation |
| `title` | String | Yes | User-friendly title, e.g., "Nike Pro Running Shirt - Shopee" |
| `description` | String? | No | Optional description for the link card |
| `originalUrl` | String | Yes | The actual platform product URL (Shopee/TikTok/Lazada) |
| `affiliateCode` | String? | No | Athlete's affiliate/referral code on the platform |
| `trackingUrl` | String (unique) | Yes | System-generated: `/go/<shortCode>` |
| `shortCode` | String (unique) | Yes | Auto-generated 8-char base64url string |
| `commissionRate` | Float | Yes | Estimated commission percentage; defaults to `0` |
| `thumbnailUrl` | String? | No | Product image for the link card |
| `clickCount` | Int | Yes | Denormalized click counter; defaults to `0` |
| `conversionCount` | Int | Yes | Denormalized conversion counter; defaults to `0` |
| `totalEarnings` | Float | Yes | Denormalized sum of commissions; defaults to `0` |
| `isActive` | Boolean | Yes | Soft toggle; defaults to `true`. Inactive links still redirect but log a warning. |
| `clicks` | AffiliateClick[] | — | One-to-many: all click records for this link |
| `commissions` | Commission[] | — | One-to-many: commissions attributed to this link |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes:** `athleteId`, `platform`, `shortCode`, `isActive`.

### 3.5 AffiliateClick

Each click on a tracking URL is recorded as an `AffiliateClick`. Clicks are not deleted even if the parent link is cascade-deleted.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `linkId` | UUID (FK) | Yes | Links to `AffiliateLink`. Cascade delete. |
| `link` | Relation | — | Belongs-to relation |
| `ipAddress` | String? | No | Client IP (from `x-forwarded-for` header or `req.ip`) |
| `userAgent` | String? | No | Browser User-Agent string |
| `referer` | String? | No | HTTP Referer header |
| `utmSource` | String? | No | UTM source from query string |
| `utmMedium` | String? | No | UTM medium from query string |
| `utmCampaign` | String? | No | UTM campaign from query string |
| `country` | String? | No | Reserved for future GeoIP enrichment |
| `device` | String? | No | Device classification: `mobile`, `desktop`, `tablet`, or `unknown` |
| `convertedAt` | DateTime? | No | Timestamp when this click led to a conversion |
| `isConverted` | Boolean | Yes | Conversion flag; defaults to `false` |
| `commissionId` | String? | No | Reserved for linking click to a commission |
| `createdAt` | DateTime | Auto | |

**Indexes:** `linkId`, `createdAt`, `isConverted`.

**Device Detection Logic** (implemented in `AffiliateService.detectDevice()`):

```
Priority order:
  1. Tablet:  /ipad|tablet|playbook|silk|kindle/i
  2. Mobile:  /mobi|android(?!.*tablet)|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i
  3. Desktop: everything else (including bots)
  4. unknown: when User-Agent is null
```

### 3.6 Commission

Commissions represent confirmed or pending earnings for an athlete. They can be linked to an `AffiliateLink`, a sponsor `Product`, or stand alone.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `athleteId` | UUID (FK) | Yes | Links to `AthleteProfile` |
| `athlete` | Relation | — | Belongs-to relation |
| `linkId` | UUID? (FK) | No | Optional link to `AffiliateLink` |
| `link` | Relation? | — | Optional belongs-to relation |
| `productId` | UUID? (FK) | No | Optional link to sponsor `Product` |
| `product` | Relation? | — | Optional belongs-to relation |
| `platform` | Enum? | No | `SHOPEE`, `TIKTOK`, `LAZADA`, or `OTHER` |
| `orderId` | String? | No | External order ID from the e-commerce platform |
| `orderAmount` | Float | Yes | Total order value; defaults to `0` |
| `commissionRate` | Float | Yes | Commission percentage applied; defaults to `0` |
| `commissionAmount` | Float | Yes | Actual earnings = `orderAmount * (commissionRate / 100)`; defaults to `0` |
| `status` | Enum | Yes | See status lifecycle below; defaults to `PENDING` |
| `notes` | String? | No | Admin notes for rejection reason, order info, etc. |
| `payoutId` | UUID? (FK) | No | Links to `Payout` when included in a payout request |
| `payout` | Relation? | — | Optional belongs-to relation |
| `approvedAt` | DateTime? | No | Timestamp when admin approved this commission |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes:** `athleteId`, `status`, `payoutId`, `createdAt`.

**Commission Status Lifecycle:**

```
PENDING  ──────► CONFIRMED ──────► APPROVED ──────► PAID
   │                 │                │
   └─────► REJECTED ◄┘                └──► REJECTED (at any approval stage)
```

| Status | Meaning | Who Acts |
|--------|---------|----------|
| `PENDING` | Commission created, awaiting confirmation | System (auto on create) |
| `CONFIRMED` | Platform has confirmed the sale occurred | Admin (manual or webhook in Phase 3) |
| `APPROVED` | Admin has verified and approved payment to athlete | Admin |
| `REJECTED` | Order was returned, cancelled, or disputed | Admin |
| `PAID` | Commission has been included in a completed payout | Admin (via payout processing) |

### 3.7 Payout

Payouts represent withdrawal requests from athletes. When a payout is created, a set of `APPROVED` commissions is linked to it.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID (PK) | Yes | Auto-generated |
| `athleteId` | UUID (FK) | Yes | Links to `AthleteProfile` |
| `athlete` | Relation | — | Belongs-to relation |
| `amount` | Float | Yes | Requested payout amount (VND) |
| `status` | String | Yes | Lifecycle: `PENDING` → `PROCESSING` → `COMPLETED` (or `FAILED`) |
| `paymentMethod` | String? | No | Payment channel: `BANK`, `MOMO`, or `ZALOPAY` |
| `paymentInfo` | JSON? | No | Flexible object: `{ bankName, accountNumber, accountName }` or `{ phoneNumber }` |
| `referenceId` | String? | No | External payment gateway reference (when available) |
| `processedAt` | DateTime? | No | Timestamp when payout was completed |
| `commissions` | Commission[] | — | One-to-many: commissions settled by this payout |
| `createdAt` | DateTime | Auto | |
| `updatedAt` | DateTime | Auto | |

**Indexes:** `athleteId`, `status`.

**Payout Status Lifecycle:**

```
PENDING  ──► PROCESSING ──► COMPLETED
                │
                └──► FAILED
```

**Payout Creation Logic** (implemented in `AffiliateService.requestPayout()`):

1. Verify the athlete has at least one `APPROVED` commission.
2. Calculate total approved amount (`sum(commissionAmount) where status = APPROVED`).
3. Validate requested amount > 0 and <= total approved.
4. Check for existing `PENDING` payout (only one active payout request allowed at a time).
5. Create `Payout` record with `status: "PENDING"`.
6. Link approved commissions to the payout, distributing proportionally until the requested amount is covered.
7. After payout is `COMPLETED`, linked commissions should be updated to `PAID` status.

---

## 4. API Reference

All API routes are prefixed with `/api/v1` in production. The base URLs shown below omit the prefix for brevity.

### 4.1 Products Module

#### Public Endpoints

| Method | Path | Auth | Query Params | Description |
|--------|------|------|-------------|-------------|
| `GET` | `/products` | None | `page`, `limit`, `categoryId`, `storeId`, `search`, `isFeatured` | List products with pagination and filters |
| `GET` | `/products/:slug` | None | — | Single product by slug |
| `GET` | `/products/categories` | None | — | List all product categories |
| `GET` | `/products/categories/:id` | None | — | Single category by ID |
| `GET` | `/stores` | None | — | List all sponsor stores |
| `GET` | `/stores/:slug` | None | — | Single store with its products |

**Example: List products with filters**

```http
GET /products?page=1&limit=20&categoryId=uuid&isFeatured=true
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "storeId": "uuid",
      "name": "Running Shoes Pro",
      "slug": "running-shoes-pro",
      "description": "Professional running shoes...",
      "price": 1500000,
      "salePrice": 1200000,
      "currency": "VND",
      "images": ["https://cdn.example.com/img1.jpg"],
      "categoryId": "uuid",
      "isActive": true,
      "isFeatured": true,
      "stock": 50,
      "commissionRate": 5.0,
      "store": { "id": "uuid", "name": "Nike Vietnam", "slug": "nike-vietnam" },
      "category": { "id": "uuid", "name": "Running", "slug": "running" },
      "createdAt": "2026-06-28T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Admin Endpoints

All admin routes require `JWT` authentication and the `SUPER_ADMIN` or `ADMIN` role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/products` | ADMIN | Create a new product |
| `PUT` | `/products/:id` | ADMIN | Update a product |
| `DELETE` | `/products/:id` | ADMIN | Delete a product |
| `POST` | `/products/categories` | ADMIN | Create a new category |
| `PUT` | `/products/categories/:id` | ADMIN | Update a category |
| `DELETE` | `/products/categories/:id` | ADMIN | Delete a category |
| `POST` | `/stores` | ADMIN | Create a new store |
| `PUT` | `/stores/:id` | ADMIN | Update a store |
| `DELETE` | `/stores/:id` | ADMIN | Delete a store |

**Example: Create a product**

```http
POST /products
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "name": "Running Shoes Pro",
  "description": "Lightweight professional running shoes designed for performance.",
  "price": 1500000,
  "salePrice": 1200000,
  "currency": "VND",
  "images": ["https://cdn.example.com/img1.jpg"],
  "categoryId": "uuid-of-category",
  "storeId": "uuid-of-store",
  "isActive": true,
  "isFeatured": true,
  "stock": 50,
  "commissionRate": 5.0
}
```

**Validation rules** (from `CreateProductDto`):
- `name`: required string
- `description`: required string
- `price`: required number, minimum 0
- `salePrice`: optional number, minimum 0
- `currency`: optional string
- `images`: optional array of strings (URLs)
- `categoryId`: optional UUID string
- `storeId`: optional UUID string
- `isActive`: optional boolean
- `isFeatured`: optional boolean
- `stock`: optional number, minimum 0
- `commissionRate`: optional number, 0-100

**Example: Create a store**

```http
POST /stores
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "partnerId": "uuid-of-partner",
  "name": "Nike Vietnam",
  "description": "Official Nike distributor in Vietnam",
  "logoUrl": "https://cdn.example.com/nike-logo.png",
  "bannerUrl": "https://cdn.example.com/nike-banner.png"
}
```

**Example: Create a category**

```http
POST /products/categories
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "name": "Running",
  "slug": "running",
  "description": "Running shoes, apparel, and accessories"
}
```

### 4.2 Affiliate Module

#### Athlete Endpoints (JWT required)

All athlete routes resolve the `athleteId` from the authenticated user's `AthleteProfile`. If no `AthleteProfile` exists, the endpoint returns `404`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/affiliate/links` | JWT | List own affiliate links (paginated, filterable by platform and isActive) |
| `POST` | `/affiliate/links` | JWT | Create a new affiliate link |
| `GET` | `/affiliate/links/:id/stats` | JWT | Detailed stats for one link (clicks, conversions, commissions, device breakdown, status breakdown) |
| `PUT` | `/affiliate/links/:id` | JWT | Update an existing link (own links only) |
| `DELETE` | `/affiliate/links/:id` | JWT | Delete an existing link (own links only) |
| `GET` | `/affiliate/earnings` | JWT | Earnings summary (total, pending, approved, paid, commission count) |
| `GET` | `/affiliate/earnings/details` | JWT | Detailed commission list (paginated, filterable by status) |
| `POST` | `/affiliate/payouts/request` | JWT | Request a payout (amount, paymentMethod, paymentInfo) |

**Example: Create an affiliate link**

```http
POST /affiliate/links
Authorization: Bearer <athlete_jwt>
Content-Type: application/json

{
  "platform": "SHOPEE",
  "originalUrl": "https://shopee.vn/product/123456789/987654321",
  "title": "Running Shoes Pro - Shopee",
  "description": "Great running shoes with athlete discount",
  "affiliateCode": "ATHLETE123",
  "commissionRate": 5,
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "productId": "uuid-of-related-product"
}
```

**Response:**

```json
{
  "id": "uuid",
  "athleteId": "uuid",
  "platform": "SHOPEE",
  "originalUrl": "https://shopee.vn/product/123456789/987654321",
  "title": "Running Shoes Pro - Shopee",
  "description": "Great running shoes with athlete discount",
  "affiliateCode": "ATHLETE123",
  "commissionRate": 5,
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "productId": "uuid-of-related-product",
  "shortCode": "Xk7mP2qL",
  "trackingUrl": "/go/Xk7mP2qL",
  "clickCount": 0,
  "conversionCount": 0,
  "totalEarnings": 0,
  "isActive": true,
  "createdAt": "2026-06-28T00:00:00.000Z"
}
```

**Validation rules** (from `CreateAffiliateLinkDto`):
- `platform`: required, must be `SHOPEE`, `TIKTOK`, `LAZADA`, or `OTHER`
- `originalUrl`: required string
- `title`: required string
- `description`: optional string
- `affiliateCode`: optional string
- `commissionRate`: optional number, minimum 0
- `thumbnailUrl`: optional string
- `productId`: optional string (UUID)

**Example: Get link stats**

```http
GET /affiliate/links/:id/stats
Authorization: Bearer <athlete_jwt>
```

**Response:**

```json
{
  "id": "uuid",
  "shortCode": "Xk7mP2qL",
  "title": "Running Shoes Pro - Shopee",
  "platform": "SHOPEE",
  "clickCount": 150,
  "conversionCount": 3,
  "totalEarnings": 450000,
  "stats": {
    "totalClicks": 150,
    "convertedClicks": 3,
    "conversionRate": 2.0,
    "totalCommissionEarned": 450000,
    "clicksByDevice": {
      "mobile": 120,
      "desktop": 25,
      "tablet": 5,
      "unknown": 0
    },
    "commissionsByStatus": {
      "PENDING": 1,
      "CONFIRMED": 0,
      "APPROVED": 1,
      "REJECTED": 0,
      "PAID": 1
    }
  },
  "clicks": [ /* Array of recent click records */ ],
  "commissions": [ /* Array of recent commission records */ ],
  "product": {
    "id": "uuid",
    "name": "Running Shoes Pro",
    "price": 1500000,
    "salePrice": 1200000,
    "currency": "VND",
    "images": ["https://cdn.example.com/img1.jpg"]
  }
}
```

**Example: Earnings summary**

```http
GET /affiliate/earnings
Authorization: Bearer <athlete_jwt>
```

**Response:**

```json
{
  "totalEarnings": 1500000,
  "pendingAmount": 300000,
  "approvedAmount": 700000,
  "paidAmount": 500000,
  "commissionCount": 12
}
```

**Example: Request a payout**

```http
POST /affiliate/payouts/request
Authorization: Bearer <athlete_jwt>
Content-Type: application/json

{
  "amount": 500000,
  "paymentMethod": "BANK",
  "paymentInfo": {
    "bankName": "Vietcombank",
    "accountNumber": "0123456789",
    "accountName": "Nguyen Van A"
  }
}
```

**Response:**

```json
{
  "id": "uuid",
  "athleteId": "uuid",
  "amount": 500000,
  "status": "PENDING",
  "paymentMethod": "BANK",
  "paymentInfo": {
    "bankName": "Vietcombank",
    "accountNumber": "0123456789",
    "accountName": "Nguyen Van A"
  },
  "createdAt": "2026-06-28T00:00:00.000Z"
}
```

**Error cases for payout request:**
- `409 Conflict`: No approved commissions available
- `409 Conflict`: Requested amount exceeds total approved
- `409 Conflict`: A pending payout already exists

#### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/go/:shortCode` | None | Click tracker + 302 redirect to original URL |
| `GET` | `/affiliate/platforms` | None | List supported platforms |

**Click Redirect Endpoint (`GET /go/:shortCode`):**

1. Look up `AffiliateLink` by `shortCode`.
2. Return `404` if not found. Log a warning if link is inactive.
3. Fire-and-forget click recording (does not block the redirect):
   - Extract IP from `x-forwarded-for` header or `req.ip`
   - Extract User-Agent and classify device
   - Extract Referer header
   - Extract UTM query params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`)
   - Create `AffiliateClick` record
   - Increment `AffiliateLink.clickCount`
4. Parse `originalUrl`, append any UTM params from the incoming request query string, and append `ref=<shortCode>`.
5. Return `HTTP 302 Found` redirect to the modified target URL.

### 4.3 Commissions Module (Admin Only)

All routes require `JWT` and `SUPER_ADMIN` or `ADMIN` role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/commissions` | ADMIN | List all commissions (paginated, filterable by status) |
| `POST` | `/commissions` | ADMIN | Manually create a commission |
| `GET` | `/commissions/athlete/:id` | ADMIN | List commissions for a specific athlete |
| `PUT` | `/commissions/:id/approve` | ADMIN | Approve a commission (sets status to `APPROVED`, sets `approvedAt`) |
| `PUT` | `/commissions/:id/reject` | ADMIN | Reject a commission (sets status to `REJECTED`, accepts optional `notes` body) |
| `GET` | `/payouts` | ADMIN | List all payouts (paginated, filterable by status) |
| `GET` | `/payouts/athlete/:id` | ADMIN | List payouts for a specific athlete |
| `PUT` | `/payouts/:id/process` | ADMIN | Update payout status to `PROCESSING`, `COMPLETED`, or `FAILED` |

**Example: Create a commission**

```http
POST /commissions
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "athleteId": "uuid-of-athlete",
  "linkId": "uuid-of-link",
  "platform": "SHOPEE",
  "orderId": "SHOPEE-ORDER-12345",
  "orderAmount": 1500000,
  "commissionRate": 5,
  "commissionAmount": 75000,
  "status": "PENDING",
  "notes": "Shopee order confirmed by athlete"
}
```

**Validation rules** (from `CreateCommissionDto`):
- `athleteId`: required UUID string
- `linkId`: optional UUID string
- `productId`: optional UUID string
- `platform`: optional, must be `SHOPEE`, `TIKTOK`, `LAZADA`, or `OTHER`
- `orderId`: optional string
- `orderAmount`: required number, minimum 0
- `commissionRate`: required number, 0-100
- `commissionAmount`: required number, minimum 0
- `status`: optional, defaults to `PENDING`
- `notes`: optional string

**Example: Approve a commission**

```http
PUT /commissions/:id/approve
Authorization: Bearer <admin_jwt>
```

**Example: Reject a commission**

```http
PUT /commissions/:id/reject
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "notes": "Order was returned by customer"
}
```

**Example: Process a payout**

```http
PUT /payouts/:id/process
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "status": "COMPLETED",
  "referenceId": "VCB-TXN-20260628-001"
}
```

**Valid statuses for `processPayout`:** `PROCESSING`, `COMPLETED`, `FAILED`.

---

## 5. Click Tracking Flow — Full Sequence

### 5.1 End-to-End Data Flow

```
+----------+        +-------------------+        +------------+
|  Athlete |        |   VietnamPara API |        |  End User  |
+----+-----+        +--------+----------+        +------+-----+
     |                       |                          |
     | 1. POST /affiliate/   |                          |
     |    links              |                          |
     |---------------------->|                          |
     |                       |-- Generate shortCode    |
     |                       |   (base64url, 8 chars)  |
     |                       |-- Create AffiliateLink  |
     |   { shortCode:        |   record in DB          |
     |     "Xk7mP2qL",       |                          |
     |     trackingUrl:      |                          |
     |     "/go/Xk7mP2qL" }  |                          |
     |<----------------------|                          |
     |                       |                          |
     | 2. Shares link on     |                          |
     |    social media       |                          |
     |                       |                          |
     |                       |  3. GET /go/Xk7mP2qL     |
     |                       |     ?utm_source=facebook |
     |                       |<-------------------------|
     |                       |                          |
     |                       |-- Lookup shortCode       |
     |                       |-- Extract IP, UA,        |
     |                       |   Referer, UTM params    |
     |                       |-- Detect device type     |
     |                       |-- Create AffiliateClick  |
     |                       |-- Increment clickCount   |
     |                       |   (async, non-blocking)  |
     |                       |                          |
     |                       |-- Build target URL:      |
     |                       |   originalUrl +          |
     |                       |   utm params + ref=code  |
     |                       |                          |
     |                       |  302 Location: https://  |
     |                       |  shopee.vn/product?      |
     |                       |  utm_source=facebook&    |
     |                       |  ref=Xk7mP2qL            |
     |                       |------------------------->|
     |                       |                          |
     |                       |                          | 4. User lands on
     |                       |                          |    Shopee product
     |                       |                          |    page
     |                       |                          |
     |                       |  5. Conversion occurs    |
     |                       |                          |
     | 6. (Phase 1) Admin    |                          |
     |    POST /commissions  |                          |
     |    (Phase 3) Webhook  |                          |
     |---------------------->|                          |
     |                       |-- Create Commission      |
     |                       |   PENDING                |
     |                       |                          |
     | 7. Admin approves     |                          |
     |    PUT /commissions/  |                          |
     |    :id/approve        |                          |
     |---------------------->|                          |
     |                       |-- Status -> APPROVED     |
     |                       |-- Set approvedAt         |
     |                       |                          |
     | 8. Athlete requests   |                          |
     |    payout             |                          |
     |    POST /affiliate/   |                          |
     |    payouts/request    |                          |
     |<----------------------|                          |
     |                       |-- Validate approved      |
     |                       |   commissions exist      |
     |                       |-- Create Payout PENDING  |
     |                       |-- Link commissions       |
     |                       |   to payout              |
     |                       |                          |
     | 9. Admin processes    |                          |
     |    payout             |                          |
     |    PUT /payouts/      |                          |
     |    :id/process        |                          |
     |---------------------->|                          |
     |                       |-- Status -> COMPLETED    |
     |                       |-- Set processedAt        |
     |                       |-- Set referenceId        |
     |                       |                          |
     | 10. Athlete receives  |                          |
     |     money via bank/   |                          |
     |     MoMo/ZaloPay      |                          |
     |<----------------------+                          |
     |                       |                          |
```

### 5.2 Short Code Generation

```typescript
// Source: api-server/src/modules/affiliate/affiliate.service.ts
function generateShortCode(): string {
  return crypto.randomBytes(6).toString("base64url").substring(0, 8);
}
```

The code generates a cryptographically random 8-character string using the base64url alphabet (`A-Z`, `a-z`, `0-9`, `-`, `_`). The generation loop retries if a collision occurs (the `shortCode` column has a `@unique` constraint). With 64^8 possible values (~281 trillion), collisions are extremely rare in practice.

### 5.3 Device Detection

```typescript
// Source: api-server/src/modules/affiliate/affiliate.service.ts
function detectDevice(userAgent: string): string {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|kindle/.test(ua)) return "tablet";
  if (/mobi|android(?!.*tablet)|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) return "mobile";
  return "desktop";
}
```

Detection runs tablet-first to avoid false-positives (some Android tablets report as `mobile`). The negative lookahead `(?!.*tablet)` on the Android regex prevents tablets containing "tablet" in their UA from being classified as mobile.

---

## 6. Affiliate Platform Integration

### 6.1 Supported Platforms

| Platform | Code | Affiliate Program Name | API Availability |
|----------|------|----------------------|------------------|
| Shopee | `SHOPEE` | Shopee Affiliate Program (SAP) | Yes — Shopee AMS API (by application) |
| TikTok | `TIKTOK` | TikTok Shop Partner Program | Yes — TikTok Shop Partner API |
| Lazada | `LAZADA` | Lazada Affiliate Program | Yes — Lazada Affiliate API |
| Other | `OTHER` | Any platform not covered above | N/A — manual tracking only |

### 6.2 How Affiliate Codes Work

Each platform assigns athletes a unique affiliate/referral code (typically an alphanumeric string or numeric ID). This code is embedded in product URLs:

- **Shopee**: `https://shopee.vn/product/123?affiliate_id=CODE123`
- **TikTok**: `https://www.tiktok.com/@seller/video/123?traffic_type=affiliate&affiliate_id=CODE123`
- **Lazada**: `https://www.lazada.vn/products/i123.html?lazada_affiliate_id=CODE123`

When a user purchases after clicking an affiliate-tagged URL, the platform records the attribution. Athletes can view their confirmed orders and earnings in their respective platform dashboards.

### 6.3 ACCESSTRADE Intermediary

**ACCESSTRADE** is a Vietnamese affiliate network that acts as an intermediary between publishers (athletes) and advertisers (Shopee, TikTok, Lazada). Key advantages:

- Single integration point for all three major platforms
- Unified reporting dashboard
- Deep linking API for generating affiliate URLs programmatically
- Supports conversion tracking via postback/S2S (server-to-server callbacks)

**ACCESSTRADE API Capabilities:**

| Feature | Phase 2 Target |
|---------|---------------|
| Auto-generate deep links | Replace manual URL entry |
| Fetch product catalog | Auto-populate link titles and thumbnails |
| Pull conversion reports | Auto-create Commission records |
| S2S postback | Real-time conversion tracking |

### 6.4 Platform-by-Platform Notes

**Shopee:**
- Affiliate program requires manual application and approval by Shopee
- Commission rates vary by product category (typically 1-10%)
- Cookie window: 7 days (purchase within 7 days of click counts)
- AMS API is available for registered Shopee Affiliate Partners

**TikTok Shop:**
- Requires TikTok Shop Partner account
- Commission rates set by sellers, typically 5-20%
- Attribution window: 30 days
- In-app linking is the primary distribution channel

**Lazada:**
- Lazada Affiliate Program is open-registration
- Commission rates: 1-6% depending on product category
- Cookie window: 7 days (common), up to 30 days for specific campaigns
- API available via Lazada Open Platform

### 6.5 Current Integration Status

**Phase 1 (Implemented):**
- Athletes manually copy their affiliate product URLs from platform dashboards
- Athletes paste URLs into the Vietnam ParaSports affiliate link creation form
- The system generates tracking URLs and records clicks
- Commission tracking is fully manual: admins create Commission records after athletes report confirmed orders

---

## 7. Phase Roadmap

### 7.1 Phase 1 — Current (Manual)

**Status: Implemented**

| Feature | Status |
|---------|--------|
| Sponsor marketplace (products, stores, categories) | Done |
| Product CRUD (admin) | Done |
| Public product browsing with search/filter | Done |
| Affiliate link creation by athletes | Done |
| Short code generation (`/go/:shortCode`) | Done |
| Click tracking with device detection and UTM params | Done |
| Click-to-redirect flow (302 with UTM forwarding) | Done |
| Athlete earnings dashboard (summary + detail) | Done |
| Manual commission creation by admin | Done |
| Commission approve/reject workflow | Done |
| Payout request by athlete | Done |
| Payout processing by admin | Done |
| AffiliateTab component in profile page | Done |
| Admin marketplace management page | Done |

**Limitations in Phase 1:**
- Affiliate link creation is 100% manual (athlete copies URL from Shopee/TikTok/Lazada)
- No automated conversion tracking (athlete must report confirmed orders to admin)
- Commission rates are manually entered by admin
- Payout processing is manual (admin marks as completed, no real payment gateway)

### 7.2 Phase 2 — ACCESSTRADE Integration (Planned)

| Feature | Description |
|---------|-------------|
| ACCESSTRADE API client | Implement API client module in NestJS for ACCESSTRADE REST API |
| Auto-generate deep links | Replace manual URL entry: athlete selects product from catalog, system builds affiliate deep link via ACCESSTRADE API |
| Product catalog sync | Fetch product listings from ACCESSTRADE to auto-populate titles, prices, thumbnails |
| Periodic conversion report pull | Scheduled cron job (`@nestjs/schedule`) to fetch conversion reports from ACCESSTRADE daily |
| Auto-create Commission records | When a conversion report shows a confirmed order, auto-create a Commission with status `CONFIRMED` |
| ACCESSTRADE credentials storage | Add encrypted credential fields to `AthleteProfile` or a new `AthleteIntegration` model |
| Link attribution matching | Match ACCESSTRADE conversions to `AffiliateClick` records using order IDs and click timestamps |

**New Dependencies (Phase 2):**

```
@nestjs/schedule    — Cron job scheduling
@nestjs/axios       — HTTP client for ACCESSTRADE API
```

**Proposed new model:**

```prisma
model AthleteIntegration {
  id          String   @id @default(uuid())
  athleteId   String   @unique
  athlete     AthleteProfile @relation(fields: [athleteId], references: [id])
  platform    AffiliatePlatform
  apiKey      String?  // Encrypted ACCESSTRADE API key
  partnerId   String?  // ACCESSTRADE partner/affiliate ID
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 7.3 Phase 3 — Webhook-Based Automation (Planned)

| Feature | Description |
|---------|-------------|
| S2S postback endpoint | Webhook endpoint: `POST /webhooks/accesstrade/conversion` to receive real-time conversion notifications |
| Direct platform APIs | Shopee AMS API, TikTok Shop Partner API, Lazada Open Platform for eligible high-volume athletes |
| Auto payout reconciliation | When a payout is marked `COMPLETED`, automatically update linked commissions to `PAID` and update `AthleteLink.totalEarnings` |
| Automated payment gateway integration | Integrate with Vietcombank/Vietinbank API or payment aggregator for auto bank transfers |
| Real-time analytics dashboard | Live click maps, conversion funnels, A/B link testing |
| Fraud detection | Automated flagging of suspicious click patterns (rapid clicks from same IP, bot user-agents) |

---

## 8. Frontend Pages

### 8.1 Public Routes

| Route | Component Location | Description | Status |
|-------|-------------------|-------------|--------|
| `/marketplace` | `web-client/src/app/[locale]/marketplace/page.tsx` | Product listing grid with search bar, category filter dropdown, and pagination. Displays product cards with image, name, price, sale price, commission rate badge, and store name. | Done |
| `/marketplace/[slug]` | `web-client/src/app/[locale]/marketplace/[slug]/page.tsx` | Product detail page showing full description, image gallery, price (with sale price strikethrough), commission rate, store link, and affiliate athlete info. | Done |
| `/stores/[slug]` | `web-client/src/app/[locale]/stores/[slug]/page.tsx` | Sponsor store detail page with store banner, logo, description, and grid of all products from that store. | Done |
| `/go/[shortCode]` | Handled by API (no frontend page) | Redirect handler. Server-side: records click, then HTTP 302 to the target platform URL with UTM params preserved. | Done |

### 8.2 Athlete Dashboard (under `/profile?tab=affiliate`)

| Section | Component | Description | Status |
|---------|-----------|-------------|--------|
| Affiliate Tab | `web-client/src/app/[locale]/profile/AffiliateTab.tsx` | Full-featured tab within the profile dashboard. Four earnings summary cards (Total, Pending, Approved, Paid) using VND currency formatting. Click counter. Create link modal with platform dropdown, URL/title/description/affiliate code/thumbnail fields, and validation. Link list with platform badge, title, original URL, short code with copy button, click count, and delete. Payout request modal with amount, payment method (BANK/MOMO/ZALOPAY), and payment info fields. All labels are bilingual (vi/en). | Done |
| Tab Integration | `web-client/src/app/[locale]/profile/page.tsx` | The AffiliateTab is imported as a component in the profile page. When the user has an `athleteProfile`, an "Affiliate" tab is added to the navigation bar. The tab is selected via URL query param `?tab=affiliate`. | **Pending - Not yet wired into tab navigation** |

### 8.3 Admin Routes

| Route | Component Location | Description | Status |
|-------|-------------------|-------------|--------|
| `/admin/marketplace` | `web-client/src/app/[locale]/admin/marketplace/page.tsx` | Admin panel with three sub-tabs: Products, Categories, Stores. Each tab has a DataTable with CRUD operations. Products tab shows image, name, price, store, category, active status, and commission rate columns. Includes search bar, add/edit modals with full form fields (including images, sale price, commission rate). | Done |
| `/admin/commissions` | Not yet built | Dedicated admin commission management page with DataTable showing all commissions, filterable by status. Approve/reject buttons per row. Pagination. | Pending |
| `/admin/payouts` | Not yet built | Dedicated admin payout management page with DataTable showing all payouts, filterable by status. Process button with status selector (PROCESSING/COMPLETED/FAILED). Reference ID input field. | Pending |
| `/admin/affiliate` | Not yet built | Admin overview of all affiliate links across all athletes. Click analytics. Platform distribution chart. | Pending |

### 8.4 Navigation Items

| Navigation Link | Target Route | Status |
|----------------|-------------|--------|
| "Marketplace" / "Sports Shop" | `/marketplace` | Needs to be added to main navigation |
| "Sponsor Stores" | `/stores` | Needs to be added to main navigation |

---

## 9. Implementation Checklist

### 9.1 Done

- [x] Prisma schema: `SponsorStore`, `Product`, `ProductCategory`, `AffiliateLink`, `AffiliateClick`, `Commission`, `Payout` models
- [x] Backend: Products module with public listing/detail + admin CRUD
- [x] Backend: Stores controller with public listing/detail + admin CRUD
- [x] Backend: Categories CRUD for admin
- [x] Backend: Affiliate module with link CRUD, earnings summary, earnings detail
- [x] Backend: Click tracking (`GET /go/:shortCode`) with IP, UA, referrer, UTM, device detection
- [x] Backend: Redirect handler with UTM forwarding and `ref` parameter
- [x] Backend: Commissions module with create, approve, reject, athlete listing
- [x] Backend: Payout listing, athlete payout history, payout processing
- [x] Backend: Athlete payout request with validation (approved commissions check, amount validation, duplicate check)
- [x] Backend: Commission linking to Payout with proportional distribution
- [x] Frontend: `AffiliateTab` component with full functionality (link CRUD, earnings dashboard, payout request)
- [x] Frontend: Public marketplace listing page with search, category filter, pagination
- [x] Frontend: Product detail page
- [x] Frontend: Store detail page
- [x] Frontend: Admin marketplace panel (products, categories, stores) with DataTable and modals
- [x] Frontend: Bilingual support (vi/en) for all marketplace and affiliate UI text

### 9.2 Pending

- [ ] **Link AffiliateTab into profile tab navigation** — The `AffiliateTab` component exists and is fully functional, but the parent `profile/page.tsx` does not yet include an "Affiliate" tab button in the navigation bar. When an athlete logs in and visits `/profile`, they cannot access the Affiliate tab.
  - **Location**: `web-client/src/app/[locale]/profile/page.tsx`, lines ~814-909 (tab navigation section)
  - **Required change**: Add an affiliate tab button (similar to athlete/coach/assistant tabs) that appears when `profile?.athleteProfile` exists, routing to `?tab=affiliate`. Import `AffiliateTab` and render it in the tab panels section.

- [ ] **Add "Marketplace" to main navigation** — The main navigation bar (likely in `web-client/src/components/layout/`) does not include a link to `/marketplace`.

- [ ] **Add "Sponsor Stores" to main navigation** — The main navigation bar does not include a link to `/stores`.

- [ ] **Sitemap update** — Add `/marketplace`, `/stores`, and their dynamic sub-routes to the site's sitemap.xml generation.

- [ ] **Admin commissions page** — Build `web-client/src/app/[locale]/admin/commissions/page.tsx` with a DataTable, status filters, approve/reject buttons.

- [ ] **Admin payouts page** — Build `web-client/src/app/[locale]/admin/payouts/page.tsx` with a DataTable, status filters, process button with modal.

- [ ] **Admin affiliate analytics page** — Build `web-client/src/app/[locale]/admin/affiliate/page.tsx` for global affiliate link overview.

- [ ] **SEO metadata** — Add proper `<title>`, `<meta description>`, and Open Graph tags to marketplace and store pages.

- [ ] **Automated commission status propagation** — When a payout is marked `COMPLETED`, the linked commissions should be automatically updated to `PAID`. This logic is not yet in the `commissions.service.ts` `processPayout` method (line 311).

### 9.3 Quick Fix: AffiliateTab Wiring

The most pressing pending item is wiring the `AffiliateTab` into the profile page. The change required in `profile/page.tsx`:

**Tab button** (add alongside athlete/coach/assistant tab buttons around line 858):

```tsx
{profile?.athleteProfile && (
  <button
    role="tab"
    aria-selected={activeTab === "affiliate"}
    onClick={() => changeTab("affiliate")}
    className={...}
  >
    <LinkIcon size={16} /> {language === "vi" ? "Tiếp thị" : "Affiliate"}
  </button>
)}
```

**Tab panel** (add alongside athlete/coach/assistant panels around line 1068):

```tsx
{activeTab === "affiliate" && profile && (
  <AffiliateTab userProfile={profile} onRefresh={fetchProfileData} />
)}
```

**Imports to add:**
```tsx
import AffiliateTab from "./AffiliateTab";
import { Link as LinkIcon } from "lucide-react";  // if not already imported
```

**Validation** — Add `"affiliate"` to the allowed tabs array in the `useEffect` at line 327.

---

## 10. Commission Tracking Guidelines

### 10.1 Admin Verification Process

When an athlete reports a confirmed order from an e-commerce platform, an admin must verify and record the commission. The following verification steps should be followed:

1. **Verify the order ID** — The athlete must provide the external order ID from the platform (Shopee/TikTok/Lazada order number). This is stored in `Commission.orderId`.

2. **Verify the order amount** — Confirm the final order value (after discounts, before shipping). This is stored in `Commission.orderAmount`.

3. **Verify the commission rate** — Check the platform's commission rate for the product category. For Shopee, this varies by product type (typically 1-10%). For TikTok Shop, rates are set by sellers. For sponsor marketplace products, use the `product.commissionRate` value.

4. **Calculate commission amount** — `commissionAmount = orderAmount * (commissionRate / 100)`.

5. **Create the Commission** — `POST /commissions` with the verified data. Set status to `PENDING` initially.

6. **Review and approve** — Once the order has passed the return window (typically 7 days for Shopee/Lazada, 30 days for TikTok), approve the commission via `PUT /commissions/:id/approve`.

7. **Record rejection reason** — If an order is returned, cancelled, or disputed, reject the commission via `PUT /commissions/:id/reject` with a `notes` body explaining the reason.

### 10.2 Common Rejection Reasons

| Reason | Notes Field Example |
|--------|-------------------|
| Order returned | `"Customer returned item — Shopee order #SH12345"` |
| Order cancelled | `"Order cancelled before shipment"` |
| Commission dispute | `"Platform rejected attribution — affiliate code mismatch"` |
| Duplicate entry | `"Duplicate commission — same order already recorded under commission #uuid"` |
| Fraud suspected | `"Suspicious activity — multiple orders from same IP in short time"` |

### 10.3 Payment Methods

Athletes can choose from three payment methods when requesting a payout:

| Method | Code | Required Info | Notes |
|--------|------|--------------|-------|
| Bank Transfer | `BANK` | `bankName`, `accountNumber`, `accountName` | Most common. Works with any Vietnamese bank. |
| MoMo | `MOMO` | `phoneNumber` | Requires athlete to have a registered MoMo account with the same phone number. |
| ZaloPay | `ZALOPAY` | `phoneNumber` | Requires athlete to have a registered ZaloPay account with the same phone number. |

The `paymentInfo` field on `Payout` stores this data as a flexible JSON object:

```json
// Bank Transfer
{
  "bankName": "Vietcombank",
  "accountNumber": "0123456789",
  "accountName": "Nguyen Van A"
}

// MoMo
{
  "phoneNumber": "0912345678"
}

// ZaloPay
{
  "phoneNumber": "0912345678"
}
```

### 10.4 Payout Processing Checklist

When an admin processes a payout:

1. Review the payout request at `GET /payouts` (filter `status=PENDING`).
2. Verify the linked commissions are all `APPROVED`.
3. Verify the requested amount does not exceed the sum of linked commissions.
4. Initiate the bank transfer or mobile payment manually (Phase 1).
5. Record the external reference ID (transaction number) from the bank/payment app.
6. Update the payout via `PUT /payouts/:id/process`:
   - `status: "PROCESSING"` while waiting for transfer confirmation
   - `status: "COMPLETED"` when transfer is successful, with `referenceId`
   - `status: "FAILED"` if transfer cannot be completed (wrong account info, etc.)
7. After completion, confirm that linked commissions are updated to `PAID` status (manual in Phase 1, automatic in Phase 3).

### 10.5 Minimum Payout Threshold

Athletes should have a minimum accumulated approved commission balance before requesting a payout. **Recommended threshold: 100,000 VND.** This threshold should be validated in the `requestPayout` method (currently it only checks that the amount is > 0). The frontend already enforces a minimum of 10,000 VND in the input field.

---

## Appendix A: File Reference

| Component | File Path |
|-----------|-----------|
| Prisma Schema | `api-server/prisma/schema.prisma` (lines 828-993) |
| Affiliate Controller | `api-server/src/modules/affiliate/affiliate.controller.ts` |
| Affiliate Service | `api-server/src/modules/affiliate/affiliate.service.ts` |
| Affiliate DTOs | `api-server/src/modules/affiliate/dto/` |
| Products Controller | `api-server/src/modules/products/products.controller.ts` |
| Products Service | `api-server/src/modules/products/products.service.ts` |
| Commissions Controller | `api-server/src/modules/commissions/commissions.controller.ts` |
| Commissions Service | `api-server/src/modules/commissions/commissions.service.ts` |
| AffiliateTab (Frontend) | `web-client/src/app/[locale]/profile/AffiliateTab.tsx` |
| Profile Page (Frontend) | `web-client/src/app/[locale]/profile/page.tsx` |
| Marketplace Page | `web-client/src/app/[locale]/marketplace/page.tsx` |
| Product Detail Page | `web-client/src/app/[locale]/marketplace/[slug]/page.tsx` |
| Store Detail Page | `web-client/src/app/[locale]/stores/[slug]/page.tsx` |
| Admin Marketplace | `web-client/src/app/[locale]/admin/marketplace/page.tsx` |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Affiliate Link** | A shortened tracking URL (`/go/:shortCode`) that redirects to a product page on an external platform with tracking parameters. |
| **Short Code** | An 8-character random string generated with `crypto.randomBytes` used to identify affiliate links in short URLs. |
| **UTM Parameters** | Standard marketing tracking query parameters: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`. |
| **Click Tracking** | Recording each visit to a `/go/:shortCode` URL with metadata (IP, user-agent, referrer, device, UTM params). |
| **Commission** | A record of earnings attributed to an athlete from a confirmed sale, with status tracking through approval and payment. |
| **Payout** | A withdrawal request by an athlete to receive their approved commissions, sent to their bank account or mobile wallet. |
| **ACCESSTRADE** | A Vietnamese affiliate marketing network that provides unified API access to Shopee, TikTok, and Lazada affiliate programs. |
| **S2S Postback** | Server-to-server callback from an affiliate network to notify the platform of a conversion in real time. |
| **Attribution Window** | The time period (e.g., 7 days) after a click during which a purchase is credited to the affiliate. |
