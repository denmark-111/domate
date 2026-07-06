-- setup_workspace_covers_bucket.sql
-- Creates the workspace-covers bucket (public) and sets up Row Level Security policies
-- for direct-to-Supabase workspace cover image uploads.
-- Run this in your Supabase SQL editor after applying Prisma migrations.
--
-- The workspace-covers bucket is public so cover images load immediately without
-- signed URLs. RLS still controls who can INSERT, UPDATE, and DELETE — only the
-- workspace owner (via WorkspaceMember) can manage the cover.
--
-- Prerequisite:
--   The `WorkspaceMember` table must exist (managed by Prisma).
--
-- Storage path convention:
--   {workspaceId}/{uuid}.{ext}
--   e.g. 550e8400-e29b-41d4-a716-446655440000/abc123.png
--   (storage.foldername(name))[1] = workspaceId (UUID)

BEGIN;

-- ============================
-- WorkspaceMember RLS (if not already enabled)
-- ============================

ALTER TABLE public."WorkspaceMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their memberships for covers"
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
-- Workspace Covers bucket (public)
-- ============================

-- Create the workspace-covers bucket if it doesn't already exist.
-- Public = true so covers are served directly without signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('workspace-covers', 'workspace-covers', true, 10485760)  -- 10 MB limit
ON CONFLICT (id) DO NOTHING;

-- ============================
-- Workspace Covers bucket policies
-- ============================

-- SELECT: anyone can read workspace covers (public bucket)
CREATE POLICY "anyone can read workspace covers"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'workspace-covers'
);

-- INSERT: workspace owners can upload covers for their workspace
CREATE POLICY "workspace owners can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-covers'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[1]::uuid
      AND wm."userId" = auth.uid()
      AND wm."role" = 'OWNER'
  )
);

-- UPDATE: workspace owners can overwrite covers for their workspace
CREATE POLICY "workspace owners can update covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspace-covers'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[1]::uuid
      AND wm."userId" = auth.uid()
      AND wm."role" = 'OWNER'
  )
)
WITH CHECK (
  bucket_id = 'workspace-covers'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[1]::uuid
      AND wm."userId" = auth.uid()
      AND wm."role" = 'OWNER'
  )
);

-- DELETE: workspace owners can delete covers for their workspace
CREATE POLICY "workspace owners can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspace-covers'
  AND EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    WHERE wm."workspaceId" = (storage.foldername(name))[1]::uuid
      AND wm."userId" = auth.uid()
      AND wm."role" = 'OWNER'
  )
);

COMMIT;

-- Usage: Deploy this SQL to your Supabase SQL editor or apply via psql.
--   psql "$SUPABASE_DB_URL" -f backend/sql/setup_workspace_covers_bucket.sql
