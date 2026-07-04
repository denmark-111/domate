import prisma from "../client.js";

export const getBoardLabels = async (req, res, next) => {
    const { boardId } = req.validated.params;

    const labels = await prisma.boardLabel.findMany({
        where: { boardId },
        orderBy: { name: "asc" }
    });

    res.status(200).json({
        data: labels
    });
};

export const createBoardLabel = async (req, res, next) => {
    const { boardId } = req.validated.params;
    const { name, color } = req.validated.body;

    const label = await prisma.boardLabel.create({
        data: {
            name,
            color,
            boardId
        }
    });

    res.status(201).json({
        message: "Label created successfully",
        data: label
    });
};

export const updateBoardLabel = async (req, res, next) => {
    const { labelId } = req.validated.params;
    const { name, color } = req.validated.body;

    const existing = await prisma.boardLabel.findUnique({
        where: { id: labelId }
    });

    if (!existing) {
        return res.status(404).json({ message: "Label not found" });
    }

    const label = await prisma.boardLabel.update({
        where: { id: labelId },
        data: {
            name,
            color
        }
    });

    res.status(200).json({
        message: "Label updated successfully",
        data: label
    });
};

export const deleteBoardLabel = async (req, res, next) => {
    const { labelId } = req.validated.params;

    const existing = await prisma.boardLabel.findUnique({
        where: { id: labelId }
    });

    if (!existing) {
        return res.status(404).json({ message: "Label not found" });
    }

    await prisma.boardLabel.delete({
        where: { id: labelId }
    });

    res.status(200).json({
        message: "Label deleted successfully"
    });
};
