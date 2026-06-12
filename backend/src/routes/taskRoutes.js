import express from "express";
import { getTasks, createTask, getTaskById, updateTask, deleteTask, moveTask } from "../controllers/taskController.js";
import { validate } from  "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, moveTaskSchema } from "../schemas/taskSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireTaskWorkspaceMember } from "../middleware/authorize.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested task routes under /lists/:listId/tasks
nestedRouter.get("/", asyncHandler(getTasks));
nestedRouter.post("/", validate(createTaskSchema), asyncHandler(createTask));

// main task routes under /tasks
router.get('/:taskId', validate(taskIdParamSchema), requireTaskWorkspaceMember, asyncHandler(getTaskById));
router.put('/:taskId', validate(updateTaskSchema), requireTaskWorkspaceMember, asyncHandler(updateTask));
router.delete('/:taskId', validate(taskIdParamSchema), requireTaskWorkspaceMember, asyncHandler(deleteTask));

router.patch('/:taskId/move', validate(moveTaskSchema), requireTaskWorkspaceMember, asyncHandler(moveTask));
