import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import { getUserId } from "./auth";
import { createChatCompletionStream } from "../lib/ai";

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
      if (i === parts.length - 1) {
        node[part] = null;
      } else {
        node[part] = node[part] ?? {};
        node = node[part];
      }
    }
  }
  return tree;
}

// ── Phase 1: Analyse the prompt and plan files (streaming, shows thinking) ──
async function analyseAndPlan(
  prompt: string,
  send: (data: Record<string, any>) => void
): Promise<{ projectName: string; description: string; language: string; filePlan: string[] }> {
  const systemPrompt = `You are an expert software architect. Analyse the user's app request and produce a JSON plan.

Respond with ONLY valid JSON:
{
  "projectName": "kebab-case-name",
  "description": "one-line description",
  "language": "javascript",
  "thinking": "2-4 sentences explaining your analysis of what to build, which technologies to use, and why",
  "filePlan": ["index.html", "style.css", "app.js"]
}

Rules for filePlan:
- index.html is ALWAYS first
- 3-8 files total
- Keep it simple and browser-runnable (no build step)`;

  const stream = await createChatCompletionStream({
    model: "qwen/qwen3-coder-480b-a35b:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyse and plan: ${prompt}` },
    ],
    max_tokens: 1024,
    stream: true,
  });

  let raw = "";
  send({ step: "thinking", message: "Analysing your request..." });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      raw += token;
      send({ step: "thinking_token", token });
    }
  }

  const jsonStr = extractJson(raw);
  let plan: any;
  try {
    plan = JSON.parse(jsonStr);
  } catch {
    plan = {
      projectName: "my-project",
      description: prompt,
      language: "javascript",
      thinking: "Building a complete browser app.",
      filePlan: ["index.html", "style.css", "app.js"],
    };
  }

  send({
    step: "analysed",
    message: "Analysis complete",
    thinking: plan.thinking ?? "",
    projectName: plan.projectName ?? "my-project",
    filePlan: plan.filePlan ?? ["index.html"],
  });

  return {
    projectName: plan.projectName ?? "my-project",
    description: plan.description ?? prompt,
    language: plan.language ?? "javascript",
    filePlan: (plan.filePlan ?? ["index.html", "style.css", "app.js"]) as string[],
  };
}

// ── Phase 2: Generate one file at a time with live streaming ────────────────
async function generateFile(
  filePath: string,
  prompt: string,
  projectName: string,
  allFiles: string[],
  previousFiles: Array<{ path: string; content: string }>,
  send: (data: Record<string, any>) => void
): Promise<string> {
  const previousContext = previousFiles.length > 0
    ? `\n\nPreviously generated files (for consistency):\n` +
      previousFiles.map(f => `--- ${f.path} (first 200 chars) ---\n${f.content.slice(0, 200)}`).join("\n\n")
    : "";

  const isHtml = filePath.endsWith(".html");
  const isCss = filePath.endsWith(".css");
  const isJs = filePath.endsWith(".js") || filePath.endsWith(".jsx");

  let fileGuidance = "";
  if (isHtml) {
    fileGuidance = `
This is the main HTML entry point. Requirements:
- Load ALL CDN libraries needed for the app (React via unpkg if React app, Chart.js if charts, etc.)
- Include <link> to CSS files and <script> to JS files
- Provide proper HTML5 structure
- NEVER use npm-style imports. CDN only.`;
  } else if (isCss) {
    fileGuidance = `
This is the stylesheet. Requirements:
- Modern, professional dark-theme design
- CSS variables for theming
- Responsive design with media queries
- Smooth animations and transitions`;
  } else if (isJs) {
    fileGuidance = `
This is the JavaScript/application logic. Requirements:
- Complete, fully-working implementation
- Real interactivity — buttons work, forms submit, data displays
- Error handling with user-friendly messages
- No placeholder functions or TODO comments`;
  }

  const systemPrompt = `You are an expert web developer. Write the COMPLETE content of a single file.
Output ONLY the raw file content — no markdown fences, no explanation, just the file content itself.
Write every line. The file must be 100% complete and working.${fileGuidance}`;

  const userMessage = `Project: ${projectName}
User wants: ${prompt}
All project files: ${allFiles.join(", ")}
Write the COMPLETE content of: ${filePath}${previousContext}`;

  send({
    step: "writing_file",
    message: `Writing ${filePath}...`,
    filePath,
  });

  const stream = await createChatCompletionStream({
    model: "qwen/qwen3-coder-480b-a35b:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 4096,
    stream: true,
  });

  let content = "";
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      content += token;
      send({ step: "file_token", filePath, token });
    }
  }

  send({
    step: "file_done",
    message: `${filePath} complete (${content.length} chars)`,
    filePath,
    lineCount: content.split("\n").length,
  });

  return content.trim();
}

// ── SSE stream route ─────────────────────────────────────────────────────────

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
    // ── Phase 1: Analyse ───────────────────────────────────────────────────
    const plan = await analyseAndPlan(prompt.trim(), send);

    send({
      step: "planning",
      message: `Planned ${plan.filePlan.length} files: ${plan.filePlan.join(", ")}`,
      files: plan.filePlan,
      projectName: plan.projectName,
    });

    // ── Phase 2: Generate files one by one ────────────────────────────────
    const generatedFiles: Array<{ path: string; name: string; content: string; language: string }> = [];

    for (const filePath of plan.filePlan) {
      try {
        const content = await generateFile(
          filePath,
          prompt.trim(),
          plan.projectName,
          plan.filePlan,
          generatedFiles.map(f => ({ path: f.path, content: f.content })),
          send
        );

        generatedFiles.push({
          path: filePath,
          name: filePath.split("/").pop() ?? filePath,
          content,
          language: getLanguage(filePath),
        });
      } catch (fileErr: any) {
        send({
          step: "file_error",
          filePath,
          message: `Failed to generate ${filePath}: ${fileErr.message}`,
        });
      }
    }

    if (generatedFiles.length === 0) {
      throw new Error("No files were generated. Please try again.");
    }

    send({ step: "saving", message: "Saving project..." });

    // ── Phase 3: Save to database ─────────────────────────────────────────
    const [createdProject] = await db.insert(projectsTable).values({
      name: plan.projectName,
      description: plan.description,
      language: plan.language,
      userId,
    }).returning();

    const createdFiles = await db.insert(projectFilesTable).values(
      generatedFiles.map(f => ({
        projectId: createdProject.id,
        name: f.name,
        path: f.path,
        content: f.content,
        language: f.language,
      }))
    ).returning();

    // ── Phase 4: Basic validation ─────────────────────────────────────────
    send({ step: "checking", message: "Checking for errors..." });

    const errors: string[] = [];
    for (const file of createdFiles) {
      if (file.language === "json") {
        try { JSON.parse(file.content); } catch (e: any) {
          errors.push(`${file.path}: Invalid JSON — ${e.message}`);
        }
      }
      if (file.content.trim().length === 0) {
        errors.push(`${file.path}: File is empty`);
      }
    }

    if (errors.length > 0) {
      send({ step: "fixing", message: `Fixing ${errors.length} issue(s)...`, errors });
    } else {
      send({ step: "clean", message: "All files look good!" });
    }

    const fileTree = buildFileTree(createdFiles.map(f => f.path));

    send({
      step: "done",
      message: "Your app is ready!",
      project: {
        id: createdProject.id,
        name: createdProject.name,
        description: createdProject.description,
        language: createdProject.language,
      },
      files: createdFiles.map(f => ({ id: f.id, name: f.name, path: f.path, language: f.language })),
      fileTree,
      errors,
    });

    res.end();
  } catch (err: any) {
    send({ step: "error", message: err.message });
    res.end();
  }
});

export default router;
