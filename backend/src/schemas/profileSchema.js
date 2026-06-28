import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, "Full name is required").max(255).optional(),
        avatarUrl: z.string().max(512, "Avatar path is too long").optional().nullable()
    })
});
