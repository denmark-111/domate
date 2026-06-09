import express from "express";
import { getTasks, createTask, getTaskById, updateTask, deleteTask, moveTask } from "../controllers/taskController.js";
import { validate } from  "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, moveTaskSchema } from "../schemas/taskSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested task routes under /lists/:listId/tasks
nestedRouter.get("/", asyncHandler(getTasks));
nestedRouter.post("/", validate(createTaskSchema), asyncHandler(createTask));

// main task routes under /tasks
router.get('/:taskId', validate(taskIdParamSchema), asyncHandler(getTaskById));
router.put('/:taskId', validate(updateTaskSchema), asyncHandler(updateTask));
router.delete('/:taskId', validate(taskIdParamSchema), asyncHandler(deleteTask));

router.patch('/:taskId/move', validate(moveTaskSchema), asyncHandler(moveTask));