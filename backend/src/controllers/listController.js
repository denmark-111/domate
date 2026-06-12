import prisma from "../client.js";

export const getLists = async (req, res, next) => {
    const { boardId } = req.validated.params;

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
};

export const createList = async (req, res, next) => {
    const { boardId } = req.validated.params;
    const { name } = req.validated.body;

    const lastList = await prisma.list.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' }
    });

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
};

export const getListById = async (req, res, next) => {
    const { listId } = req.validated.params;

    const list = await prisma.list.findUnique({
        where: { id: listId }
    });

    if (!list) {
        return res.status(404).json({ message: "List not found" });
    }

    res.status(200).json({
        data: list
    });
};

export const updateList = async (req, res, next) => {
    const { listId } = req.validated.params;
    const { name, position } = req.validated.body;

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
};

export const deleteList = async (req, res, next) => {
    const { listId } = req.validated.params;

    await prisma.$transaction(async (tx) => {
        const list = await tx.list.delete({
            where: { id: listId }
        });

        await tx.list.updateMany({
            where: {
                boardId: list.boardId,
                position: {
                    gt: list.position
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
        message: "List deleted successfully"
    });
};
