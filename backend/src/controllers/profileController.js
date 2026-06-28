import prisma from "../client.js";

export const getProfile = async (req, res, next) => {
    const userId = req.supabase.user.id;

    const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
        data: profile
    });
};

export const updateProfile = async (req, res, next) => {
    const userId = req.supabase.user.id;
    const { fullName, avatarUrl } = req.validated.body;

    const profile = await prisma.user.update({
        where: { id: userId },
        data: {
            fullName,
            avatarUrl
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
        }
    });

    res.status(200).json({
        message: "Profile updated successfully",
        data: profile
    });
};
