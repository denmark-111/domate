-- setup_attachment_bucket.sql
-- Creates the attachments bucket and sets up Row Level Security policies
-- for direct-to-Supabase file uploads.
-- Run this in your Supabase SQL editor after applying Prisma migrations.
--
-- Prerequisite:
--   The `WorkspaceMember` table must exist (managed by Prisma).
--
-- Storage path convention:
--   {feature}/{workspaceId}/{fileId}/{filename}
--   e.g. announcements/550e8400-e29b-41d4-a716-446655440000/abc123/doc.pdf
--   (storage.foldername(name))[1] = feature namespace (announcements, chats, etc.)
--   (storage.foldername(name))[2] = workspaceId (UUID)
--
-- The first segment acts as a namespace to support different features
-- (announcements, chats, etc.) in the same bucket.
-- The policy only checks workspace membership via the second segment,
-- so any future feature can reuse the same RLS as-is.

BEGIN;

-- ============================
-- WorkspaceMember RLS
-- ============================

-- Grants just enough access for the storage policies to verify workspace
-- membership via EXISTS subqueries, without leaking other users' data.
ALTER TABLE public."WorkspaceMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their memberships"
ON public."WorkspaceMember"
FOR SELECT
TO authenticated
USING (
  "userId" = auth.uid()
);

GRANT SELECT
ON public."WorkspaceMember"
TO authenticated;

-- ============================
-- Attachments bucket
-- ============================

-- Create the attachments bucket if it doesn't already exist.
-- The bucket is private — files are accessed via signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('attachments', 'attachments', false, 10485760)  -- 10 MB limit
ON CONFLICT (id) DO NOTHING;

-- ============================
-- Attachments bucket policies
-- ============================

-- SELECT: workspace members can read attachments in their workspace
CREATE POLICY "workspace members can read attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[2]::uuid
      AND wm."userId" = auth.uid()
  )
);

-- INSERT: workspace members can upload attachments to their workspace
CREATE POLICY "workspace members can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[2]::uuid
      AND wm."userId" = auth.uid()
  )
);

-- DELETE: workspace members can delete attachments in their workspace
CREATE POLICY "workspace members can delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[2]::uuid
      AND wm."userId" = auth.uid()
  )
);

COMMIT;

-- Usage: Deploy this SQL to your Supabase SQL editor or apply via psql.
--   psql "$SUPABASE_DB_URL" -f backend/setup_storage_rls.sql
