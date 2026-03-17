import { Router, type IRouter, type Request, type Response } from "express";

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
  rb: "ruby", sh: "shell", yaml: "yaml", yml: "yaml",
  txt: "plaintext", sql: "sql",
};

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

async function generatePlaygroundProject(prompt: string, attempt = 1): Promise<{
  projectName: string;
  description: string;
  files: Array<{ path: string; name: string; content: string; language: string }>;
}> {
  const { groq } = await import("@workspace/integrations-groq-ai");

  const systemPrompt = `You are an expert web developer. When given a project request, respond with ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

JSON structure:
{
  "projectName": "kebab-case-name",
  "description": "one line description",
  "files": [
    {
      "path": "index.html",
      "name": "index.html",
      "content": "complete file content"
    }
  ]
}

RULES:
- Build a complete, working, single-page web app using HTML, CSS, and vanilla JavaScript
- ALWAYS include an index.html as the entry point
- Keep CSS in a separate styles.css file, JS in a separate script.js (or inline if simple)
- Make the app visually impressive — dark theme, modern UI, smooth animations
- Every file must have complete, working content
- No placeholder comments
- index.html should link to styles.css and script.js using relative paths
- Respond ONLY with the raw JSON object`;

  const userMessage = attempt === 1
    ? `Build this web app: ${prompt}`
    : `Build this web app: ${prompt}\n\nIMPORTANT: Previous attempt failed. Respond with ONLY raw JSON, no markdown, no code blocks.`;

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
    if (attempt < 3) return generatePlaygroundProject(prompt, attempt + 1);
    throw new Error("AI failed to generate valid project after 3 attempts.");
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    if (attempt < 3) return generatePlaygroundProject(prompt, attempt + 1);
    throw new Error("AI returned no files.");
  }

  return {
    projectName: parsed.projectName ?? "my-app",
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
    send({ step: "thinking", message: "Planning your app..." });

    const project = await generatePlaygroundProject(prompt);

    send({ step: "writing", message: `Writing ${project.files.length} files...`, projectName: project.projectName });

    for (let i = 0; i < project.files.length; i++) {
      const file = project.files[i];
      send({ step: "file", message: `Creating ${file.path}`, file });
      await new Promise(r => setTimeout(r, 80));
    }

    send({ step: "done", message: "App is ready!", project });
    res.end();
  } catch (err: any) {
    send({ step: "error", message: err.message ?? "Generation failed" });
    res.end();
  }
});

export default router;
