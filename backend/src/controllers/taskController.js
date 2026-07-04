import prisma from "../client.js";
import { ApiError } from "../middleware/errorHandler.js";

const fullTaskInclude = {
    _count: {
        select: { comments: true }
    },
    attachments: true,
    taskLabels: {
        include: {
            boardLabel: true
        }
    },
    assignments: {
        select: {
            id: true,
            userId: true,
            assignedById: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            },
            assignedBy: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        }
    }
};

// Storage paths are workspace-scoped: tasks/{workspaceId}/{random}/{filename}
// The taskId is intentionally NOT in the path — on create it doesn't exist yet
// (files are uploaded before the task is POSTed), and the DB FK is the real
// source of truth. The {random} UUID guarantees uniqueness.
const validateAttachmentPaths = (attachments, workspaceId) => {
    const prefix = `tasks/${workspaceId}/`;
    for (const a of attachments) {
        if (!a.storagePath.startsWith(prefix)) {
            throw new ApiError(422, "Attachment storagePath does not match the expected location");
        }
    }
};

export const getMyTasks = async (req, res, next) => {
    const userId = req.supabase.user.id;

    const assignments = await prisma.taskAssignment.findMany({
        where: {
            userId,
            task: {
                completedAt: null
            }
        },
        include: {
            task: {
                include: {
                    ...fullTaskInclude,
                    list: {
                        include: {
                            board: {
                                include: {
                                    workspace: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            task: {
                updatedAt: 'desc'
            }
        }
    });

    res.status(200).json({
        data: assignments
    });
};

export const getTasks = async (req, res, next) => {
    const { listId } = req.validated.params;

    const tasks = await prisma.task.findMany({
        where: {
            listId
        },
        orderBy: {
            position: 'asc'
        },
        include: fullTaskInclude
    });

    res.status(200).json({
        data: tasks
    });
};

export const createTask = async (req, res, next) => {
    const { listId } = req.validated.params;
    const { workspaceId } = req.authorization;
    const userId = req.supabase.user.id;
    const { name, description, dueDate, attachments } = req.validated.body;

    const lastTask = await prisma.task.findFirst({
        where: { listId },
        orderBy: { position: 'desc' }
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const data = {
        name,
        description,
        dueDate,
        position,
        listId
    };

    if (attachments?.length) {
        // workspaceId is already resolved by requireListWorkspaceMember middleware
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

    const task = await prisma.task.create({
        data,
        include: fullTaskInclude
    });

    res.status(201).json({
        message: "Task created successfully",
        data: task
    });
};

export const getTaskById = async (req, res, next) => {
    const { taskId } = req.validated.params;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: fullTaskInclude
    });

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
        data: task
    });
};

export const updateTask = async (req, res, next) => {
    const { taskId } = req.validated.params;
    const { workspaceId } = req.authorization;
    const userId = req.supabase.user.id;
    const { name, description, dueDate, completed, attachments } = req.validated.body;

    const data = {
        name,
        description,
        dueDate
    };

    if (completed !== undefined) {
        data.completedAt = completed ? new Date() : null;
    }

    // "attachments" present => full replacement of the set (existing rows deleted, the
    // provided set created). "attachments" omitted => leave attachments untouched, so a
    // plain name/description/dueDate edit doesn't require resending the file list.
    if (attachments !== undefined) {
        // workspaceId is already resolved by requireTaskWorkspaceMember middleware
        validateAttachmentPaths(attachments, workspaceId);
        data.attachments = {
            deleteMany: { taskId },
            create: attachments.map(({ fileName, fileSize, mimeType, storagePath }) => ({
                fileName,
                fileSize,
                mimeType,
                storagePath,
                uploadedById: userId
            }))
        };
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data,
        include: fullTaskInclude
    });

    res.status(200).json({
        message: "Task updated successfully.",
        data: task
    });
};

export const deleteTask = async (req, res, next) => {
    const { taskId } = req.validated.params;

    await prisma.$transaction(async (tx) => {
        const task = await tx.task.delete({
            where: { id: taskId }
        });

        await tx.task.updateMany({
            where: {
                listId: task.listId,
                position: {
                    gt: task.position
                }
            },
            data: {
                position: {
                    decrement: 1
                }
            }
        });
    });

    res.status(200).json({
        message: "Task deleted successfully"
    });
};

export const moveTask = async (req, res, next) => {
    const { taskId } = req.validated.params;
    const { listId: targetListId, position: reqPosition } = req.validated.body;

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: true }
    });

    const targetList = await prisma.list.findUnique({
        where: { id: targetListId }
    });

    if (!task || !targetList) {
        return res.status(404).json({ message: "Task or list not found" });
    }

    if (task.list.boardId !== targetList.boardId) {
        return res.status(400).json({ message: "Invalid list selected" });
    }

    const sourceListId = task.listId;
    const oldPosition = task.position;
    const isSameList = sourceListId === targetListId;

    // If position is not provided, auto-calculate as the end of the target list
    let newPosition = reqPosition;
    if (newPosition === undefined) {
        const lastTask = await prisma.task.findFirst({
            where: { listId: targetListId },
            orderBy: { position: 'desc' }
        });
        newPosition = lastTask ? lastTask.position + 1 : 0;
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
        if (isSameList) {
            if (oldPosition < newPosition) {
                await tx.task.updateMany({
                    where: {
                        listId: sourceListId,
                        position: { gt: oldPosition, lte: newPosition }
                    },
                    data: { position: { decrement: 1 } }
                });
            } else if (oldPosition > newPosition) {
                await tx.task.updateMany({
                    where: {
                        listId: sourceListId,
                        position: { gte: newPosition, lt: oldPosition }
                    },
                    data: { position: { increment: 1 } }
                });
            }
        } else {
            await tx.task.updateMany({
                where: {
                    listId: sourceListId,
                    position: { gt: oldPosition }
                },
                data: { position: { decrement: 1 } }
            });

            await tx.task.updateMany({
                where: {
                    listId: targetListId,
                    position: { gte: newPosition }
                },
                data: { position: { increment: 1 } }
            });
        }

        return await tx.task.update({
            where: { id: taskId },
            data: {
                listId: targetListId,
                position: newPosition
            },
            include: fullTaskInclude
        });
    });

    return res.status(200).json({
        message: "Task moved successfully",
        data: updatedTask
    });
};
