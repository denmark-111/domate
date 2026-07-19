import prisma from "../client.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createNotifications } from "../services/notificationService.js";

export const getTaskAssignees = async (req, res, next) => {
    const { taskId } = req.validated.params;

    const assignments = await prisma.taskAssignment.findMany({
        where: { taskId },
        select: {
            id: true,
            userId: true,
            assignedById: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true
                }
            },
            assignedBy: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        }
    });

    res.status(200).json({
        data: assignments
    });
};

export const setTaskAssignees = async (req, res, next) => {
    const { taskId } = req.validated.params;
    const { userIds } = req.validated.body;
    const currentUserId = req.supabase.user.id;

    // Resolve workspaceId from authorization (set by requireTaskWorkspaceMember)
    const { workspaceId } = req.authorization;

    // Validate all userIds are workspace members
    if (userIds.length > 0) {
        const memberCount = await prisma.workspaceMember.count({
            where: {
                workspaceId,
                userId: { in: userIds }
            }
        });

        if (memberCount !== userIds.length) {
            throw new ApiError(422, "One or more users are not members of this workspace");
        }
    }

    // Get existing assignees before replacement
    const existingAssignments = await prisma.taskAssignment.findMany({
        where: { taskId },
        select: { userId: true }
    });
    const existingUserIds = new Set(existingAssignments.map(a => a.userId));

    // Determine newly assigned users (excluding self-assignment)
    const newUserIds = userIds.filter(
        id => !existingUserIds.has(id) && id !== currentUserId
    );

    // Full replacement
    const assignments = await prisma.$transaction(async (tx) => {
        await tx.taskAssignment.deleteMany({
            where: { taskId }
        });

        if (userIds.length > 0) {
            await tx.taskAssignment.createMany({
                data: userIds.map(userId => ({
                    taskId,
                    userId,
                    assignedById: currentUserId
                }))
            });
        }

        return tx.taskAssignment.findMany({
            where: { taskId },
            select: {
                id: true,
                userId: true,
                assignedById: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true
                    }
                },
                assignedBy: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });
    });

    // Create notifications for newly assigned users
    if (newUserIds.length > 0) {
        const [task, currentUser, workspace] = await Promise.all([
            prisma.task.findUnique({
                where: { id: taskId },
                select: { name: true }
            }),
            prisma.user.findUnique({
                where: { id: currentUserId },
                select: { fullName: true }
            }),
            prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { name: true }
            })
        ]);

        await createNotifications({
            userIds: newUserIds,
            actorId: currentUserId,
            type: 'task_assignment',
            data: {
                title: `Assigned to "${task.name}"`,
                body: `${currentUser.fullName || 'Someone'} assigned you to this task`,
                taskId,
                workspaceId,
                workspaceName: workspace.name,
                url: `/workspaces/${workspaceId}`
            }
        });
    }

    res.status(200).json({
        message: "Task assignees updated successfully",
        data: assignments
    });
};
