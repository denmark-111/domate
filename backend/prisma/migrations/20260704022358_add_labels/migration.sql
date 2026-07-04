-- CreateTable
CREATE TABLE "BoardLabel" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "boardId" UUID NOT NULL,

    CONSTRAINT "BoardLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLabel" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "boardLabelId" UUID NOT NULL,

    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardLabel_boardId_idx" ON "BoardLabel"("boardId");

-- CreateIndex
CREATE INDEX "TaskLabel_taskId_idx" ON "TaskLabel"("taskId");

-- CreateIndex
CREATE INDEX "TaskLabel_boardLabelId_idx" ON "TaskLabel"("boardLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskLabel_taskId_boardLabelId_key" ON "TaskLabel"("taskId", "boardLabelId");

-- AddForeignKey
ALTER TABLE "BoardLabel" ADD CONSTRAINT "BoardLabel_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_boardLabelId_fkey" FOREIGN KEY ("boardLabelId") REFERENCES "BoardLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
