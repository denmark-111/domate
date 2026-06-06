import prisma from "../client.js";
import { Prisma } from "@prisma/client";

export const getBoards = async (req, res) => {
    const { workspaceId } = req.validated.params;

	try {
		const boards = await prisma.board.findMany({
			where: {
				workspaceId
			}
		});
		res.status(200).json({
			data: boards
		});
	} catch (error) {
		console.error("Error fetching boards:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const createBoard = async (req, res) => {
    const { workspaceId } = req.validated.params;
    const { name, description } = req.validated.body;

    try{
        const board = await prisma.board.create({
            data: {
                name,
                description,
                workspaceId
            }
        })
        res.status(201).json({
            message: "Board created successfully",
            data: board
        });
    } catch (error) {
        console.error("Error creating board:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getBoardById = async (req, res) =>{
    const { boardId } = req.validated.params;

    try{
        const board = await prisma.board.findUnique({
            where: { id: boardId }
        });
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }
        res.status(200).json({
            data: board
        });
    } catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
