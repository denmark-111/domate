import prisma from "../client.js";

const userSelect = {
    id: true,
    email: true,
    fullName: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true
};

export const getMyProfile = async (req, res, next) => {
    const userId = req.supabase.user.id;

    const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelect
    });

    if (!profile) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        data: profile
    });
};

export const updateMyProfile = async (req, res, next) => {
    const userId = req.supabase.user.id;
    const { fullName, avatarUrl } = req.validated.body;

    const profile = await prisma.user.update({
        where: { id: userId },
        data: {
            fullName,
            avatarUrl
        },
        select: userSelect
    });

    res.status(200).json({
        message: "Profile updated successfully",
        data: profile
    });
};

/**
 * Search users by full name or email (partial, case-insensitive).
 * Returns at most 20 results — used for user lookups (invitations, mentions, etc.).
 * Authenticated users only (no additional workspace membership required).
 */
export const searchUsers = async (req, res, next) => {
    const { q } = req.validated.query;
    const currentUserId = req.supabase.user.id;

    if (!q || q.trim().length < 2) {
        return res.status(200).json({ data: [] });
    }

    const query = q.trim();

    const users = await prisma.user.findMany({
        where: {
            id: { not: currentUserId },
            OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } }
            ]
        },
        select: userSelect,
        take: 20,
        orderBy: { fullName: "asc" }
    });

    res.status(200).json({
        data: users
    });
};

/**
 * Get a user by ID (public profile).
 */
export const getUserById = async (req, res, next) => {
    const { userId } = req.validated.params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelect
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        data: user
    });
};
