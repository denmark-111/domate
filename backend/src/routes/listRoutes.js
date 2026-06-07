import express from "express";
import { getLists, createList, getListById, updateList, deleteList } from "../controllers/listController.js";
import { validate } from  "../middleware/validate.js";
import { createListSchema, updateListSchema, listIdParamSchema } from "../schemas/listSchema.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested list routes under /boards/:boardId/lists
nestedRouter.get('/', getLists);
nestedRouter.post('/', validate(createListSchema), createList);

// main list routes under /lists
router.get('/:listId', validate(listIdParamSchema), getListById);
router.put('/:listId', validate(updateListSchema), updateList);
router.delete('/:listId', validate(listIdParamSchema), deleteList);