import express from "express";
import { getWorkspaces, createWorkspace } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema } from "../schemas/workspaceSchema.js";

const router = express.Router();

router.get('/', getWorkspaces);
router.post('/', validate(createWorkspaceSchema), createWorkspace);

export default router;