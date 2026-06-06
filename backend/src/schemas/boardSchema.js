import { z } from "zod";

export const createBoardSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Board name is required").max(255),
        description: z.string().max(500).optional()
    })
});

export const updateBoardSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid board ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Board name is required").max(255).optional(),
        description: z.string().max(500).optional(),
    })
});

export const boardIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid board ID format")
    })
});