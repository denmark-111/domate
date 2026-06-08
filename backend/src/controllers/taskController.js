import prisma from "../client.js";
import { Prisma } from "@prisma/client";

export const getTasks = async (req, res) => {
    const { listId } = req.validated.params;
    
    try {
        const tasks = await prisma.task.findMany({
            where: {
                listId
            }
        });
        res.status(200).json({
            data: tasks
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createTask = async (req, res) => {
    const { listId } = req.validated.params;
    const { name, description, position } = req.validated.body;

    try {
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
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTaskById = async (req, res) => {
    const { taskId } = req.validated.params;

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.status(200).json({
            data: task
        });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateTask = async (req, res) => {
    const { taskId } = req.validated.params;
    const { name, description } = req.validated.body;

    try {
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
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteTask = async (req, res) => {
    const { taskId } = req.validated.params;

    try {
        await prisma.task.delete({
            where: { id: taskId }
        });
        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const moveTask = async (req, res) => {
    const { taskId } = req.validated.params;
    const { listId: targetListId, position: newPosition } = req.validated.body;

    try {
        // 1. Fetch task and its current state
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

        // 2. Execute all updates in a single, safe transaction
        const updatedTask = await prisma.$transaction(async (tx) => {
            
            if (isSameList) {
                // --- CASE A: MOVING WITHIN THE SAME LIST ---
                if (oldPosition < newPosition) {
                    // Moving down: Shift intermediate tasks UP (decrement)
                    await tx.task.updateMany({
                        where: {
                            listId: sourceListId,
                            position: { gt: oldPosition, lte: newPosition }
                        },
                        data: { position: { decrement: 1 } }
                    });
                } else if (oldPosition > newPosition) {
                    // Moving up: Shift intermediate tasks DOWN (increment)
                    await tx.task.updateMany({
                        where: {
                            listId: sourceListId,
                            position: { gte: newPosition, lt: oldPosition }
                        },
                        data: { position: { increment: 1 } }
                    });
                }
            } else {
                // --- CASE B: MOVING TO A DIFFERENT LIST ---
                // Step 1: Close the gap left behind in the source list
                await tx.task.updateMany({
                    where: {
                        listId: sourceListId,
                        position: { gt: oldPosition }
                    },
                    data: { position: { decrement: 1 } }
                });

                // Step 2: Make room in the target list
                await tx.task.updateMany({
                    where: {
                        listId: targetListId,
                        position: { gte: newPosition }
                    },
                    data: { position: { increment: 1 } }
                });
            }

            // --- Step 3: Finally, update the moved task itself ---
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

    } catch (error) {
        console.error("Error moving task:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};