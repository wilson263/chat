import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserId } from "./auth";

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

async function generateProject(prompt: string, attempt = 1): Promise<{
  projectName: string;
  description: string;
  language: string;
  files: Array<{ path: string; name: string; content: string; language: string }>;
}> {
  const { groq } = await import("@workspace/integrations-groq-ai");

  const systemPrompt = `You are an expert software engineer. When given a project request, you MUST respond with ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

The JSON must follow this exact structure:
{
  "projectName": "kebab-case-name",
  "description": "one line description",
  "language": "primary language (javascript/typescript/python/etc)",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "name": "filename.ext",
      "content": "complete file content here"
    }
  ]
}

RULES:
- Generate ALL files needed (HTML, CSS, JS, config files, etc.)
- Every file must have complete, working, production-ready content
- No placeholder comments like "add code here"
- Include a README.md explaining how to run the project
- For web apps: always include index.html, styles.css, and main JS/TS files
- For React apps: include package.json, vite.config.js, index.html, src/App.jsx, src/main.jsx
- Make the code visually impressive — dark theme, modern UI
- Respond ONLY with the JSON object, nothing else`;

  const userMessage = attempt === 1
    ? `Build this project: ${prompt}`
    : `Build this project: ${prompt}\n\nIMPORTANT: Previous attempt failed to return valid JSON. You MUST respond with ONLY a raw JSON object, no markdown, no explanation.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 32768,
    temperature: 0.5,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonStr = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    if (attempt < 3) return generateProject(prompt, attempt + 1);
    throw new Error("AI failed to generate valid project structure after 3 attempts.");
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    if (attempt < 3) return generateProject(prompt, attempt + 1);
    throw new Error("AI returned no files.");
  }

  return {
    projectName: parsed.projectName ?? "my-project",
    description: parsed.description ?? prompt,
    language: parsed.language ?? "javascript",
    files: parsed.files.map((f: any) => ({
      path: f.path ?? f.name ?? "file.txt",
      name: f.name ?? (f.path ? f.path.split("/").pop() : "file.txt"),
      content: f.content ?? "",
      language: getLanguage(f.path ?? f.name ?? ""),
    })),
  };
}

async function fixErrors(
  files: Array<{ path: string; content: string }>,
  errors: string[]
): Promise<Array<{ path: string; content: string }>> {
  const { groq } = await import("@workspace/integrations-groq-ai");

  const filesContext = files.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");
  const errorsText = errors.join("\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Fix the following errors in these project files. Return ONLY a JSON array of fixed files:
[{"path": "file.ext", "content": "fixed content"}, ...]

ERRORS:
${errorsText}

FILES:
${filesContext}

Return ONLY the JSON array, no explanation.`,
      },
    ],
    max_tokens: 32768,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] ?? "[]";

  try {
    const fixed = JSON.parse(jsonStr);
    if (Array.isArray(fixed) && fixed.length > 0) {
      const fixedMap = new Map(fixed.map((f: any) => [f.path, f.content]));
      return files.map(f => ({ ...f, content: fixedMap.get(f.path) ?? f.content }));
    }
  } catch {}

  return files;
}

function buildFileTree(paths: string[]): object {
  const tree: Record<string, any> = {};
  for (const filePath of paths) {
    const parts = filePath.split("/");
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = "file";
      } else {
        node[part] = node[part] || {};
        node = node[part];
      }
    }
  }
  return tree;
}

router.post("/agent/build", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ step: "generating", message: "Generating project structure..." });

    const project = await generateProject(prompt);

    send({ step: "writing", message: `Writing ${project.files.length} files...`, projectName: project.projectName });

    const [createdProject] = await db.insert(projectsTable).values({
      name: project.projectName,
      description: project.description,
      language: project.language,
      userId,
    }).returning();

    const createdFiles = await db.insert(projectFilesTable).values(
      project.files.map(f => ({
        projectId: createdProject.id,
        name: f.name,
        path: f.path,
        content: f.content,
        language: f.language,
      }))
    ).returning();

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
      send({ step: "fixing", message: `Fixing ${errors.length} error(s)...`, errors });

      const fixedFiles = await fixErrors(
        createdFiles.map(f => ({ path: f.path, content: f.content })),
        errors
      );

      for (const fixed of fixedFiles) {
        const dbFile = createdFiles.find(f => f.path === fixed.path);
        if (dbFile) {
          await db.update(projectFilesTable)
            .set({ content: fixed.content, updatedAt: new Date() })
            .where(eq(projectFilesTable.id, dbFile.id));
        }
      }

      send({ step: "fixed", message: "All errors fixed!" });
    } else {
      send({ step: "clean", message: "No errors found — code is clean!" });
    }

    const fileTree = buildFileTree(createdFiles.map(f => f.path));

    send({
      step: "done",
      message: "Project ready!",
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
