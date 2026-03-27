# 04 — Implementation Plan

---

## Route Map

| Route | Component | Auth Required | Role |
|---|---|---|---|
| `/` | Feed (homepage) | No | Any |
| `/login` | Login page | No (redirect if authed) | — |
| `/register` | Register page | No | — |
| `/auth/callback` | OAuth callback | No | — |
| `/post/create` | Create post form | Yes | Candidate or Recruiter |
| `/post/[id]` | Post detail + comments | No | Any |
| `/profile/[id]` | View profile | No | Any |
| `/profile/edit` | Edit own profile | Yes | Any |
| `/admin` | Admin dashboard | Yes | Admin |
| `/admin/posts` | Post moderation queue | Yes | Admin |
| `/admin/reports` | Report queue | Yes | Admin |
| `/admin/users` | User management | Yes | Admin |

---

## Component Map

### Primitives (`src/components/ui/`)
- `Button` — variants: primary, secondary, ghost, danger
- `Input` — text, email, password, number
- `Textarea`
- `Select`
- `Badge` — variants: applied, approved, rejected, pending, warning
- `Avatar` — with optional TrustRing overlay
- `TrustRing` — blue ring SVG overlay on avatar
- `Modal` — generic dialog
- `Spinner` / `Skeleton`
- `Toast` — success/error notifications
- `MapPicker` — Leaflet component for location picking

### Feed (`src/components/feed/`)
- `FeedTabs` — "Tuyển dụng" / "Tìm việc" tab switcher
- `FeedList` — infinite scroll container
- `PostCard` — compact post preview card
- `LocationFilter` — GPS toggle + radius selector

### Post (`src/components/post/`)
- `PostForm` — unified create form (adapts to recruiter/candidate)
- `PostDetail` — full post view
- `CommentList` — list of comments
- `CommentItem` — individual comment with status badge
- `ApplyButton` — apply CTA with confirmation
- `ReportButton` — report modal trigger

### Profile (`src/components/profile/`)
- `ProfileHeader` — avatar + trust ring + name + title
- `ProfileEdit` — form to edit name, title, avatar, CV
- `PostHistoryList` — user's posts

### Admin (`src/components/admin/`)
- `StatsCard` — metric card (count, trend)
- `PendingPostRow` — post row with approve/reject actions
- `ReportRow` — report row with confirm/dismiss actions
- `UserRow` — user row with warning count + block action

### Layout (`src/components/layout/`)
- `Navbar` — top nav with auth state
- `MobileBottomNav` — mobile tab bar

---

## Milestone Roadmap

### M1: Foundation (Days 1–3)
- [x] Create Next.js project
- [ ] Configure Tailwind, TypeScript, ESLint, Prettier
- [ ] Set up Supabase project + run DB schema
- [ ] Configure Supabase Auth (Email + Google)
- [ ] Implement middleware + auth callback
- [ ] Create design tokens (colors, spacing, typography)
- [ ] Create primitive UI components (Button, Input, Avatar, Badge)

### M2: Feed & Posts (Days 4–8)
- [ ] Homepage feed with tabs + lazy loading
- [ ] PostCard component
- [ ] Create post form (recruiter + candidate modes)
- [ ] Post detail page + comments
- [ ] Location picker (MapPicker component)
- [ ] Location filter on feed

### M3: Profile & CV (Days 9–11)
- [ ] Profile view page
- [ ] Profile edit page
- [ ] Avatar upload → Supabase Storage
- [ ] CV upload → Supabase Storage

### M4: Application Flow (Days 12–14)
- [ ] Apply button + confirmation
- [ ] Auto-create "Em đã apply." comment
- [ ] "Đã nộp CV" badge on comment
- [ ] Duplicate application prevention

### M5: Trust & Reports (Days 15–18)
- [ ] Trust ring display (blue ring on avatar)
- [ ] Report post flow
- [ ] Review recruiter flow (5 reviews restore ring)
- [ ] Recruiter respond to comment (Approved/Rejected)

### M6: Admin Panel (Days 19–22)
- [ ] Admin dashboard stats
- [ ] Post moderation queue (approve/reject)
- [ ] Report queue (confirm/dismiss)
- [ ] User management (view warnings, block)

### M7: Cron & Moderation (Days 23–25)
- [ ] OpenAI moderation integration on post submit
- [ ] Vercel Cron: 7-day warning check
- [ ] Email notification on warning

### M8: Polish & Deploy (Days 26–30)
- [ ] Responsive design review
- [ ] Loading/empty/error states throughout
- [ ] Tests (unit + integration)
- [ ] Vercel deployment
- [ ] README + setup docs
- [ ] Gap analysis

---

## Database Schema (SQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  title VARCHAR,
  avatar_url VARCHAR,
  cv_url VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
  frame_color VARCHAR CHECK (frame_color IN ('blue', NULL)),
  frame_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('job_offer', 'job_seeking')),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  email VARCHAR,
  location_name VARCHAR,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  salary_min INT,
  salary_max INT,
  job_type VARCHAR CHECK (job_type IN ('full_time', 'part_time')),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'applied')),
  status VARCHAR CHECK (status IN ('approved', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, candidate_id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews (candidate rates recruiter)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, target_id, post_id)
);

-- Indexes
CREATE INDEX idx_posts_type_status ON posts(type, status);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_location ON posts(lat, lng);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_unresponded ON comments(post_id, created_at) WHERE status IS NULL AND type = 'applied';
CREATE INDEX idx_applications_post ON applications(post_id);
CREATE INDEX idx_reports_status ON reports(status);
```
