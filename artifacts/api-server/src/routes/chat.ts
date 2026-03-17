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
};

const OPENAI_MODELS = new Set(["gpt-4o", "gpt-4o-mini", "o1-mini"]);

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

1. COMPLETE CODE — Minimum 1000 lines total across all files. Every function fully implemented. Zero placeholders. Zero "// TODO" comments.

2. FULL STACK — Always build:
   • Frontend — full UI with every screen, component, navigation, forms, validation
   • Backend — complete REST/GraphQL API server with all endpoints
   • Database — schema, models, migrations, seed data
   • Auth — full JWT or session-based authentication (register, login, logout, protected routes)
   • API integration — connect frontend to backend with proper error handling

3. MULTIPLE FILES — Always structure as a real project:
   • Label every file clearly: `=== filename.ext ===`
   • Group by: frontend/, backend/, database/, config/

4. REAL FEATURES — No fake data. Build actual working functionality:
   • CRUD operations that hit the database
   • Form validation (frontend + backend)
   • Error states and loading states
   • Responsive design (mobile + desktop)
   • Environment configuration (.env.example)

5. PRODUCTION QUALITY:
   • Proper error handling (try/catch, error boundaries)
   • Input sanitization and security (rate limiting, helmet, CORS)
   • Pagination for lists
   • Password hashing (bcrypt)
   • Proper HTTP status codes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (use based on request)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEB: React + Vite + Tailwind CSS + shadcn/ui + React Query | Backend: Node.js + Express + Prisma + PostgreSQL
MOBILE (Android/iOS): React Native + Expo + NativeWind | Backend: Node.js + Express
FULL NEXT.JS: Next.js 14 App Router + Prisma + PostgreSQL + NextAuth
PYTHON: FastAPI + SQLAlchemy + Alembic + PostgreSQL
If user specifies a stack → use it. Otherwise → choose the best stack for the use case.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOBILE APP — PLAY STORE / APP STORE READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When building mobile apps, ALWAYS include:
• React Native + Expo code (works for Android & iOS)
• Complete screens: Splash, Onboarding, Auth, Main app screens, Profile, Settings
• Push notifications setup (Expo Notifications)
• App store metadata: app.json with name, bundle ID, version, permissions
• At the end, include DEPLOYMENT GUIDE:
  ─ "How to publish to Google Play Store":
    1. Run: expo build:android or eas build --platform android
    2. Download the .aab file
    3. Go to play.google.com/console → Create app → Upload .aab
    4. Fill store listing (screenshots, description, rating)
    5. Submit for review (usually 1-3 days)
  ─ "How to publish to Apple App Store":
    1. Run: eas build --platform ios
    2. Upload to App Store Connect via Transporter
    3. Fill metadata → Submit for review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always structure your output like this:

## 🚀 [App Name] — Complete Build

### What's included:
- [bullet list of all features built]

### Tech Stack:
- [list of technologies used]

---

=== folder/filename.ext ===
\`\`\`language
[complete code — never truncated]
\`\`\`

=== folder/filename2.ext ===
\`\`\`language
[complete code]
\`\`\`

[... all files ...]

---

### ⚡ Quick Start:
\`\`\`bash
[step by step setup commands]
\`\`\`

### 🚀 Deploy:
[deployment instructions for the target platform]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER DO THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Never say "you can add X later" — BUILD X NOW
✗ Never write "// implement this" — IMPLEMENT IT
✗ Never truncate code with "... rest of code ..."
✗ Never build only the frontend without a backend
✗ Never use fake/hardcoded data when a real DB should be used
✗ Never skip auth if the app has user accounts`;

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

  const { groq } = await import("@workspace/integrations-groq-ai");
  const stream = await groq.chat.completions.create({
    model,
    messages,
    stream: true,
    max_tokens: 16384,
    temperature: typeof temperature === "number" ? temperature : 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
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
      max_tokens: 16384,
      temperature: typeof temperature === "number" ? temperature : 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const body = response.body;
  if (!body) throw new Error("No response body");

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

  try {
    if (isOpenAI) {
      if (!openaiApiKey) {
        res.write(`data: ${JSON.stringify({ content: "⚠️ OpenAI API key is required for GPT models. Add it in Settings → API Keys." })}\n\n`);
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
    res.write(`data: ${JSON.stringify({ content: `\n\nError: ${err.message}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

router.post("/chat/generate-image", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Image generation is not supported with the Groq AI provider." });
});

export default router;
