import prisma from "../client.js";

export const searchMyStuff = async (req, res, next) => {
  const userId = req.supabase.user.id;
  const { q } = req.validated.query;

  const [workspaces, boards] = await Promise.all([
    prisma.workspace.findMany({
      where: {
        memberships: { some: { userId } },
        name: { contains: q, mode: "insensitive" },
      },
      include: { _count: { select: { memberships: true } } },
      take: 10,
      orderBy: { name: "asc" },
    }),
    prisma.board.findMany({
      where: {
        workspace: {
          memberships: { some: { userId } },
        },
        name: { contains: q, mode: "insensitive" },
      },
      include: { workspace: { select: { id: true, name: true } } },
      take: 10,
      orderBy: { name: "asc" },
    }),
  ]);

  const formattedWorkspaces = workspaces.map((ws) => {
    const { _count, ...rest } = ws;
    return {
      ...rest,
      type: _count.memberships > 1 ? "team" : "personal",
      entityType: "workspace",
    };
  });

  const formattedBoards = boards.map((board) => ({
    ...board,
    entityType: "board",
  }));

  res.status(200).json({
    data: {
      workspaces: formattedWorkspaces,
      boards: formattedBoards,
    },
  });
};
