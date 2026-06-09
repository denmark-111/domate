import express from "express";
import { getLists, createList, getListById, updateList, deleteList } from "../controllers/listController.js";
import { validate } from  "../middleware/validate.js";
import { createListSchema, updateListSchema, listIdParamSchema } from "../schemas/listSchema.js";
import { nestedRouter as taskRouter } from "./taskRoutes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested list routes under /boards/:boardId/lists
nestedRouter.get('/', asyncHandler(getLists));
nestedRouter.post('/', validate(createListSchema), asyncHandler(createList));

// main list routes under /lists
router.get('/:listId', validate(listIdParamSchema), asyncHandler(getListById));
router.put('/:listId', validate(updateListSchema), asyncHandler(updateList));
router.delete('/:listId', validate(listIdParamSchema), asyncHandler(deleteList));

// mount nested task routes
router.use('/:listId/tasks', validate(listIdParamSchema), taskRouter);