# NeedWork

Mạng xã hội tuyển dụng minh bạch — ứng viên và nhà tuyển dụng đánh giá nhau trực tiếp.

---

## Setup (5 bước)

### 1. Clone & install
```bash
cd needwork
npm install
```

### 2. Tạo Supabase project
- Vào [supabase.com](https://supabase.com) → New project
- Vào **SQL Editor** → chạy toàn bộ file `supabase/schema.sql`
- Tạo 2 Storage buckets: `avatars` (public) và `cvs` (public)
- Bật Auth Providers: Email + Google

### 3. Tạo `.env.local`
```bash
cp .env.local.example .env.local
# Điền các giá trị từ Supabase dashboard → Project Settings → API
```

### 4. Chạy local
```bash
npm run dev
# Mở http://localhost:3000
```

### 5. Tạo tài khoản Admin
Sau khi đăng ký tài khoản, chạy trong Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Scripts

| Command | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Lint code |
| `npm run test` | Chạy unit tests |

---

## Deploy lên Vercel

```bash
npm i -g vercel
vercel --prod
```

Thêm các env vars trong Vercel dashboard (giống `.env.local`).

Cron job `/api/cron/warning-check` sẽ chạy tự động lúc 1:00 UTC hàng ngày (cấu hình trong `vercel.json`).

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (auth)/login         # Đăng nhập
│   ├── (auth)/register      # Đăng ký
│   ├── (main)/              # Layout chính
│   │   ├── page.tsx         # Feed
│   │   ├── post/[id]        # Chi tiết bài đăng
│   │   ├── post/create      # Tạo bài
│   │   ├── profile/[id]     # Xem hồ sơ
│   │   ├── profile/edit     # Sửa hồ sơ
│   │   └── admin/           # Trang admin
│   ├── api/                 # API Routes
│   └── auth/callback        # OAuth callback
├── components/              # UI Components
├── lib/                     # Supabase, utils, moderation
├── types/                   # TypeScript types
└── constants/               # Enums, config values
```

---

## Tính năng đã build

- [x] Đăng nhập / Đăng ký (Email + Google OAuth)
- [x] Feed với lazy loading + 2 tab Tuyển dụng / Tìm việc
- [x] Lọc bài đăng theo vị trí (GPS + bán kính)
- [x] Đăng bài tuyển dụng (với kiểm duyệt AI + Admin)
- [x] Đăng bài tìm việc
- [x] Upload avatar + CV
- [x] Nộp CV → tự động comment "Em đã apply." + badge
- [x] Nhà tuyển dụng phản hồi Duyệt / Từ chối
- [x] Hệ thống viền trust ring (blue → mất khi bị report → khôi phục sau 5 đánh giá tốt)
- [x] Report bài đăng
- [x] Đánh giá nhà tuyển dụng
- [x] Admin: dashboard, duyệt bài, xử lý report, quản lý user
- [x] Cron job cảnh báo nhà tuyển dụng không phản hồi sau 7 ngày

---

## Known Limitations

- Haversine location filter chạy in-memory (JS) thay vì PostGIS — đủ dùng cho 1000 users, cần migrate khi scale
- Email notification trong cron chỉ có console.log — cần thêm Resend/Supabase Edge Function
- Figma analysis chưa đầy đủ (cần restart Claude Code để dùng Figma MCP)
- Không có real-time updates (cần thêm Supabase Realtime)
- Chưa có pagination trong Admin Users page
