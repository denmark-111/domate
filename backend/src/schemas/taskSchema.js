import { z } from "zod";

export const createTaskSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Task name is required").max(255),
        description: z.string().max(500).optional(),
        dueDate: z.coerce.date().optional()
    })
});

export const updateTaskSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Task name is required").max(255).optional(),
        description: z.string().max(500).optional(),
        dueDate: z.coerce.date().optional().nullable()
    })
});

export const taskIdParamSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    })
});

export const moveTaskSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    }),
    body: z.object({
        listId: z.string().uuid("Invalid list ID format"),
        position: z.number().int().min(0)
    })
});