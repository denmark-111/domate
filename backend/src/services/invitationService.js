import crypto from "crypto";
import prisma from "../client.js";

const INVITATION_TTL_DAYS = 7;

export const invitationService = {
  /**
   * Create invitations for a list of emails.
   * Skips emails that are already members of the workspace.
   * Returns the created invitations.
   */
  async createInvitations({ workspaceId, invitedById, emails }) {
    // Find existing members to skip them
    const existingMembers = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          email: { in: emails }
        }
      },
      select: {
        user: { select: { email: true } }
      }
    });

    const existingEmails = new Set(existingMembers.map(m => m.user.email));

    // Find pending invitations that haven't expired — decline them so we can re-invite
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        email: { in: emails },
        status: "PENDING",
        expiresAt: { gt: new Date() }
      }
    });

    const pendingEmails = new Set(pendingInvitations.map(i => i.email));

    const newEmails = emails.filter(
      e => !existingEmails.has(e) && !pendingEmails.has(e)
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    // Create all invitations in a batch
    if (newEmails.length > 0) {
      await prisma.invitation.createMany({
        data: newEmails.map(email => ({
          email,
          token: crypto.randomUUID(),
          expiresAt,
          workspaceId,
          invitedById
        })),
        skipDuplicates: true
      });
    }

    return {
      created: newEmails.length,
      alreadyMember: existingEmails.size,
      alreadyPending: pendingEmails.size
    };
  },

  /**
   * Get the invitation by token.
   */
  async getByToken(token) {
    return prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  },

  /**
   * Accept an invitation: creates a workspace membership and marks the invitation as accepted.
   * Throws descriptive errors for invalid states.
   */
  async acceptInvitation({ token, userId }) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

    if (!invitation) {
      throw Object.assign(new Error("Invitation not found"), { statusCode: 404 });
    }

    if (invitation.status !== "PENDING") {
      if (invitation.status === "ACCEPTED") {
        throw Object.assign(new Error("This invitation has already been accepted"), { statusCode: 410 });
      }
      if (invitation.status === "DECLINED") {
        throw Object.assign(new Error("This invitation has been declined"), { statusCode: 410 });
      }
      throw Object.assign(new Error("This invitation is no longer valid"), { statusCode: 410 });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      throw Object.assign(new Error("This invitation has expired"), { statusCode: 410 });
    }

    // Get the accepting user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user || user.email !== invitation.email) {
      throw Object.assign(
        new Error("This invitation was sent to a different email address"),
        { statusCode: 403 }
      );
    }

    // Atomic: create membership + update invitation in a transaction
    const membership = await prisma.$transaction(async (tx) => {
      // Double-check not already a member (race condition guard)
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId
          }
        }
      });

      if (existing) {
        throw Object.assign(new Error("You are already a member of this workspace"), { statusCode: 409 });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      });

      return tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: "MEMBER"
        },
        select: {
          id: true,
          role: true,
          workspace: {
            select: { id: true, name: true }
          }
        }
      });
    });

    return {
      workspace: membership.workspace,
      role: membership.role
    };
  },

  /**
   * Revoke a pending invitation.
   */
  async revokeInvitation(invitationId) {
    const invitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" }
    });

    return invitation;
  },

  /**
   * Get pending invitations for a workspace.
   */
  async getByWorkspace(workspaceId) {
    return prisma.invitation.findMany({
      where: {
        workspaceId,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  },

  /**
   * Get pending invitations for a user by their email.
   */
  async getByEmail(email) {
    return prisma.invitation.findMany({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: { memberships: true }
            }
          }
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
  }
};
