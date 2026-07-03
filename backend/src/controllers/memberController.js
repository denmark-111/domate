import prisma from "../client.js";

export const getWorkspaceMembers = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    const memberships = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: {
            id: true,
            role: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            user: { fullName: 'asc' }
        }
    });

    res.status(200).json({
        data: memberships
    });
};
