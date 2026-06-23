import { z } from "zod";

export const createAnnouncementSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Announcement title is required").max(255),
		content: z.string().min(1, "Announcement content is required").max(5000),
		pinned: z.boolean().optional()
	})
});

export const updateAnnouncementSchema = z.object({
	params: z.object({
		announcementId: z.string().uuid("Invalid announcement ID format")
	}),
	body: z.object({
		title: z.string().min(1, "Announcement title is required").max(255).optional(),
		content: z.string().min(1, "Announcement content is required").max(5000).optional(),
		pinned: z.boolean().optional()
	})
});

export const announcementIdParamSchema = z.object({
	params: z.object({
		announcementId: z.string().uuid("Invalid announcement ID format")
	})
});
