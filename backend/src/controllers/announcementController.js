import prisma from "../client.js";

const fullAnnouncementInclude = {
    author: {
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
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
    const { title, content, pinned } = req.validated.body;

    const announcement = await prisma.announcement.create({
        data: {
            title,
            content,
            pinned,
            authorId: userId,
            workspaceId
        },
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
    const { title, content, pinned } = req.validated.body;

    const announcement = await prisma.announcement.update({
        where: { id: announcementId },
        data: {
            title,
            content,
            pinned
        },
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
