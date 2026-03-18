import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, projectFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserId } from "./auth";
import OpenAI from "openai";

  function getAIClient(): OpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
    return new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  const openai = getAIClient();

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

// Build a flat file tree for display
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

async function generateProject(prompt: string, attempt = 1): Promise<{
  projectName: string;
  description: string;
  language: string;
  files: Array<{ path: string; name: string; content: string; language: string }>;
}> {
  const systemPrompt = `You are an expert full-stack web developer building browser-runnable apps. You MUST respond with ONLY a valid JSON object — no markdown, no explanation, just the raw JSON.

JSON structure:
{
  "projectName": "kebab-case-name",
  "description": "short one-line description",
  "language": "javascript",
  "files": [
    { "path": "index.html", "name": "index.html", "content": "...full file content..." },
    { "path": "style.css", "name": "style.css", "content": "...full file content..." },
    { "path": "app.js", "name": "app.js", "content": "...full file content..." }
  ]
}

═══════════════════════════════════════════════
CRITICAL RULES — READ CAREFULLY:
═══════════════════════════════════════════════

1. ALWAYS generate a complete, working index.html as the main entry point.
2. The app runs DIRECTLY in a browser — there is NO build step, NO npm install, NO node_modules.
3. ALL external libraries must be loaded via CDN in index.html <script> or <link> tags.

═══════════════════════════════════════════════
HOW TO LOAD LIBRARIES (CDN ONLY):
═══════════════════════════════════════════════

For React apps — use this exact pattern in index.html:
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  Then write JSX in <script type="text/babel"> tags.
  Access React globals: const { useState, useEffect, useRef } = React;
  Render: ReactDOM.createRoot(document.getElementById('root')).render(<App />);

For Vue apps:
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  Then use Vue.createApp({...}).mount('#app')

For charts/graphs:
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

For icons:
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>

For animations:
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

For HTTP requests — use native fetch() API (no axios needed in browser).

For data/state — use localStorage, sessionStorage, or in-memory JS objects.

NEVER write: import React from 'react' — that breaks in browsers.
NEVER write: require('something') — that breaks in browsers.
NEVER write: npm-style imports without full CDN URLs.

═══════════════════════════════════════════════
WHAT TO BUILD:
═══════════════════════════════════════════════

- Build the COMPLETE app with ALL features the user requested
- Make it FULLY FUNCTIONAL — not a skeleton, not placeholder content
- Professional, beautiful UI — dark theme preferred, modern design
- Responsive — works on mobile and desktop
- Interactive — real buttons that do things, forms that work, animations
- For data apps: include real sample data (at least 10-20 items)
- For games: include complete game logic (collision, scoring, game over, restart)
- For tools: include all input validation and error handling

═══════════════════════════════════════════════
FILE STRUCTURE RULES:
═══════════════════════════════════════════════

Simple apps (calculator, todo, weather UI):
  - index.html (all-in-one with embedded CSS + JS)
  OR
  - index.html + style.css + app.js

React apps:
  - index.html (with CDN scripts + <div id="root">)
  - app.jsx or App.jsx (React component in JSX syntax)
  Note: Files ending in .jsx or .tsx will be auto-compiled by Babel

Complex apps:
  - index.html
  - style.css
  - app.js or app.jsx
  - components/ (if needed, e.g. components/Header.jsx)
  - data.js (if using sample data)

DO NOT generate: package.json, vite.config, node_modules, tsconfig, webpack, App.tsx (React Native style), metro.config.js, babel.config.js

ABSOLUTELY FORBIDDEN — these will break the preview:
- import { View, Text, TextInput, Button, StyleSheet } from 'react-native' ← NEVER
- import { NavigationContainer } from '@react-navigation/native' ← NEVER
- import { createNativeStackNavigator } from '@react-navigation/native-stack' ← NEVER
- import { useNavigation } from '@react-navigation/native' ← NEVER
- import * as Expo from 'expo' ← NEVER
- StyleSheet.create({...}) ← NEVER
- Any React Native JSX elements like <View>, <Text>, <TouchableOpacity> ← NEVER
These are mobile-only and do not work in a browser. Use HTML/CSS/React DOM instead.

REMEMBER: Respond with ONLY the raw JSON object.`;

  const userMessage = attempt === 1
    ? `Build this: ${prompt}`
    : `Build this: ${prompt}\n\nPREVIOUS ATTEMPT FAILED. You MUST respond with ONLY a raw JSON object. No markdown fences, no explanation text.`;

  const response = await openai.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_completion_tokens: 8192,
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
      name: f.name ?? (f.path ? f.path.split("/").pop()! : "file.txt"),
      content: f.content ?? "",
      language: getLanguage(f.path ?? f.name ?? ""),
    })),
  };
}

async function fixErrors(
  files: Array<{ path: string; content: string }>,
  errors: string[]
): Promise<Array<{ path: string; content: string }>> {
  const filesContext = files.map(f => `--- ${f.path} ---\n${f.content}`).join("\n\n");
  const errorsText = errors.join("\n");

  const response = await openai.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      {
        role: "user",
        content: `Fix the following errors in these project files. Return ONLY a JSON array of fixed files:
[{"path": "...", "content": "...complete fixed content..."}]

Files:
${filesContext}

Errors to fix:
${errorsText}

Return ONLY the JSON array, nothing else.`,
      },
    ],
    max_completion_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonBlock ? jsonBlock[1].trim() : raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    return files;
  }
}

// ── SSE stream route ──────────────────────────────────────────────────────────
// Registered at /agent/build so the full path is POST /api/agent/build

router.post("/agent/build", async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  // Disable Render/nginx proxy buffering so SSE events stream immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  function send(data: Record<string, any>) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    (res as any).flush?.(); // force immediate flush through any middleware buffers
  }

  try {
    send({ step: "thinking", message: "Analyzing your request..." });

    const project = await generateProject(prompt.trim());

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
      send({ step: "fixing", message: `Fixing ${errors.length} issue(s)...`, errors });

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

      send({ step: "fixed", message: "Issues resolved!" });
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
