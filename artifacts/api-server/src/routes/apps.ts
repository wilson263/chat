import { Router, type IRouter, type Request, type Response } from "express";
import { db, appsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserId } from "./auth";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/apps", async (_req: Request, res: Response): Promise<void> => {
  try {
    const apps = await db.select().from(appsTable).orderBy(appsTable.createdAt);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/apps", async (req: Request, res: Response): Promise<void> => {
  const allowed = await requireAdmin(req, res);
  if (!allowed) return;

  const userId = getUserId(req)!;
  const { name, description, url, iconUrl, category } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "Name and URL are required" });
    return;
  }
  try {
    const [app] = await db.insert(appsTable).values({
      name,
      description,
      url,
      iconUrl,
      category: category || "app",
      createdBy: userId,
    }).returning();
    res.json(app);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/apps/:id", async (req: Request, res: Response): Promise<void> => {
  const allowed = await requireAdmin(req, res);
  if (!allowed) return;

  const id = Number(req.params.id);
  try {
    await db.delete(appsTable).where(eq(appsTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
