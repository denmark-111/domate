import prisma from "../client.js";

const fullWorkspaceInclude = {
    memberships: {
        select: {
            role: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        }
    }
};

const getWorkspaceType = (memberCount) => {
    return memberCount > 1 ? "team" : "personal";
};

const formatFullWorkspace = (workspace) => {
    const { memberships, ...rest } = workspace;

    return {
        ...rest,
        type: getWorkspaceType(memberships.length),
        memberships
    };
};

export const getWorkspaces = async (req, res, next) => {
    const userId = req.supabase.user.id;

    const workspaces = await prisma.workspace.findMany({
        where: {
            memberships: {
                some: {
                    userId
                }
            }
        },
        include: {
            _count: {
                select: { memberships: true }
            },
            memberships: {
                where: { userId },
                select: { role: true }
            }
        }
    });

    const formattedWorkspaces = workspaces.map(ws => {
        const { _count, memberships, ...rest } = ws;

        return {
            ...rest,
            role: memberships[0]?.role,
            type: getWorkspaceType(_count.memberships)
        };
    });

    res.status(200).json({
        data: formattedWorkspaces
    });
};

export const createWorkspace = async (req, res, next) => {
    const userId = req.supabase.user.id;
    const { name, description, color, coverImageUrl } = req.validated.body;

    const workspace = await prisma.workspace.create({
        data: {
            name,
            description,
            color,
            coverImageUrl,
            memberships: {
                create: {
                    userId,
                    role: "OWNER"
                }
            }
        },
        include: fullWorkspaceInclude
    });

    res.status(201).json({
        message: "Workspace created successfully",
        data: formatFullWorkspace(workspace)
    });
};

export const getWorkspaceById = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: fullWorkspaceInclude
    });

    if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
    }

    res.status(200).json({
        data: formatFullWorkspace(workspace)
    });
};

export const updateWorkspace = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const { name, description, color, coverImageUrl } = req.validated.body;

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
            name,
            description,
            color,
            coverImageUrl
        },
        include: fullWorkspaceInclude
    });

    res.status(200).json({
        message: "Workspace updated successfully",
        data: formatFullWorkspace(workspace)
    });
};

export const deleteWorkspace = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    await prisma.workspace.delete({
        where: { id: workspaceId }
    });

    res.status(200).json({
        message: "Workspace deleted successfully"
    });
};