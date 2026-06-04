import express from "express";
import { createWorkspace } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema } from "../schemas/workspaceSchema.js";

const router = express.Router();

router.post('/', validate(createWorkspaceSchema), createWorkspace);

export default router;