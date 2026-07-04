import { z } from "zod";

export const labelColorRegex = /^#[0-9a-fA-F]{6}$/;

export const createBoardLabelSchema = z.object({
    params: z.object({
        boardId: z.string().uuid("Invalid board ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Label name is required").max(50),
        color: z.string().regex(labelColorRegex, "Color must be a valid hex color (e.g. #FF0000)")
    })
});

export const updateBoardLabelSchema = z.object({
    params: z.object({
        boardId: z.string().uuid("Invalid board ID format"),
        labelId: z.string().uuid("Invalid label ID format")
    }),
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(labelColorRegex, "Color must be a valid hex color").optional()
    })
});

export const boardLabelIdParamSchema = z.object({
    params: z.object({
        boardId: z.string().uuid("Invalid board ID format"),
        labelId: z.string().uuid("Invalid label ID format")
    })
});

export const setTaskLabelsSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    }),
    body: z.object({
        labelIds: z.array(z.string().uuid("Invalid label ID format"))
    })
});
