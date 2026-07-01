import prisma from "../client.js";

const fullBoardInclude = {
    lists: {
        orderBy: { position: "asc" },
        include: {
            tasks: {
                orderBy: { position: "asc" },
                include: {
                    _count: {
                        select: { comments: true }
                    }
                }
            }
        }
    }
}

export const getBoards = async (req, res, next) => {
    const { workspaceId } = req.validated.params;

    const boards = await prisma.board.findMany({
        where: {
            workspaceId
        }
    });

    res.status(200).json({
        data: boards
    });
};

export const createBoard = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const { name, description } = req.validated.body;

    const board = await prisma.board.create({
        data: {
            name,
            description,
            workspaceId
        },
        include: fullBoardInclude
    });

    res.status(201).json({
        message: "Board created successfully",
        data: board
    });
};

export const getBoardById = async (req, res, next) => {
    const { boardId } = req.validated.params;

    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: fullBoardInclude
    });

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json({
        data: board
    });
};

export const updateBoard = async (req, res, next) => {
    const { boardId } = req.validated.params;
    const { name, description } = req.validated.body;

    const board = await prisma.board.update({
        where: { id: boardId },
        data: {
            name,
            description
        },
        include: fullBoardInclude
    });

    res.status(200).json({
        message: "Board updated successfully",
        data: board
    });
};

export const deleteBoard = async (req, res, next) => {
    const { boardId } = req.validated.params;

    await prisma.board.delete({
        where: { id: boardId }
    });

    res.status(200).json({
        message: "Board deleted successfully"
    });
};
