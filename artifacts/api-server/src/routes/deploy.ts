import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserId } from "./auth";
import crypto from "crypto";

const router: IRouter = Router();

async function deployToNetlify(
  files: Array<{ path: string; content: string }>,
  siteName: string,
  token: string
): Promise<{ url: string; deployId: string }> {
  const fileDigests: Record<string, string> = {};
  const fileContents: Record<string, string> = {};

  for (const file of files) {
    const hash = crypto.createHash("sha1").update(file.content).digest("hex");
    fileDigests[`/${file.path}`] = hash;
    fileContents[hash] = file.content;
  }

  const listRes = await fetch(`https://api.netlify.com/api/v1/sites?name=${siteName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sites = await listRes.json() as any[];

  let siteId: string;
  if (Array.isArray(sites) && sites.length > 0) {
    siteId = sites[0].id;
  } else {
    const createRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: siteName }),
    });
    const created = await createRes.json() as any;
    if (!created.id) throw new Error(created.message ?? "Failed to create Netlify site");
    siteId = created.id;
  }

  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: fileDigests }),
  });
  const deploy = await deployRes.json() as any;
  if (!deploy.id) throw new Error(deploy.message ?? "Failed to create deploy");

  for (const hash of (deploy.required ?? [])) {
    const content = fileContents[hash];
    if (content) {
      await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${hash}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
        body: content,
      });
    }
  }

  return { url: deploy.ssl_url ?? deploy.url ?? `https://${siteName}.netlify.app`, deployId: deploy.id };
}

async function deployToVercel(
  files: Array<{ path: string; content: string }>,
  projectName: string,
  token: string
): Promise<{ url: string; deployId: string }> {
  const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: projectName,
      files: files.map(f => ({ file: f.path, data: f.content, encoding: "utf-8" })),
      projectSettings: { framework: null },
      target: "production",
    }),
  });
  const deploy = await deployRes.json() as any;
  if (deploy.error) throw new Error(deploy.error.message ?? "Vercel deploy failed");
  return { url: `https://${deploy.url}`, deployId: deploy.id };
}

async function deployToRender(deployHookUrl: string): Promise<{ url: string; deployId: string }> {
  const res = await fetch(deployHookUrl, { method: "POST" });
  const data = await res.json() as any;
  return {
    url: data.deploy?.url ?? "Check your Render dashboard for the live URL",
    deployId: data.deploy?.id ?? "triggered",
  };
}

router.post("/agent/deploy/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const { provider, token, siteName, deployHookUrl } = req.body as {
    provider: "netlify" | "vercel" | "render";
    token?: string;
    siteName?: string;
    deployHookUrl?: string;
  };

  if (!provider) { res.status(400).json({ error: "provider is required" }); return; }

  try {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) { res.status(404).json({ error: "Project not found" }); return; }

    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    if (files.length === 0) { res.status(400).json({ error: "Project has no files" }); return; }

    const fileData = files.map(f => ({ path: f.path, content: f.content }));
    const name = (siteName ?? project.name).toLowerCase().replace(/[^a-z0-9-]/g, "-");

    let result: { url: string; deployId: string };

    switch (provider) {
      case "netlify":
        if (!token) { res.status(400).json({ error: "token required for Netlify" }); return; }
        result = await deployToNetlify(fileData, name, token);
        break;
      case "vercel":
        if (!token) { res.status(400).json({ error: "token required for Vercel" }); return; }
        result = await deployToVercel(fileData, name, token);
        break;
      case "render":
        if (!deployHookUrl) { res.status(400).json({ error: "deployHookUrl required for Render" }); return; }
        result = await deployToRender(deployHookUrl);
        break;
      default:
        res.status(400).json({ error: `Unknown provider: ${provider}` });
        return;
    }

    res.json({ ok: true, provider, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
