import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  ts: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  xml: "application/xml",
  webmanifest: "application/manifest+json",
};

function getMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "txt";
  return MIME_TYPES[ext] ?? "text/plain; charset=utf-8";
}

async function ensurePublishedColumn(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await db.execute(sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_at TIMESTAMP
    `);
  } catch {
  }
}

let migrationDone = false;
async function runMigrationOnce(): Promise<void> {
  if (!migrationDone) {
    await ensurePublishedColumn();
    migrationDone = true;
  }
}

function buildHtmlWithAssets(
  htmlContent: string,
  cssFiles: { name: string; content: string }[],
  jsFiles: { name: string; content: string }[],
  hostedBase: string,
): string {
  let html = htmlContent;
  if (cssFiles.length > 0) {
    const styleTag = cssFiles
      .map((f) => `<style>/* ${f.name} */\n${f.content}</style>`)
      .join("\n");
    html = html.includes("</head>")
      ? html.replace("</head>", `${styleTag}\n</head>`)
      : styleTag + html;
  }
  if (jsFiles.length > 0) {
    const scriptTag = jsFiles
      .map((f) => `<script>/* ${f.name} */\n${f.content}</script>`)
      .join("\n");
    html = html.includes("</body>")
      ? html.replace("</body>", `${scriptTag}\n</body>`)
      : html + scriptTag;
  }
  const baseTag = `<base href="${hostedBase}">`;
  if (!html.includes("<base")) {
    html = html.includes("<head>")
      ? html.replace("<head>", `<head>\n${baseTag}`)
      : html;
  }
  return html;
}

router.post("/publish/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    await db.execute(sql`
      UPDATE projects SET published = TRUE, published_at = NOW() WHERE id = ${projectId}
    `);
    res.json({ published: true, projectId, url: `/hosted/${projectId}/` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/unpublish/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    await db.execute(sql`
      UPDATE projects SET published = FALSE, published_at = NULL WHERE id = ${projectId}
    `);
    res.json({ published: false, projectId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/status/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    const rows = await db.execute(sql`
      SELECT published, published_at FROM projects WHERE id = ${projectId}
    `);
    const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    if (!row) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ published: row.published ?? false, publishedAt: row.published_at ?? null });
  } catch {
    res.json({ published: false, publishedAt: null });
  }
});

router.get("/:projectId/*splat", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).send("Invalid project"); return; }

  let isPublished = false;
  try {
    const rows = await db.execute(sql`SELECT published FROM projects WHERE id = ${projectId}`);
    const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    isPublished = row?.published ?? false;
  } catch {
    isPublished = false;
  }

  if (!isPublished) {
    res.status(404).send(`
      <!DOCTYPE html><html><head><title>Not Found</title>
      <style>body{font-family:system-ui;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
      .box{text-align:center;padding:2rem;}.badge{background:#6e40c9;color:#fff;border-radius:6px;padding:4px 12px;font-size:12px;margin-bottom:1rem;display:inline-block;}
      h1{margin:0 0 .5rem;font-size:1.5rem;}p{color:#8b949e;}</style></head>
      <body><div class="box"><div class="badge">ZorvixAI Cloud</div>
      <h1>Project Not Published</h1>
      <p>This project hasn't been published yet.<br>Open it in ZorvixAI workspace and click <strong>Publish</strong>.</p>
      </div></body></html>
    `);
    return;
  }

  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
  if (!files.length) {
    res.status(404).send("No files found in this project.");
    return;
  }

  const requestedPath = (req.params as any).splat || "";
  const cleanPath = requestedPath.replace(/^\/+/, "") || "index.html";

  const exactMatch = files.find(
    (f) => f.path === cleanPath || f.name === cleanPath || f.path === `/${cleanPath}`
  );

  if (exactMatch) {
    const mime = getMime(exactMatch.name);
    if (mime.startsWith("text/html")) {
      const cssFiles = files.filter((f) => f.language === "css" || f.name.endsWith(".css"));
      const jsFiles = files.filter(
        (f) =>
          (f.language === "javascript" || f.name.endsWith(".js")) &&
          f.id !== exactMatch.id &&
          !files.find((h) => h.name.endsWith(".html") && h.content.includes(f.name))
      );
      const hostedBase = `/hosted/${projectId}/`;
      const builtHtml = buildHtmlWithAssets(exactMatch.content, cssFiles, jsFiles, hostedBase);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(builtHtml);
    } else {
      res.setHeader("Content-Type", mime);
      res.send(exactMatch.content);
    }
    return;
  }

  const htmlFile =
    files.find((f) => f.name === "index.html") ||
    files.find((f) => f.name.endsWith(".html")) ||
    files.find((f) => f.language === "html");

  if (htmlFile) {
    const cssFiles = files.filter((f) => f.language === "css" || f.name.endsWith(".css"));
    const jsFiles = files.filter(
      (f) =>
        (f.language === "javascript" || f.name.endsWith(".js")) &&
        f.id !== htmlFile.id
    );
    const hostedBase = `/hosted/${projectId}/`;
    const builtHtml = buildHtmlWithAssets(htmlFile.content, cssFiles, jsFiles, hostedBase);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(builtHtml);
    return;
  }

  const jsOnly = files.filter((f) => f.language === "javascript" || f.name.endsWith(".js"));
  const cssOnly = files.filter((f) => f.language === "css" || f.name.endsWith(".css"));
  if (jsOnly.length > 0 || cssOnly.length > 0) {
    const autoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project ${projectId}</title>
  ${cssOnly.map((f) => `<style>/* ${f.name} */\n${f.content}</style>`).join("\n")}
</head>
<body>
  ${jsOnly.map((f) => `<script>/* ${f.name} */\n${f.content}</script>`).join("\n")}
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(autoHtml);
    return;
  }

  const firstFile = files[0];
  res.setHeader("Content-Type", getMime(firstFile.name));
  res.send(firstFile.content);
});

export default router;
