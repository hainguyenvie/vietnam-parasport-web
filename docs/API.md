# Vietnam ParaSports API Documentation

## Tong quan / Overview

- **Base URL:** `http(s)://<domain>/api/v1`
- **He dieu hanh API:** NestJS 11 + Prisma ORM
- **Xac thuc:** JSON Web Token (JWT) Bearer
- **Dinh dang:** JSON (tru cac endpoint upload da phuong tien)
- **Ngon ngu:** Tieng Viet (thong bao loi), co ho tro song ngu Anh-Viet

---

## Xac thuc / Authentication

Gui token JWT trong header `Authorization` cho tat ca cac endpoint can xac thuc:

```
Authorization: Bearer <token>
```

### He thong vai tro / Role System

| Vai tro (Role) | Quyen han |
|---|---|
| `SUPER_ADMIN` | Toan quyen he thong, quan ly roles, audit |
| `ADMIN` | Quan ly nguoi dung, giai dau, noi dung |
| `EDITOR` | Quan ly bai viet, binh luan, templates |
| `INSTRUCTOR` | Quan ly khoa hoc, bai giang, quiz, assignment |
| `ORGANIZATION_ADMIN` | Quan ly to chuc, xu ly media accessibility |
| `USER` | Nguoi dung co ban |
| `ATHLETE` | Van dong vien |
| `COACH` | Huan luyen vien |
| `ASSISTANT` | Tro ly ho tro |

---

## Gioi han toc do / Rate Limiting

| Pham vi | Gioi han | Thoi gian reset |
|---|---|---|
| Toan cuc (global) | 100 requests | 60 giay |
| POST /auth/login | 5 requests | 60 giay |
| POST /auth/login/2fa | 5 requests | 60 giay |
| POST /auth/register | 5 requests | 60 phut |
| POST /auth/forgot-password | 3 requests | 15 phut |
| POST /auth/reset-password | 5 requests | 15 phut |
| POST /auth/oauth-login | 10 requests | 60 giay |

Khi vuot gioi han, API tra ve HTTP `429 Too Many Requests`.

---

## Dinh dang phan hoi / Response Formats

### Thanh cong / Success

Diem cuoi tra du lieu don le hoac danh sach:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "statusCode": 200
}
```

### Loi / Error

Tat ca loi duoc xu ly tap trung boi `AllExceptionsFilter`:

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "message": "Thong bao loi bang tieng Viet",
  "statusCode": 400,
  "timestamp": "2026-06-28T12:00:00.000Z",
  "path": "/api/v1/...",
  "errorCode": "ERROR_CODE"
}
```

Cac `errorCode` pho bien:

| errorCode | HTTP Status | Mo ta |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Du lieu dau vao khong hop le |
| `UNAUTHORIZED` | 401 | Token het han hoac khong hop le |
| `FORBIDDEN` | 403 | Khong co quyen truy cap |
| `NOT_FOUND` | 404 | Khong tim thay tai nguyen |
| `METHOD_NOT_ALLOWED` | 405 | Phuong thuc HTTP khong ho tro |
| `INTERNAL_SERVER_ERROR` | 500 | Loi he thong |
| `DB_ERROR_P2002` | 400 | Du lieu da ton tai (unique constraint) |
| `DB_ERROR_P2003` | 400 | Vi pham rang buoc khoa ngoai |
| `DB_ERROR_P2025` | 404 | Du lieu da bi xoa hoac khong ton tai |

### Phan trang / Paginated

```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## 1. Xac thuc & Tai khoan / Auth & Account

### 1.1 Dang nhap / Login

```
POST /api/v1/auth/login
Auth: Public
Rate Limit: 5 req/min
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "MatKhau123"
}
```

**Response (khong co 2FA):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "role": {"name": "USER"},
      "avatarUrl": null,
      "isTwoFactorEnabled": false
    }
  }
}
```

**Response (co 2FA):**

```json
{
  "twoFactorRequired": true,
  "email": "user@example.com"
}
```

---

### 1.2 Xac thuc 2 yeu to / Login 2FA

```
POST /api/v1/auth/login/2fa
Auth: Public
Rate Limit: 5 req/min
```

**Request:**

```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "role": {"name": "USER"},
      "isTwoFactorEnabled": true
    }
  }
}
```

---

### 1.3 Dang ky / Register

```
POST /api/v1/auth/register
Auth: Public
Rate Limit: 5 req/hr
```

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "MatKhau123",
  "fullName": "Nguyen Van B",
  "phoneNumber": "0912345678",
  "role": "USER",
  "dob": "1990-01-01",
  "gender": "male"
}
```

| Field | Bat buoc | Gia tri hop le |
|---|---|---|
| `email` | Co | Email hop le |
| `password` | Co | Toi thieu 8 ky tu, chua it nhat 2 loai: chu thuong/chu hoa/so |
| `fullName` | Co | Chuoi khong rong |
| `phoneNumber` | Khong | Chuoi |
| `role` | Khong | `USER`, `ATHLETE`, `COACH`, `ASSISTANT` |
| `dob` | Khong | ISO date string |
| `gender` | Khong | Chuoi |

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "fullName": "Nguyen Van B",
      "role": {"name": "USER"}
    }
  }
}
```

---

### 1.4 Quen mat khau / Forgot Password

```
POST /api/v1/auth/forgot-password
Auth: Public
Rate Limit: 3 req/15min
```

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Da gui email dat lai mat khau."
}
```

---

### 1.5 Dat lai mat khau / Reset Password

```
POST /api/v1/auth/reset-password
Auth: Public
Rate Limit: 5 req/15min
```

**Request:**

```json
{
  "email": "user@example.com",
  "token": "reset-token-tu-email",
  "newPassword": "MatKhauMoi456"
}
```

| Field | Mo ta |
|---|---|
| `email` | Email da dang ky |
| `token` | Token tu email reset password |
| `newPassword` | Mat khau moi (toi thieu 8 ky tu, 2 loai ky tu) |

**Response:**

```json
{
  "success": true,
  "message": "Mat khau da duoc dat lai thanh cong."
}
```

---

### 1.6 Dang nhap OAuth / OAuth Login

```
POST /api/v1/auth/oauth-login
Auth: Public
Rate Limit: 10 req/min
```

**Request:**

```json
{
  "email": "user@gmail.com",
  "fullName": "Google User",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "provider": "google",
  "providerAccountId": "google-uid-12345"
}
```

| Field | Bat buoc | Mo ta |
|---|---|---|
| `email` | Co | Email tu provider |
| `fullName` | Co | Ten hien thi |
| `avatarUrl` | Khong | URL anh dai dien |
| `provider` | Co | Ten provider (google, facebook, ...) |
| `providerAccountId` | Co | ID nguoi dung tu provider |

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "fullName": "Google User",
      "avatarUrl": "https://lh3.googleusercontent.com/...",
      "role": {"name": "USER"}
    }
  }
}
```

---

## 2. Nguoi dung / Users

### 2.1 Lay thong tin ca nhan / Get Profile

```
GET /api/v1/users/me
Auth: JWT (moi role)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0912345678",
    "avatarUrl": "/uploads/...",
    "dob": "1990-01-01T00:00:00.000Z",
    "gender": "male",
    "address": "Ha Noi",
    "bio": "Gioi thieu ban than",
    "isTwoFactorEnabled": false,
    "role": {"id": "role-uuid", "name": "USER"},
    "athleteProfile": null,
    "coachProfile": null,
    "assistantProfile": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 2.2 Cap nhat thong tin ca nhan / Update Profile

```
PUT /api/v1/users/me
Auth: JWT (moi role)
```

**Request:**

```json
{
  "fullName": "Nguyen Van A Updated",
  "phoneNumber": "0987654321",
  "avatarUrl": "/uploads/avatars/abc.jpg",
  "coverUrl": "/uploads/covers/abc.jpg",
  "dob": "1990-05-15",
  "gender": "male",
  "address": "TP Ho Chi Minh",
  "bio": "Cap nhat gioi thieu"
}
```

Tat ca cac truong deu khong bat buoc (`fullName`, `avatarUrl`, `coverUrl`, `phoneNumber`, `dob`, `gender`, `address`, `bio`).

**Response:** Tra ve user object da cap nhat (cung dinh dang nhu GET /users/me).

---

### 2.3 Doi mat khau / Change Password

```
PUT /api/v1/users/me/password
Auth: JWT (moi role)
```

**Request:**

```json
{
  "currentPassword": "MatKhauCu123",
  "newPassword": "MatKhauMoi456"
}
```

| Field | Bat buoc | Mo ta |
|---|---|---|
| `currentPassword` | Co | Mat khau hien tai |
| `newPassword` | Co | Mat khau moi (toi thieu 6 ky tu) |

**Response:**

```json
{
  "success": true
}
```

---

### 2.4 Tao 2FA / Generate 2FA

```
POST /api/v1/users/me/2fa/generate
Auth: JWT (moi role)
```

**Response:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/..."
}
```

Quet ma QR bang Google Authenticator hoac Authy, sau do xac thuc qua endpoint `verify`.

---

### 2.5 Xac thuc 2FA / Verify 2FA

```
POST /api/v1/users/me/2fa/verify
Auth: JWT (moi role)
```

**Request:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

| Field | Mo ta |
|---|---|
| `secret` | Ma bi mat tu endpoint generate |
| `token` | Ma TOTP 6 chu so tu ung dung xac thuc |

**Response:**

```json
{
  "success": true
}
```

---

### 2.6 Tat 2FA / Disable 2FA

```
POST /api/v1/users/me/2fa/disable
Auth: JWT (moi role)
```

**Response:**

```json
{
  "success": true
}
```

---

### 2.7 Nang cap len Athlete / Upgrade to Athlete

```
POST /api/v1/users/me/upgrade-athlete
Auth: JWT (moi role)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": {"name": "ATHLETE"}
  }
}
```

---

### 2.8 Nang cap len Coach / Upgrade to Coach

```
POST /api/v1/users/me/upgrade-coach
Auth: JWT (moi role)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": {"name": "COACH"}
  }
}
```

---

### 2.9 Danh sach nguoi dung / List Users (Admin)

```
GET /api/v1/users?page=1&limit=20
Auth: JWT (SUPER_ADMIN, ADMIN)
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang (toi da 100) |

**Response:** Dinh dang phan trang.

---

### 2.10 Danh sach vai tro / Get Roles

```
GET /api/v1/users/roles
Auth: JWT (SUPER_ADMIN)
```

**Response:** Danh sach tat ca role va permissions.

---

### 2.11 Danh sach van dong vien / Get All Athletes

```
GET /api/v1/users/athletes/all?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang (toi da 100) |

**Response:** Dinh dang phan trang. Danh sach nguoi dung co role `ATHLETE`.

---

### 2.12 Ho so van dong vien / Athlete Profile

```
GET /api/v1/users/:id/athlete-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "height": 170,
    "weight": 65,
    "sportIds": ["sport-uuid-1"],
    "disabilityTypeIds": ["disability-uuid-1"],
    "achievements": ["HCV Seagames 2025"],
    "trainingHistory": "...",
    "classification": "T54",
    "isVerified": true
  }
}
```

---

### 2.13 Cap nhat ho so van dong vien / Update Athlete Profile

```
PUT /api/v1/users/:id/athlete-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

**Request:**

```json
{
  "height": 172,
  "weight": 68,
  "sportIds": ["sport-uuid-1", "sport-uuid-2"],
  "disabilityTypeIds": ["disability-uuid-1"],
  "achievements": ["HCV Seagames 2025"],
  "trainingHistory": "Tap luyen 3 nam",
  "classification": "T54",
  "isVerified": true
}
```

---

### 2.14 Ho so huan luyen vien / Coach Profile

```
GET /api/v1/users/:id/coach-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "specialization": "Bo loi",
    "certifications": ["Cert A", "Cert B"],
    "experience": "10 nam",
    "sportIds": ["sport-uuid-1"],
    "isVerified": true
  }
}
```

---

### 2.15 Cap nhat ho so huan luyen vien / Update Coach Profile

```
PUT /api/v1/users/:id/coach-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

**Request:**

```json
{
  "specialization": "Bo loi nang cao",
  "certifications": ["Cert A", "Cert B", "Cert C"],
  "experience": "12 nam",
  "sportIds": ["sport-uuid-1"]
}
```

> `isVerified` chi co the duoc ADMIN/SUPER_ADMIN cap nhat.

---

### 2.16 Ho so tro ly / Assistant Profile

```
GET /api/v1/users/:id/assistant-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

---

### 2.17 Cap nhat ho so tro ly / Update Assistant Profile

```
PUT /api/v1/users/:id/assistant-profile
Auth: JWT (chu so huu hoac ADMIN/SUPER_ADMIN)
```

---

### 2.18 Cap nhat vai tro nguoi dung / Update User Role

```
PUT /api/v1/users/:id/role
Auth: JWT (SUPER_ADMIN)
```

**Request:**

```json
{
  "roleId": "role-uuid"
}
```

**Response:** User object da cap nhat.

---

### 2.19 Thong ke Admin / Admin Stats

```
GET /api/v1/users/admin/stats
Auth: JWT (ADMIN, SUPER_ADMIN)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalAthletes": 500,
    "totalCoaches": 100,
    "totalOrganizations": 50,
    "totalCourses": 25,
    "newUsersThisMonth": 50
  }
}
```

---

### 2.20 Nhat ky hoat dong gan day / Recent Audits

```
GET /api/v1/users/admin/audits
Auth: JWT (ADMIN, SUPER_ADMIN)
```

**Response:** Danh sach 50 ban ghi audit gan nhat.

---

### 2.21 Toan bo nhat ky hoat dong / All Audits (Paginated)

```
GET /api/v1/users/admin/audits/all?page=1&limit=50
Auth: JWT (ADMIN, SUPER_ADMIN)
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 50 | So phan tu/trang |

**Response:** Dinh dang phan trang.

---

### 2.22 Ho so cong khai / Public Profile

```
GET /api/v1/users/:id/profile
Auth: Public
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Nguyen Van A",
    "avatarUrl": "/uploads/...",
    "coverUrl": "/uploads/...",
    "bio": "Gioi thieu ban than",
    "role": "ATHLETE",
    "sport": "Boi loi",
    "classification": "T54",
    "organization": "Cau lac bo The thao Ha Noi",
    "achievementsCount": 12,
    "tournamentCount": 5
  }
}
```

---

### 2.23 Thanh tich van dong vien cong khai / Public Achievements

```
GET /api/v1/users/:id/achievements?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang |

**Response:** Dinh dang phan trang. Danh sach thanh tich cua van dong vien.

---

### 2.24 Giai dau tham gia / Public Tournaments

```
GET /api/v1/users/:id/tournaments?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang |

**Response:** Dinh dang phan trang. Danh sach giai dau nguoi dung da tham gia.

---

### 2.25 Cau lac bo thanh vien / Public Clubs

```
GET /api/v1/users/:id/clubs?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang |

**Response:** Dinh dang phan trang. Danh sach cau lac bo/to chuc nguoi dung la thanh vien.

---

### 2.26 Nguoi dong hanh / Public Companions

```
GET /api/v1/users/:id/companions?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang |

**Response:** Dinh dang phan trang. Danh sach moi quan he dong hanh/ho tro.

---

### 2.27 Nha tai tro / Public Sponsors

```
GET /api/v1/users/:id/sponsors?page=1&limit=20
Auth: Public
```

**Query parameters:**

| Param | Mac dinh | Mo ta |
|---|---|---|
| `page` | 1 | So trang |
| `limit` | 20 | So phan tu/trang |

**Response:** Dinh dang phan trang. Danh sach nha tai tro/doi tac cua nguoi dung.

---

## 3. Vai tro / Roles

Tat ca endpoint deu yeu cau `SUPER_ADMIN`.

| Method | Endpoint | Mo ta |
|---|---|---|
| `GET` | `/api/v1/roles` | Danh sach tat ca vai tro |
| `GET` | `/api/v1/roles/permissions` | Danh sach tat ca quyen |  
| `POST` | `/api/v1/roles` | Tao vai tro moi |
| `GET` | `/api/v1/roles/:id` | Chi tiet vai tro |
| `PATCH` | `/api/v1/roles/:id` | Cap nhat vai tro |
| `DELETE` | `/api/v1/roles/:id` | Xoa vai tro |

---

## 4. Cau hinh he thong / Settings

### 4.1 Lay cau hinh / Get Settings

```
GET /api/v1/settings
Auth: Public
```

**Response:**

```json
{
  "success": true,
  "data": {
    "siteName": "Vietnam ParaSports",
    "logoUrl": "/uploads/settings/logo-123.png",
    "faviconUrl": "/uploads/settings/favicon-123.ico",
    "settings": {
      "contactEmail": "contact@parasports.vn",
      "socialLinks": { ... }
    }
  }
}
```

### 4.2 Quan ly cau hinh (Admin required)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `POST` | `/api/v1/settings/admin/logo` | ADMIN/SUPER_ADMIN | Upload logo (multipart: `file`) |
| `POST` | `/api/v1/settings/admin/favicon` | ADMIN/SUPER_ADMIN | Upload favicon (multipart: `file`) |
| `POST` | `/api/v1/settings/admin/generic` | ADMIN/SUPER_ADMIN | Dat cau hinh text (`{"key": "...", "value": "..."}`) |
| `POST` | `/api/v1/settings/admin/generic-upload` | ADMIN/SUPER_ADMIN | Upload file cau hinh chung (multipart: `file`) |

---

## 5. The thao & Giai dau / Sports & Tournaments

### 5.1 Mon the thao / Sports

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/sports` | Public | Danh sach tat ca mon the thao |
| `GET` | `/api/v1/sports/:id` | Public | Chi tiet mon the thao |
| `GET` | `/api/v1/sports/slug/:slug` | Public | Chi tiet theo slug |
| `POST` | `/api/v1/sports` | ADMIN/SUPER_ADMIN | Tao mon moi (multipart: `icon` + body) |
| `PUT` | `/api/v1/sports/:id` | ADMIN/SUPER_ADMIN | Cap nhat mon (multipart: `icon` optional) |
| `DELETE` | `/api/v1/sports/:id` | ADMIN/SUPER_ADMIN | Xoa mon |

**POST/PUT Body (multipart/form-data):**

| Field | Mo ta |
|---|---|
| `icon` | File anh icon (jpeg, png, jpg) |
| `nameVi` | Ten tieng Viet |
| `nameEn` | Ten tieng Anh |
| `slug` | URL slug |
| `descVi` | Mo ta tieng Viet |
| `descEn` | Mo ta tieng Anh |
| `detailDescVi` | Mo ta chi tiet tieng Viet |
| `detailDescEn` | Mo ta chi tiet tieng Anh |

---

### 5.2 Giai dau / Tournaments

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/tournaments` | Public | Danh sach (co phan trang & filter) |
| `GET` | `/api/v1/tournaments/:id` | Public | Chi tiet giai dau |
| `POST` | `/api/v1/tournaments` | JWT | Tao giai dau moi |
| `PATCH` | `/api/v1/tournaments/:id` | JWT | Cap nhat giai dau |
| `DELETE` | `/api/v1/tournaments/:id` | JWT | Xoa giai dau |

**GET Query parameters:**

| Param | Mo ta |
|---|---|
| `page` | So trang |
| `limit` | So phan tu/trang |
| `status` | Loc theo trang thai (`UPCOMING`, `ONGOING`, `COMPLETED`) |
| `sportId` | Loc theo mon the thao |
| `location` | Loc theo dia diem |
| `startDate` | Loc theo ngay bat dau |
| `endDate` | Loc theo ngay ket thuc |

**Response (danh sach):** Dinh dang phan trang.

---

### 5.3 Thanh vien tham du / Tournament Participants

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `POST` | `/api/v1/tournaments/:id/participants` | JWT | Them nguoi tham gia |
| `PATCH` | `/api/v1/tournaments/:id/participants/:rankingId/status` | JWT | Cap nhat trang thai tham gia |
| `PATCH` | `/api/v1/tournaments/:id/participants/:rankingId/checkin` | JWT | Check-in nguoi tham gia |
| `DELETE` | `/api/v1/tournaments/:id/participants/:rankingId` | JWT | Xoa nguoi tham gia |

**POST participants body:**

```json
{
  "athleteId": "user-uuid",
  "sportId": "sport-uuid",
  "teamId": "team-uuid",
  "weightClass": "72kg",
  "classificationId": "sport-class-uuid"
}
```

**PATCH status body:**

```json
{
  "status": "APPROVED"
}
```

**PATCH checkin body:**

```json
{
  "hasCheckedIn": true
}
```

---

### 5.4 Tao nhanh dau / Generate Bracket

```
POST /api/v1/tournaments/:id/generate-bracket
Auth: JWT
```

**Request:**

```json
{
  "sportId": "sport-uuid",
  "teamIds": ["team-uuid-1", "team-uuid-2", "team-uuid-3", "team-uuid-4"],
  "format": "SINGLE_ELIMINATION"
}
```

| Field | Mo ta |
|---|---|
| `sportId` | Bat buoc - ID mon the thao |
| `teamIds` | Bat buoc - Danh sach ID cac doi |
| `format` | `SINGLE_ELIMINATION` (mac dinh) hoac `ROUND_ROBIN` |

**Response:** Tra ve cau truc bracket da tao (danh sach tran dau).

---

### 5.5 Giai dau phu / Sub-Tournaments

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/sub-tournaments` | Public | Danh sach |
| `GET` | `/api/v1/sub-tournaments/:id` | Public | Chi tiet |
| `POST` | `/api/v1/sub-tournaments` | JWT | Tao moi |
| `PATCH` | `/api/v1/sub-tournaments/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/sub-tournaments/:id` | JWT | Xoa |
| `POST` | `/api/v1/sub-tournaments/:id/generate-bracket` | JWT | Tao nhanh dau |

---

### 5.6 Su kien / Events

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/events` | Public | Danh sach su kien |
| `GET` | `/api/v1/events/:id` | Public | Chi tiet |
| `POST` | `/api/v1/events` | JWT | Tao su kien |
| `PATCH` | `/api/v1/events/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/events/:id` | JWT | Xoa |

---

### 5.7 Su kien the thao / Sport Events

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/sport-events` | Public | Danh sach |
| `GET` | `/api/v1/sport-events/:id` | Public | Chi tiet |
| `POST` | `/api/v1/sport-events` | JWT | Tao moi |
| `PATCH` | `/api/v1/sport-events/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/sport-events/:id` | JWT | Xoa |

> Su kien the thao lien ket mot mon the thao cuc the voi mot su kien (Event).

---

### 5.8 Phan loai the thao / Sport Classifications

Phan loai theo muc do khuyet tat trong tung mon the thao.

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/sport-classifications` | Public | Danh sach |
| `GET` | `/api/v1/sport-classifications/:id` | Public | Chi tiet |
| `POST` | `/api/v1/sport-classifications` | ADMIN/SUPER_ADMIN | Tao moi |
| `PATCH` | `/api/v1/sport-classifications/:id` | ADMIN/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/sport-classifications/:id` | ADMIN/SUPER_ADMIN | Xoa |

---

### 5.9 Tran dau / Matches

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/matches` | Public | Danh sach (co phan trang & filter) |
| `GET` | `/api/v1/matches/:id` | Public | Chi tiet tran dau |
| `POST` | `/api/v1/matches` | JWT | Tao tran dau |
| `PUT` | `/api/v1/matches/:id` | JWT | Cap nhat tran dau |
| `DELETE` | `/api/v1/matches/:id` | JWT | Xoa tran dau |

**GET Query parameters:**

| Param | Mo ta |
|---|---|
| `page` | So trang |
| `limit` | So phan tu/trang |
| `sportId` | Loc theo mon the thao |
| `date` | Loc theo ngay thi dau |
| `tournamentId` | Loc theo giai dau |
| `weightClass` | Loc theo hang can |
| `classificationId` | Loc theo phan loai |

**Response (danh sach):** Dinh dang phan trang.

---

### 5.10 Doi / Teams

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/teams` | Public | Danh sach |
| `GET` | `/api/v1/teams/:id` | Public | Chi tiet |
| `POST` | `/api/v1/teams` | JWT | Tao moi |
| `PUT` | `/api/v1/teams/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/teams/:id` | JWT | Xoa |

---

### 5.11 Xep hang / Rankings

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `POST` | `/api/v1/rankings` | ADMIN/SUPER_ADMIN | Tao/Cap nhat xep hang |
| `GET` | `/api/v1/rankings/sport/:sportId` | Public | Xep hang theo mon |
| `GET` | `/api/v1/rankings/tournament/:tournamentId` | Public | Xep hang theo giai dau |
| `DELETE` | `/api/v1/rankings/:id` | ADMIN/SUPER_ADMIN | Xoa xep hang |

**GET /rankings/sport/:sportId Query parameters:**

| Param | Mo ta |
|---|---|
| `tournamentId` | Loc theo giai dau |
| `disabilityId` | Loc theo loai khuyet tat |
| `event` | Loc theo su kien |

---

### 5.12 Thanh tich van dong vien / Athlete Achievements

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/athlete-achievements` | Public | Danh sach |
| `GET` | `/api/v1/athlete-achievements/:id` | Public | Chi tiet |
| `POST` | `/api/v1/athlete-achievements` | ADMIN/SUPER_ADMIN | Tao thanh tich |
| `POST` | `/api/v1/athlete-achievements/me` | JWT | Tu them thanh tich |
| `PATCH` | `/api/v1/athlete-achievements/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/athlete-achievements/:id` | JWT | Xoa |

---

### 5.13 Loai khuyet tat / Disability Types

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/disability-types` | Public | Danh sach |
| `GET` | `/api/v1/disability-types/:id` | Public | Chi tiet |
| `POST` | `/api/v1/disability-types` | ADMIN/SUPER_ADMIN | Tao moi |
| `PUT` | `/api/v1/disability-types/:id` | ADMIN/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/disability-types/:id` | ADMIN/SUPER_ADMIN | Xoa |

---

## 6. Quan ly hoc tap / Learning Management System (LMS)

### 6.1 Khoa hoc / Courses

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/courses` | Public | Danh sach khoa hoc |
| `GET` | `/api/v1/courses/:slug` | Public | Chi tiet khoa hoc theo slug |
| `POST` | `/api/v1/courses` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Tao khoa hoc moi |
| `PUT` | `/api/v1/courses/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Cap nhat khoa hoc |
| `DELETE` | `/api/v1/courses/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xoa khoa hoc |

---

### 6.2 Chuong hoc / Chapters

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/chapters` | Public | Danh sach chuong |
| `POST` | `/api/v1/chapters` | JWT | Tao chuong moi |
| `PUT` | `/api/v1/chapters/:id` | JWT | Cap nhat chuong |
| `DELETE` | `/api/v1/chapters/:id` | JWT | Xoa chuong |

---

### 6.3 Bai giang / Lessons

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/lessons` | Public | Danh sach bai giang |
| `GET` | `/api/v1/lessons/:id` | Public | Chi tiet theo ID |
| `GET` | `/api/v1/lessons/slug/:slug` | Public | Chi tiet theo slug |
| `POST` | `/api/v1/lessons` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Tao bai giang moi |
| `PUT` | `/api/v1/lessons/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/lessons/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xoa |

---

### 6.4 Tien do hoc tap / Course Progress

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/course-progress` | JWT | Tien do cua nguoi dung hien tai |
| `POST` | `/api/v1/course-progress` | JWT | Cap nhat tien do |
| `GET` | `/api/v1/course-progress/:courseId` | JWT | Tien do khoa hoc cu the |

---

### 6.5 Quiz / Kiem tra trac nghiem

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/quizzes` | Public | Danh sach quiz |
| `GET` | `/api/v1/quizzes/:id` | Public | Chi tiet quiz |
| `GET` | `/api/v1/quizzes/lesson/:lessonId` | Public | Quiz cua bai giang |
| `POST` | `/api/v1/quizzes` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Tao quiz |
| `PUT` | `/api/v1/quizzes/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/quizzes/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xoa |
| `POST` | `/api/v1/quizzes/:id/questions` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Them cau hoi vao quiz |
| `DELETE` | `/api/v1/quizzes/questions/:questionId` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xoa cau hoi |

---

### 6.6 Bai tap / Assignments

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/assignments/lesson/:lessonId` | Public | Xem bai tap cua bai giang |
| `POST` | `/api/v1/assignments` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Tao bai tap |
| `PUT` | `/api/v1/assignments/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/assignments/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xoa |
| `POST` | `/api/v1/assignments/:id/submit` | JWT | Nop bai tap |
| `GET` | `/api/v1/assignments/:id/submissions` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Xem danh sach nop |
| `PUT` | `/api/v1/assignments/submissions/:submissionId/grade` | ADMIN/INSTRUCTOR/SUPER_ADMIN | Cham diem |

---

### 6.7 Tai lieu / Documents

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/documents` | Public | Danh sach tai lieu |
| `GET` | `/api/v1/documents/:id` | Public | Chi tiet theo ID |
| `GET` | `/api/v1/documents/slug/:slug` | Public | Chi tiet theo slug |
| `POST` | `/api/v1/documents` | JWT | Tao tai lieu |
| `PUT` | `/api/v1/documents/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/documents/:id` | JWT | Xoa |

---

### 6.8 Chu de tai lieu / Document Topics

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/document-topics` | Public | Danh sach chu de |
| `GET` | `/api/v1/document-topics/:id` | Public | Chi tiet |
| `POST` | `/api/v1/document-topics` | JWT | Tao moi |
| `PUT` | `/api/v1/document-topics/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/document-topics/:id` | JWT | Xoa |

---

## 7. Cong dong & Xa hoi / Community & Social

### 7.1 Bai viet / Posts

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/posts` | Public | Danh sach bai viet da xuat ban |
| `GET` | `/api/v1/posts/paginated` | Public | Danh sach phan trang |
| `GET` | `/api/v1/posts/:slug` | Public | Chi tiet theo slug |
| `GET` | `/api/v1/posts/admin/all` | ADMIN/EDITOR/SUPER_ADMIN | Tuy chinh - tat ca bai viet |
| `POST` | `/api/v1/posts` | ADMIN/EDITOR/SUPER_ADMIN | Tao bai viet |
| `PUT` | `/api/v1/posts/:id` | ADMIN/EDITOR/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/posts/:id` | ADMIN/EDITOR/SUPER_ADMIN | Xoa |

**GET Query parameters:**

| Param | Mo ta |
|---|---|
| `skip` | Bo qua N ban ghi |
| `take` | Lay N ban ghi (mac dinh 10) |
| `categoryId` | Loc theo danh muc |
| `search` | Tim kiem theo tieu de |

**GET /paginated Query parameters:**

| Param | Mo ta |
|---|---|
| `page` | So trang (mac dinh 1) |
| `limit` | So phan tu/trang (mac dinh 12) |
| `categoryId` | Loc theo danh muc |
| `categorySlug` | Loc theo slug danh muc |
| `search` | Tim kiem theo tieu de |

**Response (paginated):** Dinh dang phan trang.

---

### 7.2 Binh luan / Comments

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/comments` | Public | Danh sach binh luan (theo postId/matchId) |
| `POST` | `/api/v1/comments` | JWT | Tao binh luan |
| `PUT` | `/api/v1/comments/:id/react` | JWT | Tha cam xuc (LIKE, LOVE, etc.) |
| `PATCH` | `/api/v1/comments/:id` | JWT | Sua noi dung binh luan |
| `PUT` | `/api/v1/comments/:id` | ADMIN/SUPER_ADMIN | Kiem duyet/Thay doi trang thai |
| `DELETE` | `/api/v1/comments/:id` | JWT | Xoa binh luan |
| `GET` | `/api/v1/comments/admin/all` | ADMIN/SUPER_ADMIN | Tuy chinh - tat ca binh luan |

**GET Query parameters:**

| Param | Mo ta |
|---|---|
| `postId` | Loc theo bai viet |
| `matchId` | Loc theo tran dau |
| `page` | So trang (mac dinh 1) |
| `limit` | So phan tu/trang (mac dinh 10) |

**POST body:**

```json
{
  "content": "Noi dung binh luan",
  "postId": "post-uuid",
  "parentId": null,
  "imageAttachments": ["url1", "url2"]
}
```

> Chi can 1 trong 2: `postId` hoac `matchId`. `parentId` dung de tra loi binh luan.

**PUT /comments/:id/react body:**

```json
{
  "type": "LIKE"
}
```

**PATCH /comments/:id body (sua noi dung):**

```json
{
  "content": "Noi dung da duoc sua"
}
```

---

### 7.3 Dau trang / Bookmarks

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/bookmarks` | JWT | Danh sach bookmark cua toi |
| `GET` | `/api/v1/bookmarks/check/:postId` | JWT | Kiem tra da bookmark chua |
| `POST` | `/api/v1/bookmarks/toggle` | JWT | Bat/tat bookmark |

**POST toggle body:**

```json
{
  "postId": "post-uuid"
}
```

---

### 7.4 The / Tags

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/tags` | Public | Danh sach the |
| `GET` | `/api/v1/tags/:id` | Public | Chi tiet the |
| `POST` | `/api/v1/tags` | JWT | Tao the moi |

---

### 7.5 Danh muc / Categories

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | Danh sach danh muc |
| `GET` | `/api/v1/categories/:id` | Public | Chi tiet danh muc |
| `POST` | `/api/v1/categories` | JWT | Tao danh muc |
| `PUT` | `/api/v1/categories/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/categories/:id` | JWT | Xoa |

---

### 7.6 Yeu cau dong hanh / Companion Requests

Nguoi dung khuyet tat gui yeu cau can nguoi dong hanh.

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `POST` | `/api/v1/companion-requests` | Public | Gui yeu cau dong hanh |
| `GET` | `/api/v1/companion-requests` | ADMIN/SUPER_ADMIN | Danh sach yeu cau |
| `PUT` | `/api/v1/companion-requests/:id/read` | ADMIN/SUPER_ADMIN | Danh dau da doc |
| `DELETE` | `/api/v1/companion-requests/:id` | ADMIN/SUPER_ADMIN | Xoa yeu cau |

**POST body:**

```json
{
  "fullName": "Nguyen Van C",
  "unit": "Don vi cong tac",
  "phone": "0912345678",
  "email": "nguyenvanc@example.com",
  "type": "TRANSPORT",
  "message": "Can ho tro di chuyen den san van dong"
}
```

---

### 7.7 Lien ket xa hoi / Social Links

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/social-links` | Public | Danh sach |
| `GET` | `/api/v1/social-links/:id` | Public | Chi tiet |
| `POST` | `/api/v1/social-links` | JWT | Tao moi |
| `PUT` | `/api/v1/social-links/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/social-links/:id` | JWT | Xoa |

---

### 7.8 To chuc / Organizations

(Chu y: URL path co viet hoa: `/Organizations`)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/Organizations` | Public | Danh sach to chuc da duyet |
| `GET` | `/api/v1/Organizations/map/bounded` | Public | Tim to chuc theo khu vuc ban do |
| `POST` | `/api/v1/Organizations` | Public | Dang ky to chuc (cho duyet) |
| `POST` | `/api/v1/Organizations/admin` | ADMIN/SUPER_ADMIN | Tao to chuc (da duyet) |
| `GET` | `/api/v1/Organizations/pending` | ADMIN/SUPER_ADMIN | Danh sach cho duyet |
| `GET` | `/api/v1/Organizations/admin/all` | ADMIN/SUPER_ADMIN | Tuy chinh - tat ca |
| `PUT` | `/api/v1/Organizations/:id/approve` | ADMIN/SUPER_ADMIN | Duyet to chuc |
| `PUT` | `/api/v1/Organizations/:id` | ADMIN/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/Organizations/:id` | ADMIN/SUPER_ADMIN | Xoa |

**GET Query parameters:**

| Param | Mo ta |
|---|---|
| `sport` | Loc theo mon the thao |
| `location` | Loc theo dia diem |

**GET /map/bounded Query parameters:**

| Param | Mo ta |
|---|---|
| `minLat` | Vi do nho nhat |
| `maxLat` | Vi do lon nhat |
| `minLng` | Kinh do nho nhat |
| `maxLng` | Kinh do lon nhat |

**POST/PUT body:**

```json
{
  "name": "Cau lac bo The thao Ha Noi",
  "location": "Ha Noi, Viet Nam",
  "sport": "BOI LOI",
  "schedule": "Thu 2, Thu 5 - 8:00-10:00",
  "suitableFor": "Nguoi khuyet tat van dong",
  "contactInfo": "0987654321",
  "imageUrl": "/uploads/...",
  "description": "Mo ta to chuc..."
}
```

---

### 7.9 Doi tac / Partners

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/partners` | Public | Danh sach doi tac |
| `GET` | `/api/v1/partners/:id` | Public | Chi tiet |
| `POST` | `/api/v1/partners` | ADMIN/SUPER_ADMIN | Tao moi |
| `PUT` | `/api/v1/partners/:id` | ADMIN/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/partners/:id` | ADMIN/SUPER_ADMIN | Xoa |

---

## 8. Media / Phuong tien

### 8.1 Upload tep tin / File Upload

```
POST /api/v1/media/upload
Auth: JWT (moi role)
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Bat buoc | Mo ta |
|---|---|---|
| `file` | Co | Tep tin can upload |
| `isPublic` | Khong | `true` cho tep cong khai, `false` cho tep bao mat (mac dinh `false`) |

**Dinh dang duoc ho tro:**

| Loai | Dinh dang | Gioi han kich thuoc |
|---|---|---|
| Hinh anh | .png, .jpg, .jpeg, .webp | 10 MB |
| Video | .mp4, .webm, .mov | 50 MB |
| PDF | .pdf | 100 MB |
| Van phong | .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt | 20 MB |
| Phu de | .vtt, .srt | 10 MB |

> SVG duoc chap nhan nhung duoc khu doc XSS tu dong truoc khi luu tru.

**Response:**

```json
{
  "success": true,
  "message": "Tai len tep tin thanh cong.",
  "data": {
    "filename": "uuid.png",
    "originalName": "banner.png",
    "mimetype": "image/png",
    "size": 245760,
    "path": "public/images/uuid.png",
    "url": "/uploads/public/images/uuid.png"
  }
}
```

- `url` la URL cong khai neu `isPublic=true`.
- `url` la Signed URL co thoi han neu `isPublic=false`.

---

### 8.2 Xem tep tin bao mat / View Private File

```
GET /api/v1/media/view?file=<duong-dan>&expires=<timestamp>&signature=<chu-ky>
Auth: Signed URL (khong can JWT)
```

Day la endpoint de phuc vu tep tin bao mat thong qua Signed URL. Client khong goi truc tiep endpoint nay - thay vao do, su dung `url` tu ket qua upload lam Signed URL.

---

### 8.3 Xu ly tro nang Media / Process Accessibility

```
POST /api/v1/media/lessons/:id/process-accessibility
Auth: JWT (ADMIN, ORGANIZATION_ADMIN)
```

Kich hoat xu ly phu de (STT) va mo ta am thanh (TTS) cho video bai giang.

---

## 9. Tim kiem / Search

```
GET /api/v1/search?q=tu+khoa
Auth: Public
```

**Query parameters:**

| Param | Bat buoc | Mo ta |
|---|---|---|
| `q` | Co | Tu khoa tim kiem |

**Response:**

```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "Ket qua thi dau...",
      "slug": "ket-qua-thi-dau",
      "excerpt": "..."
    }
  ],
  "courses": [
    {
      "id": "uuid",
      "title": "Khoa hoc...",
      "slug": "khoa-hoc",
      "description": "..."
    }
  ]
}
```

> Neu `q` rong, tra ve `{ "posts": [], "courses": [] }`.

---

## 10. Thong ke / Statistics

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/statistics/summary` | Public | Thong ke tong quan |
| `GET` | `/api/v1/statistics/dashboard-charts` | Public | Du lieu bieu do dashboard |

**Response (summary):**

```json
{
  "totalAthletes": 500,
  "totalCoaches": 100,
  "totalTournaments": 25,
  "totalOrganizations": 50,
  "totalCourses": 30,
  "totalPosts": 200
}
```

---

## 11. Bao cao & Lich / Reports & Calendar

### 11.1 Bao cao / Reports

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/reports/tournaments/:id/excel` | ADMIN | Xuat bao cao Excel |
| `GET` | `/api/v1/reports/tournaments/:id/pdf` | ADMIN | Xuat bao cao PDF |

> Tra ve file binary (Excel/PDF) truc tiep qua response stream.

---

### 11.2 Lich / Calendar

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/calendar/tournaments/:id/ics` | Public | Sinh file ICS cho tran dau |
| `GET` | `/api/v1/calendar/matches/:id/google-link` | Public | Link them vao Google Calendar |

**GET /calendar/matches/:id/google-link Query parameters:**

| Param | Bat buoc | Mo ta |
|---|---|---|
| `name` | Co | Ten tran dau |
| `startTime` | Co | Thoi gian bat dau (ISO 8601) |
| `location` | Khong | Dia diem (mac dinh "TBA") |

---

## 12. Mau Email / Email Templates

Tat ca endpoint deu yeu cau `SUPER_ADMIN` hoac `ADMIN`.

| Method | Endpoint | Mo ta |
|---|---|---|
| `GET` | `/api/v1/email-templates` | Danh sach mau email |
| `GET` | `/api/v1/email-templates/:id` | Chi tiet mau |
| `PUT` | `/api/v1/email-templates/:id` | Cap nhat mau |
| `POST` | `/api/v1/email-templates/preview` | Xem truoc mau voi bien |

---

## 13. Capcut Templates

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/capcut-templates` | Public | Danh sach templates |
| `GET` | `/api/v1/capcut-templates/:id` | Public | Chi tiet |
| `POST` | `/api/v1/capcut-templates` | ADMIN/EDITOR/SUPER_ADMIN | Tao moi |
| `PUT` | `/api/v1/capcut-templates/:id` | ADMIN/EDITOR/SUPER_ADMIN | Cap nhat |
| `DELETE` | `/api/v1/capcut-templates/:id` | ADMIN/EDITOR/SUPER_ADMIN | Xoa |

---

## 14. Ho so tro ly / Assistant Profiles

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| `GET` | `/api/v1/assistant-profiles` | Public | Danh sach |
| `GET` | `/api/v1/assistant-profiles/:id` | Public | Chi tiet |
| `POST` | `/api/v1/assistant-profiles` | JWT | Tao moi |
| `PATCH` | `/api/v1/assistant-profiles/:id` | JWT | Cap nhat |
| `DELETE` | `/api/v1/assistant-profiles/:id` | JWT | Xoa |

---

## 15. WebSocket - Diem so truc tiep / Live Scores

### Ket noi / Connection

```
Socket.IO namespace: /live-scores
URL: ws(s)://<domain>/live-scores
Transports: websocket, polling
CORS: Dua tren FRONTEND_URL trong bien moi truong
```

**Vi du Client (JavaScript):**

```javascript
import { io } from "socket.io-client";

const socket = io("https://api.parasports.vn/live-scores", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Da ket noi live-scores:", socket.id);
});

socket.on("SCORE_UPDATED", (data) => {
  console.log("Cap nhat diem so:", data);
  // Cap nhat UI
});

socket.on("disconnect", () => {
  console.log("Da ngat ket noi live-scores");
});
```

### Su kien / Events

#### Client -> Server
Khong co - server tu phat su kien.

#### Server -> Client: `SCORE_UPDATED`

Duoc phat di khi co cap nhat diem so cua tran dau.

```json
{
  "matchId": "match-uuid",
  "homeScore": 2,
  "awayScore": 1,
  "status": "LIVE",
  "currentPeriod": "HIEP_2",
  "periodTime": "72:30",
  "lastEvent": "GOAL",
  "lastEventTeam": "home",
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```

| Field | Mo ta |
|---|---|
| `matchId` | ID tran dau |
| `homeScore` | Diem so doi nha |
| `awayScore` | Diem so doi khach |
| `status` | Trang thai tran dau (`SCHEDULED`, `LIVE`, `FINISHED`, etc.) |
| `currentPeriod` | Hiep/hiep phu hien tai |
| `periodTime` | Thoi gian trong hiep |
| `lastEvent` | Su kien cuoi cung (`GOAL`, `FOUL`, `SUBSTITUTION`, etc.) |
| `lastEventTeam` | Doi thuc hien su kien (`home` hoac `away`) |
| `timestamp` | Thoi gian cap nhat |

---

## 16. Health Check / Kiem tra suc khoe

```
GET /api/v1/health
Auth: Public
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```

---

## Bang tong hop API / Quick Reference

| Module | Method | Endpoint | Auth |
|---|---|---|---|
| Auth | POST | `/auth/login` | Public |
| Auth | POST | `/auth/login/2fa` | Public |
| Auth | POST | `/auth/register` | Public |
| Auth | POST | `/auth/forgot-password` | Public |
| Auth | POST | `/auth/reset-password` | Public |
| Auth | POST | `/auth/oauth-login` | Public |
| Users | GET | `/users/me` | JWT |
| Users | PUT | `/users/me` | JWT |
| Users | PUT | `/users/me/password` | JWT |
| Users | POST | `/users/me/2fa/generate` | JWT |
| Users | POST | `/users/me/2fa/verify` | JWT |
| Users | POST | `/users/me/2fa/disable` | JWT |
| Users | POST | `/users/me/upgrade-athlete` | JWT |
| Users | POST | `/users/me/upgrade-coach` | JWT |
| Users | GET | `/users` | ADMIN/SUPER_ADMIN |
| Users | GET | `/users/roles` | SUPER_ADMIN |
| Users | GET | `/users/athletes/all` | Public |
| Users | GET | `/users/:id/athlete-profile` | JWT |
| Users | PUT | `/users/:id/athlete-profile` | JWT |
| Users | GET | `/users/:id/coach-profile` | JWT |
| Users | PUT | `/users/:id/coach-profile` | JWT |
| Users | GET | `/users/:id/assistant-profile` | JWT |
| Users | PUT | `/users/:id/assistant-profile` | JWT |
| Users | PUT | `/users/:id/role` | SUPER_ADMIN |
| Users | GET | `/users/admin/stats` | ADMIN/SUPER_ADMIN |
| Users | GET | `/users/admin/audits` | ADMIN/SUPER_ADMIN |
| Users | GET | `/users/admin/audits/all` | ADMIN/SUPER_ADMIN |
| Users | GET | `/users/:id/profile` | Public |
| Users | GET | `/users/:id/achievements` | Public |
| Users | GET | `/users/:id/tournaments` | Public |
| Users | GET | `/users/:id/clubs` | Public |
| Users | GET | `/users/:id/companions` | Public |
| Users | GET | `/users/:id/sponsors` | Public |
| Roles | GET | `/roles` | SUPER_ADMIN |
| Roles | GET | `/roles/permissions` | SUPER_ADMIN |
| Roles | POST | `/roles` | SUPER_ADMIN |
| Roles | GET/PATCH/DELETE | `/roles/:id` | SUPER_ADMIN |
| Settings | GET | `/settings` | Public |
| Settings | POST | `/settings/admin/logo` | ADMIN/SUPER_ADMIN |
| Settings | POST | `/settings/admin/favicon` | ADMIN/SUPER_ADMIN |
| Settings | POST | `/settings/admin/generic` | ADMIN/SUPER_ADMIN |
| Settings | POST | `/settings/admin/generic-upload` | ADMIN/SUPER_ADMIN |
| Sports | GET | `/sports` | Public |
| Sports | GET | `/sports/:id` | Public |
| Sports | GET | `/sports/slug/:slug` | Public |
| Sports | POST/PUT/DELETE | `/sports`, `/sports/:id` | ADMIN/SUPER_ADMIN |
| Tournaments | GET | `/tournaments` | Public |
| Tournaments | GET | `/tournaments/:id` | Public |
| Tournaments | POST/PATCH/DELETE | `/tournaments`, `/tournaments/:id` | JWT |
| Tournaments | POST | `/tournaments/:id/generate-bracket` | JWT |
| Tournaments | POST | `/tournaments/:id/participants` | JWT |
| Tournaments | PATCH | `/tournaments/:id/participants/:rankingId/status` | JWT |
| Tournaments | PATCH | `/tournaments/:id/participants/:rankingId/checkin` | JWT |
| Tournaments | DELETE | `/tournaments/:id/participants/:rankingId` | JWT |
| Sub-Tournaments | GET | `/sub-tournaments` | Public |
| Sub-Tournaments | GET | `/sub-tournaments/:id` | Public |
| Sub-Tournaments | POST/PATCH/DELETE | `/sub-tournaments`, `/sub-tournaments/:id` | JWT |
| Sub-Tournaments | POST | `/sub-tournaments/:id/generate-bracket` | JWT |
| Events | GET/POST/PATCH/DELETE | `/events`, `/events/:id` | Public (GET) / JWT |
| Sport Events | GET/POST/PATCH/DELETE | `/sport-events`, `/sport-events/:id` | Public (GET) / JWT |
| Sport Classifications | GET | `/sport-classifications` | Public |
| Sport Classifications | POST/PATCH/DELETE | `/sport-classifications`, `/sport-classifications/:id` | ADMIN/SUPER_ADMIN |
| Matches | GET | `/matches` | Public |
| Matches | GET | `/matches/:id` | Public |
| Matches | POST/PUT/DELETE | `/matches`, `/matches/:id` | JWT |
| Teams | GET | `/teams`, `/teams/:id` | Public |
| Teams | POST/PUT/DELETE | `/teams`, `/teams/:id` | JWT |
| Rankings | GET | `/rankings/sport/:sportId` | Public |
| Rankings | GET | `/rankings/tournament/:tournamentId` | Public |
| Rankings | POST/DELETE | `/rankings`, `/rankings/:id` | ADMIN/SUPER_ADMIN |
| Athlete Achievements | GET | `/athlete-achievements`, `/:id` | Public |
| Athlete Achievements | POST/me | `/athlete-achievements/me` | JWT |
| Athlete Achievements | POST/PATCH/DELETE | `/athlete-achievements`, `/:id` | JWT |
| Disability Types | GET | `/disability-types`, `/:id` | Public |
| Disability Types | POST/PUT/DELETE | `/disability-types`, `/:id` | ADMIN/SUPER_ADMIN |
| Courses | GET | `/courses`, `/:slug` | Public |
| Courses | POST/PUT/DELETE | `/courses`, `/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Chapters | GET | `/chapters` | Public |
| Chapters | POST/PUT/DELETE | `/chapters`, `/:id` | JWT |
| Lessons | GET | `/lessons`, `/:id`, `/slug/:slug` | Public |
| Lessons | POST/PUT/DELETE | `/lessons`, `/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Course Progress | GET/POST | `/course-progress` | JWT |
| Course Progress | GET | `/course-progress/:courseId` | JWT |
| Quizzes | GET | `/quizzes`, `/:id`, `/lesson/:lessonId` | Public |
| Quizzes | POST/PUT/DELETE | `/quizzes`, `/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Quizzes | POST | `/quizzes/:id/questions` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Quizzes | DELETE | `/quizzes/questions/:questionId` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Assignments | GET | `/assignments/lesson/:lessonId` | Public |
| Assignments | POST/PUT/DELETE | `/assignments`, `/:id` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Assignments | POST | `/assignments/:id/submit` | JWT |
| Assignments | GET | `/assignments/:id/submissions` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Assignments | PUT | `/assignments/submissions/:submissionId/grade` | ADMIN/INSTRUCTOR/SUPER_ADMIN |
| Documents | GET | `/documents`, `/:id`, `/slug/:slug` | Public |
| Documents | POST/PUT/DELETE | `/documents`, `/:id` | JWT |
| Document Topics | GET | `/document-topics`, `/:id` | Public |
| Document Topics | POST/PUT/DELETE | `/document-topics`, `/:id` | JWT |
| Posts | GET | `/posts`, `/paginated`, `/:slug` | Public |
| Posts | GET | `/posts/admin/all` | ADMIN/EDITOR/SUPER_ADMIN |
| Posts | POST/PUT/DELETE | `/posts`, `/:id` | ADMIN/EDITOR/SUPER_ADMIN |
| Comments | GET | `/comments` | Public |
| Comments | GET | `/comments/admin/all` | ADMIN/SUPER_ADMIN |
| Comments | POST | `/comments` | JWT |
| Comments | PUT | `/comments/:id/react` | JWT |
| Comments | PATCH | `/comments/:id` | JWT |
| Comments | PUT | `/comments/:id` (moderate) | ADMIN/SUPER_ADMIN |
| Comments | DELETE | `/comments/:id` | JWT |
| Bookmarks | GET | `/bookmarks`, `/check/:postId` | JWT |
| Bookmarks | POST | `/bookmarks/toggle` | JWT |
| Tags | GET | `/tags`, `/:id` | Public |
| Tags | POST | `/tags` | JWT |
| Categories | GET | `/categories`, `/:id` | Public |
| Categories | POST/PUT/DELETE | `/categories`, `/:id` | JWT |
| Companion Requests | POST | `/companion-requests` | Public |
| Companion Requests | GET | `/companion-requests` | ADMIN/SUPER_ADMIN |
| Companion Requests | PUT | `/companion-requests/:id/read` | ADMIN/SUPER_ADMIN |
| Companion Requests | DELETE | `/companion-requests/:id` | ADMIN/SUPER_ADMIN |
| Social Links | GET | `/social-links`, `/:id` | Public |
| Social Links | POST/PUT/DELETE | `/social-links`, `/:id` | JWT |
| Organizations | GET | `/Organizations` | Public |
| Organizations | GET | `/Organizations/map/bounded` | Public |
| Organizations | POST | `/Organizations` | Public |
| Organizations | POST | `/Organizations/admin` | ADMIN/SUPER_ADMIN |
| Organizations | GET | `/Organizations/pending` | ADMIN/SUPER_ADMIN |
| Organizations | GET | `/Organizations/admin/all` | ADMIN/SUPER_ADMIN |
| Organizations | PUT | `/Organizations/:id/approve` | ADMIN/SUPER_ADMIN |
| Organizations | PUT/DELETE | `/Organizations/:id` | ADMIN/SUPER_ADMIN |
| Partners | GET | `/partners`, `/:id` | Public |
| Partners | POST/PUT/DELETE | `/partners`, `/:id` | ADMIN/SUPER_ADMIN |
| Search | GET | `/search?q=` | Public |
| Statistics | GET | `/statistics/summary` | Public |
| Statistics | GET | `/statistics/dashboard-charts` | Public |
| Reports | GET | `/reports/tournaments/:id/excel` | ADMIN |
| Reports | GET | `/reports/tournaments/:id/pdf` | ADMIN |
| Calendar | GET | `/calendar/tournaments/:id/ics` | Public |
| Calendar | GET | `/calendar/matches/:id/google-link` | Public |
| Media | POST | `/media/upload` | JWT |
| Media | GET | `/media/view` | Signed URL |
| Media | POST | `/media/lessons/:id/process-accessibility` | ADMIN/ORGANIZATION_ADMIN |
| Email Templates | GET | `/email-templates`, `/:id` | ADMIN/SUPER_ADMIN |
| Email Templates | PUT | `/email-templates/:id` | ADMIN/SUPER_ADMIN |
| Email Templates | POST | `/email-templates/preview` | ADMIN/SUPER_ADMIN |
| Capcut Templates | GET | `/capcut-templates`, `/:id` | Public |
| Capcut Templates | POST/PUT/DELETE | `/capcut-templates`, `/:id` | ADMIN/EDITOR/SUPER_ADMIN |
| Assistant Profiles | GET | `/assistant-profiles`, `/:id` | Public |
| Assistant Profiles | POST/PATCH/DELETE | `/assistant-profiles`, `/:id` | JWT |
| Health | GET | `/health` | Public |
