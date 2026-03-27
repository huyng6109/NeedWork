# 03 — Architecture

---

## Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG, API Routes, file routing, Vercel-native |
| Language | TypeScript | Strong typing, safer refactors |
| Styling | Tailwind CSS | Utility-first, matches design token workflow |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth, storage, RLS |
| ORM | Supabase JS client (direct SQL where needed) | Supabase SDK is sufficient; avoids Prisma overhead for free-tier constraints |
| Auth | Supabase Auth | Google OAuth + Email/Password, session via SSR cookies |
| File Storage | Supabase Storage | CV (PDF), avatar (image) — same free project |
| Cache | Upstash Redis | Feed cursor cache, session metadata |
| Maps | Leaflet + OpenStreetMap | 100% free, no API key needed |
| AI Moderation | OpenAI Moderation API (free endpoint) | First-pass content filter before admin review |
| Cron | Vercel Cron Jobs (free tier) | 7-day warning check, runs daily |
| Deploy | Vercel | Free tier, CI/CD on push, global CDN |

---

## Folder Structure

```
needwork/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx          # Main layout with nav
│   │   │   ├── page.tsx            # Feed (homepage)
│   │   │   ├── profile/
│   │   │   │   ├── [id]/page.tsx   # View any profile
│   │   │   │   └── edit/page.tsx   # Edit own profile
│   │   │   ├── post/
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [id]/page.tsx   # Post detail + comments
│   │   │   └── admin/
│   │   │       ├── layout.tsx      # Admin guard
│   │   │       ├── page.tsx        # Dashboard
│   │   │       ├── posts/page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       └── users/page.tsx
│   │   ├── api/
│   │   │   ├── posts/
│   │   │   │   ├── route.ts        # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts    # GET detail
│   │   │   │       ├── apply/route.ts
│   │   │   │       └── comments/route.ts
│   │   │   ├── comments/
│   │   │   │   └── [id]/route.ts   # PATCH respond
│   │   │   ├── reports/route.ts
│   │   │   ├── reviews/route.ts
│   │   │   ├── profile/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── stats/route.ts
│   │   │   │   ├── posts/[id]/route.ts
│   │   │   │   └── reports/[id]/route.ts
│   │   │   └── cron/
│   │   │       └── warning-check/route.ts
│   │   └── auth/
│   │       └── callback/route.ts
│   ├── components/
│   │   ├── ui/                     # Primitives: Button, Input, Badge, Avatar, Modal
│   │   ├── feed/                   # FeedList, PostCard, TabBar
│   │   ├── post/                   # PostForm, PostDetail, CommentList, CommentItem
│   │   ├── profile/                # ProfileCard, ProfileEdit, TrustRing
│   │   ├── admin/                  # StatsCard, PostModerationRow, ReportRow
│   │   └── layout/                 # Navbar, Sidebar, Footer
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   └── server.ts           # Server client (cookies)
│   │   ├── redis.ts                # Upstash client
│   │   ├── moderation.ts           # OpenAI moderation wrapper
│   │   ├── location.ts             # Haversine helper
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFeed.ts
│   │   └── useLocation.ts
│   ├── types/
│   │   └── index.ts                # All shared TypeScript types
│   └── constants/
│       └── index.ts                # Roles, enums, config values
├── docs/                           # This directory
├── public/
├── middleware.ts                   # Route protection
├── .env.local
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Auth Flow

```
User → /login
  Google OAuth → Supabase → /auth/callback → exchange code → session cookie → /
  Email/Password → Supabase → session cookie → /

Middleware checks session on:
  /profile/edit, /post/create, /admin/*
  → redirect to /login if unauthenticated
  → redirect to / if non-admin hits /admin/*
```

---

## Data Flow

```
Feed request:
  Client → GET /api/posts?type=job_offer&lat=x&lng=y&radius=10&cursor=xxx
  → Server: query Supabase with Haversine, cursor pagination
  → Return 20 posts + next_cursor

Apply flow:
  Client → POST /api/posts/:id/apply
  → Server: check duplicate → create Application + auto Comment (type='applied')
  → Return { comment_id, application_id }

Report flow:
  Client → POST /api/reports { post_id, reason }
  → Server: create Report (status=pending)
  → Admin confirms → recruiter frame_color=null (trust ring removed)

7-day cron:
  Vercel Cron → GET /api/cron/warning-check (secret header)
  → Query all comments type='applied', status=null, created_at < now-7days
  → Increment warning_count on recruiter
  → Send email via Supabase transactional email
```

---

## Permissions Matrix

| Action | Guest | Candidate | Recruiter | Admin |
|---|---|---|---|---|
| View feed | ✅ | ✅ | ✅ | ✅ |
| View post detail | ✅ | ✅ | ✅ | ✅ |
| Register / login | ✅ | — | — | — |
| Create job_offer post | ❌ | ❌ | ✅ | ✅ |
| Create job_seeking post | ❌ | ✅ | ❌ | ✅ |
| Apply to job post | ❌ | ✅ | ❌ | ❌ |
| Edit own profile | ❌ | ✅ | ✅ | ✅ |
| Upload CV | ❌ | ✅ | ❌ | ❌ |
| Respond to application comment | ❌ | ❌ | ✅ | ✅ |
| Report a job_offer post | ❌ | ✅ | ❌ | ❌ |
| Review a recruiter | ❌ | ✅* | ❌ | ❌ |
| Approve/reject post | ❌ | ❌ | ❌ | ✅ |
| Confirm/dismiss report | ❌ | ❌ | ❌ | ✅ |
| View admin dashboard | ❌ | ❌ | ❌ | ✅ |

*Only candidates who have applied to that recruiter's post

---

## State Management

- **Server state**: Supabase queries via API Routes (no client-side data fetching library in MVP; use React `fetch` + `use cache`)
- **Auth state**: Supabase session via SSR cookies + `useAuth` hook
- **UI state**: React `useState` / `useReducer` — no global state library needed for MVP
- **Feed cursor**: stored in component state, Upstash Redis caches page results for 60s

---

## File Upload Strategy

```
Avatar:
  Client → FileReader preview → POST multipart to /api/profile/avatar
  Server → supabase.storage.from('avatars').upload(userId, file)
  → Returns public URL → update users.avatar_url

CV:
  Client → PDF only, max 5MB → POST multipart to /api/profile/cv
  Server → supabase.storage.from('cvs').upload(userId, file)
  → Returns public URL → update users.cv_url
```

---

## Location Strategy

```
Client:
  navigator.geolocation.getCurrentPosition → { lat, lng }
  Radius selector (5/10/20/50/100 km)
  → appended to feed query params

Server (PostgreSQL query):
  SELECT *, (6371 * acos(
    cos(radians($lat)) * cos(radians(lat))
    * cos(radians(lng) - radians($lng))
    + sin(radians($lat)) * sin(radians(lat))
  )) AS distance
  FROM posts
  WHERE type = 'job_offer' AND status = 'approved'
  HAVING distance <= $radius
  ORDER BY created_at DESC
```

---

## Moderation Pipeline

```
Recruiter submits post → status = 'pending'
→ OpenAI Moderation API check (automatic)
  → If flagged: status = 'rejected', notify recruiter
  → If clean: stays 'pending' for admin review
→ Admin sees pending posts in admin panel
→ Admin approves → status = 'approved' → appears on feed
→ Admin rejects → status = 'rejected' → notify recruiter
```
