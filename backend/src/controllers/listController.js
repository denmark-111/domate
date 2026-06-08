import prisma from "../client.js";
import { Prisma } from "@prisma/client";

export const getLists = async (req, res) => {
    const { boardId } = req.validated.params;

    try {
        const lists = await prisma.list.findMany({
            where: {
                boardId
            },
            orderBy: {
                position: 'asc'
            }
        });
        res.status(200).json({
            data: lists
        });
    } catch (error) {
        console.error("Error fetching lists:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createList = async (req, res) => {
    const { boardId } = req.validated.params;
    const { name } = req.validated.body;

    try {
        // Get the highest position in the board
        const lastList = await prisma.list.findFirst({
            where: { boardId },
            orderBy: { position: 'desc' }
        });

        // Set position to last list's position + 1, or 0 if no lists exist
        const position = lastList ? lastList.position + 1 : 0;

        const list = await prisma.list.create({
            data: {
                name,
                position,
                boardId
            }
        });
        res.status(201).json({
            message: "List created successfully",
            data: list
        });
    } catch (error) {
        console.error("Error creating list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getListById = async (req, res) => {
    const { listId } = req.validated.params;

    try {
        const list = await prisma.list.findUnique({
            where: { id: listId }
        });
        if (!list) {
            return res.status(404).json({ message: "List not found" });
        }
        res.status(200).json({
            data: list
        });
    } catch (error) {
        console.error("Error fetching list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateList = async (req, res) => {
    const { listId } = req.validated.params;
    const { name, position } = req.validated.body;

    try {
        const existingList = await prisma.list.findUnique({
            where: { id: listId }
        });

        if (!existingList) {
            return res.status(404).json({ message: "List not found" });
        }

        const updatedList = await prisma.$transaction(async (tx) => {

            if (position !== undefined && position !== existingList.position) {
                const oldPosition = existingList.position;

                if (oldPosition < position) {
                    // Moving right
                    await tx.list.updateMany({
                        where: {
                            boardId: existingList.boardId,
                            position: {
                                gt: oldPosition,
                                lte: position
                            }
                        },
                        data: {
                            position: {
                                decrement: 1
                            }
                        }
                    });
                } else {
                    // Moving left
                    await tx.list.updateMany({
                        where: {
                            boardId: existingList.boardId,
                            position: {
                                gte: position,
                                lt: oldPosition
                            }
                        },
                        data: {
                            position: {
                                increment: 1
                            }
                        }
                    });
                }
            }

            return await tx.list.update({
                where: { id: listId },
                data: {
                    name,
                    position
                }
            });
        });

        return res.status(200).json({
            message: "List updated successfully.",
            data: updatedList
        });

    } catch (error) {
        console.error("Error updating list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteList = async (req, res) => {
    const { listId } = req.validated.params;

    try {
        await prisma.list.delete({
            where: { id: listId }
        });
        res.status(200).json({
            message: "List deleted successfully"
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "List not found" });
        }
        console.error("Error deleting list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
