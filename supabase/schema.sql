-- NeedWork Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR UNIQUE NOT NULL,
  name         VARCHAR,
  title        VARCHAR,
  avatar_url   VARCHAR,
  cv_url       VARCHAR,
  role         VARCHAR NOT NULL DEFAULT 'candidate'
               CHECK (role IN ('candidate', 'recruiter', 'admin')),
  frame_color  VARCHAR CHECK (frame_color IN ('blue')),
  frame_count  INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          VARCHAR NOT NULL CHECK (type IN ('job_offer', 'job_seeking')),
  title         VARCHAR NOT NULL,
  content       TEXT NOT NULL,
  email         VARCHAR,
  location_name VARCHAR,
  lat           DECIMAL(10, 8),
  lng           DECIMAL(11, 8),
  salary_min    INT,
  salary_max    INT,
  job_type      VARCHAR CHECK (job_type IN ('full_time', 'part_time')),
  status        VARCHAR NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  type         VARCHAR NOT NULL DEFAULT 'normal'
               CHECK (type IN ('normal', 'applied')),
  status       VARCHAR CHECK (status IN ('approved', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment_id   UUID REFERENCES public.comments(id),
  status       VARCHAR NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reason         TEXT NOT NULL,
  status         VARCHAR NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'dismissed')),
  reviewed_by    UUID REFERENCES public.users(id),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, target_id, post_id)
);

-- ─────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_type_status   ON public.posts(type, status);
CREATE INDEX IF NOT EXISTS idx_posts_author        ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_location      ON public.posts(lat, lng);
CREATE INDEX IF NOT EXISTS idx_posts_created       ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post       ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_applied    ON public.comments(post_id, created_at)
  WHERE status IS NULL AND type = 'applied';
CREATE INDEX IF NOT EXISTS idx_applications_post   ON public.applications(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON public.reports(status);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;

-- users: anyone can read, only self can update
CREATE POLICY "public read users"   ON public.users FOR SELECT USING (true);
CREATE POLICY "self update users"   ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "self insert users"   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- posts: approved posts are public; author can insert; no delete
CREATE POLICY "public read approved posts"
  ON public.posts FOR SELECT
  USING (status = 'approved' OR auth.uid() = author_id);

CREATE POLICY "authenticated insert post"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "author update post"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- comments: public read; authenticated insert own comments
CREATE POLICY "public read comments"  ON public.comments FOR SELECT USING (true);
CREATE POLICY "auth insert comment"   ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author update comment" ON public.comments FOR UPDATE USING (auth.uid() = author_id);

-- applications: candidate sees own
CREATE POLICY "own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "insert application"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

-- reports: auth insert
CREATE POLICY "auth insert report"  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "own read reports"    ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- reviews: auth insert
CREATE POLICY "auth insert review"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "public read reviews" ON public.reviews FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Supabase dashboard or via API)
-- ─────────────────────────────────────────────────────────────────

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', true);
