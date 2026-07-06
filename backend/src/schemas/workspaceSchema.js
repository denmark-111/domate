import { z } from "zod";

export const createWorkspaceSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Workspace name is required").max(255),
		description: z.string().max(500).optional(),
		color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
		coverImage: z.string().optional()
	})
});

export const updateWorkspaceSchema = z.object({
	params: z.object({
		workspaceId: z.string().uuid("Invalid workspace ID format")
	}),
	body: z.object({
		name: z.string().min(1, "Workspace name is required").max(255).optional(),
		description: z.string().max(500).optional(),
		color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
		coverImage: z.string().optional()
	})
});

export const workspaceIdParamSchema = z.object({
	params: z.object({
		workspaceId: z.string().uuid("Invalid workspace ID format")
	})
});