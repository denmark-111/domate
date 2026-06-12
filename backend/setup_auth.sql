-- setup_auth.sql
-- setup_auth.sql
-- Idempotent SQL to create triggers that insert into public.User when a new
-- row is added to auth.users (Supabase Auth). The actual `User` table is
-- expected to be managed by Prisma (prisma/schema.prisma).

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    "fullName",
    "avatarUrl",
    "rawUserMeta",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data,
    NOW(),
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    "fullName" = COALESCE(EXCLUDED."fullName", "User"."fullName"),
    "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", "User"."avatarUrl"),
    "rawUserMeta" = COALESCE(EXCLUDED."rawUserMeta", "User"."rawUserMeta"),
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auth_user_created_trigger
ON auth.users;

CREATE TRIGGER auth_user_created_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;
-- Usage: Deploy this SQL to your Supabase SQL editor or apply via psql.
