import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, conversations, messages, projectsTable, projectFilesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { getUserId } from "./auth";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response): Promise<number | null> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return userId;
}

router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [convCount] = await db.select({ count: count() }).from(conversations);
    const [msgCount] = await db.select({ count: count() }).from(messages);
    const [projectCount] = await db.select({ count: count() }).from(projectsTable);
    const [fileCount] = await db.select({ count: count() }).from(projectFilesTable);

    const recentActivity = await db
      .select({
        date: sql<string>`DATE(${messages.createdAt})`,
        count: count(),
      })
      .from(messages)
      .groupBy(sql`DATE(${messages.createdAt})`)
      .orderBy(sql`DATE(${messages.createdAt}) DESC`)
      .limit(14);

    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);

    res.json({
      totals: {
        users: Number(userCount.count),
        conversations: Number(convCount.count),
        messages: Number(msgCount.count),
        projects: Number(projectCount.count),
        files: Number(fileCount.count),
      },
      recentActivity: recentActivity.map(r => ({ date: r.date, messages: Number(r.count) })),
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/users/:id/toggle-admin", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const userId = parseInt(req.params.id);
  if (isNaN(userId) || userId === adminId) {
    res.status(400).json({ error: "Invalid user or cannot modify own admin status" });
    return;
  }

  const { isAdmin } = req.body;
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ isAdmin: Boolean(isAdmin) })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: updated.id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const userId = parseInt(req.params.id);
  if (isNaN(userId) || userId === adminId) {
    res.status(400).json({ error: "Cannot delete your own account via admin" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
