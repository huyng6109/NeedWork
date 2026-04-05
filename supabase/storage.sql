-- NeedWork storage buckets + policies
-- Run this file in Supabase SQL Editor after schema.sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'avatars';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'cvs',
  'cvs',
  true,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'cvs'
);

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'cvs';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'post-images'
);

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'post-images';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read avatars'
  ) THEN
    CREATE POLICY "Public read avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth upload avatars'
  ) THEN
    CREATE POLICY "Auth upload avatars"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth update avatars'
  ) THEN
    CREATE POLICY "Auth update avatars"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars')
      WITH CHECK (bucket_id = 'avatars');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read cvs'
  ) THEN
    CREATE POLICY "Public read cvs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'cvs');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth upload cvs'
  ) THEN
    CREATE POLICY "Auth upload cvs"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'cvs');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth update cvs'
  ) THEN
    CREATE POLICY "Auth update cvs"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'cvs')
      WITH CHECK (bucket_id = 'cvs');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read post-images'
  ) THEN
    CREATE POLICY "Public read post-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'post-images');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth upload post-images'
  ) THEN
    CREATE POLICY "Auth upload post-images"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'post-images');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Auth update post-images'
  ) THEN
    CREATE POLICY "Auth update post-images"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'post-images')
      WITH CHECK (bucket_id = 'post-images');
  END IF;
END
$$;
