import express from "express";
import {
  createInvitations,
  getWorkspaceInvitations,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
  getMyInvitations
} from "../controllers/invitationController.js";
import { validate } from "../middleware/validate.js";
import {
  createInvitationSchema,
  invitationIdParamSchema,
  invitationTokenSchema
} from "../schemas/invitationSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireInvitationWorkspaceOwner } from "../middleware/authorize.js";

// -- Nested router (mounted under /workspaces/:workspaceId; parent enforces owner) --
export const nestedRouter = express.Router({ mergeParams: true });

nestedRouter.post("/", validate(createInvitationSchema), asyncHandler(createInvitations));
nestedRouter.get("/", asyncHandler(getWorkspaceInvitations));

// -- Top-level router (mounted at /api/invitations) --
const router = express.Router();

router.get("/", asyncHandler(getMyInvitations));

router.get("/:token", validate(invitationTokenSchema), asyncHandler(getInvitationByToken));

router.post("/:token/accept", validate(invitationTokenSchema), asyncHandler(acceptInvitation));

router.delete("/:invitationId", validate(invitationIdParamSchema), requireInvitationWorkspaceOwner, asyncHandler(revokeInvitation));

export default router;
