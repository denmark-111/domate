import { z } from "zod";

// Files attached to an announcement. The frontend uploads to Supabase Storage first
// (constructing its own storagePath, since Supabase requires the caller to supply one),
// then submits the resulting path + metadata here. The DB id is backend-generated.
const attachmentInput = z.object({
	fileName: z.string().min(1, "File name is required").max(255),
	fileSize: z.number().int().positive("File size must be a positive integer").max(10 * 1024 * 1024, "File size exceeds the 10 MB limit"),
	mimeType: z.string().min(1, "MIME type is required").max(255),
	storagePath: z.string().min(1, "Storage path is required").max(500)
});

export const createAnnouncementSchema = z.object({
	body: z.object({
		title: z.string().min(1, "Announcement title is required").max(255),
		content: z.string().min(1, "Announcement content is required").max(5000),
		pinned: z.boolean().optional(),
		attachments: z.array(attachmentInput).optional()
	})
});

export const updateAnnouncementSchema = z.object({
	params: z.object({
		announcementId: z.string().uuid("Invalid announcement ID format")
	}),
	body: z.object({
		title: z.string().min(1, "Announcement title is required").max(255).optional(),
		content: z.string().min(1, "Announcement content is required").max(5000).optional(),
		pinned: z.boolean().optional(),
		// When present, attachments are treated as the full intended set (removed ones are
		// pruned). When omitted, existing attachments are left untouched.
		attachments: z.array(attachmentInput).optional()
	})
});

export const announcementIdParamSchema = z.object({
	params: z.object({
		announcementId: z.string().uuid("Invalid announcement ID format")
	})
});
