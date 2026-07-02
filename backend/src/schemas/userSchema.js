import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, "Full name is required").max(255).optional(),
        avatarUrl: z.string().max(512, "Avatar path is too long").optional().nullable()
    })
});

export const searchUsersSchema = z.object({
    query: z.object({
        q: z.string().min(2, "Search query must be at least 2 characters").max(100)
    })
});

export const userIdParamSchema = z.object({
    params: z.object({
        userId: z.string().uuid("Invalid user ID format")
    })
});

export const logVisitSchema = z.object({
    body: z.object({
        entityType: z.enum(["workspace", "board"], {
            errorMap: () => ({ message: "entityType must be 'workspace' or 'board'" })
        }),
        entityId: z.string().uuid("Invalid entity ID format")
    })
});

export const getRecentSchema = z.object({
	query: z.object({
		limit: z.coerce.number().int().positive().max(100).optional()
	})
});
