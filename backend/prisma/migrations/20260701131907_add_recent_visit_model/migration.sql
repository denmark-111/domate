-- CreateTable
CREATE TABLE "RecentVisit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "entityType" VARCHAR(20) NOT NULL,
    "entityId" UUID NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentVisit_userId_entityType_visitedAt_idx" ON "RecentVisit"("userId", "entityType", "visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecentVisit_userId_entityType_entityId_key" ON "RecentVisit"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "RecentVisit" ADD CONSTRAINT "RecentVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
