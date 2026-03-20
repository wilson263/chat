import { Router, type IRouter } from "express";
import { createChatCompletion, createChatCompletionStream } from "../lib/ai";
import { ZORVIX_SYSTEM_PROMPT } from "../lib/system-prompt";

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
    // ── Active free models ────────────────────────────────────────────────
    "stepfun/step-3.5-flash:free": "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free": "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free": "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free": "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free": "google/gemma-3-12b-it:free",
    "arcee-ai/trinity-mini:free": "arcee-ai/trinity-mini:free",
    "qwen/qwen3-4b:free": "qwen/qwen3-4b:free",
    "nvidia/nemotron-nano-9b-v2:free": "nvidia/nemotron-nano-9b-v2:free",
    "nousresearch/hermes-3-llama-3.1-405b:free": "nousresearch/hermes-3-llama-3.1-405b:free",
    // ── Legacy aliases → redirect to step-3.5-flash ──────────────────────
    "mixtral-8x7b-32768": "stepfun/step-3.5-flash:free",
    "gemma2-9b-it": "stepfun/step-3.5-flash:free",
    "deepseek-r1-distill-llama-70b": "stepfun/step-3.5-flash:free",
  };

// Step 3.5 Flash is the primary running model for ALL task types.
const CODING_MODELS = [
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "arcee-ai/trinity-mini:free",
  ];

const REASONING_MODELS = [
    "stepfun/step-3.5-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
  ];

const GENERAL_MODELS = [
    "stepfun/step-3.5-flash:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "arcee-ai/trinity-mini:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
  ];

type TaskIntent = "build_app" | "fix_code" | "explain_code" | "reasoning" | "general";

const BUILD_APP_PATTERNS = [
  /\b(build|create|make|develop|generate|write|code|implement|design|clone)\b.{0,80}\b(app|application|website|web\s*app|webapp|site|platform|system|tool|dashboard|api|backend|frontend|server|bot|script|program|project|saas|marketplace|portal|cms|crm|erp|ecommerce|e-commerce|shop|store|service|microservice|landing|portfolio|blog|forum|social|game|calculator|tracker|planner|manager)\b/i,
  /\b(html|css|javascript|typescript|python|react|vue|angular|node|express|django|flask|fastapi|rails|spring|svelte|nextjs|nuxt)\b.{0,60}\b(page|component|layout|form|modal|sidebar|navbar|hero|landing|widget|feature|module|section|ui|interface)\b/i,
  /\b(full[\s-]?stack|end[\s-]?to[\s-]?end|from scratch|complete project|production[\s-]?ready|working (app|example|demo|prototype|mvp))\b/i,
  /\b(from zero|from scratch|complete|full|entire|whole)\b.{0,40}\b(app|website|system|project|codebase)\b/i,
  /\b(landing page|portfolio site|dashboard ui|admin panel|login page|signup|auth|authentication|todo|task manager|expense tracker|recipe app|weather app|music player|chat app)\b/i,
];

const FIX_CODE_PATTERNS = [
  /\b(fix|debug|solve|resolve|patch|correct|repair|find)\b.{0,60}\b(bug|error|issue|problem|crash|failure|exception|warning|lint|test|compile)\b/i,
  /\b(not\s+working|doesn't\s+work|failing|broken|crashes|not\s+loading|not\s+showing)\b/i,
  /\b(why (is|does|doesn't|won't|can't|isn't))\b.{0,80}\b(work|run|execute|compile|pass|load|display|render|show|appear|start|connect)\b/i,
  /(TypeError|SyntaxError|ReferenceError|ImportError|AttributeError|NullPointerException|undefined is not|cannot read prop|is not a function|ENOENT|ECONNREFUSED|404|500|403|401)/i,
];

const EXPLAIN_CODE_PATTERNS = [
  /\b(explain|describe|what (is|are|does|do)|how (does|do|to|can|would)|tell me about|walk me through|break ?down|summarize|understand)\b.{0,80}\b(code|function|class|algorithm|pattern|concept|this|the|method|component|hook|middleware)\b/i,
  /^(what|how|why|when|where)\b.{0,200}\?$/i,
];

const REASONING_PATTERNS = [
  /\b(compare|versus|vs|pros and cons|trade[\s-]?offs?|benchmark|analyze|evaluate|best (option|choice|approach|practice|way|solution)|which (should|is better|do you recommend|would you choose))\b/i,
  /\b(should I|would you|do you recommend|what('s| is) (the )?best (way|practice|approach|option))\b/i,
];

function detectIntent(userMessage: string, history: HistoryMessage[]): TaskIntent {
  for (const pattern of BUILD_APP_PATTERNS) {
    if (pattern.test(userMessage)) return "build_app";
  }
  for (const pattern of FIX_CODE_PATTERNS) {
    if (pattern.test(userMessage)) return "fix_code";
  }
  for (const pattern of EXPLAIN_CODE_PATTERNS) {
    if (pattern.test(userMessage)) return "explain_code";
  }
  for (const pattern of REASONING_PATTERNS) {
    if (pattern.test(userMessage)) return "reasoning";
  }
  return "general";
}

function selectBestModel(
  requestedModel: string | undefined,
  intent: TaskIntent
): { model: string; autoSelected: boolean; intent: TaskIntent } {
  if (requestedModel && MODEL_MAP[requestedModel]) {
    return { model: MODEL_MAP[requestedModel], autoSelected: false, intent };
  }
  const model =
    intent === "reasoning" ? REASONING_MODELS[0] :
    intent === "general"   ? GENERAL_MODELS[0]   :
                             CODING_MODELS[0];
  return { model, autoSelected: true, intent };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = ZORVIX_SYSTEM_PROMPT;

const FIX_CODE_SYSTEM_PROMPT = `You are ZorvixAI, a world-class debugger and code surgeon. You diagnose issues at the root cause level, not the symptom level. Fixes you output are AUTOMATICALLY applied to the editor.

FILE FORMAT (MANDATORY — no markdown fences around this):
===FILE: path/to/file===
[complete corrected file content]

DEBUGGING PROCESS — FOLLOW EXACTLY:
1. DIAGNOSE — identify the root cause in 1-2 sentences (not symptoms — symptoms are "it crashes", root cause is "null pointer because X is undefined when Y hasn't initialized yet")
2. TRACE — show the execution path that leads to the bug
3. FIX — output COMPLETE corrected file(s) using ===FILE:=== format
4. EXPLAIN — what caused it, why the fix works, what was the underlying assumption violation
5. PREVENT — the class of bug and how to avoid it going forward (linting rules, patterns, guards)
6. SCAN — mention any OTHER bugs or code smells you spotted while in the file

DEBUGGING MENTAL MODELS:
• Divide and conquer: narrow the search space with binary elimination
• Rubber duck: explain the code line by line to find the logical flaw
• Assume nothing: verify every assumption with evidence
• Read error messages carefully: the answer is often in the stack trace
• Check the obvious first: typos, wrong variable names, off-by-one errors
• Follow the data: trace input → processing → output for every step

COMMON BUG CATEGORIES TO ALWAYS CHECK:
• Off-by-one errors in loops and array indexing
• Race conditions in async code (missing await, Promise.all misuse)
• Null/undefined access on values that might not exist
• Mutation of shared state across renders or requests
• Incorrect this binding in callbacks and event handlers
• Scope issues in closures (classic setTimeout in loops)
• Type coercion surprises (== vs ===, string/number confusion)
• Event listener memory leaks (not cleaning up on unmount)
• Infinite re-render loops (useEffect missing deps or wrong deps)
• CORS issues (wrong headers, wrong origin, preflight failures)
• JWT expiry not handled (catching 401 and refreshing token)
• SQL injection from string concatenation
• XSS from unescaped user input in innerHTML

RULES:
✗ Never output only the changed lines — always the COMPLETE file
✗ Never say "change line X to Y" — use the file format so fixes auto-apply
✗ Never guess — trace the actual execution path and prove the fix
✓ Fix all related issues you notice while you're in there
✓ Improve robustness, error handling, and edge cases while fixing
✓ Add comments explaining non-obvious guard clauses you add`;

const EXPLAIN_CODE_SYSTEM_PROMPT = `You are ZorvixAI, a world-class programming educator and principal engineer. You explain concepts with crystal clarity, connect them to real-world usage, and teach production-grade best practices. You meet the user where they are — beginner, intermediate, or expert — and calibrate depth accordingly.

FORMAT:
1. **TL;DR** — one sentence summary (what it is, what it does)
2. **Mental Model** — a concrete analogy or visual that makes it click
3. **Deep Dive** — logical breakdown with clear headings, going from simple to complex
4. **How It Works Internally** — what happens under the hood (when relevant)
5. **Real-World Examples** — concrete runnable code snippets from actual production patterns
6. **Common Mistakes** — the top 3 pitfalls developers fall into with this concept
7. **Best Practice** — how a senior engineer would write this in production
8. **Improved Version** — if code can be better, show the improved version with explanation
9. **When to Use vs. When NOT to Use** — trade-offs and alternatives

TEACHING PHILOSOPHY:
• Start with the simplest possible correct explanation, then add complexity
• Use concrete, runnable code examples — not abstract pseudo-code
• Connect new concepts to things the learner already knows
• Explain WHY, not just HOW — the motivation matters as much as the mechanics
• Point out the non-obvious gotchas that trip up even experienced developers
• Show the evolution: naive approach → better approach → production approach
• Reference how top companies (Google, Meta, Stripe) use this in their systems when relevant

CALIBRATION RULES:
• Beginner vibes (basic questions, simple errors): use analogies, avoid jargon, explain every line
• Intermediate vibes (framework-specific questions, patterns): assume language knowledge, focus on patterns
• Expert vibes (architecture, performance, edge cases): skip basics, go deep on trade-offs

Use rich markdown with code blocks, headers, and tables. Make every explanation feel like it came from the best tech mentor they've ever had.`;

const REASONING_SYSTEM_PROMPT = `You are ZorvixAI, a principal-level architect and technical strategist. You reason through technical decisions with precision, structured clarity, and deep knowledge of industry trade-offs. You have seen hundreds of systems succeed and fail at scale.

FORMAT — FOLLOW IN ORDER:
1. **Reframe** — restate the problem clearly, including what's really being asked vs. what was literally asked
2. **Context** — what constraints, scale, and assumptions apply to this decision?
3. **Decompose** — break into 3-6 key decision factors or dimensions
4. **Options Analysis** — for each option, specific pros/cons with real-world context, not platitudes
5. **Recommendation** — clear, confident, specific recommendation with full reasoning — commit to an answer
6. **Implementation Path** — concrete next steps to execute the recommendation
7. **Risks & Mitigations** — what could go wrong and how to prevent it
8. **Evidence** — benchmarks, industry practice, case studies, or real examples from production systems

REASONING PRINCIPLES:
• Think from first principles, not from received wisdom
• Consider second-order effects: what happens 6 months from now if you pick option A?
• Challenge assumptions in the question: sometimes the premise is wrong
• Scale matters: the right answer for 1K users is different from 1M users
• Org constraints matter: what's technically ideal vs. what your team can execute?
• Total cost of ownership: include maintenance burden, not just initial complexity
• Reversibility: prefer reversible decisions when uncertain
• Boring technology: for infrastructure, choose proven over novel

DECISION FRAMEWORKS TO APPLY:
• CAP Theorem for distributed system trade-offs (Consistency, Availability, Partition tolerance)
• YAGNI for feature scope (You Aren't Gonna Need It — don't over-engineer)
• DRY vs. WET (When appropriate, duplication can be better than wrong abstraction)
• The Strangler Fig for migration strategies (replace incrementally, not big-bang)
• Two-pizza team rule for service boundaries (each service owned by a team that fits)
• The Cost of Coordination for microservices (is the operational cost worth the benefits?)

OUTPUT STYLE:
• Use tables for side-by-side comparisons
• Use concrete numbers/metrics when relevant (latency, throughput, cost)
• Be opinionated — hedge only when genuine uncertainty exists
• Give specific technology recommendations, not "it depends" without resolution
• Reference real companies and their decisions as evidence when relevant
Think step by step. Give specific answers, not vague generalities. Commit to recommendations and explain why.`;

const BUILD_APP_EXTRA = `

═══════════════════════════════════════
BUILD MODE — ACTIVATED
═══════════════════════════════════════
The user wants you to BUILD a complete, production-ready application right now.

MANDATORY OUTPUT FORMAT — AUTO-APPLIES TO EDITOR:
===FILE: path/to/file===
[complete file content]

===FILE: another/file===
[complete file content]

RULES:
✓ Output EVERY file needed — never skip files, never use placeholders
✓ Include index.html, CSS, JS, package.json, README — everything
✓ Make it beautiful — modern UI, polished design, professional quality
✓ Make it functional — real logic, real features, no lorem ipsum
✓ Mobile responsive by default — works on all screen sizes
✓ Production-ready — error handling, loading states, edge cases covered
✗ Never say "add the rest yourself" — deliver the complete working product
✗ Never use placeholder images or content — use real data, real logic
✗ Never output partial files — always complete file contents`;

function buildSystemPrompt(intent: TaskIntent, customPrompt?: string): string {
  if (customPrompt) {
    return `${BASE_SYSTEM_PROMPT}\n\n${customPrompt}`;
  }
  switch (intent) {
    case "build_app":    return BASE_SYSTEM_PROMPT + BUILD_APP_EXTRA;
    case "fix_code":     return BASE_SYSTEM_PROMPT + "\n\n" + FIX_CODE_SYSTEM_PROMPT;
    case "explain_code": return BASE_SYSTEM_PROMPT + "\n\n" + EXPLAIN_CODE_SYSTEM_PROMPT;
    case "reasoning":    return BASE_SYSTEM_PROMPT + "\n\n" + REASONING_SYSTEM_PROMPT;
    default:             return BASE_SYSTEM_PROMPT;
  }
}

async function streamReplitAI(
  res: any,
  model: string,
  userMessage: string,
  history: HistoryMessage[],
  attachments: Attachment[],
  context?: string,
  temperature?: number,
  resolvedSystemPrompt?: string
): Promise<{ answeredBy: string }> {
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

  // Track which model actually answers (may differ from requested if switching occurs)
  let answeredBy = model;

  const onSwitch = (fromModel: string, toModel: string, attempt: number, reason: string) => {
    answeredBy = toModel;
    try {
      res.write(`data: ${JSON.stringify({ modelSwitch: { from: fromModel, to: toModel, attempt, reason } })}\n\n`);
    } catch (_) {}
  };

  const stream = await createChatCompletionStream({
    model,
    messages: messages as any,
    stream: true,
    max_tokens: 100000,
    temperature: temperature ?? 0.25,
  } as any, undefined, onSwitch);

  const keepalive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch {}
  }, 20000);

  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  } finally {
    clearInterval(keepalive);
  }

  return { answeredBy };
}

async function handleChatRequest(req: any, res: any): Promise<void> {
  const body = req.body as ChatRequest;
  if (!body || typeof body.userMessage !== "string") {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  const { userMessage, history = [], attachments = [], context, model, temperature, systemPrompt } = body;

  const intent = detectIntent(userMessage, history);
  const { model: resolvedModel, autoSelected } = selectBestModel(model, intent);
  const resolvedSystemPrompt = buildSystemPrompt(intent, systemPrompt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`data: ${JSON.stringify({ modelInfo: { model: resolvedModel, intent, autoSelected } })}\n\n`);

  try {
    const { answeredBy } = await streamReplitAI(res, resolvedModel, userMessage, history, attachments, context, temperature, resolvedSystemPrompt);
    res.write(`data: ${JSON.stringify({ done: true, answeredBy })}\n\n`);
    res.end();
  } catch (err: any) {
    const errMsg = err?.message ?? "An unexpected error occurred";
    res.write(`data: ${JSON.stringify({ content: `\n\n⚠️ ${errMsg}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
}

router.post("/chat/stream", handleChatRequest);
router.post("/chat/message", handleChatRequest);

router.post("/chat/generate-image", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Image generation is not supported with the current AI provider." });
});

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
