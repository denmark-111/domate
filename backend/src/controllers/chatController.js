import prisma from "../client.js";
import { ApiError } from "../middleware/errorHandler.js";
import { broadcastChat } from "../services/realtimeService.js";

const fullMessageInclude = {
    author: {
        select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
        }
    }
};

export const getMessages = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const { page = 1, limit = 50 } = req.validated.query || {};
    const offset = ((page ?? 1) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
        prisma.chatMessage.findMany({
            where: {
                workspaceId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: fullMessageInclude,
            skip: Number(offset),
            take: Number(limit)
        }),
        prisma.chatMessage.count({
            where: {
                workspaceId
            }
        })
    ]);

    res.status(200).json({
        data: messages.reverse(),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: Number(offset) + messages.length < total
        }
    });
};

export const sendMessage = async (req, res, next) => {
    const { workspaceId } = req.validated.params;
    const userId = req.supabase.user.id;
    const { content } = req.validated.body;

    const message = await prisma.chatMessage.create({
        data: {
            content,
            authorId: userId,
            workspaceId
        },
        include: fullMessageInclude
    });

    broadcastChat(workspaceId, 'new-message', message).catch(() => {});

    res.status(201).json({
        message: "Message sent successfully",
        data: message
    });
};

export const deleteMessage = async (req, res, next) => {
    const { messageId } = req.validated.params;
    const userId = req.supabase.user.id;

    const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { authorId: true, workspaceId: true }
    });

    if (!message) {
        return res.status(404).json({ message: "Message not found" });
    }

    if (message.authorId !== userId) {
        return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await prisma.chatMessage.delete({
        where: { id: messageId }
    });

    broadcastChat(message.workspaceId, 'delete-message', { messageId }).catch(() => {});

    res.status(200).json({
        message: "Message deleted successfully"
    });
};