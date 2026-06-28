import { z } from "zod";

// Nested under /workspaces/:workspaceId/invitations — workspaceId validated by parent route
export const createInvitationSchema = z.object({
	body: z.object({
		emails: z
			.array(z.string().email("Invalid email format"))
			.min(1, "At least one email is required")
			.max(20, "Cannot invite more than 20 people at once")
	})
});

// Nested under /workspaces/:workspaceId/invitations
// Top-level: GET /invitations/:invitationId, POST /invitations/:invitationId/accept, DELETE /invitations/:invitationId
export const invitationIdParamSchema = z.object({
	params: z.object({
		invitationId: z.string().uuid("Invalid invitation ID format")
	})
});
