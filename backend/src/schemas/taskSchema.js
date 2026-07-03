import { z } from "zod";

// Files attached to a task. The frontend uploads to Supabase Storage first,
// then submits the resulting path + metadata here. The DB id is backend-generated.
const attachmentInput = z.object({
	fileName: z.string().min(1, "File name is required").max(255),
	fileSize: z.number().int().positive("File size must be a positive integer").max(10 * 1024 * 1024, "File size exceeds the 10 MB limit"),
	mimeType: z.string().min(1, "MIME type is required").max(255),
	storagePath: z.string().min(1, "Storage path is required").max(500)
});

export const createTaskSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Task name is required").max(255),
        description: z.string().max(500).optional(),
        dueDate: z.coerce.date().optional(),
        attachments: z.array(attachmentInput).optional()
    })
});

export const updateTaskSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Task name is required").max(255).optional(),
        description: z.string().max(500).optional(),
        dueDate: z.coerce.date().optional().nullable(),
        completed: z.boolean().optional(),
        // When present, attachments are treated as the full intended set (removed ones are
        // pruned). When omitted, existing attachments are left untouched.
        attachments: z.array(attachmentInput).optional()
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
        position: z.number().int().min(0).optional()
    })
});
