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

// Storage paths are workspace-scoped: announcements/{workspaceId}/{random}
// The announcementId is intentionally NOT in the path — on create it doesn't exist yet
// (files are uploaded before the announcement is POSTed), and the DB FK is the real
// source of truth for which attachment belongs to which announcement. The {random} UUID
// guarantees uniqueness; this prefix check just stops a client from persisting a row
// that points at an arbitrary location in the bucket.
const validateAttachmentPaths = (attachments, workspaceId) => {
    const prefix = `announcements/${workspaceId}/`;
    for (const a of attachments) {
        if (!a.storagePath.startsWith(prefix)) {
            throw new ApiError(422, "Attachment storagePath does not match the expected location");
        }
    }
};

export const getAnnouncements = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const { page = 1, limit = 20 } = req.validated.query || {};
    const offset = ((page ?? 1) - 1) * Number(limit);

    const [announcements, total] = await Promise.all([
        prisma.announcement.findMany({
            where: {
                workspaceId
            },
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" }
            ],
            include: fullAnnouncementInclude,
            skip: Number(offset),
            take: Number(limit)
        }),
        prisma.announcement.count({
            where: {
                workspaceId
            }
        })
    ]);

    res.status(200).json({
        data: announcements,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: Number(offset) + announcements.length < total
        }
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
        validateAttachmentPaths(attachments, workspaceId);
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
        validateAttachmentPaths(attachments, workspaceId);
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
