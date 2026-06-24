import prisma from "../client.js";
import { ApiError } from "../middleware/errorHandler.js";

const fullAnnouncementInclude = {
    author: {
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
        }
    },
    attachments: true
};

// Storage paths look like: announcements/{workspaceId}/{announcementId}/{random}
// On create the announcementId isn't known yet, so only the workspace-scoped prefix is
// enforced; the frontend's random segment fills the rest. This prevents a client from
// persisting a row that points at an arbitrary location in the bucket.
const buildStoragePrefix = (workspaceId, announcementId) =>
    `announcements/${workspaceId}/${announcementId ?? ""}`;

const validateAttachmentPaths = (attachments, workspaceId, announcementId) => {
    const prefix = buildStoragePrefix(workspaceId, announcementId);
    for (const a of attachments) {
        if (!a.storagePath.startsWith(prefix)) {
            throw new ApiError(422, "Attachment storagePath does not match the expected location");
        }
    }
};

export const getAnnouncements = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    const announcements = await prisma.announcement.findMany({
        where: {
            workspaceId
        },
        orderBy: [
            { pinned: "desc" },
            { createdAt: "desc" }
        ],
        include: fullAnnouncementInclude
    });

    res.status(200).json({
        data: announcements
    });
};

export const createAnnouncement = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const userId = req.supabase.user.id;
    const { title, content, pinned, attachments } = req.validated.body;

    const data = {
        title,
        content,
        pinned,
        authorId: userId,
        workspaceId
    };

    if (attachments?.length) {
        // On create the announcementId is assigned by Postgres, so only the
        // workspace-scoped prefix can be validated here.
        validateAttachmentPaths(attachments, workspaceId, undefined);
        data.attachments = {
            create: attachments.map(({ fileName, fileSize, mimeType, storagePath }) => ({
                fileName,
                fileSize,
                mimeType,
                storagePath,
                uploadedById: userId
            }))
        };
    }

    const announcement = await prisma.announcement.create({
        data,
        include: fullAnnouncementInclude
    });

    res.status(201).json({
        message: "Announcement created successfully",
        data: announcement
    });
};

export const getAnnouncementById = async (req, res, next) => {
    const { announcementId } = req.validated.params;

    const announcement = await prisma.announcement.findUnique({
        where: { id: announcementId },
        include: fullAnnouncementInclude
    });

    if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json({
        data: announcement
    });
};

export const updateAnnouncement = async (req, res, next) => {
    const { announcementId } = req.validated.params;
    const { workspaceId } = req.authorization;
    const userId = req.supabase.user.id;
    const { title, content, pinned, attachments } = req.validated.body;

    const data = {
        title,
        content,
        pinned
    };

    // "attachments" present => full replacement of the set (existing rows deleted, the
    // provided set created). "attachments" omitted => leave attachments untouched, so a
    // plain title/content edit doesn't require resending the file list.
    if (attachments !== undefined) {
        validateAttachmentPaths(attachments, workspaceId, announcementId);
        data.attachments = {
            deleteMany: { announcementId },
            create: attachments.map(({ fileName, fileSize, mimeType, storagePath }) => ({
                fileName,
                fileSize,
                mimeType,
                storagePath,
                uploadedById: userId
            }))
        };
    }

    const announcement = await prisma.announcement.update({
        where: { id: announcementId },
        data,
        include: fullAnnouncementInclude
    });

    res.status(200).json({
        message: "Announcement updated successfully",
        data: announcement
    });
};

export const deleteAnnouncement = async (req, res, next) => {
    const { announcementId } = req.validated.params;

    await prisma.announcement.delete({
        where: { id: announcementId }
    });

    res.status(200).json({
        message: "Announcement deleted successfully"
    });
};
