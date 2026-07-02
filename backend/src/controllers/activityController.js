import prisma from "../client.js";

export const getRecent = async (req, res, next) => {
  const userId = req.supabase.user.id;
  const limit = req.validated.query.limit || 5; // Limit of recent workspaces and boards to return

  const visits = await prisma.recentVisit.findMany({
    where: { userId },
    orderBy: { visitedAt: "desc" },
    take: 50, // fetch enough to catch both recent workspaces and boards, then filter down to the limit
  });

  // Separate into workspaces and boards, preserving visit order
  const seenWorkspaceIds = new Set();
  const seenBoardIds = new Set();
  const recentWorkspaces = [];
  const recentBoards = [];

  for (const v of visits) {
    if (v.entityType === "workspace" && !seenWorkspaceIds.has(v.entityId)) {
        if (recentWorkspaces.length < limit) {
        seenWorkspaceIds.add(v.entityId);
        recentWorkspaces.push(v.entityId);
        }
    }
    if (v.entityType === "board" && !seenBoardIds.has(v.entityId)) {
        if (recentBoards.length < limit) {
        seenBoardIds.add(v.entityId);
        recentBoards.push(v.entityId);
        }
    }
    if (recentWorkspaces.length >= limit && recentBoards.length >= limit) break;
  }

  const [workspaces, boards] = await Promise.all([
    recentWorkspaces.length
      ? prisma.workspace.findMany({
          where: { id: { in: recentWorkspaces } },
          include: { _count: { select: { memberships: true } } },
        })
      : [],
    recentBoards.length
      ? prisma.board.findMany({
          where: { id: { in: recentBoards } },
          include: { workspace: { select: { id: true, name: true } } },
        })
      : [],
  ]);

  // Map type field for workspaces
  const formattedWorkspaces = workspaces.map((ws) => {
    const { _count, ...rest } = ws;
    return {
      ...rest,
      type: _count.memberships > 1 ? "team" : "personal",
    };
  });

  // Preserve the order from the visits
  const orderedWorkspaces = recentWorkspaces
    .map((id) => formattedWorkspaces.find((w) => w.id === id))
    .filter(Boolean);

  const orderedBoards = recentBoards
    .map((id) => boards.find((b) => b.id === id))
    .filter(Boolean);

  res.status(200).json({
    data: {
      recentWorkspaces: orderedWorkspaces,
      recentBoards: orderedBoards,
    },
  });
};

export const logVisit = async (req, res, next) => {
  const userId = req.supabase.user.id;
  const { entityType, entityId } = req.validated.body;

  await prisma.recentVisit.upsert({
    where: {
      userId_entityType_entityId: { userId, entityType, entityId },
    },
    update: { visitedAt: new Date() },
    create: { userId, entityType, entityId },
  });

  res.status(200).json({ message: "Visit logged" });
};