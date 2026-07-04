import prisma from "../client.js";

export const getTaskLabels = async (req, res, next) => {
    const { taskId } = req.validated.params;

    const taskLabels = await prisma.taskLabel.findMany({
        where: { taskId },
        include: {
            boardLabel: true
        }
    });

    res.status(200).json({
        data: taskLabels
    });
};

export const setTaskLabels = async (req, res, next) => {
    const { taskId } = req.validated.params;
    const { labelIds } = req.validated.body;

    // Verify all labelIds exist and belong to the same board as the task
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            list: {
                select: { boardId: true }
            }
        }
    });

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    if (labelIds.length > 0) {
        const labels = await prisma.boardLabel.findMany({
            where: {
                id: { in: labelIds },
                boardId: task.list.boardId
            },
            select: { id: true }
        });

        const validIds = new Set(labels.map(l => l.id));
        const invalidIds = labelIds.filter(id => !validIds.has(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                message: `Labels not found or not on this board: ${invalidIds.join(", ")}`
            });
        }
    }

    // Full replacement of task labels
    const taskLabels = await prisma.$transaction(async (tx) => {
        await tx.taskLabel.deleteMany({
            where: { taskId }
        });

        if (labelIds.length > 0) {
            await tx.taskLabel.createMany({
                data: labelIds.map(boardLabelId => ({
                    taskId,
                    boardLabelId
                }))
            });
        }

        return tx.taskLabel.findMany({
            where: { taskId },
            include: {
                boardLabel: true
            }
        });
    });

    res.status(200).json({
        message: "Task labels updated successfully",
        data: taskLabels
    });
};
