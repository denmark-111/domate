import express from "express";
import { getWorkspaces, createWorkspace, getWorkspaceById, updateWorkspace, deleteWorkspace } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema, workspaceIdParamSchema, updateWorkspaceSchema } from "../schemas/workspaceSchema.js";
import { nestedRouter as boardRouter } from "./boardRoutes.js";

const router = express.Router();

router.get('/', getWorkspaces);
router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/:id', validate(workspaceIdParamSchema), getWorkspaceById);
router.put('/:id', validate(updateWorkspaceSchema), updateWorkspace);
router.delete('/:id', validate(workspaceIdParamSchema), deleteWorkspace);

router.use('/:id/boards', validate(workspaceIdParamSchema), boardRouter);

export default router;