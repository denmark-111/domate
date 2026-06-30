import prisma from "../client.js";
import { WorkspaceRole } from "@prisma/client";

const workspaceSelect = {
  id: true,
  role: true,
  workspaceId: true
};

export const WorkspaceRoles = WorkspaceRole;

// Builds the optional Prisma role condition; an empty roles list allows any member role.
const roleFilter = (roles) => {
  if (!roles || roles.length === 0) {
    return {};
  }

  return { role: { in: roles } };
};

export const authorizationService = {
  // Params: workspaceId, authenticated userId, and optional allowed roles.
  async getWorkspaceMembership({ workspaceId, userId, roles }) {
    return prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        ...roleFilter(roles)
      },
      select: workspaceSelect
    });
  },

  // Params: invitationId, authenticated userId, and optional allowed roles.
  async getInvitationWorkspaceOwnership({ invitationId, userId }) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { workspaceId: true }
    });

    if (!invitation) return null;

    return this.getWorkspaceMembership({
      workspaceId: invitation.workspaceId,
      userId,
      roles: [WorkspaceRole.OWNER]
    });
  },

  // Params: boardId, authenticated userId, and optional allowed roles.
  async getBoardMembership({ boardId, userId, roles }) {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspace: {
          memberships: {
            some: {
              userId,
              ...roleFilter(roles)
            }
          }
        }
      },
      select: {
        id: true,
        workspaceId: true
      }
    });

    if (!board) {
      return null;
    }

    return {
      resourceId: board.id,
      workspaceId: board.workspaceId
    };
  },

  // Params: announcementId, authenticated userId, and optional allowed roles.
  async getAnnouncementMembership({ announcementId, userId, roles }) {
    const announcement = await prisma.announcement.findFirst({
      where: {
        id: announcementId,
        workspace: {
          memberships: {
            some: {
              userId,
              ...roleFilter(roles)
            }
          }
        }
      },
      select: {
        id: true,
        workspaceId: true
      }
    });

    if (!announcement) {
      return null;
    }

    return {
      resourceId: announcement.id,
      workspaceId: announcement.workspaceId
    };
  },

  // Params: listId, authenticated userId, and optional allowed roles.
  async getListMembership({ listId, userId, roles }) {
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        board: {
          workspace: {
            memberships: {
              some: {
                userId,
                ...roleFilter(roles)
              }
            }
          }
        }
      },
      select: {
        id: true,
        boardId: true,
        board: {
          select: {
            workspaceId: true
          }
        }
      }
    });

    if (!list) {
      return null;
    }

    return {
      resourceId: list.id,
      boardId: list.boardId,
      workspaceId: list.board.workspaceId
    };
  },

  // Params: chatMessageId, authenticated userId, and optional allowed roles.
  async getChatMessageMembership({ messageId, userId, roles }) {
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        workspace: {
          memberships: {
            some: {
              userId,
              ...roleFilter(roles)
            }
          }
        }
      },
      select: {
        id: true,
        workspaceId: true
      }
    });

    if (!message) {
      return null;
    }

    return {
      resourceId: message.id,
      workspaceId: message.workspaceId
    };
  },

  // Params: taskId, authenticated userId, and optional allowed roles.
  async getTaskMembership({ taskId, userId, roles }) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        list: {
          board: {
            workspace: {
              memberships: {
                some: {
                  userId,
                  ...roleFilter(roles)
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        listId: true,
        list: {
          select: {
            boardId: true,
            board: {
              select: {
                workspaceId: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return null;
    }

    return {
      resourceId: task.id,
      listId: task.listId,
      boardId: task.list.boardId,
      workspaceId: task.list.board.workspaceId
    };
  }
};
