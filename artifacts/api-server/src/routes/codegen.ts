import { Router, type IRouter } from "express";
import { createChatCompletion } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

import {
  GenerateCodeBody,
  ExplainCodeBody,
  FixCodeBody,
  ReviewCodeBody,
  ConvertCodeBody,
  CompleteCodeBody,
  GenerateTestsBody,
  DocumentCodeBody,
  ListLanguagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LANGUAGES = [
  { id: "python", name: "Python", extension: ".py", icon: "🐍" },
  { id: "javascript", name: "JavaScript", extension: ".js", icon: "🟨" },
  { id: "typescript", name: "TypeScript", extension: ".ts", icon: "🔷" },
  { id: "java", name: "Java", extension: ".java", icon: "☕" },
  { id: "c", name: "C", extension: ".c", icon: "🔵" },
  { id: "cpp", name: "C++", extension: ".cpp", icon: "⚙️" },
  { id: "csharp", name: "C#", extension: ".cs", icon: "🟣" },
  { id: "go", name: "Go", extension: ".go", icon: "🐹" },
  { id: "rust", name: "Rust", extension: ".rs", icon: "🦀" },
  { id: "swift", name: "Swift", extension: ".swift", icon: "🍎" },
  { id: "kotlin", name: "Kotlin", extension: ".kt", icon: "🟠" },
  { id: "php", name: "PHP", extension: ".php", icon: "🐘" },
  { id: "ruby", name: "Ruby", extension: ".rb", icon: "💎" },
  { id: "r", name: "R", extension: ".r", icon: "📊" },
  { id: "matlab", name: "MATLAB", extension: ".m", icon: "🔢" },
  { id: "sql", name: "SQL", extension: ".sql", icon: "🗄️" },
  { id: "html", name: "HTML", extension: ".html", icon: "🌐" },
  { id: "css", name: "CSS", extension: ".css", icon: "🎨" },
  { id: "bash", name: "Bash", extension: ".sh", icon: "💻" },
  { id: "powershell", name: "PowerShell", extension: ".ps1", icon: "🖥️" },
  { id: "dart", name: "Dart", extension: ".dart", icon: "🎯" },
  { id: "lua", name: "Lua", extension: ".lua", icon: "🌙" },
  { id: "perl", name: "Perl", extension: ".pl", icon: "🐪" },
  { id: "scala", name: "Scala", extension: ".scala", icon: "⭐" },
  { id: "haskell", name: "Haskell", extension: ".hs", icon: "λ" },
  { id: "elixir", name: "Elixir", extension: ".ex", icon: "💧" },
  { id: "erlang", name: "Erlang", extension: ".erl", icon: "🟥" },
  { id: "clojure", name: "Clojure", extension: ".clj", icon: "🔵" },
  { id: "fsharp", name: "F#", extension: ".fs", icon: "🔶" },
  { id: "julia", name: "Julia", extension: ".jl", icon: "🔴" },
  { id: "groovy", name: "Groovy", extension: ".groovy", icon: "🟢" },
  { id: "objectivec", name: "Objective-C", extension: ".m", icon: "🍎" },
  { id: "vba", name: "VBA", extension: ".vba", icon: "📗" },
  { id: "assembly", name: "Assembly", extension: ".asm", icon: "⚙️" },
  { id: "cobol", name: "COBOL", extension: ".cbl", icon: "📟" },
  { id: "fortran", name: "Fortran", extension: ".f90", icon: "🔢" },
  { id: "pascal", name: "Pascal", extension: ".pas", icon: "📐" },
  { id: "prolog", name: "Prolog", extension: ".pl", icon: "🧠" },
  { id: "lisp", name: "Lisp", extension: ".lisp", icon: "λ" },
  { id: "solidity", name: "Solidity", extension: ".sol", icon: "🪙" },
  { id: "webassembly", name: "WebAssembly", extension: ".wat", icon: "🔧" },
  { id: "graphql", name: "GraphQL", extension: ".graphql", icon: "📡" },
  { id: "yaml", name: "YAML", extension: ".yaml", icon: "📄" },
  { id: "json", name: "JSON", extension: ".json", icon: "📋" },
  { id: "xml", name: "XML", extension: ".xml", icon: "📰" },
  { id: "markdown", name: "Markdown", extension: ".md", icon: "📝" },
  { id: "terraform", name: "Terraform", extension: ".tf", icon: "🏗️" },
  { id: "dockerfile", name: "Dockerfile", extension: ".dockerfile", icon: "🐳" },
];

async function streamToResponse(res: any, messages: { role: string; content: string }[], systemPrompt: string): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await createChatCompletion({
    messages: [
      { role: "system", content: `${ZORVIX_SYSTEM_PROMPT}\n\n${systemPrompt}` },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    stream: true,
    max_completion_tokens: 8192,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

router.get("/codegen/languages", (_req, res): void => {
  res.json(ListLanguagesResponse.parse(LANGUAGES));
});

router.post("/codegen/generate", async (req, res): Promise<void> => {
  const parsed = GenerateCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { prompt, language, context } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Write ${language} code for: ${prompt}${context ? `\n\nContext:\n${context}` : ""}` }],
    `You are an expert ${language} developer. Write clean, production-ready, well-commented code. Always include the complete implementation with no placeholders.`
  );
});

router.post("/codegen/explain", async (req, res): Promise<void> => {
  const parsed = ExplainCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Explain this ${language} code in detail:\n\`\`\`${language}\n${code}\n\`\`\`` }],
    `You are an expert code explainer. Explain code clearly and concisely, covering what it does, how it works, key concepts, and any potential issues.`
  );
});

router.post("/codegen/fix", async (req, res): Promise<void> => {
  const parsed = FixCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language, error } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Fix this ${language} code${error ? ` (Error: ${error})` : ""}:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the fixed code and explain what was wrong.` }],
    `You are an expert debugger. Identify and fix all bugs in the code. Explain what was wrong and what you changed.`
  );
});

router.post("/codegen/review", async (req, res): Promise<void> => {
  const parsed = ReviewCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Review this ${language} code for quality, security, performance, and best practices:\n\`\`\`${language}\n${code}\n\`\`\`` }],
    `You are a senior code reviewer. Provide detailed feedback on: code quality, security vulnerabilities, performance issues, best practices, maintainability, and suggest specific improvements.`
  );
});

router.post("/codegen/convert", async (req, res): Promise<void> => {
  const parsed = ConvertCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, fromLanguage, toLanguage } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Convert this ${fromLanguage} code to ${toLanguage}:\n\`\`\`${fromLanguage}\n${code}\n\`\`\`\n\nUse idiomatic ${toLanguage} patterns and best practices.` }],
    `You are an expert polyglot programmer. Convert code between languages preserving logic and applying idiomatic patterns of the target language.`
  );
});

router.post("/codegen/complete", async (req, res): Promise<void> => {
  const parsed = CompleteCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Complete or continue this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`` }],
    `You are an expert ${language} developer. Continue or complete the provided code in a logical and idiomatic way.`
  );
});

router.post("/codegen/test", async (req, res): Promise<void> => {
  const parsed = GenerateTestsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language, framework } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Generate comprehensive unit tests for this ${language} code${framework ? ` using ${framework}` : ""}:\n\`\`\`${language}\n${code}\n\`\`\`` }],
    `You are an expert at writing tests. Generate thorough unit tests covering happy paths, edge cases, and error cases.`
  );
});

router.post("/codegen/document", async (req, res): Promise<void> => {
  const parsed = DocumentCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, language, style } = parsed.data;
  await streamToResponse(
    res,
    [{ role: "user", content: `Add ${style || "inline"} documentation/comments to this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`` }],
    `You are a technical writer and expert ${language} developer. Add clear, comprehensive documentation and comments to the code.`
  );
});

export default router;
