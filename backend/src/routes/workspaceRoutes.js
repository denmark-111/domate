import express from "express";
import { getWorkspaces, createWorkspace, getWorkspaceById } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema, workspaceIdParamSchema } from "../schemas/workspaceSchema.js";

const router = express.Router();

router.get('/', getWorkspaces);
router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/:id', validate(workspaceIdParamSchema), getWorkspaceById);

export default router;