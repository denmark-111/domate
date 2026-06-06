import express from "express";
import { getBoards, createBoard } from "../controllers/boardController.js";
import { validate } from  "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema, boardIdParamSchema } from "../schemas/boardSchema.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

nestedRouter.get('/', getBoards);
nestedRouter.post('/', validate(createBoardSchema), createBoard);