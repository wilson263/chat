import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, conversations, messages, projectsTable, projectFilesTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { getUserId } from "./auth";

const router: IRouter = Router();

router.get("/usage/stats", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Global totals
    const [convCount] = await db.select({ count: count() }).from(conversations);
    const [msgCount] = await db.select({ count: count() }).from(messages);
    const [projectCount] = await db.select({ count: count() }).from(projectsTable);
    const [fileCount] = await db.select({ count: count() }).from(projectFilesTable);

    // Per-user conversation count
    const [userConvCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.userId, userId));

    // Per-user message count (messages in the user's conversations)
    const userConvIds = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.userId, userId));

    let userMsgCount = 0;
    if (userConvIds.length > 0) {
      const ids = userConvIds.map(c => c.id);
      const [mc] = await db
        .select({ count: count() })
        .from(messages)
        .where(sql`${messages.conversationId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`);
      userMsgCount = Number(mc?.count ?? 0);
    }

    // Per-user project count
    const [userProjectCount] = await db
      .select({ count: count() })
      .from(projectsTable)
      .where(eq((projectsTable as any).userId, userId))
      .catch(() => [{ count: 0 }]); // userId column may not exist on projectsTable

    // Global recent activity
    const recentMessages = await db
      .select({
        date: sql<string>`DATE(${messages.createdAt})`,
        count: count(),
      })
      .from(messages)
      .groupBy(sql`DATE(${messages.createdAt})`)
      .orderBy(sql`DATE(${messages.createdAt}) DESC`)
      .limit(30);

    // Per-user recent activity (from conversations)
    let userRecentActivity: Array<{ date: string; messages: number }> = [];
    if (userConvIds.length > 0) {
      const ids = userConvIds.map(c => c.id);
      const rows = await db
        .select({
          date: sql<string>`DATE(${messages.createdAt})`,
          count: count(),
        })
        .from(messages)
        .where(sql`${messages.conversationId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`)
        .groupBy(sql`DATE(${messages.createdAt})`)
        .orderBy(sql`DATE(${messages.createdAt}) DESC`)
        .limit(30);
      userRecentActivity = rows.map(r => ({ date: r.date, messages: Number(r.count) }));
    }

    const [userCount] = await db.select({ count: count() }).from(usersTable);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, joinedAt: user.createdAt },
      personal: {
        conversations: Number(userConvCount?.count ?? 0),
        messages: userMsgCount,
        projects: Number(userProjectCount?.count ?? 0),
        recentActivity: userRecentActivity,
      },
      totals: {
        conversations: Number(convCount.count),
        messages: Number(msgCount.count),
        projects: Number(projectCount.count),
        files: Number(fileCount.count),
        users: Number(userCount.count),
      },
      recentActivity: recentMessages.map(r => ({ date: r.date, messages: Number(r.count) })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
