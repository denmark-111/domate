import express from "express";
import { getTasks, createTask, getTaskById, updateTask, deleteTask, moveTask, getMyTasks } from "../controllers/taskController.js";
import { validate } from  "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, moveTaskSchema } from "../schemas/taskSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireTaskWorkspaceMember } from "../middleware/authorize.js";
import { router as taskLabelRouter } from "./taskLabelRoutes.js";
import { nestedRouter as commentRouter } from "./taskCommentRoutes.js";
import { nestedRouter as taskAssignmentRouter } from "./taskAssignmentRoutes.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested task routes under /lists/:listId/tasks
nestedRouter.get("/", asyncHandler(getTasks));
nestedRouter.post("/", validate(createTaskSchema), asyncHandler(createTask));

// main task routes under /tasks
router.get('/my', asyncHandler(getMyTasks));
router.get('/:taskId', validate(taskIdParamSchema), requireTaskWorkspaceMember, asyncHandler(getTaskById));
router.put('/:taskId', validate(updateTaskSchema), requireTaskWorkspaceMember, asyncHandler(updateTask));
router.delete('/:taskId', validate(taskIdParamSchema), requireTaskWorkspaceMember, asyncHandler(deleteTask));

router.patch('/:taskId/move', validate(moveTaskSchema), requireTaskWorkspaceMember, asyncHandler(moveTask));

// mount nested comment routes under /tasks/:taskId/comments
router.use('/:taskId/comments', validate(taskIdParamSchema), requireTaskWorkspaceMember, commentRouter);

// mount nested task assignment routes under /tasks/:taskId/assignees
router.use('/:taskId/assignees', validate(taskIdParamSchema), requireTaskWorkspaceMember, taskAssignmentRouter);

// mount nested task label routes under /tasks/:taskId/labels
router.use('/:taskId/labels', validate(taskIdParamSchema), requireTaskWorkspaceMember, taskLabelRouter);
