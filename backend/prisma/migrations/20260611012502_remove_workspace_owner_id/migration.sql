/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Workspace` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Workspace_ownerId_idx";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "ownerId";
