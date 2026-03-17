import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUserId } from "./auth";

const router = Router();

const ensureTable = async () => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_secrets (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(project_id, user_id, key)
    )
  `);
};
ensureTable().catch(console.error);

router.get("/secrets/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    const result = await db.execute(sql`SELECT id, key, description, created_at, updated_at FROM project_secrets WHERE project_id = ${projectId} AND user_id = ${userId} ORDER BY key`);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/secrets/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  const { key, value, description = "" } = req.body;
  if (!key || value === undefined) { res.status(400).json({ error: "key and value are required" }); return; }
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) { res.status(400).json({ error: "Key must contain only letters, numbers, and underscores" }); return; }
  try {
    const result = await db.execute(sql`
      INSERT INTO project_secrets (project_id, user_id, key, value, description)
      VALUES (${projectId}, ${userId}, ${key.toUpperCase()}, ${value}, ${description})
      ON CONFLICT (project_id, user_id, key) DO UPDATE SET value = ${value}, description = ${description}, updated_at = NOW()
      RETURNING id, key, description, created_at, updated_at
    `);
    res.json(result.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/secrets/:projectId/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = parseInt(req.params.id);
  try {
    await db.execute(sql`DELETE FROM project_secrets WHERE id = ${id} AND user_id = ${userId}`);
    res.sendStatus(204);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/secrets/:projectId/export/env", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  try {
    const result = await db.execute(sql`SELECT key, value FROM project_secrets WHERE project_id = ${projectId} AND user_id = ${userId} ORDER BY key`);
    const content = result.rows.map((s: any) => `${s.key}=${s.value}`).join("\n");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename=".env"`);
    res.send(content);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
