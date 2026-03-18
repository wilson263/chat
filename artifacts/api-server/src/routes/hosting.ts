import { Router, type Request, type Response } from "express";
  import { eq } from "drizzle-orm";
  import { db, projectsTable, projectFilesTable } from "@workspace/db";
  import { sql } from "drizzle-orm";

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

  // UMD CDN scripts — load as globals, no ES module issues
  const UMD_SCRIPTS = `<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>`;
  const BABEL_SCRIPT = `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;

  function hasJsx(code: string): boolean {
    return /<[A-Z][A-Za-z.]*[\s\/>]/.test(code) || /<\/[A-Z][A-Za-z.]*>/.test(code);
  }

  function hasBareImports(code: string): boolean {
    return /(?:from|import)\s+['"][^'".\/][^'"]*['"]/m.test(code);
  }

  // Rewrite bare imports so they work with globally-loaded UMD libs
  // or fall back to esm.sh CDN for unknown packages
  function processJsForBrowser(code: string): string {
    // React named imports → destructure from global React
    code = code.replace(
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]react['"]/g,
      (_, names) => `const { ${names.trim()} } = React;`
    );
    // import React from 'react' — already global
    code = code.replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]/g, "");
    // import * as React from 'react'
    code = code.replace(/import\s+\*\s+as\s+React\s+from\s+['"]react['"]/g, "");
    // createRoot from react-dom/client
    code = code.replace(
      /import\s+\{\s*createRoot\s*\}\s+from\s+['"]react-dom(?:\/client)?['"]/g,
      "const { createRoot } = ReactDOM;"
    );
    // import ReactDOM from 'react-dom' or 'react-dom/client'
    code = code.replace(/import\s+ReactDOM\s+from\s+['"]react-dom(?:\/client)?['"]/g, "");
    // All remaining bare imports — strip with a comment (they may be from CDN via separate tags)
    code = code.replace(
      /^\s*import\s+.*?\s+from\s+['"][^'".\/][^'"]*['"]/gm,
      (m) => `/* stripped: ${m.trim()} */`
    );
    code = code.replace(
      /^\s*import\s+['"][^'".\/][^'"]*['"]/gm,
      (m) => `/* stripped: ${m.trim()} */`
    );
    // Remove export keywords (not valid outside module context with Babel plain)
    code = code.replace(/^export\s+default\s+/gm, "");
    code = code.replace(/^export\s+(function|class|const|let|var)\s+/gm, "$1 ");
    code = code.replace(/^export\s+\{[^}]*\};?/gm, "");
    return code;
  }

  // Auto-append render call if no render found and App component exists
  function maybeAppendRender(code: string): string {
    const hasApp = /(?:^|\s)(?:function|class)\s+App[\s({]/.test(code) ||
                   /(?:^|\s)(?:const|let|var)\s+App\s*=/.test(code);
    const hasRender = /createRoot|ReactDOM\.render|root\.render/.test(code);
    if (hasApp && !hasRender) {
      return code + `
  const __root = document.getElementById("root") || document.getElementById("app");
  if (__root) { ReactDOM.createRoot(__root).render(React.createElement(App)); }
  `;
    }
    return code;
  }

  async function ensurePublishedColumn(): Promise<void> {
    try {
      await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE`);
      await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`);
    } catch { /* ignore */ }
  }

  let migrationDone = false;
  async function runMigrationOnce(): Promise<void> {
    if (!migrationDone) {
      await ensurePublishedColumn();
      migrationDone = true;
    }
  }

  function buildHostedHtml(
    htmlContent: string,
    cssFiles: { name: string; content: string }[],
    jsFiles: { name: string; content: string }[],
    hostedBase: string,
  ): string {
    let html = htmlContent;

    const allJsCode = jsFiles.map((f) => f.content).join("\n");
    const needsBabel = hasJsx(allJsCode) || hasJsx(html);
    const needsGlobals = needsBabel || hasBareImports(allJsCode);

    // CSS
    if (cssFiles.length > 0) {
      const styles = cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n");
      html = html.includes("</head>") ? html.replace("</head>", `${styles}\n</head>`) : styles + html;
    }

    // Inject UMD libs + Babel into <head>
    if (needsGlobals || needsBabel) {
      const headInject = UMD_SCRIPTS + "\n" + (needsBabel ? BABEL_SCRIPT : "");
      html = html.includes("<head>")
        ? html.replace("<head>", `<head>\n${headInject}`)
        : headInject + html;
    }

    // Upgrade any existing <script type="module"> to text/babel (JSX safe)
    if (needsBabel) {
      html = html.replace(/<script(\s+type=["']module["'])?>/g, '<script type="text/babel">');
    }

    // Inject processed JS files
    if (jsFiles.length > 0) {
      const scriptTags = jsFiles.map((f) => {
        if (needsBabel) {
          const processed = maybeAppendRender(processJsForBrowser(f.content));
          return `<script type="text/babel">\n/* ${f.name} */\n${processed}\n</script>`;
        }
        return `<script>\n/* ${f.name} */\n${f.content}\n</script>`;
      }).join("\n");
      html = html.includes("</body>") ? html.replace("</body>", `${scriptTags}\n</body>`) : html + scriptTags;
    }

    // base href
    if (!html.includes("<base")) {
      html = html.includes("<head>") ? html.replace("<head>", `<head>\n<base href="${hostedBase}">`) : html;
    }

    return html;
  }

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

  router.use("/:projectId", async (req: Request, res: Response): Promise<void> => {
    await runMigrationOnce();
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) { res.status(400).send("Invalid project"); return; }

    let isPublished = false;
    try {
      const rows = await db.execute(sql`SELECT published FROM projects WHERE id = ${projectId}`);
      const row = (rows as any).rows?.[0] ?? (Array.isArray(rows) ? rows[0] : null);
      isPublished = row?.published ?? false;
    } catch { isPublished = false; }

    if (!isPublished) {
      res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title>
  <style>body{font-family:system-ui;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{text-align:center;padding:2rem}.badge{background:#6e40c9;color:#fff;border-radius:6px;padding:4px 12px;font-size:12px;margin-bottom:1rem;display:inline-block}
  h1{margin:0 0 .5rem;font-size:1.5rem}p{color:#8b949e}</style></head>
  <body><div class="box"><div class="badge">ZorvixAI</div>
  <h1>Project Not Published</h1>
  <p>Open this project in ZorvixAI and click <strong>Publish</strong>.</p>
  </div></body></html>`);
      return;
    }

    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    if (!files.length) { res.status(404).send("No files found."); return; }

    const reqPath = (req.path || "").replace(/^\/+/, "");
    const cleanPath = reqPath || "index.html";

    // Serve a specific non-HTML file if requested directly
    const exactMatch = files.find(
      (f) => f.path === cleanPath || f.name === cleanPath || f.path === `/${cleanPath}`
    );
    if (exactMatch && !exactMatch.name.endsWith(".html")) {
      res.setHeader("Content-Type", getMime(exactMatch.name));
      res.send(exactMatch.content);
      return;
    }

    const cssFiles = files.filter((f) => f.language === "css" || f.name.endsWith(".css"));
    const jsFiles = files.filter((f) =>
      f.language === "javascript" || f.language === "typescript" ||
      f.name.endsWith(".js") || f.name.endsWith(".jsx") ||
      f.name.endsWith(".ts") || f.name.endsWith(".tsx")
    );
    const htmlFile =
      exactMatch ||
      files.find((f) => f.name === "index.html") ||
      files.find((f) => f.name.endsWith(".html")) ||
      files.find((f) => f.language === "html");

    const hostedBase = `/hosted/${projectId}/`;

    if (htmlFile) {
      const otherJs = jsFiles.filter((f) => f.id !== htmlFile.id);
      const built = buildHostedHtml(htmlFile.content, cssFiles, otherJs, hostedBase);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(built);
      return;
    }

    // No HTML — auto-generate a shell
    const allJs = jsFiles.map((f) => f.content).join("\n");
    const needsBabel = hasJsx(allJs) || hasBareImports(allJs);

    let scriptTags = "";
    if (needsBabel) {
      const processed = maybeAppendRender(processJsForBrowser(allJs));
      scriptTags = `<script type="text/babel">\n${processed}\n</script>`;
    } else {
      scriptTags = jsFiles.map((f) => `<script>\n${f.content}\n</script>`).join("\n");
    }

    const autoHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Published App</title>
    ${needsBabel ? UMD_SCRIPTS + "\n  " + BABEL_SCRIPT : ""}
    ${cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n")}
  </head>
  <body>
    <div id="root"></div>
    <div id="app"></div>
    ${scriptTags}
  </body>
  </html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(autoHtml);
  });

  export default router;
  