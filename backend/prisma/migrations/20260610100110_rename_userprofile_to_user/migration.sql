/*
  Warnings:

  - You are about to drop the `userprofile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "userprofile";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "rawUserMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
