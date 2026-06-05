import prisma from "../client.js";
import { Prisma } from "@prisma/client";

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export const getWorkspaces = async (req, res) => {
	try {
		const workspaces = await prisma.workspace.findMany({
			where: {
				ownerId: TEST_USER_ID
			}
		});
		res.status(200).json({
			data: workspaces
		});
	} catch (error) {
		console.error("Error fetching workspaces:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const createWorkspace = async (req, res) => {
	const { name, description } = req.validated.body;

	try{
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
	} catch (error) {
		console.error("Error creating workspace:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getWorkspaceById = async (req, res) => {
	const { id } = req.validated.params;

	try{
		const workspace = await prisma.workspace.findUnique({
			where: { id }
		});
		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found" });
		}
		res.status(200).json({
			data: workspace
		});
	} catch (error) {
		console.error("Error fetching workspace:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateWorkspace = async (req, res) => {
	const { id } = req.validated.params;
	const { name, description } = req.validated.body;

	try{
		const workspace = await prisma.workspace.update({
			where: { id },
			data: {
				name,
				description
			}
		});
		res.status(200).json({
			message: "Workspace updated successfully",
			data: workspace
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
			return res.status(404).json({ message: "Workspace not found" });
		}
		console.error("Error updating workspace:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteWorkspace = async (req, res) => {
	const { id } = req.validated.params;

	try {
		await prisma.workspace.delete({
			where: { id }
		});
		res.status(200).json({
			message: "Workspace deleted successfully"
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
			return res.status(404).json({ message: "Workspace not found" });
		}
		console.error("Error deleting workspace:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};