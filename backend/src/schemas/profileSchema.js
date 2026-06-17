import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, "Full name is required").max(255).optional()
    })
});
