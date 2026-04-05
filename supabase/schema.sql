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
  username     VARCHAR,
  name         VARCHAR,
  title        VARCHAR,
  avatar_url   VARCHAR,
  cv_url       VARCHAR,
  role         VARCHAR NOT NULL DEFAULT 'candidate'
               CHECK (role IN ('candidate', 'recruiter', 'admin')),
  frame_color  VARCHAR CHECK (frame_color IN ('green')),
  frame_count  INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username VARCHAR;

UPDATE public.users
SET username = LOWER(BTRIM(username))
WHERE username IS NOT NULL
  AND username <> LOWER(BTRIM(username));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON public.users ((LOWER(username)))
  WHERE username IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_admin_identity_check'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_admin_identity_check;
  END IF;

  ALTER TABLE public.users
    ADD CONSTRAINT users_admin_identity_check
    CHECK (
      (
        role = 'admin'
        AND LOWER(COALESCE(username, '')) = 'admin'
      )
      OR (
        role <> 'admin'
        AND LOWER(COALESCE(username, '')) <> 'admin'
      )
    ) NOT VALID;
END $$;

CREATE OR REPLACE FUNCTION public.protect_user_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'admin' OR LOWER(COALESCE(NEW.username, '')) = 'admin' THEN
      RAISE EXCEPTION 'Admin account provisioning requires elevated privileges';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Role and username can only be changed with elevated privileges';
  END IF;

  IF (
    NEW.role IS DISTINCT FROM OLD.role
    AND (
      NEW.role = 'admin'
      OR OLD.role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Role and username can only be changed with elevated privileges';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_admin_fields_on_insert ON public.users;
CREATE TRIGGER protect_user_admin_fields_on_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_admin_fields();

DROP TRIGGER IF EXISTS protect_user_admin_fields_on_update ON public.users;
CREATE TRIGGER protect_user_admin_fields_on_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_admin_fields();

-- Provision the sole admin account with elevated privileges, for example:
-- UPDATE public.users
-- SET role = 'admin', username = 'admin'
-- WHERE email = 'your-admin-email@example.com';

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
  salary_currency VARCHAR NOT NULL DEFAULT 'VND'
                  CONSTRAINT posts_salary_currency_check CHECK (salary_currency IN ('VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD', 'AUD', 'CAD', 'CNY', 'THB')),
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
  reply_to_comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  reply_to_author_name VARCHAR,
  type         VARCHAR NOT NULL DEFAULT 'normal'
               CHECK (type IN ('normal', 'applied')),
  status       VARCHAR CHECK (status IN ('approved', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS salary_currency VARCHAR NOT NULL DEFAULT 'VND';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_salary_currency_check'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_salary_currency_check;
  END IF;

  ALTER TABLE public.posts
    ADD CONSTRAINT posts_salary_currency_check
    CHECK (salary_currency IN ('VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD', 'AUD', 'CAD', 'CNY', 'THB'));
END $$;

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

CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type           VARCHAR NOT NULL
                 CHECK (
                   type IN (
                     'post_comment',
                     'comment_reply',
                     'application_submitted',
                     'application_approved',
                     'application_rejected'
                   )
                 ),
  title          VARCHAR NOT NULL,
  body           TEXT,
  post_id        UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id     UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS public.pinned_posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

CREATE OR REPLACE FUNCTION public.enforce_pinned_posts_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.pinned_posts
    WHERE user_id = NEW.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Pinned posts limit exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_pinned_posts_limit_on_insert ON public.pinned_posts;
CREATE TRIGGER enforce_pinned_posts_limit_on_insert
  BEFORE INSERT ON public.pinned_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pinned_posts_limit();

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
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_pinned_posts_user_created
  ON public.pinned_posts(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_posts ENABLE ROW LEVEL SECURITY;

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

-- notifications: recipient sees and marks own notifications
CREATE POLICY "own notifications read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own notifications update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- reports: auth insert
CREATE POLICY "auth insert report"  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "own read reports"    ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- reviews: auth insert
CREATE POLICY "auth insert review"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "public read reviews" ON public.reviews FOR SELECT USING (true);

CREATE POLICY "own read pinned posts"
  ON public.pinned_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own insert pinned posts"
  ON public.pinned_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own delete pinned posts"
  ON public.pinned_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Supabase dashboard or via API)
-- ─────────────────────────────────────────────────────────────────

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
-- CREATE POLICY "Public read post images" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
-- CREATE POLICY "Auth upload post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images');
