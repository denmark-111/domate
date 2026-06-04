import prisma from "../client.js";

const HADCODED_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export const createWorkspace = async (req, res) => {
	const { name, description } = req.validated.body;

	try{
		const workspace = await prisma.workspace.create({
			data: {
				name,
				description,
				ownerId: HADCODED_USER_ID
			}
		});
		res.status(201).json(workspace);
	} catch (error) {
		console.error("Error creating workspace:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};