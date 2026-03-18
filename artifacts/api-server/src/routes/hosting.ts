import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getUserId } from "./auth";

const router = Router();

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
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
};

function getMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "txt";
  return MIME_TYPES[ext] ?? "text/plain; charset=utf-8";
}

// Known package aliases for esm.sh
const PACKAGE_ALIASES: Record<string, string> = {
  "react": "react@18",
  "react-dom": "react-dom@18",
  "react-dom/client": "react-dom@18/client",
  "react-router-dom": "react-router-dom@6",
  "react-router": "react-router@6",
  "@tanstack/react-query": "@tanstack/react-query@5",
  "wouter": "wouter@3",
  "zustand": "zustand@4",
  "jotai": "jotai@2",
  "axios": "axios@1",
  "date-fns": "date-fns@3",
  "clsx": "clsx@2",
  "classnames": "classnames@2",
  "lodash": "lodash@4",
  "nanoid": "nanoid@5",
  "uuid": "uuid@9",
  "zod": "zod@3",
  "framer-motion": "framer-motion@11",
  "lucide-react": "lucide-react@0",
  "recharts": "recharts@2",
  "chart.js": "chart.js@4",
  "d3": "d3@7",
  "three": "three@0",
  "socket.io-client": "socket.io-client@4",
  "immer": "immer@10",
  "react-hook-form": "react-hook-form@7",
  "react-icons": "react-icons@5",
  "@radix-ui/react-dialog": "@radix-ui/react-dialog@1",
  "@radix-ui/react-dropdown-menu": "@radix-ui/react-dropdown-menu@2",
  "@radix-ui/react-tabs": "@radix-ui/react-tabs@1",
  "@radix-ui/react-toast": "@radix-ui/react-toast@1",
  "@radix-ui/react-slot": "@radix-ui/react-slot@1",
  "tailwind-merge": "tailwind-merge@2",
  "class-variance-authority": "class-variance-authority@0",
  "react-query": "@tanstack/react-query@4",
};

function resolvePackage(pkg: string): string {
  if (PACKAGE_ALIASES[pkg]) return `https://esm.sh/${PACKAGE_ALIASES[pkg]}`;
  return `https://esm.sh/${pkg}`;
}

// Rewrite bare package imports to esm.sh CDN URLs so any npm package works in browser
function rewriteImportsToEsm(code: string): string {
  // Strip TypeScript type-only imports
  code = code.replace(/^\s*import\s+type\s+.*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, "");
  code = code.replace(/^\s*export\s+type\s+\{[^}]*\}\s*;?\s*$/gm, "");

  // Rewrite bare package imports to esm.sh
  code = code.replace(
    /^(\s*import\s+(?:[^'"]*\s+from\s+)?)(["'])([^'".\/][^'"]*)(["'])/gm,
    (match, prefix, q1, pkg, q2) => `${prefix}${q1}${resolvePackage(pkg)}${q2}`
  );

  // Rewrite export ... from 'pkg'
  code = code.replace(
    /^(\s*export\s+(?:\{[^}]*\}|\*)\s+from\s+)(["'])([^'".\/][^'"]*)(["'])/gm,
    (match, prefix, q1, pkg, q2) => `${prefix}${q1}${resolvePackage(pkg)}${q2}`
  );

  return code;
}

// Build an import map from all bare imports referenced in the code
function buildImportMap(allCode: string): string {
  const imports: Record<string, string> = {};
  const re = /(?:from|import)\s+(['"])([^'".\/][^'"]*)\1/g;
  let m;
  while ((m = re.exec(allCode)) !== null) {
    const pkg = m[2];
    if (!imports[pkg]) imports[pkg] = resolvePackage(pkg);
  }
  if (Object.keys(imports).length === 0) return "";
  return `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;
}

// Build a full HTML document from the project files, with Babel + esm.sh for all imports
function buildProjectHtml(
  files: { name: string; content: string; language?: string | null; path?: string | null }[],
  baseHref: string,
  projectTitle: string,
): string {
  const cssFiles = files.filter((f) => f.language === "css" || f.name.endsWith(".css"));
  const jsFiles = files.filter((f) =>
    f.language === "javascript" || f.language === "typescript" ||
    f.name.endsWith(".js") || f.name.endsWith(".jsx") ||
    f.name.endsWith(".ts") || f.name.endsWith(".tsx")
  );
  const htmlFile =
    files.find((f) => f.name === "index.html") ||
    files.find((f) => f.name.endsWith(".html")) ||
    files.find((f) => f.language === "html");

  if (htmlFile) {
    return buildFromHtmlFile(htmlFile.content, cssFiles, jsFiles.filter((f) => f.name !== htmlFile.name), baseHref);
  }

  // No HTML file — generate one
  return buildAutoHtml(jsFiles, cssFiles, baseHref, projectTitle);
}

function buildFromHtmlFile(
  htmlContent: string,
  cssFiles: { name: string; content: string }[],
  jsFiles: { name: string; content: string }[],
  baseHref: string,
): string {
  let html = htmlContent;
  const allJsCode = jsFiles.map((f) => f.content).join("\n");
  const importMap = buildImportMap(allJsCode);

  // Inject CSS
  if (cssFiles.length > 0) {
    const styles = cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n");
    html = html.includes("</head>") ? html.replace("</head>", `${styles}\n</head>`) : styles + html;
  }

  // Inject import map + Babel into <head>
  const headInject = `${importMap}\n<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;
  html = html.includes("<head>")
    ? html.replace("<head>", `<head>\n${headInject}`)
    : headInject + html;

  // Upgrade existing script tags to text/babel (handles JSX + TS)
  html = html.replace(/<script(\s+type=["']module["'])?(\s*)>/g, '<script type="text/babel" data-type="module"$2>');

  // Rewrite inline script content to use esm.sh
  html = html.replace(
    /<script\s[^>]*data-type="module"[^>]*>([\s\S]*?)<\/script>/g,
    (match, code) => match.replace(code, rewriteImportsToEsm(code))
  );

  // Inject external JS files
  if (jsFiles.length > 0) {
    const scriptTags = jsFiles.map((f) => {
      const code = rewriteImportsToEsm(f.content);
      return `<script type="text/babel" data-type="module">\n/* ${f.name} */\n${code}\n</script>`;
    }).join("\n");
    html = html.includes("</body>") ? html.replace("</body>", `${scriptTags}\n</body>`) : html + scriptTags;
  }

  // Add base href
  if (!html.includes("<base")) {
    html = html.includes("<head>") ? html.replace("<head>", `<head>\n<base href="${baseHref}">`) : html;
  }

  return html;
}

function buildAutoHtml(
  jsFiles: { name: string; content: string }[],
  cssFiles: { name: string; content: string }[],
  baseHref: string,
  title: string,
): string {
  const allCode = jsFiles.map((f) => f.content).join("\n");
  const importMap = buildImportMap(allCode);

  // Sort: entry points first (main, index, App)
  const sorted = [...jsFiles].sort((a, b) => {
    const p = (n: string) => /^(main|index)\.(tsx?|jsx?)$/i.test(n) ? 0 : /^App\.(tsx?|jsx?)$/i.test(n) ? 1 : 2;
    return p(a.name) - p(b.name);
  });

  const combined = sorted.map((f) => rewriteImportsToEsm(f.content)).join("\n\n");

  const hasRender = /createRoot|ReactDOM\.render|root\.render/.test(combined);
  const hasApp = /(?:^|\s)(?:function|class)\s+App[\s({]/.test(combined) ||
                 /(?:^|\s)(?:const|let|var)\s+App\s*=/.test(combined);

  const autoRender = (!hasRender && hasApp) ? `
// Auto-render
const __c = document.getElementById("root") || document.getElementById("app");
if (__c) {
  const { createRoot } = await import("${resolvePackage("react-dom/client")}");
  createRoot(__c).render((await import("${resolvePackage("react")}")).createElement(App));
}` : "";

  const cssInline = cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <base href="${baseHref}">
  ${importMap}
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${cssInline}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #root, #app { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <script type="text/babel" data-type="module">
${combined}${autoRender}
  </script>
</body>
</html>`;
}

let migrationDone = false;
async function runMigrationOnce(): Promise<void> {
  if (migrationDone) return;
  try {
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`);
    migrationDone = true;
  } catch {
    migrationDone = true;
  }
}

// ── Publish / Unpublish / Status ──────────────────────────────────────────────

router.post("/publish/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    await db.execute(sql`UPDATE projects SET published = TRUE, published_at = NOW() WHERE id = ${projectId}`);
    res.json({ published: true, projectId, url: `/hosted/${projectId}/` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/unpublish/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    await db.execute(sql`UPDATE projects SET published = FALSE, published_at = NULL WHERE id = ${projectId}`);
    res.json({ published: false, projectId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/status/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid project ID" }); return; }
  try {
    const rows = await db.execute(sql`SELECT published, published_at FROM projects WHERE id = ${projectId}`);
    const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    if (!row) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ published: row.published ?? false, publishedAt: row.published_at ?? null });
  } catch { res.json({ published: false, publishedAt: null }); }
});

// ── Live Preview (authenticated, no publish required) ─────────────────────────
// This is used by the workspace's Live Preview panel
router.use("/preview/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const userId = getUserId(req);
  if (!userId) { res.status(401).send("Not authenticated"); return; }

  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).send("Invalid project"); return; }

  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
  if (!files.length) {
    res.status(404).send("No files found.");
    return;
  }

  const reqPath = (req.path || "").replace(/^\/+/, "");
  const cleanPath = reqPath || "index.html";

  // Serve a specific non-HTML asset if requested
  const exactMatch = files.find((f) => f.path === cleanPath || f.name === cleanPath || f.path === `/${cleanPath}`);
  if (exactMatch && !exactMatch.name.endsWith(".html")) {
    res.setHeader("Content-Type", getMime(exactMatch.name));
    res.send(exactMatch.content);
    return;
  }

  let projectTitle = "Preview";
  try {
    const rows = await db.execute(sql`SELECT name FROM projects WHERE id = ${projectId}`);
    const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    projectTitle = row?.name ?? "Preview";
  } catch { /* ignore */ }

  const previewBase = `/api/hosting/preview/${projectId}/`;
  const html = buildProjectHtml(files, previewBase, projectTitle);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ── Public hosted projects ────────────────────────────────────────────────────
router.use("/:projectId", async (req: Request, res: Response): Promise<void> => {
  await runMigrationOnce();
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).send("Invalid project"); return; }

  let isPublished = false;
  let projectTitle = "Published App";
  try {
    const rows = await db.execute(sql`SELECT published, name FROM projects WHERE id = ${projectId}`);
    const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
    isPublished = row?.published ?? false;
    projectTitle = row?.name ?? "Published App";
  } catch { isPublished = false; }

  if (!isPublished) {
    res.status(404).send(`<!DOCTYPE html><html><head><title>Not Published</title>
<style>body{font-family:system-ui;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:2rem}.badge{background:#6e40c9;color:#fff;border-radius:6px;padding:4px 12px;font-size:12px;margin-bottom:1rem;display:inline-block}
h1{margin:0 0 .5rem;font-size:1.5rem}p{color:#8b949e}</style></head>
<body><div class="box"><div class="badge">ZorvixAI</div>
<h1>Project Not Published</h1>
<p>Open this project in ZorvixAI and click <strong>Publish Live</strong>.</p>
</div></body></html>`);
    return;
  }

  const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
  if (!files.length) { res.status(404).send("No files found."); return; }

  const reqPath = (req.path || "").replace(/^\/+/, "");
  const cleanPath = reqPath || "index.html";

  // Serve a specific non-HTML asset if requested
  const exactMatch = files.find((f) => f.path === cleanPath || f.name === cleanPath || f.path === `/${cleanPath}`);
  if (exactMatch && !exactMatch.name.endsWith(".html")) {
    res.setHeader("Content-Type", getMime(exactMatch.name));
    res.send(exactMatch.content);
    return;
  }

  const hostedBase = `/hosted/${projectId}/`;
  const html = buildProjectHtml(files, hostedBase, projectTitle);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
