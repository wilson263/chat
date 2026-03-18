import { Router, type IRouter, type Request, type Response } from "express";
import { createChatCompletion } from "../lib/ai";

const router: IRouter = Router();

function extractJson(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlock) return jsonBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

const LANGUAGE_MAP: Record<string, string> = {
  html: "html", css: "css", js: "javascript", ts: "typescript",
  tsx: "typescript", jsx: "javascript", json: "json", md: "markdown",
  py: "python", go: "go", rs: "rust", java: "java", php: "php",
  rb: "ruby", sh: "shell", bash: "shell", yaml: "yaml", yml: "yaml",
  txt: "plaintext", sql: "sql", c: "c", cpp: "cpp", cs: "csharp",
  swift: "swift", kt: "kotlin", dart: "dart", r: "r", m: "matlab",
  scala: "scala", ex: "elixir", exs: "elixir", erl: "erlang",
  hs: "haskell", lua: "lua", pl: "perl", vue: "vue", svelte: "svelte",
  toml: "toml", ini: "ini", env: "plaintext", dockerfile: "dockerfile",
  xml: "xml", graphql: "graphql", prisma: "prisma",
};

function getLanguage(filePath: string): string {
  const base = filePath.split("/").pop() ?? "";
  if (base.toLowerCase() === "dockerfile") return "dockerfile";
  if (base.toLowerCase() === ".env" || base.toLowerCase() === ".env.example") return "plaintext";
  const ext = base.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

async function generatePlaygroundProject(prompt: string, attempt = 1): Promise<{
  projectName: string;
  description: string;
  files: Array<{ path: string; name: string; content: string; language: string }>;
}> {
  const systemPrompt = `You are a world-class senior software engineer and architect. You build complete, production-quality projects in ANY programming language or framework the user requests. You never restrict yourself to just HTML/CSS/JS.

When given a project request, respond with ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

JSON structure:
{
  "projectName": "kebab-case-name",
  "description": "one line description",
  "files": [
    {
      "path": "folder/filename.ext",
      "name": "filename.ext",
      "content": "complete file content here"
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE & FRAMEWORK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If the user specifies a language (Python, Java, Go, Rust, PHP, C#, C++, Swift, Kotlin, React, Vue, Angular, Next.js, Django, Laravel, Spring Boot, Flutter, etc.) → USE IT EXACTLY
- If no language is specified and it's a web app → use HTML/CSS/JavaScript with SEPARATE files for each page and feature
- You support ALL programming languages that exist: Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, Dart, R, Scala, Haskell, Lua, Perl, Elixir, Erlang, MATLAB, Bash, SQL, and more

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE RULES — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER put everything in one file. Always create a proper project structure:

FOR MULTI-PAGE WEB APPS:
- Create a SEPARATE .html file for EACH page (home.html, about.html, cart.html, products.html, contact.html, login.html, etc.)
- Create a SEPARATE .css file for styles (styles.css or per-page CSS)
- Create a SEPARATE .js file for each feature or page (main.js, cart.js, auth.js, products.js, etc.)
- Minimum 6-15 files for any real app

FOR PYTHON PROJECTS:
- main.py or app.py as entry point
- Separate modules for each feature (models.py, routes.py, database.py, utils.py, config.py, etc.)
- requirements.txt with all dependencies
- README.md

FOR NODE.JS / EXPRESS PROJECTS:
- server.js or index.js as entry point
- routes/ folder with separate route files
- models/ folder, controllers/ folder, middleware/ folder
- package.json with all dependencies

FOR REACT / VUE / ANGULAR:
- Proper component structure with MANY separate component files
- Separate files for pages, components, hooks, services, utils
- package.json, proper config files

FOR JAVA / SPRING:
- Proper Maven/Gradle project structure
- Separate classes for each responsibility
- pom.xml or build.gradle

FOR ANY LANGUAGE:
- NEVER dump everything in one file
- Follow that language's standard project conventions
- Create all config files (package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, etc.)
- Include README.md with setup and run instructions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every file must have COMPLETE, WORKING content — no placeholders, no "// TODO", no "..." truncation
- For web apps: dark theme, modern UI, smooth animations, fully responsive
- For multi-page HTML sites: each page must link to all other pages in the navigation
- Minimum 10+ files for any substantial project
- All files must be properly linked/imported — nothing should be missing
- Include sample/seed data so the app looks real when opened
- Respond ONLY with the raw JSON object — no markdown, no explanation`;

  const userMessage = attempt === 1
    ? `Build this project: ${prompt}`
    : `Build this project: ${prompt}\n\nIMPORTANT: Previous attempt failed JSON parsing. Respond with ONLY raw JSON, no markdown fences, no explanation. Every string value must have properly escaped quotes and newlines (\\n, \\").`;

  const response = await createChatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    model: "qwen/qwen3-coder-480b-a35b:free",
    max_completion_tokens: 100000,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonStr = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    if (attempt < 3) return generatePlaygroundProject(prompt, attempt + 1);
    throw new Error("AI failed to generate valid project after 3 attempts.");
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    if (attempt < 3) return generatePlaygroundProject(prompt, attempt + 1);
    throw new Error("AI returned no files.");
  }

  return {
    projectName: parsed.projectName ?? "my-project",
    description: parsed.description ?? prompt,
    files: parsed.files.map((f: any) => ({
      path: f.path ?? f.name ?? "file.txt",
      name: f.name ?? (f.path ? f.path.split("/").pop() : "file.txt") ?? "file.txt",
      content: f.content ?? "",
      language: getLanguage(f.path ?? f.name ?? ""),
    })),
  };
}

router.post("/playground/generate", async (req: Request, res: Response): Promise<void> => {
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
    send({ step: "thinking", message: "Planning your project..." });

    const project = await generatePlaygroundProject(prompt);

    send({ step: "writing", message: `Writing ${project.files.length} files...`, projectName: project.projectName });

    for (let i = 0; i < project.files.length; i++) {
      const file = project.files[i];
      send({ step: "file", message: `Creating ${file.path}`, file });
      await new Promise(r => setTimeout(r, 80));
    }

    send({ step: "done", message: "Project is ready!", project });
    res.end();
  } catch (err: any) {
    send({ step: "error", message: err.message ?? "Generation failed" });
    res.end();
  }
});

export default router;
