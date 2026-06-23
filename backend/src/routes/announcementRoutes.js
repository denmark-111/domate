import express from "express";
import { getAnnouncements, createAnnouncement, getAnnouncementById, updateAnnouncement, deleteAnnouncement } from "../controllers/announcementController.js";
import { validate } from  "../middleware/validate.js";
import { createAnnouncementSchema, updateAnnouncementSchema, announcementIdParamSchema } from "../schemas/announcementSchema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireWorkspaceMember, requireWorkspaceOwner, requireAnnouncementWorkspaceMember, requireAnnouncementWorkspaceOwner } from "../middleware/authorize.js";

export const router = express.Router();
export const nestedRouter = express.Router({ mergeParams: true });

// nested announcement routes under /workspaces/:workspaceId/announcements
// listing is open to any member; creation is owner-only.
nestedRouter.get('/', requireWorkspaceMember, asyncHandler(getAnnouncements));
nestedRouter.post('/', validate(createAnnouncementSchema), requireWorkspaceOwner, asyncHandler(createAnnouncement));

// main announcement routes under /announcements
router.get('/:announcementId', validate(announcementIdParamSchema), requireAnnouncementWorkspaceMember, asyncHandler(getAnnouncementById));
router.put('/:announcementId', validate(updateAnnouncementSchema), requireAnnouncementWorkspaceOwner, asyncHandler(updateAnnouncement));
router.delete('/:announcementId', validate(announcementIdParamSchema), requireAnnouncementWorkspaceOwner, asyncHandler(deleteAnnouncement));
