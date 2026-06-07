import express from "express";
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard } from "../controllers/boardController.js";
import { validate } from  "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema, boardIdParamSchema } from "../schemas/boardSchema.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested board routes under /workspaces/:workspaceId/boards
nestedRouter.get('/', getBoards);
nestedRouter.post('/', validate(createBoardSchema), createBoard);

// main board routes under /boards
router.get('/:boardId', validate(boardIdParamSchema), getBoardById);
router.put('/:boardId', validate(updateBoardSchema), updateBoard);
router.delete('/:boardId', validate(boardIdParamSchema), deleteBoard);