import { z } from "zod";

export const searchMyStuffSchema = z.object({
  query: z.object({
    q: z.string().min(2, "Search query must be at least 2 characters").max(100),
  }),
});
