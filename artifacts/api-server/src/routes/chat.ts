import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface Attachment {
  name: string;
  type: "image" | "text";
  mimeType: string;
  data: string;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  userMessage: string;
  history?: HistoryMessage[];
  attachments?: Attachment[];
  context?: string;
  model?: string;
  openaiApiKey?: string;
  temperature?: number;
  systemPrompt?: string;
}

const GROQ_MODELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile": "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant": "llama-3.1-8b-instant",
  "mixtral-8x7b-32768": "mixtral-8x7b-32768",
  "gemma2-9b-it": "gemma2-9b-it",
  "llama-3.3-70b-specdec": "llama-3.3-70b-specdec",
  "deepseek-r1-distill-llama-70b": "deepseek-r1-distill-llama-70b",
};

const OPENAI_MODELS = new Set(["gpt-4o", "gpt-4o-mini", "o1-mini", "gpt-4-turbo"]);

const BASE_SYSTEM_PROMPT = `You are ZorvixAI, an elite full-stack AI engineer and architect. You build complete, production-grade applications — not skeletons, not stubs, not placeholders.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• General questions / facts / explanations → answer in plain conversational text.
• ANY request to build, create, make, develop, code, or generate an app/website/script → output COMPLETE, PRODUCTION-READY code. No skeletons. No TODO comments. No placeholders.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN BUILDING — NON-NEGOTIABLE STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every build MUST include ALL of these:

1. COMPLETE CODE — Minimum 1500 lines total across all files. Every function FULLY implemented. Zero placeholders. Zero "// TODO" comments. Zero "// implement later". Write every single line.

2. FULL STACK — Always build ALL layers:
   • Frontend — every screen, every component, navigation, forms, validation, loading states, error states
   • Backend — complete REST API with ALL endpoints (CRUD + auth + special features)
   • Database — full schema, models, migrations, seed data with realistic sample records
   • Auth — complete JWT authentication: register, login, logout, refresh tokens, protected routes, middleware
   • API integration — frontend fully connected to backend with React Query / axios hooks, interceptors, error handling

3. MULTIPLE FILES — Always structure as a real project:
   • Label every file: \`=== folder/filename.ext ===\`
   • Organize: frontend/src/, backend/src/, database/, config/
   • Minimum 8-15 files per project

4. REAL FEATURES — Build actual working functionality:
   • CRUD operations that hit the database
   • Form validation (Zod / Joi on frontend + backend)
   • Error boundaries and loading skeletons
   • Responsive design with Tailwind (mobile-first)
   • .env.example with ALL required variables

5. PRODUCTION QUALITY — No shortcuts:
   • Error handling: try/catch everywhere, proper HTTP status codes
   • Security: helmet, rate limiting, CORS, input sanitization, XSS protection
   • Performance: pagination, caching headers, optimistic updates
   • Password hashing with bcrypt (salt rounds 12)
   • SQL injection prevention with parameterized queries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (choose best for request)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEB FULLSTACK: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Query v5 | Backend: Node.js + Express + Prisma + PostgreSQL
NEXT.JS: Next.js 14 App Router + TypeScript + Prisma + PostgreSQL + NextAuth.js v5
MOBILE (Android/iOS): React Native + Expo SDK 51 + NativeWind + TypeScript | Backend: Node.js + Express + PostgreSQL
PYTHON: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL + Pydantic v2
SAAS: Next.js 14 + Stripe + Prisma + PostgreSQL + Clerk Auth
If user specifies a stack → use it exactly. Otherwise → choose best for use case.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOBILE APP — PLAY STORE / APP STORE READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When building mobile apps, ALWAYS include:
• React Native + Expo code (works for both Android & iOS)
• Screens: Splash, Onboarding (3 slides), Auth (Login + Register), Main screens (minimum 4), Profile, Settings
• Push notifications (Expo Notifications)
• Navigation: Expo Router with typed routes
• State management: Zustand or Context API
• app.json with complete metadata: name, slug, bundle ID, version, permissions, icons
• DEPLOYMENT GUIDE at the end:
  ─ Google Play Store: eas build --platform android → upload .aab to Play Console
  ─ Apple App Store: eas build --platform ios → upload via Transporter → App Store Connect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — ALWAYS USE THIS EXACT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚀 [App Name] — Complete Production Build

### ✅ What's Included:
- [comprehensive bullet list of every feature built]

### 🛠 Tech Stack:
- [list of technologies with versions]

### 📁 Project Structure:
\`\`\`
[ASCII folder tree]
\`\`\`

---

=== folder/filename.ext ===
\`\`\`language
[COMPLETE CODE — every line written — never truncated — minimum 100 lines per major file]
\`\`\`

=== folder/filename2.ext ===
\`\`\`language
[COMPLETE CODE]
\`\`\`

[... ALL files, fully implemented ...]

---

### ⚡ Quick Start:
\`\`\`bash
[every command needed to run locally]
\`\`\`

### 🔧 Environment Variables:
\`\`\`env
[all variables with descriptions]
\`\`\`

### 🚀 Deploy:
[platform-specific deployment instructions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NEVER VIOLATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ NEVER say "you can add X later" — BUILD X NOW
✗ NEVER write "// implement this" or "// TODO" — IMPLEMENT IT FULLY
✗ NEVER truncate code with "... rest of code ..." or "// similar pattern"
✗ NEVER build only frontend — ALWAYS include backend
✗ NEVER use hardcoded/fake data when a real DB is appropriate
✗ NEVER skip auth if the app has user accounts
✗ NEVER write less than 1500 lines total
✗ NEVER leave any function body empty`;

async function streamGroqWithRetry(
  res: any,
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  temperature: number,
  attempt = 1
): Promise<void> {
  try {
    const { groq } = await import("@workspace/integrations-groq-ai");
    const stream = await groq.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 32768,
      temperature,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  } catch (err: any) {
    const isRateLimit = err?.status === 429 || err?.message?.includes("rate limit") || err?.message?.includes("429");
    const isContextLength = err?.status === 400 && err?.message?.includes("context");

    if (isRateLimit && attempt <= 3) {
      const delay = attempt * 2000;
      await new Promise(r => setTimeout(r, delay));
      return streamGroqWithRetry(res, model, messages, temperature, attempt + 1);
    }

    if (isContextLength && attempt === 1) {
      const truncatedMessages = [
        messages[0],
        ...messages.slice(1).map(m => ({
          ...m,
          content: m.content.slice(0, 4000),
        })),
      ];
      return streamGroqWithRetry(res, model, truncatedMessages, temperature, attempt + 1);
    }

    if (attempt <= 2) {
      const fallbackModel = model === "llama-3.3-70b-versatile" ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";
      return streamGroqWithRetry(res, fallbackModel, messages, temperature, attempt + 1);
    }

    throw err;
  }
}

async function streamGroq(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  context?: string,
  temperature?: number,
  systemPrompt?: string
) {
  const textAttachments = attachments.filter(a => a.type === "text");

  let fullText = "";
  if (context) fullText += `Current code context:\n${context}\n\n`;
  for (const att of textAttachments) {
    fullText += `--- Uploaded file: ${att.name} ---\n${att.data}\n\n`;
  }
  fullText += userMessage;

  const finalSystemPrompt = systemPrompt
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional user instructions:\n${systemPrompt}`
    : BASE_SYSTEM_PROMPT;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: fullText },
  ];

  const temp = typeof temperature === "number" ? temperature : 0.7;
  await streamGroqWithRetry(res, model, messages, temp);
}

async function streamOpenAI(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  apiKey: string,
  context?: string,
  temperature?: number,
  systemPrompt?: string
) {
  const textAttachments = attachments.filter(a => a.type === "text");
  const imageAttachments = attachments.filter(a => a.type === "image");

  let userContent = "";
  if (context) userContent += `Current code context:\n${context}\n\n`;
  for (const att of textAttachments) {
    userContent += `--- Uploaded file: ${att.name} ---\n${att.data}\n\n`;
  }
  userContent += userMessage;

  const finalSystemPrompt = systemPrompt
    ? `${BASE_SYSTEM_PROMPT}\n\nAdditional user instructions:\n${systemPrompt}`
    : BASE_SYSTEM_PROMPT;

  type OpenAIContent = string | { type: string; text?: string; image_url?: { url: string } }[];
  const openaiMessages: { role: string; content: OpenAIContent }[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  if (imageAttachments.length > 0) {
    const parts: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: "text", text: userContent },
    ];
    for (const img of imageAttachments) {
      parts.push({ type: "image_url", image_url: { url: img.data } });
    }
    openaiMessages.push({ role: "user", content: parts });
  } else {
    openaiMessages.push({ role: "user", content: userContent });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      stream: true,
      max_tokens: 32768,
      temperature: typeof temperature === "number" ? temperature : 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const body = response.body;
  if (!body) throw new Error("No response body from OpenAI");

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      } catch {}
    }
  }
}

router.post("/chat/stream", async (req, res): Promise<void> => {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, openaiApiKey, temperature, systemPrompt } = body;
  const isOpenAI = OPENAI_MODELS.has(model ?? "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    if (isOpenAI) {
      if (!openaiApiKey) {
        res.write(`data: ${JSON.stringify({ content: "⚠️ OpenAI API key is required for GPT models. Go to Settings → API Keys to add yours." })}\n\n`);
      } else {
        await streamOpenAI(res, model!, userMessage, history, attachments, openaiApiKey, context, temperature, systemPrompt);
      }
    } else {
      const resolvedModel = GROQ_MODELS[model ?? ""] ?? "llama-3.3-70b-versatile";
      await streamGroq(res, resolvedModel, userMessage, history, attachments, context, temperature, systemPrompt);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    const errMsg = err?.message ?? "An unexpected error occurred";
    const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
    const friendlyMsg = isRateLimit
      ? "⚠️ Rate limit reached. Please wait a moment and try again."
      : `⚠️ Error: ${errMsg}`;
    res.write(`data: ${JSON.stringify({ content: `\n\n${friendlyMsg}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

router.post("/chat/message", async (req, res): Promise<void> => {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, openaiApiKey, temperature, systemPrompt } = body;
  const isOpenAI = OPENAI_MODELS.has(model ?? "");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    if (isOpenAI) {
      if (!openaiApiKey) {
        res.write(`data: ${JSON.stringify({ content: "⚠️ OpenAI API key is required for GPT models. Go to Settings → API Keys to add yours." })}\n\n`);
      } else {
        await streamOpenAI(res, model!, userMessage, history, attachments, openaiApiKey, context, temperature, systemPrompt);
      }
    } else {
      const resolvedModel = GROQ_MODELS[model ?? ""] ?? "llama-3.3-70b-versatile";
      await streamGroq(res, resolvedModel, userMessage, history, attachments, context, temperature, systemPrompt);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    const errMsg = err?.message ?? "An unexpected error occurred";
    const isRateLimit = errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");
    const friendlyMsg = isRateLimit
      ? "⚠️ Rate limit reached. Please wait a moment and try again."
      : `⚠️ Error: ${errMsg}`;
    res.write(`data: ${JSON.stringify({ content: `\n\n${friendlyMsg}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

router.post("/chat/generate-image", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Image generation is not supported with the current AI provider." });
});

export default router;
