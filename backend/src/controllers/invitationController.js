import prisma from "../client.js";
import { invitationService } from "../services/invitationService.js";

export const createInvitations = async (req, res, next) => {
  const userId = req.supabase.user.id;
  const { workspaceId } = req.validated.params;
  const { emails } = req.validated.body;

  const result = await invitationService.createInvitations({
    workspaceId,
    invitedById: userId,
    emails
  });

  res.status(201).json({
    message: "Invitations processed",
    data: result
  });
};

export const getWorkspaceInvitations = async (req, res, next) => {
  const { workspaceId } = req.validated.params;

  const invitations = await invitationService.getByWorkspace(workspaceId);

  res.status(200).json({
    data: invitations
  });
};

export const revokeInvitation = async (req, res, next) => {
  const { invitationId } = req.validated.params;

  await invitationService.revokeInvitation(invitationId);

  res.status(200).json({
    message: "Invitation revoked successfully"
  });
};

export const getInvitationByToken = async (req, res, next) => {
  const { token } = req.validated.params;

  const invitation = await invitationService.getByToken(token);

  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return res.status(410).json({
      message: "This invitation is no longer valid",
      data: {
        status: invitation.expiresAt < new Date() ? "EXPIRED" : invitation.status
      }
    });
  }

  res.status(200).json({
    data: {
      workspace: invitation.workspace,
      invitedAt: invitation.createdAt
    }
  });
};

export const acceptInvitation = async (req, res, next) => {
  const userId = req.supabase.user.id;
  const { token } = req.validated.params;

  try {
    const result = await invitationService.acceptInvitation({ token, userId });

    res.status(200).json({
      message: `You have joined ${result.workspace.name}`,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
};

export const getMyInvitations = async (req, res, next) => {
  const userId = req.supabase.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user?.email) {
    return res.status(200).json({ data: [] });
  }

  const invitations = await invitationService.getByEmail(user.email);

  res.status(200).json({
    data: invitations
  });
};
