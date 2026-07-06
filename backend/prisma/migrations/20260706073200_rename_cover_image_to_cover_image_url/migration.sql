-- Rename coverImage to coverImageUrl for consistency with avatarUrl
ALTER TABLE "Workspace" RENAME COLUMN "coverImage" TO "coverImageUrl";
