-- setup_avatars_bucket.sql
-- Creates the avatars bucket (public) and sets up Row Level Security policies
-- for direct-to-Supabase avatar uploads.
-- Run this in your Supabase SQL editor after creating the avatars bucket in the dashboard.
--
-- The avatars bucket is public so avatars load immediately on any page without
-- signed URLs. RLS still controls who can INSERT and DELETE — only the user
-- whose ID is in the path can upload/delete their own avatar.
--
-- Storage path convention:
--   {userId}/{uuid}.{ext}
--   e.g. 550e8400-e29b-41d4-a716-446655440000/abc123.png
--   (storage.foldername(name))[1] = userId (UUID)

BEGIN;

-- ============================
-- Avatars bucket (public)
-- ============================

-- Create the avatars bucket if it doesn't already exist.
-- Public = true so avatars are served directly without signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 10485760)  -- 10 MB limit
ON CONFLICT (id) DO NOTHING;

-- ============================
-- Avatars bucket policies
-- ============================

-- SELECT: anyone can read avatars (public bucket, allows hotlinking)
CREATE POLICY "anyone can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

-- INSERT: authenticated users can upload their own avatar.
-- Path must follow {theirUserId}/... — enforced via RLS.
CREATE POLICY "users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: authenticated users can overwrite their own avatar.
CREATE POLICY "users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: authenticated users can delete their own avatar.
CREATE POLICY "users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;

-- Usage: Deploy this SQL to your Supabase SQL editor or apply via psql.
--   psql "$SUPABASE_DB_URL" -f backend/sql/setup_avatars_bucket.sql
