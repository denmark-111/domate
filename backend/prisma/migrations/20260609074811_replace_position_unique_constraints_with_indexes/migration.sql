-- DropIndex
DROP INDEX "List_boardId_position_key";

-- DropIndex
DROP INDEX "Task_listId_position_key";

-- CreateIndex
CREATE INDEX "List_boardId_position_idx" ON "List"("boardId", "position");

-- CreateIndex
CREATE INDEX "Task_listId_position_idx" ON "Task"("listId", "position");
