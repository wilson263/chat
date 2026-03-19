import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, conversations, messages, projectsTable, projectFilesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { getUserId } from "./auth";
import { sendApprovalEmail, sendRejectionEmail } from "../lib/email";

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

// ─── Stats ────────────────────────────────────────────────────────────────────
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
        status: (u as any).status ?? "approved",
        createdAt: u.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Registration Requests ────────────────────────────────────────────────────
router.get("/admin/registration-requests", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  try {
    const pending = await db
      .select()
      .from(usersTable)
      .where(eq((usersTable as any).status, "pending"))
      .orderBy(usersTable.createdAt);

    res.json(pending.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/registration-requests/:id/approve", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ status: "approved" } as any)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) { res.status(404).json({ error: "User not found" }); return; }

    sendApprovalEmail({ name: updated.name, email: updated.email }).catch(() => {});

    res.json({ ok: true, user: { id: updated.id, name: updated.name, email: updated.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/admin/registration-requests/:id/reject", async (req: Request, res: Response): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    sendRejectionEmail({ name: user.name, email: user.email }).catch(() => {});

    await db.delete(usersTable).where(eq(usersTable.id, userId));

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── One-click approve via email link ─────────────────────────────────────────
router.get("/admin/registration-requests/:id/approve-via-email", async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string;
  const expectedToken = process.env.ADMIN_EMAIL_TOKEN ?? "";

  if (!expectedToken || token !== expectedToken) {
    res.status(403).send("Invalid or missing token. Please approve from the admin panel.");
    return;
  }

  const userId = parseInt(req.params.id);
  if (isNaN(userId)) { res.status(400).send("Invalid user ID"); return; }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ status: "approved" } as any)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) { res.status(404).send("User not found or already processed."); return; }

    sendApprovalEmail({ name: updated.name, email: updated.email }).catch(() => {});

    const appUrl = process.env.APP_URL ?? "/";
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>User Approved</title></head>
      <body style="font-family:system-ui,sans-serif;background:#05050f;color:#eeeeff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;padding:40px;">
          <div style="font-size:48px;margin-bottom:16px;">✓</div>
          <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;">${updated.name} has been approved!</h2>
          <p style="color:#b4b4d4;margin:0 0 24px;">An approval email has been sent to ${updated.email}.</p>
          <a href="${appUrl}/admin" style="padding:12px 28px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Go to Admin Panel</a>
        </div>
      </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send("Error approving user: " + err.message);
  }
});

// ─── Toggle Admin ─────────────────────────────────────────────────────────────
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

// ─── Delete User ──────────────────────────────────────────────────────────────
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
