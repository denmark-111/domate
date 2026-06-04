import { z } from "zod";

export const createWorkspaceSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Workspace name is required").max(255),
		description: z.string().max(500).optional()
	})
});

export const updateWorkspaceSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Workspace name is required").max(255).optional(),
		description: z.string().max(500).optional(),
	})
});

export const workspaceIdParamSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid workspace ID format")
	})
});