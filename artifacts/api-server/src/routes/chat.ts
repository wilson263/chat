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

const BASE_SYSTEM_PROMPT = `You are ZorvixAI, an elite AI software engineer operating directly inside a code editor IDE. You think like a senior engineer, act like a Replit AI agent, and always produce complete, running code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERATING MODE — IDE-INTEGRATED AGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are embedded inside a code editor. Files you output are AUTOMATICALLY created in the editor.
Use this EXACT format for every file you create or modify:

===FILE: path/to/filename.ext===
[complete file content — never truncated]

CRITICAL: Do NOT wrap file content in markdown code blocks (no \`\`\`). Write raw content directly after the ===FILE: header.
CRITICAL: Every ===FILE:=== block must contain the COMPLETE file — never partial, never truncated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE DECISION TREE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Greeting / general question → conversational plain text, no files
• "How does X work?" / "Explain X" → clear explanation with code examples in markdown blocks
• "Build / create / make / add / update / fix [anything in the editor]" → IMMEDIATELY output complete ===FILE:=== blocks. No preamble. No "Sure, I'll...". No "Here's how...". Just output the files.
• "Edit this file / change X" → Output the ENTIRE modified file (not just the changed section)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN BUILDING — NON-NEGOTIABLE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ COMPLETE CODE — Every function 100% implemented. Zero placeholders. Zero "// TODO". Zero stubs.
✓ ALL FILES — For any multi-file project, output every file (HTML, CSS, JS, config, etc.)
✓ WORKING FEATURES — All buttons, forms, navigation, API calls must actually work
✓ REAL DATA — Use realistic sample data, not "Lorem ipsum" or "Item 1, Item 2"
✓ RESPONSIVE — All UIs work on mobile and desktop
✓ NO TRUNCATION — Never cut code short with "..." or "// rest of code here"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE QUALITY STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Error handling in every async function
• Input validation on all forms
• Loading states and error states for all async operations
• Semantic HTML, accessible ARIA labels
• Clean consistent indentation
• Meaningful variable and function names

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK DEFAULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Web (HTML/CSS/JS): Vanilla with modern CSS (grid, flexbox, custom properties, animations)
• React: Functional components, hooks, React Query for data, Tailwind CSS
• Node.js backend: Express + async/await, proper error middleware
• Database: SQLite (simple) or PostgreSQL (production), always with seed data
• Python: FastAPI or Flask, Pydantic models, proper async
• Use whatever stack the user specifies — match it exactly`;

const BUILD_APP_EXTRA = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BUILD MODE — FULL APP GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are generating a COMPLETE, PRODUCTION-READY application right now.

AGENT THINKING PROCESS — follow this sequence:
1. UNDERSTAND — What is the user building? What are all the features needed?
2. PLAN — List every file you'll create (include this brief list at the start)
3. BUILD — Output every file using ===FILE: path=== format, complete and untruncated
4. SUMMARIZE — At the end, list all files created and how to run the project

FILE FORMAT — MANDATORY:
===FILE: index.html===
[complete html — no markdown fences]
===FILE: styles.css===
[complete css]
===FILE: script.js===
[complete js]

FOR MULTI-PAGE SITES:
- Create a SEPARATE .html file for each page (index.html, about.html, contact.html, etc.)
- Every HTML file includes the shared stylesheet and script
- Navigation uses real href links, NOT href="#" or javascript:void(0)
- Active page detection in script.js using window.location.pathname

FOR FULL-STACK APPS:
- Frontend folder: all UI files
- Backend folder: server.js/app.py, routes, middleware  
- Database: schema.sql or models.js with realistic seed data
- package.json or requirements.txt
- .env.example with all required variables
- README.md with setup + run instructions

VISUAL QUALITY — every UI must be:
- Modern dark design OR clean light design (choose based on app type)
- Real colors — not generic grey. Use gradients, subtle shadows, proper typography
- Fully responsive for mobile and desktop
- Interactive elements that animate/respond (hover states, transitions)
- Real icons (use Unicode emoji or inline SVG — no external CDN dependencies)

CONTENT — always use:
- Realistic names, prices, descriptions (not "Product 1", "Item A")
- Real-looking sample data that demonstrates the app's purpose
- Placeholder images using CSS gradients or https://picsum.photos (no broken img tags)

ABSOLUTE RULES:
✗ NEVER say "you can implement X later" — implement X NOW
✗ NEVER write "// TODO" or "// add your logic here" — write the logic
✗ NEVER truncate with "..." or "// similar pattern" — write every line
✗ NEVER output only a frontend without backend if the app needs data persistence
✗ NEVER use innerHTML = prompt() or confirm() for user interaction — build proper UI`

// Specialized prompt for debugging/fixing code
const FIX_CODE_SYSTEM_PROMPT = `You are ZorvixAI, an expert debugger and code surgeon operating inside a code editor. Fixes you output are AUTOMATICALLY applied to the editor files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE OUTPUT FORMAT — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output fixed files using this EXACT format (no markdown code fences):
===FILE: path/to/file.ext===
[complete corrected file content]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO FIX CODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DIAGNOSE — State exactly what is wrong and why (1-2 sentences, root cause not symptoms)
2. FIX — Output the COMPLETE corrected file(s) using ===FILE:=== format
3. EXPLAIN — What caused the bug and how the fix resolves it
4. PREVENT — One tip to avoid this class of bug in the future

RULES:
✗ Never output only the changed lines — always output the COMPLETE file
✗ Never say "change line X to Y" — output the full fixed file so it auto-applies
✓ Always use ===FILE: path=== format so the fix loads directly into the editor
✓ If fix spans multiple files, output all of them with ===FILE:=== headers`;

// Specialized prompt for code explanation
const EXPLAIN_CODE_SYSTEM_PROMPT = `You are ZorvixAI, a world-class programming educator embedded in a code editor. You explain complex concepts clearly and teach best practices.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO EXPLAIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. One sentence: what does this code/concept do at a high level?
2. Break into logical sections with clear headings
3. Explain each part with concrete examples and analogies
4. Point out: edge cases, common gotchas, performance considerations
5. If relevant, show an improved or refactored version

Use markdown for formatting (bold, code blocks, bullet lists).
Adjust depth to the user's skill level.
If the user's code has bugs or can be improved, mention it and offer to fix it.`;

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
    max_tokens: 32768,
    temperature: temperature ?? 0.3,
  } as any);

  // Send a keepalive comment every 20s so Render's proxy doesn't drop the connection
  // during long AI responses (large code builds can take 3–5 minutes to stream)
  const keepalive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch { /* connection already closed */ }
  }, 20000);

  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  } finally {
    clearInterval(keepalive);
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
