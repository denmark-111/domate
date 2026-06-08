import express from "express";
import { getTasks, createTask, getTaskById, updateTask, deleteTask, moveTask } from "../controllers/taskController.js";
import { validate } from  "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, moveTaskSchema } from "../schemas/taskSchema.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested task routes under /lists/:listId/tasks
nestedRouter.get("/", getTasks);
nestedRouter.post("/", validate(createTaskSchema), createTask);

// main task routes under /tasks
router.get('/:taskId', validate(taskIdParamSchema), getTaskById);
router.put('/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/:taskId', validate(taskIdParamSchema), deleteTask);

router.patch('/:taskId/move', validate(moveTaskSchema), moveTask);