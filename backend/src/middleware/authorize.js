import { authorizationService, WorkspaceRoles } from "../services/authorizationService.js";
import { ApiError } from "./errorHandler.js";

const asArray = (roles) => {
  if (!roles) {
    return [];
  }

  return Array.isArray(roles) ? roles : [roles];
};

const getUserId = (req) => req.supabase?.user?.id;

// Stores ids found during authorization for downstream controllers.
const attachAuthorization = (req, data) => {
  req.authorization = {
    ...(req.authorization || {}),
    ...data
  };
};

/* Middleware factory
 * Params: 
 * resolver(req, userId, roles) returns access data or null.
 * options.roles limits allowed workspace roles; status/message customize denied responses.
 */
const requireAuthorized = (resolver, options = {}) => {
  const roles = asArray(options.roles);

  return async (req, res, next) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        throw new ApiError(401, "Authentication required");
      }

      const authorization = await resolver(req, userId, roles);

      if (!authorization) {
        throw new ApiError(options.status || 404, options.message || "Resource not found");
      }

      attachAuthorization(req, authorization);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Requires membership for routes with :workspaceId in validated params.
export const requireWorkspaceMember = requireAuthorized((req, userId, roles) => {
  const { workspaceId } = req.validated.params;
  return authorizationService.getWorkspaceMembership({ workspaceId, userId, roles });
});

// Requires OWNER role for routes with :workspaceId in validated params.
export const requireWorkspaceOwner = requireAuthorized((req, userId) => {
  const { workspaceId } = req.validated.params;
  return authorizationService.getWorkspaceMembership({
    workspaceId,
    userId,
    roles: [WorkspaceRoles.OWNER]
  });
}, {
  status: 403,
  message: "Only workspace owners can perform this action"
});

// Requires OWNER role for the workspace the invitation belongs to.
export const requireInvitationWorkspaceOwner = requireAuthorized((req, userId) => {
  const { invitationId } = req.validated.params;
  return authorizationService.getInvitationWorkspaceOwnership({ invitationId, userId });
}, {
  status: 403,
  message: "Only workspace owners can perform this action"
});

// Checks workspace membership through the board's workspace.
export const requireBoardWorkspaceMember = requireAuthorized((req, userId, roles) => {
  const { boardId } = req.validated.params;
  return authorizationService.getBoardMembership({ boardId, userId, roles });
});

// Checks workspace membership through the announcement's workspace.
export const requireAnnouncementWorkspaceMember = requireAuthorized((req, userId, roles) => {
  const { announcementId } = req.validated.params;
  return authorizationService.getAnnouncementMembership({ announcementId, userId, roles });
});

// Requires OWNER role for an announcement's workspace.
export const requireAnnouncementWorkspaceOwner = requireAuthorized((req, userId) => {
  const { announcementId } = req.validated.params;
  return authorizationService.getAnnouncementMembership({
    announcementId,
    userId,
    roles: [WorkspaceRoles.OWNER]
  });
}, {
  status: 403,
  message: "Only workspace owners can perform this action"
});

// Checks workspace membership through the list's board and workspace.
export const requireListWorkspaceMember = requireAuthorized((req, userId, roles) => {
  const { listId } = req.validated.params;
  return authorizationService.getListMembership({ listId, userId, roles });
});

// Checks workspace membership through the task's list, board, and workspace.
export const requireTaskWorkspaceMember = requireAuthorized((req, userId, roles) => {
  const { taskId } = req.validated.params;
  return authorizationService.getTaskMembership({ taskId, userId, roles });
});
