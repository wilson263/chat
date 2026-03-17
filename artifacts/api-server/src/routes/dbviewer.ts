import { Router, type Request, type Response } from "express";
import { getUserId } from "./auth";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const ALLOWED_TABLES = ["projects", "project_files", "project_secrets", "users", "apps"];

router.get("/dbviewer/tables", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = result.rows
      .map((r: any) => r.table_name as string)
      .filter(t => ALLOWED_TABLES.includes(t));
    res.json(tables);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/dbviewer/tables/:name/schema", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const tableName = req.params.name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!ALLOWED_TABLES.includes(tableName)) { res.status(403).json({ error: "Access denied" }); return; }
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/dbviewer/tables/:name/rows", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const tableName = req.params.name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!ALLOWED_TABLES.includes(tableName)) { res.status(403).json({ error: "Access denied" }); return; }
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(100, parseInt(String(req.query.limit || "50")));
  const offset = (page - 1) * limit;
  try {
    const countRes = await db.execute(sql.raw(`SELECT COUNT(*) AS count FROM "${tableName}"`));
    const total = parseInt(String((countRes.rows[0] as any)?.count || "0"));
    const dataRes = await db.execute(sql.raw(`SELECT * FROM "${tableName}" ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`));
    res.json({ rows: dataRes.rows, total, page, totalPages: Math.ceil(total / limit), limit });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/dbviewer/query", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { query } = req.body;
  if (!query || typeof query !== "string") { res.status(400).json({ error: "query required" }); return; }
  const upperQ = query.trim().toUpperCase();
  if (!upperQ.startsWith("SELECT")) { res.status(403).json({ error: "Only SELECT queries are allowed" }); return; }
  const forbidden = ALLOWED_TABLES.map(t => `"${t}"`);
  const hasAllowed = ALLOWED_TABLES.some(t => query.toLowerCase().includes(t.toLowerCase()));
  if (!hasAllowed) { res.status(403).json({ error: "Query must reference allowed tables" }); return; }
  try {
    const result = await db.execute(sql.raw(query));
    res.json({ rows: result.rows, rowCount: result.rows.length });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
