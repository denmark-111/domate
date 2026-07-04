import express from "express";
import { getBoardLabels, createBoardLabel, updateBoardLabel, deleteBoardLabel } from "../controllers/boardLabelController.js";
import { validate } from "../middleware/validate.js";
import { createBoardLabelSchema, updateBoardLabelSchema, boardLabelIdParamSchema } from "../schemas/boardLabelSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router({ mergeParams: true });

router.get('/', asyncHandler(getBoardLabels));
router.post('/', validate(createBoardLabelSchema), asyncHandler(createBoardLabel));
router.put('/:labelId', validate(updateBoardLabelSchema), asyncHandler(updateBoardLabel));
router.delete('/:labelId', validate(boardLabelIdParamSchema), asyncHandler(deleteBoardLabel));
