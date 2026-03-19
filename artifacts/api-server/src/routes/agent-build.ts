import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import { getUserId } from "./auth";
import { createChatCompletionStreamFromList, AGENT_BUILD_MODELS, PLANNING_MODELS } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

const router: IRouter = Router();

const LANGUAGE_MAP: Record<string, string> = {
  html: "html", css: "css", js: "javascript", ts: "typescript",
  tsx: "typescript", jsx: "javascript", json: "json", md: "markdown",
  py: "python", go: "go", rs: "rust", java: "java", php: "php",
  rb: "ruby", sh: "shell", yaml: "yaml", yml: "yaml", env: "plaintext",
  txt: "plaintext", sql: "sql", swift: "swift", kt: "kotlin",
};

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

function extractJson(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock) return jsonBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

function buildFileTree(paths: string[]): Record<string, any> {
  const tree: Record<string, any> = {};
  for (const p of paths) {
    const parts = p.replace(/^\//, "").split("/");
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) { node[part] = null; }
      else { node[part] = node[part] ?? {}; node = node[part]; }
    }
  }
  return tree;
}

// ── Streaming helper: collect full text and stream tokens ─────────────────────
async function streamCollect(
  modelList: string[],
  messages: Array<{ role: "system" | "user"; content: string }>,
  maxTokens: number,
  onToken?: (token: string) => void
): Promise<string> {
  const { stream } = await createChatCompletionStreamFromList({
    messages,
    max_tokens: maxTokens,
    stream: true,
  } as any, modelList);
  let raw = "";
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) { raw += token; onToken?.(token); }
  }
  return raw;
}

// ── Phase 1: Analyse and plan ─────────────────────────────────────────────────
async function analyseAndPlan(
  prompt: string,
  send: (data: Record<string, any>) => void
): Promise<{ projectName: string; description: string; language: string; filePlan: Array<{ path: string; role: string }> }> {

  const systemPrompt = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are an expert software architect. Analyse the user's app request and produce a detailed project plan.

You MUST respond with ONLY valid JSON — no markdown, no explanation:
{
  "projectName": "kebab-case-name",
  "description": "one-line description",
  "language": "javascript",
  "thinking": "3-5 sentences: what you are building, the architecture, technologies used via CDN, why this approach creates a Play-Store quality experience",
  "filePlan": [
    { "path": "index.html", "role": "Entry point — links ALL CSS files via <link href> and loads ALL JS files via <script src> tags" },
    { "path": "frontend/css/style.css", "role": "Global styles, CSS variables, animations, responsive layout" },
    { "path": "frontend/css/components.css", "role": "Component-specific styles: cards, buttons, modals, inputs" },
    { "path": "frontend/js/app.js", "role": "App router, state management, page navigation, initialisation" },
    { "path": "frontend/js/pages/home.js", "role": "Home page/screen — separate file for this screen" },
    { "path": "frontend/js/pages/detail.js", "role": "Detail/inner page — separate file for this screen" },
    { "path": "frontend/js/components/navbar.js", "role": "Reusable navigation bar component" },
    { "path": "backend/api.js", "role": "API/data service layer — fetch wrappers, mock data, localStorage" },
    { "path": "backend/data.js", "role": "Sample data — 20+ realistic records for each entity" }
  ]
}

RULES for filePlan:
- index.html MUST be first and at the ROOT level (not inside any folder)
- index.html MUST reference files using their folder paths e.g. <link href="frontend/css/style.css"> and <script src="backend/api.js">
- NEVER put CSS or JS inline in index.html — always use separate files linked via <link> or <script src>
- Generate 10-15 files total — enough for a real, structured app
- MANDATORY folder structure:
    frontend/css/          — all stylesheets (style.css + components.css minimum)
    frontend/js/pages/     — one SEPARATE file per page/screen (never combine pages into one file)
    frontend/js/components/— reusable UI pieces (navbar, cards, modals)
    backend/               — api.js (data service layer) + data.js (sample data, 20+ records)
- Each page/screen MUST be its own separate file in frontend/js/pages/
- All files must be browser-runnable via CDN — no npm, no build step
- The app should feel like a Play Store / App Store quality mobile app`;

  send({ step: "thinking", message: "Analysing your request..." });

  // Use the planning model list — fast models first for quick analysis
  const raw = await streamCollect(
    PLANNING_MODELS,
    [{ role: "system", content: systemPrompt }, { role: "user", content: `Plan this app: ${prompt}` }],
    1500,
    (token) => send({ step: "thinking_token", token })
  );

  const jsonStr = extractJson(raw);
  let plan: any;
  try { plan = JSON.parse(jsonStr); }
  catch {
    plan = {
      projectName: "my-app",
      description: prompt,
      language: "javascript",
      thinking: "Building a full-featured browser app with modern design.",
      filePlan: [
        { path: "index.html", role: "Entry point — links CSS and JS files" },
        { path: "frontend/css/style.css", role: "Global styles" },
        { path: "frontend/css/components.css", role: "Component styles" },
        { path: "frontend/js/app.js", role: "App router and state" },
        { path: "frontend/js/pages/home.js", role: "Home screen" },
        { path: "frontend/js/pages/detail.js", role: "Detail screen" },
        { path: "frontend/js/components/navbar.js", role: "Navigation bar" },
        { path: "backend/api.js", role: "Data layer" },
        { path: "backend/data.js", role: "Sample data" },
      ],
    };
  }

  const filePlan = (plan.filePlan ?? []).map((f: any) =>
    typeof f === "string" ? { path: f, role: "File" } : f
  );

  send({
    step: "analysed",
    thinking: plan.thinking ?? "",
    projectName: plan.projectName ?? "my-app",
    filePlan: filePlan.map((f: any) => f.path),
  });

  return {
    projectName: plan.projectName ?? "my-app",
    description: plan.description ?? prompt,
    language: plan.language ?? "javascript",
    filePlan,
  };
}

// ── Phase 2: Generate a single file ──────────────────────────────────────────
async function generateFile(opts: {
  filePath: string;
  role: string;
  prompt: string;
  projectName: string;
  allFiles: Array<{ path: string; role: string }>;
  indexHtmlSnippet?: string;
  send: (data: Record<string, any>) => void;
}): Promise<string> {
  const { filePath, role, prompt, projectName, allFiles, indexHtmlSnippet, send } = opts;

  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const isHtml = ext === "html";
  const isCss = ext === "css";
  const isJs = ext === "js" || ext === "jsx";

  // File-type specific guidance
  let fileGuidance = "";
  if (isHtml) {
    fileGuidance = `
You are writing index.html — the ENTRY POINT of the app.

CRITICAL REQUIREMENTS:
1. Load ALL CDN libraries at the top of <head> — Tailwind CSS CDN, Font Awesome icons, Google Fonts, Chart.js (if charts), GSAP (if animations), etc.
2. Link every CSS file using <link> tags with correct folder paths: frontend/css/style.css, frontend/css/components.css, etc.
3. Load every JS file at the bottom of <body> in dependency order using <script src> tags: backend/api.js, backend/data.js, frontend/js/components/navbar.js, frontend/js/pages/home.js, frontend/js/app.js (last)
4. Add a splash screen / loading animation that fades out
5. Create the root HTML structure with proper semantic tags
6. Add PWA meta tags: viewport, theme-color, apple-mobile-web-app-capable
7. The app must look and feel like a native mobile app

NEVER inline CSS in index.html — always use <link href="frontend/css/style.css">
NEVER inline JS in index.html — always use <script src="backend/api.js"> etc.

CDN LINKS TO USE:
- Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
- Animate.css: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
- Chart.js (if charts): <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

NEVER use npm-style imports. CDN only.`;
  } else if (isCss) {
    const isGlobal = filePath.includes("style") && !filePath.includes("component");
    fileGuidance = isGlobal ? `
You are writing the GLOBAL stylesheet.

REQUIREMENTS — Play Store quality design:
1. Define CSS custom properties (variables) for the entire design system:
   --primary, --primary-dark, --secondary, --accent, --background, --surface, --surface-2, 
   --text, --text-secondary, --text-muted, --border, --shadow, --radius, --radius-lg
2. Dark theme by default (deep dark backgrounds, vibrant accent colors)
3. Mobile-first: base styles for mobile, media queries for desktop
4. Smooth animations: transitions on all interactive elements (0.2s ease)
5. Safe area support: padding for mobile notches (env(safe-area-inset-*))
6. Custom scrollbar styling
7. Typography scale using the Google Font loaded in HTML
8. Glassmorphism effects: backdrop-filter: blur() with semi-transparent backgrounds
9. Gradient backgrounds and accent colors
10. Bottom navigation bar styles (fixed, blur background)
11. Card styles with subtle shadows and hover effects
12. Input/button styles that look native-app quality` : `
You are writing COMPONENT styles.

REQUIREMENTS:
1. Cards: rounded corners (16-24px), subtle shadows, hover lift effects
2. Buttons: gradient backgrounds, press animations (transform: scale(0.97))
3. Modals/sheets: slide-up animation, backdrop blur
4. List items: proper padding, dividers, tap highlight
5. Badges/tags: pill shapes, color variants
6. Skeleton loaders for loading states
7. Empty states with illustrations (CSS-only or emoji)
8. Toast/snackbar notifications
9. Progress bars and spinners
10. Avatar components`;
  } else if (isJs) {
    const isRouter = filePath.endsWith("app.js");
    const isApi = filePath.includes("api");
    const isPage = filePath.includes("pages/");
    const isComponent = filePath.includes("components/");
    const isData = filePath.includes("data");

    if (isRouter) {
      fileGuidance = `
You are writing the MAIN APP ROUTER and state manager.

REQUIREMENTS:
1. Client-side router: manage "pages" as shown/hidden div sections
2. Global app state object (AppState): currentUser, currentPage, data cache, theme
3. Navigation functions: navigate(page, params), goBack()
4. Auth check on init: read user from localStorage
5. Bottom tab bar rendering and active state management
6. Page transition animations (slide, fade)
7. Initialize all components on DOM ready
8. Toast notification system
9. Theme toggling (dark/light)
10. Error boundary: global error handler`;
    } else if (isApi) {
      fileGuidance = `
You are writing the API SERVICE LAYER.

REQUIREMENTS:
1. Wrap localStorage as a mini-database (no real backend needed — simulate one)
2. CRUD functions for all data entities the app needs
3. User auth simulation: register(), login(), logout(), getCurrentUser()
4. Data persistence: all operations save to localStorage, load on init
5. Async wrappers that simulate network delay (200-500ms) for realism
6. Error simulation for edge cases
7. Pre-populate with 20+ realistic sample records on first run
8. Export all functions for use by pages/components`;
    } else if (isPage) {
      const pageName = filePath.split("/").pop()?.replace(".js", "") ?? "page";
      fileGuidance = `
You are writing the ${pageName.toUpperCase()} PAGE module.

REQUIREMENTS:
1. render() function that returns HTML string for this page
2. init() function called after render to attach event listeners
3. Full page layout with header, content area, and proper spacing
4. At least 3-5 meaningful UI sections/components visible on this screen
5. Interactive elements: buttons, forms, cards that respond to user input
6. Loading states and empty states
7. Real data from the api.js service layer
8. Smooth entry animation on page load
9. Mobile-optimized touch targets (min 44px)
10. Context-appropriate icons from Font Awesome`;
    } else if (isComponent) {
      const compName = filePath.split("/").pop()?.replace(".js", "") ?? "component";
      fileGuidance = `
You are writing the ${compName.toUpperCase()} COMPONENT.

REQUIREMENTS:
1. Reusable render(props) function
2. Event delegation pattern for dynamic elements
3. Multiple visual variants (primary, secondary, danger, etc.)
4. Responsive behaviour for mobile vs desktop
5. Accessible markup (aria labels, roles)`;
    } else if (isData) {
      fileGuidance = `
You are writing the SAMPLE DATA module.

REQUIREMENTS:
1. Export 20-30 realistic, diverse sample records for each data type the app needs
2. Use real-sounding names, locations, dates, prices, etc.
3. Include variety: different statuses, categories, dates, amounts
4. Image URLs from https://picsum.photos/seed/{id}/400/300 for placeholder images
5. Avatar URLs from https://i.pravatar.cc/150?img={1-70} for user avatars
6. Export as named constants: export const USERS = [...], export const PRODUCTS = [...], etc.`;
    }
  }

  const allFilesList = allFiles.map(f => `  ${f.path} — ${f.role}`).join("\n");
  const contextNote = indexHtmlSnippet && !isHtml
    ? `\n\nindex.html summary (CDN scripts loaded, file structure):\n${indexHtmlSnippet}`
    : "";

  const systemPrompt = `${ZORVIX_SYSTEM_PROMPT}\n\nYou are an elite frontend engineer building a Play Store quality app.
Write the COMPLETE, PRODUCTION-READY content of a SINGLE file.
Output ONLY the raw file content — no markdown fences, no explanation text, no comments like "// rest of code".
Write EVERY LINE. Minimum 150 lines for CSS/JS files, minimum 80 lines for HTML.
The design and code quality must match top-tier apps on the Play Store / App Store.${fileGuidance}`;

  const userMessage = `App: ${projectName}
User request: ${prompt}
This file: ${filePath} (${role})

Full project structure:
${allFilesList}${contextNote}

Write the COMPLETE content of ${filePath} now:`;

  send({ step: "writing_file", message: `Writing ${filePath}...`, filePath });

  // All files use AGENT_BUILD_MODELS — tries best coders first, falls back to fast working models.
  // This means if qwen3-coder is unavailable, we quickly fall to step-3.5-flash (which works) instead
  // of wasting time cycling through 10+ failing models.
  const content = await streamCollect(
    AGENT_BUILD_MODELS,
    [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
    4096,
    (token) => send({ step: "file_token", filePath, token })
  );

  send({
    step: "file_done",
    message: `${filePath} complete`,
    filePath,
    lineCount: content.split("\n").length,
  });

  return content.trim();
}

// ── SSE stream route ──────────────────────────────────────────────────────────
router.post("/agent/build", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  function send(data: Record<string, any>) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    (res as any).flush?.();
  }

  try {
    // ── Phase 1: Plan ─────────────────────────────────────────────────────
    const plan = await analyseAndPlan(prompt.trim(), send);

    send({
      step: "planning",
      message: `Planned ${plan.filePlan.length} files`,
      files: plan.filePlan.map(f => f.path),
      projectName: plan.projectName,
    });

    // ── Phase 2: Generate index.html first (others depend on its CDN links) ──
    const generatedMap = new Map<string, string>();

    const htmlFile = plan.filePlan.find(f => f.path.endsWith(".html")) ?? plan.filePlan[0];
    const htmlContent = await generateFile({
      filePath: htmlFile.path,
      role: htmlFile.role,
      prompt: prompt.trim(),
      projectName: plan.projectName,
      allFiles: plan.filePlan,
      send,
    });
    generatedMap.set(htmlFile.path, htmlContent);

    // ── Phase 3: Generate all remaining files in parallel (2 at a time) ──
    const remaining = plan.filePlan.filter(f => f.path !== htmlFile.path);
    const CONCURRENCY = 2;

    // Extract a short snippet of index.html as context for other files
    const indexSnippet = htmlContent.slice(0, 800);

    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
      const batch = remaining.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(file => generateFile({
          filePath: file.path,
          role: file.role,
          prompt: prompt.trim(),
          projectName: plan.projectName,
          allFiles: plan.filePlan,
          indexHtmlSnippet: indexSnippet,
          send,
        }))
      );
      results.forEach((result, j) => {
        if (result.status === "fulfilled") {
          generatedMap.set(batch[j].path, result.value);
        } else {
          send({ step: "file_error", filePath: batch[j].path, message: String(result.reason) });
          generatedMap.set(batch[j].path, `// Error generating this file`);
        }
      });
    }

    if (generatedMap.size === 0) throw new Error("No files were generated. Please try again.");

    send({ step: "saving", message: "Saving project..." });

    // ── Phase 4: Save to database ─────────────────────────────────────────
    const [createdProject] = await db.insert(projectsTable).values({
      name: plan.projectName,
      description: plan.description,
      language: plan.language,
      userId,
    }).returning();

    const fileRows = plan.filePlan.map(f => ({
      projectId: createdProject.id,
      name: f.path.split("/").pop()!,
      path: f.path,
      content: generatedMap.get(f.path) ?? "",
      language: getLanguage(f.path),
    }));

    const createdFiles = await db.insert(projectFilesTable).values(fileRows).returning();

    send({ step: "checking", message: "Checking files..." });

    const errors: string[] = [];
    for (const file of createdFiles) {
      if (file.content.trim().length < 10) errors.push(`${file.path}: File appears empty`);
    }

    send(errors.length > 0
      ? { step: "fixing", message: `${errors.length} file(s) had issues`, errors }
      : { step: "clean", message: "All files generated successfully!" }
    );

    const fileTree = buildFileTree(createdFiles.map(f => f.path));

    send({
      step: "done",
      message: "Your app is ready!",
      project: { id: createdProject.id, name: createdProject.name, description: createdProject.description, language: createdProject.language },
      files: createdFiles.map(f => ({ id: f.id, name: f.name, path: f.path, language: f.language })),
      fileTree,
      errors,
    });

    res.end();
  } catch (err: any) {
    send({ step: "error", message: err.message ?? "Build failed" });
    res.end();
  }
});

export default router;
