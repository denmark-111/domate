import { z } from "zod";

export const sendMessageSchema = z.object({
	body: z.object({
		content: z.string().min(1, "Message content is required").max(5000, "Message content exceeds the 5000 character limit")
	})
});

export const listMessagesSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().optional(),
		limit: z.coerce.number().int().positive().max(100).optional()
	})
});

export const messageIdParamSchema = z.object({
	params: z.object({
		messageId: z.string().uuid("Invalid message ID format")
	})
});