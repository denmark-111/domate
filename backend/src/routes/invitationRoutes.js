import express from "express";
import {
  createInvitations,
  getWorkspaceInvitations,
  revokeInvitation,
  getInvitationById,
  acceptInvitation,
  declineInvitation,
  getMyInvitations
} from "../controllers/invitationController.js";
import { validate } from "../middleware/validate.js";
import {
  createInvitationSchema,
  invitationIdParamSchema
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

router.get("/:invitationId", validate(invitationIdParamSchema), asyncHandler(getInvitationById));

router.post("/:invitationId/accept", validate(invitationIdParamSchema), asyncHandler(acceptInvitation));

router.post("/:invitationId/decline", validate(invitationIdParamSchema), asyncHandler(declineInvitation));

router.delete("/:invitationId", validate(invitationIdParamSchema), requireInvitationWorkspaceOwner, asyncHandler(revokeInvitation));

export default router;
