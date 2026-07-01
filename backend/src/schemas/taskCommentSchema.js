import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Comment content is required").max(5000, "Comment exceeds the 5000 character limit")
  })
});

export const listCommentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});

export const commentIdParamSchema = z.object({
  params: z.object({
    commentId: z.string().uuid("Invalid comment ID format")
  })
});
