-- NeedWork notifications migration
-- Run this file in Supabase SQL Editor if the main schema already exists.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'own notifications read'
  ) THEN
    CREATE POLICY "own notifications read"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'own notifications update'
  ) THEN
    CREATE POLICY "own notifications update"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
