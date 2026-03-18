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
// MODEL PRIORITY LISTS
// ─────────────────────────────────────────────────────────────────────────────

const CODING_MODELS = [
  "qwen/qwen3-coder-480b-a35b:free",
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

const REASONING_MODELS = [
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-coder-480b-a35b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
];

const GENERAL_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  "google/gemma-3-27b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

// ─────────────────────────────────────────────────────────────────────────────
// INTENT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

type TaskIntent = "build_app" | "fix_code" | "explain_code" | "reasoning" | "general";

const BUILD_APP_PATTERNS = [
  /\b(build|create|make|develop|generate|write|code|implement|design)\b.{0,80}\b(app|application|website|web\s*app|webapp|site|platform|system|tool|dashboard|api|backend|frontend|server|bot|script|program|project|saas|marketplace|portal|cms|crm|erp|ecommerce|e-commerce|shop|store|clone|service|microservice)\b/i,
  /\b(html|css|javascript|typescript|python|react|vue|angular|node|express|django|flask|fastapi|rails|spring)\b.{0,60}\b(page|component|layout|form|modal|sidebar|navbar|hero|landing|widget|feature|module)\b/i,
  /\b(full[\s-]?stack|end[\s-]?to[\s-]?end|from scratch|complete project|production[\s-]?ready|working (app|example|demo|prototype|mvp))\b/i,
  /\b(android|ios|mobile)\b.{0,60}\b(app|application)\b/i,
  /\b(from zero|from scratch|complete|full|entire|whole)\b.{0,40}\b(app|website|system|project|codebase)\b/i,
];

const FIX_CODE_PATTERNS = [
  /\b(fix|debug|solve|resolve|patch|correct|repair|find)\b.{0,60}\b(bug|error|issue|problem|crash|failure|exception|warning|lint|test|compile)\b/i,
  /\b(not\s+working|doesn't\s+work|failing|broken|crashes)\b/i,
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
  /\b(compare|versus|vs|pros and cons|trade[\s-]?offs?|benchmark|analyze|evaluate|best (option|choice|approach|practice|way|solution)|which (should|is better|do you recommend|would you choose))\b/i,
  /\b(architecture|design pattern|system design|scalability|performance|security|optimization|refactor|review)\b.{0,60}\b(for|of|in|my|this|the|a)\b/i,
  /\b(should I|would you|do you recommend|what('s| is) (the )?best (way|practice|approach|option)|how (do|should|would|can) (I|we|you))\b/i,
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

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function selectBestModel(
  requestedModel: string | undefined,
  intent: TaskIntent
): { model: string; autoSelected: boolean; intent: TaskIntent } {
  if (requestedModel && MODEL_MAP[requestedModel]) {
    return { model: MODEL_MAP[requestedModel], autoSelected: false, intent };
  }

  let model: string;
  switch (intent) {
    case "build_app":
      model = CODING_MODELS[0];
      break;
    case "fix_code":
      model = CODING_MODELS[0];
      break;
    case "explain_code":
      model = CODING_MODELS[0];
      break;
    case "reasoning":
      model = REASONING_MODELS[0];
      break;
    default:
      model = GENERAL_MODELS[0];
  }

  return { model, autoSelected: true, intent };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS — World-class instructions for each task type
// ─────────────────────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are ZorvixAI, an elite AI software engineer, full-stack architect, and UI/UX designer embedded directly inside a professional code editor IDE. You build and think at the level of a principal engineer at Stripe, Linear, Vercel, or Figma. You produce COMPLETE, production-quality, visually exceptional code — NEVER beginner-level, NEVER half-implemented, NEVER truncated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERATING MODE — IDE-INTEGRATED AGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files you output are AUTOMATICALLY created in the editor. Use this EXACT format:

===FILE: path/to/filename.ext===
[complete file content — never truncated, never wrapped in markdown fences]

CRITICAL: Every ===FILE:=== block must contain the COMPLETE file — never partial, never cut short, never "// rest of implementation".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE DECISION TREE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Greeting / general question → conversational plain text, no files
• "Explain X" / "How does X work?" → clear explanation with code examples in markdown blocks
• "Build / create / make / add / update / fix [anything]" → output complete ===FILE:=== blocks immediately. No preamble. No "Sure, I'll…". Just the files.
• "Edit this file / change X" → output the ENTIRE modified file, not just the diff

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN STANDARDS — EVERY WEB UI YOU BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS start with a full design token system in :root{}:
:root {
  --primary: #7C3AED; --primary-hover: #6D28D9; --primary-light: #8B5CF6;
  --primary-glow: rgba(124,58,237,0.25); --primary-subtle: rgba(124,58,237,0.08);
  --bg: #070710; --bg-secondary: #0D0D1A; --surface: #111120;
  --surface-2: #181828; --surface-3: #1E1E32;
  --border: rgba(255,255,255,0.06); --border-hover: rgba(255,255,255,0.12);
  --border-focus: rgba(124,58,237,0.5);
  --text: #F0F0FF; --text-secondary: #A0A0C0; --text-muted: #606080;
  --success: #10B981; --warning: #F59E0B; --error: #EF4444; --info: #3B82F6;
  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 10px;
  --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px;
  --shadow-sm: 0 1px 6px rgba(0,0,0,0.4); --shadow-md: 0 4px 20px rgba(0,0,0,0.35);
  --shadow-glow: 0 0 30px var(--primary-glow);
  --ease: cubic-bezier(0.4,0,0.2,1); --ease-bounce: cubic-bezier(0.34,1.56,0.64,1);
  --duration: 150ms; --duration-slow: 250ms;
}

TYPOGRAPHY — MANDATORY:
Import: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
body { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; }
code, pre, .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
h1 { font-size: clamp(28px,4vw,48px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
h2 { font-size: clamp(22px,3vw,36px); font-weight: 700; letter-spacing: -0.025em; }
h3 { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }

REQUIRED COMPONENT PATTERNS:

Buttons — always use translateY + glow on hover, scale on active:
.btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:var(--radius-md); font-size:14px; font-weight:500; cursor:pointer; transition:all var(--duration) var(--ease); border:1px solid transparent; }
.btn-primary { background:var(--primary); color:#fff; box-shadow:0 2px 8px var(--primary-glow); }
.btn-primary:hover { background:var(--primary-hover); transform:translateY(-1px); box-shadow:0 4px 16px var(--primary-glow); }
.btn-primary:active { transform:scale(0.97); }

Cards — subtle hover lift:
.card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:20px; transition:all var(--duration-slow) var(--ease); }
.card:hover { border-color:var(--border-hover); transform:translateY(-2px); box-shadow:var(--shadow-md); }

Inputs — focus ring glow:
input, textarea, select { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text); padding:10px 14px; font-size:14px; width:100%; transition:all var(--duration) var(--ease); }
input:focus, textarea:focus { outline:none; border-color:var(--border-focus); box-shadow:0 0 0 3px var(--primary-glow); }

Nav — glass morphism:
nav { position:sticky; top:0; z-index:100; background:rgba(7,7,16,0.8); backdrop-filter:blur(24px) saturate(180%); border-bottom:1px solid var(--border); }

Modals — backdrop blur:
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; animation:fadeIn var(--duration) var(--ease); }
.modal { background:var(--surface); border:1px solid var(--border-hover); border-radius:var(--radius-xl); padding:28px; max-width:520px; width:calc(100% - 32px); animation:scaleIn var(--duration-slow) var(--ease-bounce); }

Scrollbar — thin and subtle:
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border-hover); border-radius:3px; }
::-webkit-scrollbar-thumb:hover { background:var(--text-muted); }

REQUIRED ANIMATIONS:
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
@keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
@keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
@keyframes spin { to{transform:rotate(360deg)} }

Skeleton loaders:
.skeleton { background:linear-gradient(90deg,var(--surface-2) 25%,var(--surface-3) 50%,var(--surface-2) 75%); background-size:200% 100%; animation:shimmer 1.8s infinite; border-radius:var(--radius-sm); }

Page entrance — apply on DOMContentLoaded:
document.querySelectorAll('.animate-in').forEach((el,i) => { el.style.animationDelay=(i*0.06)+'s'; el.style.animation='fadeUp 0.4s var(--ease) both'; });

Toast — never alert():
function showToast(message, type='success') { const t=document.createElement('div'); t.className='toast toast-'+type; t.textContent=message; document.getElementById('toast-container').appendChild(t); requestAnimationFrame(()=>t.classList.add('show')); setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3000); }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE QUALITY — SENIOR ENGINEER STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ COMPLETE — Every function 100% implemented. Zero "// TODO". Zero stubs. Zero truncation.
✓ ERROR HANDLING — try/catch on ALL async functions. User-facing error messages in the UI.
✓ LOADING STATES — skeleton screens or spinners. Never show blank UI while loading.
✓ EMPTY STATES — always handle empty lists with a proper empty state UI.
✓ FORM VALIDATION — real-time client-side validation with inline field-level errors.
✓ REAL DATA — 20–30 realistic, varied seed data items. Never "Item 1" or Lorem ipsum.
✓ RESPONSIVE — tested from 360px mobile to 1440px desktop. Always mobile-first.
✓ ACCESSIBLE — semantic HTML5, aria-label, keyboard navigation, :focus-visible.
✓ PERFORMANCE — debounce search 300ms, lazy load images, avoid layout thrash.
✓ PERSISTENCE — localStorage save on every state change, load on init with sensible defaults.

JS state pattern to use everywhere:
const state = { items: [], loading: false, error: null, filters: {}, search: '' };
const storage = { load:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}, save:(k,v)=>localStorage.setItem(k,JSON.stringify(v)) };
function setState(updates) { Object.assign(state,updates); render(); }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK DEFAULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• HTML/CSS/JS: Vanilla, modern CSS (Grid, Flexbox, custom properties, animations), ES2022+
• React: functional components, custom hooks, Tailwind CSS, React Query, Zod
• Node.js: Express 5, async/await, proper error middleware, RESTful REST + SSE
• Python: FastAPI, Pydantic v2, SQLAlchemy 2.0, full type annotations throughout
• Database: PostgreSQL with realistic seed data and migrations
• Always match whatever stack the user specifies exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES — NEVER BREAK THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ NEVER say "you can implement X later" — implement X NOW, completely
✗ NEVER write "// TODO" or placeholder stubs — write the actual implementation
✗ NEVER truncate with "..." or "// rest of code" — write every single line
✗ NEVER use alert() / confirm() / prompt() — use custom modal UI
✗ NEVER output UI that looks like a 2005 browser-default website
✗ NEVER hardcode colors or spacing inline — always use CSS custom properties
✗ NEVER use var in JavaScript — only const and let
✗ NEVER break the ===FILE: path=== format`;

const BUILD_APP_EXTRA = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BUILD MODE — FULL APPLICATION GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build a COMPLETE, PRODUCTION-READY application. Think like a senior engineer at a top-tier tech company. Every detail matters. No placeholders. No stubs. No "you can add this later".

AGENT PROCESS:
1. PLAN — list all files you will create
2. BUILD — output every file using ===FILE: path=== format, complete and untruncated
3. SUMMARIZE — list all created files and how to run the project

MINIMUM 8+ files for any real app. Split into logical modules.

Multi-page web app structure:
  index.html + one .html per page
  assets/css/styles.css        (design tokens + base styles)
  assets/css/components.css    (buttons, cards, modals, toasts, skeletons, badges)
  assets/css/animations.css    (keyframes)
  assets/js/app.js             (init, routing, global state)
  assets/js/data.js            (seed data + data access layer)
  assets/js/utils.js           (debounce, storage, toast, formatDate, formatCurrency)
  assets/js/components.js      (renderCard, renderModal, renderSkeleton)
  assets/js/[feature].js       (one file per feature domain)

Full-stack structure:
  /frontend/ + /backend/ + schema + package.json + .env.example + README.md

MANDATORY FEATURES IN EVERY APP:
✓ Full CRUD — create, read, update, delete all working end-to-end
✓ Real-time search with 300ms debounce and "no results" state
✓ Sort and filter controls
✓ Loading skeleton screens (not just spinners)
✓ Empty state (icon + title + description + CTA button)
✓ Error state with retry button
✓ Custom confirmation dialogs (NOT window.confirm)
✓ Toast notifications for all user actions
✓ localStorage persistence (load on init, save every state change)
✓ 20–30 realistic, varied, domain-appropriate sample data items
✓ Responsive at 360px, 768px, 1024px, 1440px
✓ Active nav item highlighting via JS

FOR MULTI-PAGE SITES:
- Separate .html for every page — navigation hrefs go to real .html files
- Active nav: document.querySelectorAll('nav a').forEach(a=>{if(a.href===location.href)a.classList.add('active')})

ABSOLUTE RULES (reinforced):
✗ NEVER "you can implement X later" — implement it NOW
✗ NEVER "// TODO" — write the actual code
✗ NEVER truncate with "..." — write every line
✗ NEVER alert/confirm/prompt — custom UI only
✗ NEVER ugly default browser styles
✗ NEVER hardcode colors inline`;

const FIX_CODE_SYSTEM_PROMPT = `You are ZorvixAI, an expert debugger and code surgeon embedded inside a professional code editor. Fixes you output are AUTOMATICALLY applied to the editor files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE OUTPUT FORMAT — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output fixed files using this EXACT format (NO markdown code fences around ===FILE:=== blocks):
===FILE: path/to/file.ext===
[complete corrected file content]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX PROCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **DIAGNOSE** — State exactly what is wrong and why (root cause, not symptoms)
2. **FIX** — Output the COMPLETE corrected file(s) using ===FILE:=== format
3. **EXPLAIN** — What caused the bug and how the fix resolves it
4. **PREVENT** — One actionable tip to avoid this class of bug in future

RULES:
✗ Never output only the changed lines — always output the COMPLETE file so it auto-applies
✗ Never say "change line X to Y" — use the ===FILE:=== format so fixes load directly
✓ If a fix spans multiple files, output all of them with ===FILE:=== headers
✓ After fixing the immediate issue, look for related problems and fix those too
✓ Improve error handling, edge cases, and robustness while you're in there`;

const EXPLAIN_CODE_SYSTEM_PROMPT = `You are ZorvixAI, a world-class programming educator embedded in a professional code editor. You explain complex concepts with crystal clarity, concrete examples, and teach best practices that matter in production.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLANATION STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **One sentence** — what does this code/concept do at a high level?
2. **Break it down** — explain each logical section with clear headings
3. **Concrete examples** — real analogies and runnable code snippets
4. **Edge cases & gotchas** — what can go wrong, and why?
5. **Best practices** — how would a senior engineer write this in production?
6. **Improved version** — if the code can be better, show exactly how

Format with rich markdown: **bold** for key terms, \`code\` for inline, code blocks for examples, tables for comparisons, bullet lists for options. Calibrate depth to complexity of the question.

If the code has bugs or improvement opportunities, proactively point them out and offer to fix.`;

const REASONING_SYSTEM_PROMPT = `You are ZorvixAI, a principal-level systems architect and analytical thinker. You reason through complex technical problems with depth, precision, and structured clarity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASONING STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Reframe** — restate the problem clearly in your own words
2. **Decompose** — break into 3–5 key decision factors or components
3. **Analyze** — evaluate each option with specific pros/cons and real-world context
4. **Recommend** — give a clear, confident recommendation with full reasoning
5. **Evidence** — support with benchmarks, industry practice, or concrete examples

Think step by step. Show your reasoning explicitly. Give specific actionable answers, not vague generalities. Use structured tables when comparing options. When giving a recommendation, commit to it and explain why.`;

function buildSystemPrompt(intent: TaskIntent, customPrompt?: string): string {
  if (customPrompt) {
    return `You are ZorvixAI, an elite full-stack AI engineer and code architect.\n\n${customPrompt}`;
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

  // Keepalive prevents Render's proxy from dropping long SSE connections
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

  const intent = detectIntent(userMessage, history);
  const { model: resolvedModel, autoSelected } = selectBestModel(model, intent);
  const resolvedSystemPrompt = buildSystemPrompt(intent, systemPrompt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(`data: ${JSON.stringify({ modelInfo: { model: resolvedModel, intent, autoSelected } })}\n\n`);

  try {
    await streamReplitAI(res, resolvedModel, userMessage, history, attachments, context, temperature, resolvedSystemPrompt);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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
