import { z } from "zod";

export const createListSchema = z.object({
    body: z.object({
        name: z.string().min(1, "List name is required").max(255)
    })
});

export const updateListSchema = z.object({
    params: z.object({
        listId: z.string().uuid("Invalid list ID format")
    }),
    body: z.object({
        name: z.string().min(1, "List name is required").max(255).optional(),
        position: z.number().int().min(0).optional()
    })
});

export const listIdParamSchema = z.object({
    params: z.object({
        listId: z.string().uuid("Invalid list ID format")
    })
});