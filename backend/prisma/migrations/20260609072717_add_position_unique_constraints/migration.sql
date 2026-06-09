/*
  Warnings:

  - A unique constraint covering the columns `[boardId,position]` on the table `List` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[listId,position]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "List_boardId_position_idx";

-- DropIndex
DROP INDEX "Task_listId_position_idx";

-- CreateIndex
CREATE UNIQUE INDEX "List_boardId_position_key" ON "List"("boardId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Task_listId_position_key" ON "Task"("listId", "position");
