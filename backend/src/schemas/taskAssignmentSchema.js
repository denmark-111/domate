import { z } from "zod";

export const setTaskAssigneesSchema = z.object({
    params: z.object({
        taskId: z.string().uuid("Invalid task ID format")
    }),
    body: z.object({
        userIds: z.array(z.string().uuid("Invalid user ID format"))
    })
});
