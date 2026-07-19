import { Prisma } from "@prisma/client";
import prisma from "../client.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createNotifications } from "./notificationService.js";

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

    // Find pending invitations that haven't expired
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
          expiresAt,
          workspaceId,
          invitedById
        })),
        skipDuplicates: true
      });
    }

    // Create notifications for existing users matching invited emails
    if (newEmails.length > 0) {
      const invitedUsers = await prisma.user.findMany({
        where: { email: { in: newEmails } },
        select: { id: true }
      });

      if (invitedUsers.length > 0) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { name: true }
        });

        await createNotifications({
          userIds: invitedUsers.map(u => u.id),
          actorId: invitedById,
          type: 'invitation',
          data: {
            title: `Invited to ${workspace.name}`,
            body: `You've been invited to join "${workspace.name}"`,
            workspaceId,
            workspaceName: workspace.name,
            url: `/settings`
          }
        });
      }
    }

    return {
      created: newEmails.length,
      alreadyMember: existingEmails.size,
      alreadyPending: pendingEmails.size
    };
  },

  /**
   * Get the invitation by id.
   */
  async getById(id) {
    return prisma.invitation.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  },

  /**
   * Accept an invitation: creates a workspace membership and marks the invitation as accepted.
   * Throws ApiError for invalid / expired / not-found states.
   */
  async acceptInvitation({ id, userId }) {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new ApiError(410, "This invitation is no longer valid");
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      throw new ApiError(410, "This invitation is no longer valid");
    }

    // Check the accepting user matches the invited email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user || user.email !== invitation.email) {
      throw new ApiError(403, "This invitation was sent to a different email address");
    }

    // Atomic transaction: claim the invitation + create membership.
    // updateMany with where:{status:"PENDING"} acts as a gate:
    // only one concurrent request wins, the other gets count===0.
    const membership = await prisma.$transaction(async (tx) => {
      const result = await tx.invitation.updateMany({
        where: { id: invitation.id, status: "PENDING" },
        data: { status: "ACCEPTED" }
      });

      if (result.count === 0) {
        throw new ApiError(410, "This invitation is no longer valid");
      }

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
    }).catch((error) => {
      // Convert unique constraint violation (duplicate membership) to a 409
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(409, "You are already a member of this workspace");
      }
      throw error; // re-throw ApiError or anything else
    });

    return {
      workspace: membership.workspace,
      role: membership.role
    };
  },

  /**
   * Revoke a pending invitation (owner action).
   */
  async revokeInvitation(invitationId) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" }
    });
  },

  /**
   * Decline a pending invitation (invited user action).
   * Verifies the user's email matches the invitation.
   */
  async declineInvitation({ id, userId }) {
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new ApiError(410, "This invitation is no longer valid");
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      throw new ApiError(410, "This invitation is no longer valid");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user || user.email !== invitation.email) {
      throw new ApiError(403, "This invitation was sent to a different email address");
    }

    const result = await prisma.invitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { status: "DECLINED" }
    });

    if (result.count === 0) {
      throw new ApiError(410, "This invitation is no longer valid");
    }
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
