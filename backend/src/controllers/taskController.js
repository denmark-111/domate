import prisma from "../client.js";

export const getTasks = async (req, res, next) => {
    const { listId } = req.validated.params;

    const tasks = await prisma.task.findMany({
        where: {
            listId
        },
        orderBy: {
            position: 'asc'
        }
    });

    res.status(200).json({
        data: tasks
    });
};

export const createTask = async (req, res, next) => {
    const { listId } = req.validated.params;
    const { name, description } = req.validated.body;

    const listExists = await prisma.list.findUnique({
        where: { id: listId }
    });

    if (!listExists) {
        return res.status(404).json({ message: "List not found" });
    }

    const lastTask = await prisma.task.findFirst({
        where: { listId },
        orderBy: { position: 'desc' }
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await prisma.task.create({
        data: {
            name,
            description,
            position,
            listId
        }
    });

    res.status(201).json({
        message: "Task created successfully",
        data: task
    });
};

export const getTaskById = async (req, res, next) => {
    const { taskId } = req.validated.params;

    const task = await prisma.task.findUnique({
        where: { id: taskId }
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
    const { name, description } = req.validated.body;

    const task = await prisma.task.update({
        where: { id: taskId },
        data: {
            name,
            description
        }
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
    const { listId: targetListId, position: newPosition } = req.validated.body;

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
            }
        });
    });

    return res.status(200).json({
        message: "Task moved successfully",
        data: updatedTask
    });
};