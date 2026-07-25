import prisma from "../client.js";
import { broadcastBoard } from "../services/realtimeService.js";

const fullCommentInclude = {
  author: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true
    }
  }
};

export const getComments = async (req, res, next) => {
  const { taskId } = req.validated.params;
  const { page = 1, limit = 50 } = req.validated.query || {};
  const offset = ((page ?? 1) - 1) * Number(limit);

  const [comments, total] = await Promise.all([
    prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: fullCommentInclude,
      skip: Number(offset),
      take: Number(limit)
    }),
    prisma.taskComment.count({ where: { taskId } })
  ]);

  res.status(200).json({
    data: comments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: Number(offset) + comments.length < total
    }
  });
};

export const createComment = async (req, res, next) => {
  const { taskId } = req.validated.params;
  const { boardId } = req.authorization || {};
  const userId = req.supabase.user.id;
  const { content } = req.validated.body;

  const comment = await prisma.taskComment.create({
    data: {
      content,
      authorId: userId,
      taskId
    },
    include: fullCommentInclude
  });

  if (boardId) {
    broadcastBoard(boardId, 'task:comment', { taskId, action: 'create', comment }).catch(() => {});
  }

  res.status(201).json({
    message: "Comment created successfully",
    data: comment
  });
};

export const deleteComment = async (req, res, next) => {
  const { commentId } = req.validated.params;
  const userId = req.supabase.user.id;

  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      taskId: true,
      task: {
        select: {
          list: {
            select: {
              boardId: true
            }
          }
        }
      }
    }
  });

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({ message: "You can only delete your own comments" });
  }

  await prisma.taskComment.delete({ where: { id: commentId } });

  const boardId = req.authorization?.boardId || comment.task?.list?.boardId;
  if (boardId) {
    broadcastBoard(boardId, 'task:comment', { taskId: comment.taskId, action: 'delete', commentId }).catch(() => {});
  }

  res.status(200).json({ message: "Comment deleted successfully" });
};



