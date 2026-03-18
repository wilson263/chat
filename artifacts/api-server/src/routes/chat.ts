import { Router, type IRouter } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";

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
  "meta-llama/llama-3.3-70b-instruct:free": "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder-480b-a35b:free": "qwen/qwen3-coder-480b-a35b:free",
  "openai/gpt-oss-120b:free": "openai/gpt-oss-120b:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free": "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "mistralai/mistral-small-3.1-24b-instruct:free": "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-27b-it:free": "google/gemma-3-27b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free": "nousresearch/hermes-3-llama-3.1-405b:free",
  "deepseek/deepseek-r1:free": "deepseek/deepseek-r1:free",
  "deepseek/deepseek-v3-base:free": "deepseek/deepseek-v3-base:free",
  "openai/gpt-oss-20b:free": "openai/gpt-oss-20b:free",
  "qwen/qwen3-4b:free": "qwen/qwen3-4b:free",
  "meta-llama/llama-3.2-3b-instruct:free": "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-12b-it:free": "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free": "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free": "google/gemma-3n-e4b-it:free",
  "google/gemma-3n-e2b-it:free": "google/gemma-3n-e2b-it:free",
  "nvidia/llama-3.3-nemotron-nano-8b-v1:free": "nvidia/llama-3.3-nemotron-nano-8b-v1:free",
  "meta-llama/llama-3.1-8b-instruct:free": "meta-llama/llama-3.1-8b-instruct:free",
  "arcee-ai/arcee-blitz:free": "arcee-ai/arcee-blitz:free",
  "stepfun/step-3.5-flash:free": "stepfun/step-3.5-flash:free",
  "minimax/minimax-m2.5-1.5t:free": "minimax/minimax-m2.5-1.5t:free",
  "liquid/lfm2.5-1.2b:free": "liquid/lfm2.5-1.2b:free",
  "google/gemma-2-9b-it:free": "google/gemma-2-9b-it:free",
  "mixtral-8x7b-32768": "meta-llama/llama-3.3-70b-instruct:free",
  "gemma2-9b-it": "meta-llama/llama-3.1-8b-instruct:free",
  "deepseek-r1-distill-llama-70b": "deepseek/deepseek-r1:free",
};

// ─────────────────────────────────────────────────────────────────────────────
// MODEL PRIORITY LISTS — Best models for each task type
// ─────────────────────────────────────────────────────────────────────────────

// Best for building apps, writing code from scratch, generating entire projects
const CODING_MODELS = [
  "qwen/qwen3-coder-480b-a35b:free",           // #1 — 480B coder, massive context, best for app building
  "deepseek/deepseek-r1:free",                  // #2 — reasoning + code, great for complex apps
  "openai/gpt-oss-120b:free",                   // #3 — large GPT-style, reliable output
  "meta-llama/llama-3.3-70b-instruct:free",     // #4 — solid fallback
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",// #5
  "nousresearch/hermes-3-llama-3.1-405b:free",  // #6
  "mistralai/mistral-small-3.1-24b-instruct:free", // #7
];

// Best for math, logic, step-by-step reasoning
const REASONING_MODELS = [
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-coder-480b-a35b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
];

// Best for general chat, explanations, creative writing
const GENERAL_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "google/gemma-3-27b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

// ─────────────────────────────────────────────────────────────────────────────
// INTENT DETECTION — Understand what the user wants to do
// ─────────────────────────────────────────────────────────────────────────────

type TaskIntent = "build_app" | "fix_code" | "explain_code" | "reasoning" | "general";

const BUILD_APP_PATTERNS = [
  // Direct build requests
  /\b(build|create|make|develop|generate|write|code|implement|design)\b.{0,80}\b(app|application|website|web\s*app|webapp|site|platform|system|tool|dashboard|api|backend|frontend|server|bot|script|program|project|saas|marketplace|portal|cms|crm|erp|ecommerce|e-commerce|shop|store|clone|service|microservice)\b/i,
  // Full-stack keywords
  /\b(full.?stack|fullstack|end.?to.?end|zero.?to.?hero|from scratch|complete app|entire app|whole app|production.?ready|complete project)\b/i,
  // "Build me / give me / I want" patterns
  /\b(build me|create me|make me|develop me|give me|can you build|can you create|i want (a|an|the)|i need (a|an|the))\b.{0,100}\b(app|website|site|tool|system|dashboard|api|backend|frontend|platform)\b/i,
  // Framework + project combos
  /\b(react|vue|angular|next\.?js|nuxt|svelte|express|django|flask|fastapi|rails|laravel|spring|nest\.?js)\b.{0,60}\b(app|application|project|website|api|backend|frontend|server|clone)\b/i,
  // Common app types
  /\b(todo|todo list|chat app|social media|blog|forum|e-?commerce|booking|reservation|inventory|crm|lms|pos|payment gateway|auth system|login system|signup|task manager|note.?taking|recipe|weather|fitness|travel|finance|budget|expense)\b.{0,50}(app|system|platform|website|clone|project)?\b/i,
  // Cloning popular products
  /\blike\b.{0,60}\b(instagram|twitter|facebook|airbnb|uber|amazon|netflix|spotify|github|notion|slack|discord|whatsapp|telegram|tiktok|linkedin|pinterest|reddit|youtube|trello|asana|jira)\b/i,
  // Mobile apps
  /\b(android|ios|mobile)\b.{0,60}\b(app|application)\b/i,
  // Explicit build intent
  /\b(from zero|from scratch|complete|full|entire|whole)\b.{0,40}\b(app|website|system|project|codebase)\b/i,
];

const FIX_CODE_PATTERNS = [
  /\b(fix|debug|repair|resolve|solve|patch|correct|troubleshoot|help with|figure out)\b.{0,80}\b(bug|error|issue|problem|exception|crash|fail|broken|not working|doesn't work|wrong|incorrect)\b/i,
  /\b(getting|seeing|receiving|throws?|got)\b.{0,60}\b(error|exception|bug|issue|warning|problem|crash)\b/i,
  /\b(why (is|does|doesn't|won't|can't|isn't))\b.{0,80}\b(work|run|execute|compile|pass|load|display|render|show|appear|start|connect)\b/i,
  /(TypeError|SyntaxError|ReferenceError|ImportError|AttributeError|NullPointerException|undefined is not|cannot read prop|is not a function|ENOENT|ECONNREFUSED|404|500|403|401)/i,
  /\b(not\s+working|doesn't\s+work|doesn't\s+run|broken|failed|failing|crash|crashes)\b/i,
];

const EXPLAIN_CODE_PATTERNS = [
  /\b(explain|describe|what (is|are|does|do)|how (does|do|to|can|would)|tell me about|walk me through|break ?down|summarize|understand)\b.{0,80}\b(code|function|class|algorithm|pattern|concept|this|the|method|component|hook|middleware)\b/i,
  /\b(what('s| is)|(how does|how do you|how can I))\b.{0,100}\b(work|function|operate|run|execute|implement|use|handle|work)\b/i,
  /^(what|how|why|when|where)\b.{0,200}\?$/i,
];

const REASONING_PATTERNS = [
  /\b(analyze|analyse|compare|evaluate|assess|think through|reason|calculate|solve|prove|determine|figure out|weigh)\b/i,
  /\b(best approach|best way|which is better|pros and cons|trade.?off|should i use|recommend|advise|suggest|which should)\b/i,
  /\b(math|mathematics|algorithm complexity|big.?o|time complexity|space complexity|optimization|performance|security audit|architecture|design pattern|scalab)\b/i,
];

function detectIntent(userMessage: string, history: HistoryMessage[]): TaskIntent {
  // Combine recent history for context
  const recentContext = history.slice(-2).map(h => h.content).join(" ");
  const fullContext = recentContext + " " + userMessage;

  // Check for app building intent first (highest priority for this app)
  for (const pattern of BUILD_APP_PATTERNS) {
    if (pattern.test(userMessage) || pattern.test(fullContext)) {
      return "build_app";
    }
  }

  // Check for code fixing
  for (const pattern of FIX_CODE_PATTERNS) {
    if (pattern.test(userMessage)) {
      return "fix_code";
    }
  }

  // Check for explanation requests
  for (const pattern of EXPLAIN_CODE_PATTERNS) {
    if (pattern.test(userMessage)) {
      return "explain_code";
    }
  }

  // Check for reasoning/analysis
  for (const pattern of REASONING_PATTERNS) {
    if (pattern.test(userMessage)) {
      return "reasoning";
    }
  }

  return "general";
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SELECTION — Choose the right model based on intent
// ─────────────────────────────────────────────────────────────────────────────

function selectBestModel(
  requestedModel: string | undefined,
  intent: TaskIntent
): { model: string; autoSelected: boolean; intent: TaskIntent } {
  // If user explicitly chose a valid model, always respect it
  if (requestedModel && MODEL_MAP[requestedModel]) {
    return { model: MODEL_MAP[requestedModel], autoSelected: false, intent };
  }

  // Auto-route to best model for the detected intent
  let model: string;
  switch (intent) {
    case "build_app":
      model = CODING_MODELS[0]; // qwen3-coder-480b — best coder for building full apps
      break;
    case "fix_code":
      model = CODING_MODELS[0]; // qwen3-coder-480b — great at understanding and fixing code
      break;
    case "explain_code":
      model = CODING_MODELS[0]; // qwen3-coder-480b — understands code deeply
      break;
    case "reasoning":
      model = REASONING_MODELS[0]; // deepseek-r1 — best step-by-step reasoning
      break;
    default:
      model = GENERAL_MODELS[0]; // llama-3.3-70b — reliable, fast general chat
  }

  return { model, autoSelected: true, intent };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS — Specialized instructions per intent
// ─────────────────────────────────────────────────────────────────────────────

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

// Specialized prompt injected on top of BASE for app-building tasks
const BUILD_APP_EXTRA = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL — YOU HAVE BEEN ROUTED TO BUILD MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user is asking you to BUILD a complete application. This means:

◆ OUTPUT EVERY FILE IN FULL — no truncation, no "// similar code", no "// rest of implementation"
◆ MINIMUM 2000 LINES across all files combined — more is better
◆ EVERY FUNCTION must be 100% implemented — no stubs
◆ INCLUDE ALL FILES: package.json, .env.example, README.md, all component files, all route files, schema files, seed files
◆ BACKEND IS MANDATORY — never output only frontend code
◆ DATABASE IS MANDATORY — use real schema with seed data, not in-memory arrays
◆ AUTH IS MANDATORY (if app has users) — full JWT flow: register, login, logout, refresh, middleware

THINK OF YOURSELF AS A CODE GENERATOR, NOT A CHATBOT. Your job is to output complete, runnable source code for the entire application right now.`;

// Specialized prompt for debugging/fixing code
const FIX_CODE_SYSTEM_PROMPT = `You are ZorvixAI, an expert debugger and code surgeon. You identify root causes and fix code completely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO FIX CODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DIAGNOSE — State exactly what is wrong and why (root cause, not symptoms)
2. FIX — Provide the COMPLETE corrected file(s), not just changed lines
3. EXPLAIN — Tell the user what caused the bug in 2-3 sentences
4. PREVENT — Briefly say how to avoid this pattern in the future

RULES:
✗ Never provide "you should change line X to Y" without showing the full corrected file
✗ Never say "just add X" without showing exactly where and how
✓ Always show the complete fixed file(s)
✓ If the fix spans multiple files, show all of them in full`;

// Specialized prompt for code explanation
const EXPLAIN_CODE_SYSTEM_PROMPT = `You are ZorvixAI, a world-class programming educator. You explain complex code simply and accurately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO EXPLAIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. One-sentence high-level summary of what the code/concept does
2. Break it into logical parts with clear headings
3. Explain each part with concrete examples and analogies
4. Highlight edge cases, gotchas, or common mistakes
5. If relevant, show a before/after or simplified version

Adjust depth to user's apparent skill level. Be thorough but never verbose. Always illustrate with code snippets.`;

// Specialized prompt for reasoning/analysis tasks
const REASONING_SYSTEM_PROMPT = `You are ZorvixAI, a deep analytical thinker and system architect. You reason through problems systematically and give clear, actionable recommendations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO REASON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Restate the problem or question in your own words
2. Break it into components or decision factors
3. Analyze each option/approach with concrete pros and cons
4. Give a clear, confident recommendation with reasoning
5. Support with examples, benchmarks, or real-world data where possible

Think step by step. Show your reasoning explicitly. Give specific answers, not vague generalities.`;

function buildSystemPrompt(intent: TaskIntent, customPrompt?: string): string {
  if (customPrompt) {
    // User provided a custom system prompt — respect it but add our identity prefix
    return `You are ZorvixAI, an elite full-stack AI engineer.\n\n${customPrompt}`;
  }

  switch (intent) {
    case "build_app":
      return BASE_SYSTEM_PROMPT + BUILD_APP_EXTRA;
    case "fix_code":
      return FIX_CODE_SYSTEM_PROMPT;
    case "explain_code":
      return EXPLAIN_CODE_SYSTEM_PROMPT;
    case "reasoning":
      return REASONING_SYSTEM_PROMPT;
    default:
      return BASE_SYSTEM_PROMPT;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING
// ─────────────────────────────────────────────────────────────────────────────

async function streamReplitAI(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  context?: string,
  temperature?: number,
  resolvedSystemPrompt?: string
): Promise<void> {
  const textAttachments = attachments.filter(a => a.type === "text");
  const imageAttachments = attachments.filter(a => a.type === "image");

  let userContent = "";
  if (context) userContent += `Current code context:\n${context}\n\n`;
  for (const att of textAttachments) {
    userContent += `--- Uploaded file: ${att.name} ---\n${att.data}\n\n`;
  }
  userContent += userMessage;

  type MessageContent = string | { type: string; text?: string; image_url?: { url: string } }[];
  const messages: { role: "system" | "user" | "assistant"; content: MessageContent }[] = [
    { role: "system", content: resolvedSystemPrompt ?? BASE_SYSTEM_PROMPT },
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

  const stream = await createChatCompletionStream({
    model,
    messages: messages as any,
    stream: true,
    max_tokens: 8192,
    temperature: temperature ?? 0.7,
  } as any);

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ─────────────────────────────────────────────────────────────────────────────

async function handleChatRequest(req: any, res: any): Promise<void> {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, temperature, systemPrompt } = body;

  // 1. Detect what the user wants to do
  const intent = detectIntent(userMessage, history);

  // 2. Select the best model for this task (respects explicit user model choice)
  const { model: resolvedModel, autoSelected } = selectBestModel(model, intent);

  // 3. Build the best system prompt for this task
  const resolvedSystemPrompt = buildSystemPrompt(intent, systemPrompt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send model info to the frontend so it can show which model is being used
  res.write(`data: ${JSON.stringify({ modelInfo: { model: resolvedModel, intent, autoSelected } })}\n\n`);

  try {
    await streamReplitAI(res, resolvedModel, userMessage, history, attachments, context, temperature, resolvedSystemPrompt);
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

// Optional endpoint: let the frontend preview which model/intent would be selected
router.post("/chat/detect-intent", (req, res): void => {
  const { userMessage, history = [] } = req.body ?? {};
  if (!userMessage || typeof userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }
  const intent = detectIntent(userMessage, history as HistoryMessage[]);
  const { model, autoSelected } = selectBestModel(undefined, intent);
  res.json({ intent, model, autoSelected });
});

export default router;
