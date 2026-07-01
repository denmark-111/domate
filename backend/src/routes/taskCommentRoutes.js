import express from "express";
import { getComments, createComment, deleteComment } from "../controllers/taskCommentController.js";
import { validate } from  "../middleware/validate.js";
import { createCommentSchema, listCommentsSchema, commentIdParamSchema } from "../schemas/taskCommentSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// Nested comment routes under /tasks/:taskId/comments
nestedRouter.get('/', validate(listCommentsSchema), asyncHandler(getComments));
nestedRouter.post('/', validate(createCommentSchema), asyncHandler(createComment));

// Direct comment routes under /tasks (mounted by parent)
// Deletion is performed by comment id; parent route applies task membership middleware.
router.delete('/:commentId', validate(commentIdParamSchema), asyncHandler(deleteComment));

