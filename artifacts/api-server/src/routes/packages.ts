import { Router, type Request, type Response } from "express";
import { getUserId } from "./auth";
import { db, projectFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/packages/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  try {
    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    const pkgFile = files.find(f => f.name === "package.json");
    if (!pkgFile) { res.json({ dependencies: {}, devDependencies: {} }); return; }
    const pkg = JSON.parse(pkgFile.content || "{}");
    res.json({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {}, name: pkg.name, version: pkg.version });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/packages/:projectId/add", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  const { name, dev = false } = req.body;
  if (!name || typeof name !== "string") { res.status(400).json({ error: "Package name required" }); return; }

  try {
    const npmRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
    if (!npmRes.ok) { res.status(404).json({ error: `Package "${name}" not found on npm` }); return; }
    const npmData = await npmRes.json() as any;
    const resolvedVersion = `^${npmData.version}`;

    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    const pkgFile = files.find(f => f.name === "package.json");
    let pkg: any = { name: "project", version: "1.0.0", dependencies: {}, devDependencies: {} };
    if (pkgFile) { try { pkg = JSON.parse(pkgFile.content || "{}"); } catch { /* */ } }
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    if (dev) pkg.devDependencies[name] = resolvedVersion;
    else pkg.dependencies[name] = resolvedVersion;
    const newContent = JSON.stringify(pkg, null, 2);
    if (pkgFile) {
      await db.update(projectFilesTable).set({ content: newContent, updatedAt: new Date() }).where(eq(projectFilesTable.id, pkgFile.id));
    } else {
      await db.insert(projectFilesTable).values({ projectId, name: "package.json", path: "package.json", content: newContent, language: "json" });
    }
    res.json({ name, version: resolvedVersion, type: dev ? "devDependency" : "dependency", description: npmData.description, homepage: npmData.homepage });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/packages/:projectId/:pkgName", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const projectId = parseInt(req.params.projectId);
  const pkgName = decodeURIComponent(req.params.pkgName);
  try {
    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    const pkgFile = files.find(f => f.name === "package.json");
    if (!pkgFile) { res.status(404).json({ error: "No package.json found" }); return; }
    const pkg = JSON.parse(pkgFile.content || "{}");
    delete pkg.dependencies?.[pkgName];
    delete pkg.devDependencies?.[pkgName];
    await db.update(projectFilesTable).set({ content: JSON.stringify(pkg, null, 2), updatedAt: new Date() }).where(eq(projectFilesTable.id, pkgFile.id));
    res.sendStatus(204);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/packages/npm/search", async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q) { res.status(400).json({ error: "q required" }); return; }
  try {
    const resp = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(String(q))}&size=10`);
    const data = await resp.json() as any;
    res.json(data.objects?.map((o: any) => ({ name: o.package.name, version: o.package.version, description: o.package.description })) || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
