import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

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

const MODEL_MAP: Record<string, string> = {
  "llama-3.3-70b-versatile": "gpt-5.2",
  "llama-3.1-70b-versatile": "gpt-5.2",
  "llama-3.1-8b-instant": "gpt-5-mini",
  "mixtral-8x7b-32768": "gpt-5.2",
  "gemma2-9b-it": "gpt-5-mini",
  "llama-3.3-70b-specdec": "gpt-5.2",
  "deepseek-r1-distill-llama-70b": "gpt-5.2",
  "gpt-4o": "gpt-5.2",
  "gpt-4o-mini": "gpt-5-mini",
  "o1-mini": "gpt-5.2",
  "gpt-4-turbo": "gpt-5.2",
};

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

function resolveModel(requestedModel?: string): string {
  if (!requestedModel) return "gpt-5.2";
  return MODEL_MAP[requestedModel] ?? "gpt-5.2";
}

async function streamReplitAI(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  context?: string,
  temperature?: number,
  systemPrompt?: string
): Promise<void> {
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

  type MessageContent = string | { type: string; text?: string; image_url?: { url: string } }[];
  const messages: { role: "system" | "user" | "assistant"; content: MessageContent }[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  if (imageAttachments.length > 0) {
    const parts: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: "text", text: userContent },
    ];
    for (const img of imageAttachments) {
      parts.push({ type: "image_url", image_url: { url: img.data } });
    }
    messages.push({ role: "user", content: parts });
  } else {
    messages.push({ role: "user", content: userContent });
  }

  const stream = await openai.chat.completions.create({
    model,
    messages: messages as any,
    stream: true,
    max_completion_tokens: 8192,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}

async function handleChatRequest(req: any, res: any): Promise<void> {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, temperature, systemPrompt } = body;
  const resolvedModel = resolveModel(model);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    await streamReplitAI(res, resolvedModel, userMessage, history, attachments, context, temperature, systemPrompt);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    const errMsg = err?.message ?? "An unexpected error occurred";
    res.write(`data: ${JSON.stringify({ content: `\n\n⚠️ Error: ${errMsg}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
}

router.post("/chat/stream", handleChatRequest);
router.post("/chat/message", handleChatRequest);

router.post("/chat/generate-image", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Image generation is not supported with the current AI provider." });
});

export default router;
