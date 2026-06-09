import express from "express";
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard } from "../controllers/boardController.js";
import { validate } from  "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema, boardIdParamSchema } from "../schemas/boardSchema.js";
import { nestedRouter as listRouter } from "./listRoutes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested board routes under /workspaces/:workspaceId/boards
nestedRouter.get('/', asyncHandler(getBoards));
nestedRouter.post('/', validate(createBoardSchema), asyncHandler(createBoard));

// main board routes under /boards
router.get('/:boardId', validate(boardIdParamSchema), asyncHandler(getBoardById));
router.put('/:boardId', validate(updateBoardSchema), asyncHandler(updateBoard));
router.delete('/:boardId', validate(boardIdParamSchema), asyncHandler(deleteBoard));

// mount nested list routes
router.use('/:boardId/lists', validate(boardIdParamSchema), listRouter);