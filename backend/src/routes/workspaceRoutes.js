import express from "express";
import { getWorkspaces, createWorkspace, getWorkspaceById, updateWorkspace, deleteWorkspace } from "../controllers/workspaceController.js";
import { validate } from  "../middleware/validate.js";
import { createWorkspaceSchema, workspaceIdParamSchema, updateWorkspaceSchema } from "../schemas/workspaceSchema.js";
import { nestedRouter as boardRouter } from "./boardRoutes.js";
import { nestedRouter as announcementRouter } from "./announcementRoutes.js";
import { nestedRouter as chatRouter } from "./chatRoutes.js";
import { nestedRouter as invitationRouter } from "./invitationRoutes.js";
import { nestedRouter as memberRouter } from "./memberRoutes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireWorkspaceMember, requireWorkspaceOwner } from "../middleware/authorize.js";

const router = express.Router();

router.get('/', asyncHandler(getWorkspaces));
router.post('/', validate(createWorkspaceSchema), asyncHandler(createWorkspace));
router.get('/:workspaceId', validate(workspaceIdParamSchema), requireWorkspaceMember, asyncHandler(getWorkspaceById));
router.put('/:workspaceId', validate(updateWorkspaceSchema), requireWorkspaceOwner, asyncHandler(updateWorkspace));
router.delete('/:workspaceId', validate(workspaceIdParamSchema), requireWorkspaceOwner, asyncHandler(deleteWorkspace));

// mount nested board routes
router.use('/:workspaceId/boards', validate(workspaceIdParamSchema), requireWorkspaceMember, boardRouter);

// mount nested announcement routes (per-route guards enforce member vs owner @announcementRoutes.js)
router.use('/:workspaceId/announcements', validate(workspaceIdParamSchema), announcementRouter);

// mount nested chat routes (member-only — workspace membership is validated by requireWorkspaceMember)
router.use('/:workspaceId/chat', validate(workspaceIdParamSchema), requireWorkspaceMember, chatRouter);

// mount nested invitation routes (owner-only — only owners see/manage invitations)
router.use('/:workspaceId/invitations', validate(workspaceIdParamSchema), requireWorkspaceOwner, invitationRouter);

// mount nested member routes (any workspace member can list members)
router.use('/:workspaceId/members', validate(workspaceIdParamSchema), requireWorkspaceMember, memberRouter);

export default router;
