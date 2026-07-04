import express from "express";
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard } from "../controllers/boardController.js";
import { validate } from  "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema, boardIdParamSchema } from "../schemas/boardSchema.js";
import { nestedRouter as listRouter } from "./listRoutes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireBoardWorkspaceMember } from "../middleware/authorize.js";
import { router as boardLabelRouter } from "./boardLabelRoutes.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested board routes under /workspaces/:workspaceId/boards
nestedRouter.get('/', asyncHandler(getBoards));
nestedRouter.post('/', validate(createBoardSchema), asyncHandler(createBoard));

// main board routes under /boards
router.get('/:boardId', validate(boardIdParamSchema), requireBoardWorkspaceMember, asyncHandler(getBoardById));
router.put('/:boardId', validate(updateBoardSchema), requireBoardWorkspaceMember, asyncHandler(updateBoard));
router.delete('/:boardId', validate(boardIdParamSchema), requireBoardWorkspaceMember, asyncHandler(deleteBoard));

// mount nested list routes
router.use('/:boardId/lists', validate(boardIdParamSchema), requireBoardWorkspaceMember, listRouter);

// mount nested label routes
router.use('/:boardId/labels', validate(boardIdParamSchema), requireBoardWorkspaceMember, boardLabelRouter);
