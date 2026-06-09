import prisma from "../client.js";

// temporary user while auth is not implemented
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export const getWorkspaces = async (req, res, next) => {
    const workspaces = await prisma.workspace.findMany({
        where: {
            ownerId: TEST_USER_ID
        }
    });

    res.status(200).json({
        data: workspaces
    });
};

export const createWorkspace = async (req, res, next) => {
    const { name, description } = req.validated.body;

    const workspace = await prisma.workspace.create({
        data: {
            name,
            description,
            ownerId: TEST_USER_ID
        }
    });

    res.status(201).json({
        message: "Workspace created successfully",
        data: workspace
    });
};

export const getWorkspaceById = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
    });

    if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
    }

    res.status(200).json({
        data: workspace
    });
};

export const updateWorkspace = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const { name, description } = req.validated.body;

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
            name,
            description
        }
    });

    res.status(200).json({
        message: "Workspace updated successfully",
        data: workspace
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