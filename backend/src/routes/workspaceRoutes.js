import express from "express";
import { getWorkspaces, createWorkspace, getWorkspaceById, updateWorkspace, deleteWorkspace } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema, workspaceIdParamSchema, updateWorkspaceSchema } from "../schemas/workspaceSchema.js";
import { nestedRouter as boardRouter } from "./boardRoutes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.get('/', asyncHandler(getWorkspaces));
router.post('/', validate(createWorkspaceSchema), asyncHandler(createWorkspace));
router.get('/:workspaceId', validate(workspaceIdParamSchema), asyncHandler(getWorkspaceById));
router.put('/:workspaceId', validate(updateWorkspaceSchema), asyncHandler(updateWorkspace));
router.delete('/:workspaceId', validate(workspaceIdParamSchema), asyncHandler(deleteWorkspace));

// mount nested board routes
router.use('/:workspaceId/boards', validate(workspaceIdParamSchema), boardRouter);

export default router;