import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/page-layout';
import {
  ArrowLeft, Sparkles, Code2, Zap, Shield, Globe, GitBranch,
  MessageSquare, FolderKanban, BarChart3, GitCompare, Download,
  Brain, Star, FolderOpen, Clock, Share2, Terminal, LayoutTemplate,
  Play, Code, Trophy, FileDown, Palette, Layers, Wand2, Lock,
  Hash, Sliders, Cpu, History, Search, BookMarked, Edit3, Save,
  Package, Database, KeyRound, Puzzle, Users, Bug, RefreshCw,
  GitCommit, GitPullRequest, Eye, Rocket, Globe as GlobeIcon,
  Gamepad2, Camera, Music, BarChart, CheckSquare, FileText,
  Monitor, Columns2, GitCompare as GitCompare2, LayoutPanelLeft, AlignLeft,
  Command, ArrowUp, ArrowDown, Folder, Image, Keyboard, Layout, Compass,
  Network, Server, Activity, ShieldCheck, FlaskConical, Workflow,
  DatabaseZap, CloudUpload, TestTube, Gauge, BookOpen, Lightbulb,
  CreditCard, Container, Sigma, Layers3, Globe2, Braces, MousePointer2,
  SquareCode, Repeat2, SlidersHorizontal, Mail, Video, ToggleLeft,
  HardDrive, PenTool, GitMerge, Box, MapPin,
} from 'lucide-react';
import { OPENROUTER_MODELS } from '@/components/model-selector';

export default function AboutPage() {
  const [, setLocation] = useLocation();

  const playgroundFeatures = [
    { icon: Sparkles, title: 'AI App Generator', desc: 'Type any idea — AI creates the full folder structure, writes every file, and runs the app instantly. No setup required.', color: 'bg-primary/10 text-primary', badge: 'NEW' },
    { icon: FolderOpen, title: 'Real File Tree', desc: 'AI-generated projects show a real folder/file hierarchy. Click any file to open it in the editor. Just like a local project.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'NEW' },
    { icon: Eye, title: 'Live Preview', desc: 'Every HTML/CSS/JS project renders in a sandboxed iframe instantly. CSS and JS are automatically inlined for seamless preview.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: Terminal, title: 'Console Code Runner', desc: 'Run JavaScript, TypeScript, or Python files directly from the editor. Output streams in real time to the built-in console tab.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: Wand2, title: 'AI Error Explainer', desc: 'When your code has errors, click "AI Explain Error" — Gemini reads the code and error together and gives a plain-English fix.', color: 'bg-rose-500/10 text-rose-400', badge: 'NEW' },
    { icon: Search, title: 'Multi-File Search', desc: 'Search across all files in your project simultaneously. Results show filename, line number, and matching text. Click to jump.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
    { icon: Share2, title: 'Project Sharing', desc: 'Share any playground project via a URL link. Recipients open the link and see the full project — no signup needed.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Download, title: 'ZIP Export', desc: 'Download any project as a ZIP archive with the full folder structure. Open locally in VS Code or your favourite editor.', color: 'bg-orange-500/10 text-orange-400', badge: 'NEW' },
    { icon: Columns2, title: 'Split / Single View', desc: 'Toggle between split view (editor + preview side-by-side) or single view (maximised preview or editor) with one click.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: LayoutTemplate, title: 'Templates Marketplace', desc: '10+ ready-to-use templates (Todo App, Snake Game, Calculator, Dashboard, Weather, Markdown Editor…) across 6 categories.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'NEW' },
    { icon: Code2, title: 'In-Browser Code Editor', desc: 'Per-file tab switching, language-aware file icons, and editable textarea with tab-support and real-time character count.', color: 'bg-sky-500/10 text-sky-400', badge: 'NEW' },
    { icon: Gamepad2, title: 'Example Prompt Library', desc: 'Not sure what to build? Choose from curated example prompts (todo app, snake game, weather dashboard, music player…) to start instantly.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
  ];

  const workspaceFeatures = [
    { icon: Terminal, title: 'Live Code Terminal', desc: 'Run JavaScript, TypeScript, Python, Bash, and Ruby directly inside the workspace. Real-time SSE output streaming with 30s sandboxed execution.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'CORE' },
    { icon: Brain, title: 'AI Workspace Context', desc: 'The AI chat automatically receives all your open files as context. Ask about any file, get suggestions, and have the AI understand your entire codebase.', color: 'bg-purple-500/10 text-purple-400', badge: 'CORE' },
    { icon: Wand2, title: 'AI Code Autocomplete', desc: 'Inline AI completions powered by Gemini appear as you type in the Monaco editor. Press Tab to accept. Understands your file context for smarter completions.', color: 'bg-blue-500/10 text-blue-400', badge: 'CORE' },
    { icon: Code2, title: 'Monaco Editor', desc: 'VS Code\'s editor engine with syntax highlighting, bracket matching, multi-cursor, keyboard shortcuts, and custom dark theme.', color: 'bg-sky-500/10 text-sky-400', badge: 'CORE' },
    { icon: GitCompare2, title: 'Diff Viewer', desc: 'Compare the original and AI-suggested version of any file side-by-side with color-coded diff highlighting before accepting changes.', color: 'bg-amber-500/10 text-amber-400', badge: 'CORE' },
    { icon: GitBranch, title: 'Git Panel', desc: 'View commit history, manage branches, create new branches, and browse open pull requests — all from inside the workspace connected to your GitHub repo.', color: 'bg-orange-500/10 text-orange-400', badge: 'CORE' },
    { icon: Package, title: 'Package Manager UI', desc: 'Search the npm registry, add packages (with dev flag), remove packages, and manage your package.json — all from the Packages tab without leaving the editor.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'CORE' },
    { icon: Database, title: 'Database Viewer', desc: 'Browse database tables, view rows with pagination, run SELECT queries against your project data — a full visual SQL explorer built in.', color: 'bg-teal-500/10 text-teal-400', badge: 'CORE' },
    { icon: Bug, title: 'AI Debugging', desc: 'One-click AI debugging of the active file. The Debug Issues tool analyzes your code for bugs, errors, and problems then provides fixed versions.', color: 'bg-red-500/10 text-red-400', badge: 'CORE' },
    { icon: KeyRound, title: 'Secrets Manager', desc: 'Store environment variables and API keys per project. Keys are never committed to git. Export as .env. Masked by default with toggle-to-reveal.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'CORE' },
    { icon: Users, title: 'Real-Time Collaboration', desc: 'See who else is in your workspace live. Colored avatar indicators show presence, active file, and cursor position. Presence syncs every 5 seconds.', color: 'bg-pink-500/10 text-pink-400', badge: 'CORE' },
    { icon: Puzzle, title: 'Plugin / Extension System', desc: '5 built-in extensions (AI Autocomplete, GitLens, Code Runner, Live Preview, Theme Studio) plus a marketplace of 6+ community plugins. Toggle any on/off instantly.', color: 'bg-violet-500/10 text-violet-400', badge: 'CORE' },
    { icon: Rocket, title: 'Live Deploy URLs', desc: 'Deploy your project to Netlify, Vercel, or Render from the Deploy button. Get a live shareable URL instantly. Custom domain support included.', color: 'bg-sky-500/10 text-sky-400', badge: 'CORE' },
    { icon: GlobeIcon, title: 'Custom Domain Support', desc: 'Connect a custom domain to your deployed project via the Deploy settings. Point your DNS and ZorvixAI provisions the SSL cert automatically.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'CORE' },
    { icon: Globe, title: 'GitHub Import', desc: 'Import any GitHub repository directly into a workspace project. Files, folders and directory structure are all preserved automatically.', color: 'bg-gray-500/10 text-gray-400', badge: 'CORE' },
    { icon: Monitor, title: 'Live Preview Pane', desc: 'A built-in live preview panel shows your HTML/JS project running alongside the editor. Refresh on demand or after every save.', color: 'bg-green-500/10 text-green-400', badge: 'CORE' },
  ];

  const chatFeatures = [
    { icon: Brain, title: 'Multi-Model AI Chat', desc: `${OPENROUTER_MODELS.length} free OpenRouter models — Llama 3.3 70B, Qwen3 Coder, GPT-OSS, Mistral, DeepSeek, Gemma 3, and more. Switch model per message.` },
    { icon: Layers, title: 'File Attachments', desc: 'Attach images, PDFs, code files or CSV data to any message. AI reads and reasons over the content.' },
    { icon: Palette, title: 'Custom System Prompts', desc: 'Set a persistent system prompt for your entire session. Make the AI behave as a specific persona or expert.' },
    { icon: Sliders, title: 'Temperature Control', desc: 'Adjust creativity from 0.0 (deterministic) to 1.0 (creative) per conversation.' },
    { icon: History, title: 'Conversation History', desc: 'Full scrollable message history with copy buttons. Markdown rendered with code blocks and syntax highlighting.' },
    { icon: GitCompare, title: 'Model Comparison', desc: 'Send the same prompt to two models simultaneously and compare their responses side-by-side.' },
  ];

  // ── NEW POWER FEATURES ────────────────────────────────────────────────────
  const powerFeatures = [
    {
      icon: Command,
      title: 'Slash Commands',
      desc: 'Type /fix, /explain, /test, /refactor, /optimize, /document, /review, or /summarize to trigger instant AI actions. An autocomplete menu appears as you type with descriptions.',
      color: 'bg-primary/10 text-primary',
      badge: 'NEW',
    },
    {
      icon: Image,
      title: 'Vision / Image Input',
      desc: 'Paste a screenshot directly into chat or upload an image — the AI analyzes it and responds based on what it sees. Supports all common image formats.',
      color: 'bg-pink-500/10 text-pink-400',
      badge: 'NEW',
    },
    {
      icon: Search,
      title: 'Search Within Conversation',
      desc: 'Press Ctrl+F (or click the search icon) to search through all messages in the current conversation. Navigate matches with arrow buttons, matched messages are highlighted.',
      color: 'bg-blue-500/10 text-blue-400',
      badge: 'NEW',
    },
    {
      icon: Download,
      title: 'Drag & Drop Files',
      desc: 'Drag any file from your desktop and drop it directly onto the chat window. Images and text files are instantly attached and sent as context to the AI.',
      color: 'bg-orange-500/10 text-orange-400',
      badge: 'NEW',
    },
    {
      icon: Cpu,
      title: 'Context Window Bar',
      desc: 'A visual progress bar shows what percentage of the AI\'s context window is currently used across all messages and project files. Turns yellow at 50% and red at 80%.',
      color: 'bg-yellow-500/10 text-yellow-400',
      badge: 'NEW',
    },
    {
      icon: Code2,
      title: 'Inline Code Annotation',
      desc: 'Hover over any line of code in an AI response to get a one-sentence AI explanation tooltip — instantly. No need to ask a follow-up question.',
      color: 'bg-emerald-500/10 text-emerald-400',
      badge: 'NEW',
    },
    {
      icon: Folder,
      title: 'Multi-File Project Context',
      desc: 'Upload your entire project folder as context. All uploaded files (JS, TS, Python, CSS, JSON, etc.) are automatically injected into every message so the AI understands your full codebase.',
      color: 'bg-violet-500/10 text-violet-400',
      badge: 'NEW',
    },
    {
      icon: Zap,
      title: 'Agent Autonomous Mode',
      desc: 'Enable Autonomous Mode and give the AI a goal — it automatically plans the steps, executes them one by one, and delivers the complete result without needing you to guide each step.',
      color: 'bg-rose-500/10 text-rose-400',
      badge: 'NEW',
    },
    {
      icon: Keyboard,
      title: 'Keyboard-First Navigation',
      desc: 'Navigate through chat messages using j/k or arrow keys. Press c to copy the focused message. Ctrl+F to search, Ctrl+K for new chat, Ctrl+P for prompt library — fully keyboard navigable.',
      color: 'bg-cyan-500/10 text-cyan-400',
      badge: 'NEW',
    },
  ];

  const promptGeneratorFeatures = [
    { icon: Wand2, title: 'AI Prompt Builder', desc: 'Generate professional UI/UX, design, and code prompts for Figma, Canva, Framer, and other design tools in seconds.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Layers, title: 'Prompt Categories', desc: 'Browse prompts by category: UI design, landing pages, dashboards, mobile apps, icons, illustrations, and more.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
    { icon: Code2, title: 'Code Prompt Templates', desc: 'Pick from pre-built code prompt templates for React, Vue, Python, APIs, and more — fully editable and customizable.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: Share2, title: 'One-Click Copy', desc: 'Copy any generated prompt to clipboard instantly and paste it directly into your favourite design or AI tool.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: History, title: 'Prompt History', desc: 'All your previously generated prompts are saved in session so you can revisit, tweak, or re-use them quickly.', color: 'bg-amber-500/10 text-amber-400', badge: 'NEW' },
    { icon: Sparkles, title: 'AI-Powered Refinement', desc: 'Ask the AI to refine, shorten, expand, or rewrite any generated prompt to better match your creative vision.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
  ];

  const exploreFeatures = [
    { icon: Compass, title: 'Community Projects', desc: 'Browse and discover projects shared by other ZorvixAI users. Find inspiration, fork a project, and build on it.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: Search, title: 'Project Search', desc: 'Search across all public community projects by name, language, or description to quickly find what you need.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: Star, title: 'Featured Projects', desc: 'Curated hand-picked projects featured by the ZorvixAI team — showcasing the best community creations each week.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'NEW' },
    { icon: Share2, title: 'Fork & Remix', desc: 'Fork any public project directly into your own account with one click and immediately start editing and customizing.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Eye, title: 'Live Preview Browsing', desc: 'See a live thumbnail preview of each community project before opening it so you know what you\'re getting into.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: Globe, title: 'Trending Projects', desc: 'Discover the most popular projects ranked by views, forks, and community activity to see what developers are building.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
  ];

  const aiIntelligenceFeatures = [
    { icon: Network, title: 'Agent Architecture', desc: 'ZorvixAI plans before acting — it breaks every request into steps, executes in order, and self-corrects. It operates like an autonomous agent, not just a chatbot.', color: 'bg-primary/10 text-primary', badge: 'CORE' },
    { icon: Brain, title: 'Full-Stack Context Awareness', desc: 'The AI understands your entire codebase — frontend, backend, types, and APIs together. It keeps all layers in sync when you make changes.', color: 'bg-violet-500/10 text-violet-400', badge: 'CORE' },
    { icon: ShieldCheck, title: 'Security-First Code Generation', desc: 'Every piece of code generated follows OWASP Top 10 guidelines — parameterized queries, CSRF protection, helmet headers, and input validation by default.', color: 'bg-red-500/10 text-red-400', badge: 'CORE' },
    { icon: Gauge, title: 'Performance-Aware Output', desc: 'ZorvixAI targets Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) and flags performance anti-patterns like N+1 queries and layout thrashing.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'CORE' },
    { icon: FlaskConical, title: 'LLM Engineering Expertise', desc: 'Builds AI-powered features with best practices: streaming SSE, prompt injection defense, token budgets, model routing, RAG pipelines, and cost tracking.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'CORE' },
    { icon: Workflow, title: 'System Design Patterns', desc: 'Implements circuit breakers, bulkheads, sagas, outbox pattern, BFF, and event-driven architecture — production-grade distributed system design built in.', color: 'bg-blue-500/10 text-blue-400', badge: 'CORE' },
    { icon: DatabaseZap, title: 'Advanced Database Engineering', desc: 'Handles indexing strategies, connection pooling, cursor pagination, event sourcing, CQRS, soft deletes, optimistic locking, and multi-tenancy by default.', color: 'bg-teal-500/10 text-teal-400', badge: 'CORE' },
    { icon: Activity, title: 'Observability by Default', desc: 'Generated backends include structured logging, distributed tracing with OpenTelemetry, Prometheus-compatible metrics, and health check endpoints.', color: 'bg-pink-500/10 text-pink-400', badge: 'CORE' },
    { icon: CloudUpload, title: 'DevOps & CI/CD Guidance', desc: 'ZorvixAI configures GitHub Actions pipelines, Docker multi-stage builds, blue-green deployments, feature flags, and Terraform IaC from the start.', color: 'bg-orange-500/10 text-orange-400', badge: 'CORE' },
    { icon: TestTube, title: 'Production-Grade Testing', desc: 'Writes unit tests for business logic, integration tests for API endpoints, E2E tests for critical flows, and load tests before launch — test quality, not coverage.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'CORE' },
    { icon: BookOpen, title: 'I18N & A11Y Built In', desc: 'Generates accessible code (WCAG 2.1 AA) with ARIA labels, focus management, keyboard navigation, and i18n-ready string extraction from day one.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'CORE' },
    { icon: Lightbulb, title: 'Engineering Mentorship Mode', desc: 'Explains every decision with the WHY behind it, points out ADR-worthy choices, celebrates good engineering, and teaches production-grade patterns as it builds.', color: 'bg-amber-500/10 text-amber-400', badge: 'CORE' },
  ];

  const aiUpgradeV2Features = [
    { icon: SquareCode, title: 'Next.js App Router Expert', desc: 'Full mastery of Server Components, Client Components, Server Actions, streaming, loading.tsx, error.tsx, parallel routes, intercepting routes, and Partial Pre-Rendering (PPR).', color: 'bg-black/10 text-foreground', badge: 'NEW' },
    { icon: Braces, title: 'GraphQL & Apollo Mastery', desc: 'Schema-first design, DataLoader for N+1 prevention, cursor pagination, persisted queries, Apollo Client cache normalization, optimistic updates, and schema federation.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
    { icon: Palette, title: 'Advanced CSS & Animation', desc: 'Container queries, :has() selector, CSS Layers, View Transitions API, scroll-driven animations, FLIP technique, Framer Motion spring animations, and Oklch color space.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Container, title: 'Docker & Kubernetes Production', desc: 'Multi-stage builds, non-root users, liveness/readiness/startup probes, HPA, PodDisruptionBudget, Helm charts, ArgoCD GitOps, and service mesh (Istio/Linkerd).', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: Network, title: 'Microservices & Distributed Systems', desc: 'Service boundaries, async messaging, dead letter queues, idempotent consumers, message schema versioning, distributed tracing, bulkhead and retry patterns.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: TestTube, title: 'Vitest & Playwright Expert', desc: 'vi.mock, vi.useFakeTimers, test.each, MSW for API mocking, Playwright Page Object Model, visual regression testing, trace viewer, and codegen.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: Globe2, title: 'Edge Computing & Serverless', desc: 'Cloudflare Workers, Vercel Edge Functions, Durable Objects, KV stores, streaming from the edge, cold start optimization, and DynamoDB single-table design.', color: 'bg-orange-500/10 text-orange-400', badge: 'NEW' },
    { icon: Repeat2, title: 'SSE & Streaming Patterns', desc: 'Server-Sent Events format, heartbeat messages, backpressure handling, ReadableStream for edge environments, Vercel AI SDK, and OpenAI streaming integration.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
    { icon: SlidersHorizontal, title: 'State Management Deep Dive', desc: 'Zustand, Jotai, XState, URL state, form state with React Hook Form, optimistic vs pessimistic updates, cache invalidation, and atomic state patterns.', color: 'bg-amber-500/10 text-amber-400', badge: 'NEW' },
    { icon: MousePointer2, title: 'Advanced React Patterns', desc: 'Compound components, headless UI, portals, useDeferredValue, useTransition, React.memo with custom comparison, virtualization, useSyncExternalStore, and Concurrent Features.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'NEW' },
    { icon: DatabaseZap, title: 'Prisma & Drizzle ORM Expert', desc: 'Prisma migrations, transactions, middleware, Drizzle SQL-first queries, drizzle-zod integration, upserts, CTEs, and Row Level Security for multi-tenant apps.', color: 'bg-rose-500/10 text-rose-400', badge: 'NEW' },
    { icon: CreditCard, title: 'Payments & Billing Systems', desc: 'Stripe Payment Intents, webhook verification, subscription states, dunning management, usage-based billing, Stripe Tax, Stripe Connect for marketplaces, and chargeback defense.', color: 'bg-green-500/10 text-green-400', badge: 'NEW' },
  ];

  const aiUpgradeV3Features = [
    { icon: Code2, title: 'Python Backend (FastAPI & Django)', desc: 'FastAPI async-first APIs, Pydantic v2, SQLAlchemy 2.0 async sessions, Alembic migrations, Celery tasks, Django ORM optimization, and httpx for async HTTP.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: Zap, title: 'Go (Golang) Mastery', desc: 'Goroutines, channels, context propagation, errors.Is/As, sync primitives, table-driven tests, pprof profiling, graceful shutdown, and Go generics.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
    { icon: Box, title: 'Rust Fundamentals', desc: 'Ownership model, borrowing rules, lifetimes, Result/Option ergonomics, traits, Tokio async runtime, Axum web framework, Serde, and sqlx.', color: 'bg-orange-500/10 text-orange-400', badge: 'NEW' },
    { icon: Layers, title: 'Vue 3 & Nuxt Mastery', desc: 'Composition API with <script setup>, Pinia stores, useAsyncData, useFetch, Nuxt modules, auto-imports, Nitro server engine, and Island architecture.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: Star, title: 'Astro Framework', desc: 'Islands architecture, content collections with Zod schemas, client: hydration directives, middleware, API routes, View Transitions, and Astro DB.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Globe, title: 'Browser APIs Deep Dive', desc: 'Intersection Observer, ResizeObserver, Web Animations API, Pointer Events, Clipboard API, File System Access, IndexedDB, Web Crypto, and BroadcastChannel.', color: 'bg-sky-500/10 text-sky-400', badge: 'NEW' },
    { icon: Search, title: 'SEO & Core Web Vitals', desc: 'LCP/INP/CLS ranking signals, JSON-LD structured data, hreflang, canonical URLs, robots.txt, XML sitemaps, E-E-A-T, and mobile-first indexing.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'NEW' },
    { icon: Palette, title: 'Design Systems', desc: 'Design tokens, semantic tokens, Radix UI primitives, Storybook + Chromatic, CVA (Class Variance Authority), compound components, and ARIA pattern library.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
    { icon: HardDrive, title: 'Cloud Storage & File Handling', desc: 'Pre-signed S3 URLs for direct uploads, multipart upload, file type validation via magic bytes, Sharp image processing, ffmpeg, and CDN lifecycle policies.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: BookOpen, title: 'Technical Writing & Docs', desc: 'ADRs, Diátaxis framework (Tutorial/How-To/Reference/Explanation), TSDoc, Runbooks, Mermaid diagrams, Docusaurus, and Vale linting for prose.', color: 'bg-amber-500/10 text-amber-400', badge: 'NEW' },
    { icon: Cpu, title: 'Memory Management', desc: 'WeakMap/WeakRef/FinalizationRegistry, V8 JIT shape optimization, detached DOM leak detection, heap snapshots, structuredClone, and object pooling patterns.', color: 'bg-rose-500/10 text-rose-400', badge: 'NEW' },
    { icon: PenTool, title: 'Developer Experience (DX)', desc: 'README-driven development, zero-config defaults, Husky + lint-staged, commitlint, devcontainers, path aliases, Prettier/ESLint integration, and update notifiers.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'NEW' },
  ];

  const aiUpgradeV4Features = [
    { icon: Braces, title: 'tRPC — Type-Safe APIs', desc: 'End-to-end typed procedures, Zod input/output validation, protected procedures, React Query integration, infinite queries, optimistic updates, and server-side callers.', color: 'bg-primary/10 text-primary', badge: 'NEW' },
    { icon: Monitor, title: 'React Native & Expo', desc: 'Expo Router, React Navigation, Reanimated 60fps animations, FlashList, EAS Build, OTA updates via expo-updates, Gesture Handler, and MMKV for fast storage.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: ToggleLeft, title: 'Feature Flags & Rollouts', desc: 'Gradual rollouts (1%→100%), kill switches, user targeting by segment/plan/region, LaunchDarkly/GrowthBook, server-side evaluation, and flag debt prevention.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: BarChart, title: 'Analytics & Experimentation', desc: 'Privacy-first event tracking, GDPR/CCPA compliance, funnel analysis, cohort retention, A/B testing with statistical significance, PostHog session replay, and UTM attribution.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: Database, title: 'Caching Strategies', desc: 'Cache-aside, write-through, stale-while-revalidate, Redis data structures (Hash/Set/Sorted Set/Stream), cache stampede prevention, CDN cache control, and LRU/LFU eviction.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
    { icon: ShieldCheck, title: 'Rate Limiting & Abuse Prevention', desc: 'Token bucket and sliding window algorithms, Redis-based distributed limiting, per-IP and per-user quotas, 429 Retry-After headers, bot detection, and DDoS defense.', color: 'bg-red-500/10 text-red-400', badge: 'NEW' },
    { icon: Activity, title: 'Logging Best Practices', desc: 'Structured JSON logs with correlation IDs, pino/Winston/zap, log levels, PII scrubbing, centralized shipping to Datadog/ELK, log sampling, and child loggers.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'NEW' },
    { icon: Video, title: 'WebRTC & Peer-to-Peer', desc: 'ICE/STUN/TURN negotiation, SDP offer/answer, perfect negotiation pattern, SFU (Mediasoup/LiveKit), simulcast, RTCDataChannel, screen sharing, and MediaRecorder.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
    { icon: Brain, title: 'ML Integration Patterns', desc: 'ONNX Runtime, TensorFlow.js, HuggingFace Inference API, embeddings + cosine similarity, pgvector, re-ranking with cross-encoders, structured output, and AI guardrails.', color: 'bg-amber-500/10 text-amber-400', badge: 'NEW' },
    { icon: Users, title: 'Multi-Tenancy Architecture', desc: 'Row-level isolation, Postgres RLS policies, tenant context middleware, tenant-aware caching, subdomain routing, custom domains, and per-tenant usage metering.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: GitMerge, title: 'Real-Time Collaboration', desc: 'Yjs CRDT (YText/YArray/YMap), y-websocket/y-indexeddb, presence awareness, collaborative cursors, OT vs CRDT tradeoffs, and optimistic concurrency.', color: 'bg-orange-500/10 text-orange-400', badge: 'NEW' },
    { icon: Terminal, title: 'CLI Tools & Desktop Apps', desc: 'Commander.js + Inquirer, Chalk + Ora, exit codes, shell completions, Tauri (Rust + WebView), Electron IPC, code signing for Windows/macOS, and auto updater.', color: 'bg-sky-500/10 text-sky-400', badge: 'NEW' },
  ];

  const aiUpgradeV5Features = [
    { icon: Mail, title: 'Email Systems & Deliverability', desc: 'SPF/DKIM/DMARC setup, IP warming, bounce/unsubscribe handling, BullMQ email queuing, React Email/MJML, suppression lists, and List-Unsubscribe headers.', color: 'bg-rose-500/10 text-rose-400', badge: 'NEW' },
    { icon: Server, title: 'Infrastructure as Code (IaC)', desc: 'Terraform plan/apply/state, remote state with S3+DynamoDB, modules, Terragrunt for DRY configs, Pulumi (TypeScript), AWS CDK, Policy as Code with OPA.', color: 'bg-blue-500/10 text-blue-400', badge: 'NEW' },
    { icon: DatabaseZap, title: 'Advanced SQL Patterns', desc: 'Recursive CTEs, window functions (ROW_NUMBER, LAG, LEAD), LATERAL JOIN, DISTINCT ON, UPSERT, partial indexes, pg_stat_statements, materialized views, and advisory locks.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'NEW' },
    { icon: Database, title: 'NoSQL & Document Databases', desc: 'MongoDB aggregation pipeline, $lookup, change streams, DynamoDB single-table design, GSIs, conditional writes, TTL, and Redis as primary database with Sorted Sets/Streams.', color: 'bg-orange-500/10 text-orange-400', badge: 'NEW' },
    { icon: Network, title: 'Networking Fundamentals', desc: 'TCP vs UDP, HTTP/2 multiplexing, HTTP/3 on QUIC, TLS 1.3 handshake, DNS resolution, CDN Anycast, load balancer algorithms, gRPC over HTTP/2, and service mesh.', color: 'bg-violet-500/10 text-violet-400', badge: 'NEW' },
    { icon: GitCommit, title: 'API Versioning & Evolution', desc: 'Breaking vs non-breaking changes, Sunset/Deprecation headers, URL vs header versioning, Expand/Contract pattern, consumer-driven contracts with Pact, and gateway routing.', color: 'bg-cyan-500/10 text-cyan-400', badge: 'NEW' },
    { icon: Package, title: 'Frontend Build Optimization', desc: 'Bundle analysis, tree shaking, code splitting, Brotli compression, critical CSS inlining, content-hash filenames, CDN deployment, Lighthouse CI, and build caching.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'NEW' },
    { icon: Workflow, title: 'Queue-Based Architecture', desc: 'BullMQ lifecycle (waiting/active/completed/failed), exponential backoff with jitter, DLQ, job idempotency, parent-child flows, Kafka consumer groups, and at-least-once delivery.', color: 'bg-teal-500/10 text-teal-400', badge: 'NEW' },
    { icon: Gamepad2, title: 'Web Game Development', desc: 'requestAnimationFrame game loop, delta time, Entity-Component System, Phaser 3, React Three Fiber, object pooling, FSM for AI, spatial hashing, and multiplayer with Colyseus.', color: 'bg-pink-500/10 text-pink-400', badge: 'NEW' },
    { icon: MapPin, title: 'IoT & Edge Device Patterns', desc: 'MQTT (QoS levels, wildcards, broker), device shadow, CoAP, OTA firmware updates, telemetry with InfluxDB, heartbeat pattern, watchdog timers, and FOTA management.', color: 'bg-amber-500/10 text-amber-400', badge: 'NEW' },
    { icon: Lock, title: 'Blockchain & Web3', desc: 'Solidity smart contracts, proxy upgradability patterns, ABI, gas optimization, ERC-20/721/1155 standards, ethers.js/viem, The Graph, reentrancy defense, and IPFS.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'NEW' },
    { icon: Lightbulb, title: 'Product Engineering Mindset', desc: 'Ship small & often, blameless postmortems, chaos engineering, boring technology principle, MVP thinking, toil automation, runbooks, graceful degradation, and user empathy.', color: 'bg-sky-500/10 text-sky-400', badge: 'NEW' },
  ];

  const aiUpgradeCoreFeatures = [
    { icon: Zap, title: 'Autonomous Agent Behavior', desc: 'ZorvixAI plans before every task — outputs an implementation plan, completes 100% of what it starts, self-reviews output, and warns you before breaking changes. No more half-finished files.', color: 'bg-yellow-500/10 text-yellow-400', badge: 'CORE' },
    { icon: Code2, title: 'Full-Stack Generation in One Pass', desc: 'Every API endpoint comes with its Zod schema, TypeScript types, client hook, and UI component. Every form includes loading, error, success, and validation. Never a half-built feature.', color: 'bg-primary/10 text-primary', badge: 'CORE' },
    { icon: Rocket, title: 'Replit-Style Zero-Config Dev', desc: 'Projects start in under 3 seconds with zero config. Startup logs show port, environment, DB status, and feature flags. Path aliases, HMR, and health check endpoints are standard.', color: 'bg-orange-500/10 text-orange-400', badge: 'CORE' },
    { icon: Braces, title: 'TypeScript Mastery: satisfies, infer, brands', desc: 'Uses satisfies operator, discriminated unions, template literal types, const assertions, branded ID types, mapped type modifiers, module augmentation, and NoInfer<T> utility.', color: 'bg-blue-500/10 text-blue-400', badge: 'CORE' },
    { icon: MousePointer2, title: 'React 19 & Server Actions', desc: 'useOptimistic, use() hook, useFormStatus, React Compiler (no manual memo/useCallback), Suspense at every boundary, Error Boundaries, startTransition, and useDeferredValue.', color: 'bg-sky-500/10 text-sky-400', badge: 'CORE' },
    { icon: CloudUpload, title: 'Production Deployment Patterns', desc: 'Blue-green deployments, canary releases with traffic splitting, backward-compatible migrations, SIGTERM graceful shutdown, immutable infrastructure, and git-SHA-tagged Docker images.', color: 'bg-emerald-500/10 text-emerald-400', badge: 'CORE' },
    { icon: FlaskConical, title: 'Advanced LLM Engineering', desc: 'Structured output with JSON schemas, RAG with pgvector, prompt caching for 90% cost reduction, streaming SSE, multi-turn context trimming, model routing, and automated evals on every change.', color: 'bg-violet-500/10 text-violet-400', badge: 'CORE' },
    { icon: Network, title: 'AI Agent Orchestration', desc: 'ReAct pattern, parallel tool execution, 10-step depth limits, human-in-the-loop for destructive actions, agent memory (short/long-term/episodic), and per-step logging for full debuggability.', color: 'bg-pink-500/10 text-pink-400', badge: 'CORE' },
    { icon: ShieldCheck, title: 'Advanced Security Hardening', desc: 'CSP with nonces, Subresource Integrity, timing-safe comparison, SSRF prevention, secrets rotation with zero downtime, session fixation prevention, and supply chain security with pinned deps.', color: 'bg-red-500/10 text-red-400', badge: 'CORE' },
    { icon: Gauge, title: 'Core Web Vitals Engineering', desc: 'LCP via preload + CDN, CLS via explicit image dimensions, INP via scheduler.yield(), 103 Early Hints, stale-while-revalidate, Service Worker caching, AVIF images, and critical CSS inlining.', color: 'bg-amber-500/10 text-amber-400', badge: 'CORE' },
    { icon: Brain, title: 'Implementation Plan First', desc: 'Every non-trivial task begins with a written plan listing files to create/edit and the order of changes. Dependency order is always respected: types → utils → components → pages.', color: 'bg-indigo-500/10 text-indigo-400', badge: 'CORE' },
    { icon: Activity, title: '100 Elite Instructions Total', desc: 'All 100 new Replit Max Core instructions span agent behavior, full-stack codegen, TypeScript mastery, React 19, deployment, LLM engineering, agent orchestration, security, and performance.', color: 'bg-teal-500/10 text-teal-400', badge: 'CORE' },
  ];

  const aiElite500Features = [
    { icon: Cpu, title: 'WASM Near-Native Speed', desc: 'Run C, Rust, Go compiled code in browser at near-native performance.', cat: 'WebAssembly' },
    { icon: Zap, title: 'wasm-pack + wasm-bindgen', desc: 'Publish Rust-to-WASM npm packages with automatic JS type bridges.', cat: 'WebAssembly' },
    { icon: Globe, title: 'WASM SIMD Instructions', desc: '128-bit SIMD for 4× speedup on image filters, ML inference, audio.', cat: 'WebAssembly' },
    { icon: Server, title: 'WASI Runtime Sandbox', desc: 'Run WASM outside the browser with filesystem, sockets, env vars.', cat: 'WebAssembly' },
    { icon: Code2, title: 'Streaming WASM Compile', desc: 'instantiateStreaming starts compiling before full .wasm downloads.', cat: 'WebAssembly' },
    { icon: Activity, title: 'SharedArrayBuffer Threads', desc: 'Multi-threaded WASM via Web Workers with Atomics and SAB.', cat: 'WebAssembly' },
    { icon: Database, title: 'SQLite-in-Browser (WASM)', desc: 'wa-sqlite / sql.js: full relational DB in browser, persisted via OPFS.', cat: 'WebAssembly' },
    { icon: Package, title: 'wasm-opt Compression', desc: 'Binaryen wasm-opt shrinks bundles — target <500KB gzipped for web.', cat: 'WebAssembly' },
    { icon: Globe2, title: 'WebGPU Compute Shaders', desc: 'General-purpose GPU programs for ML inference and physics in browser.', cat: 'WebGL / GPU' },
    { icon: Layers, title: 'WebGL 2 Rendering Pipeline', desc: 'Vertex + fragment shaders, VBOs, uniforms, textures, framebuffers.', cat: 'WebGL / GPU' },
    { icon: Palette, title: 'Instanced Rendering', desc: 'Draw thousands of identical objects in one draw call with InstancedMesh.', cat: 'WebGL / GPU' },
    { icon: Cpu, title: 'GPU Particle Systems', desc: 'Store particle state in textures, update in shaders — millions at 60fps.', cat: 'WebGL / GPU' },
    { icon: Eye, title: 'Ping-Pong Framebuffers', desc: 'Two framebuffers alternating for GPGPU simulation steps.', cat: 'WebGL / GPU' },
    { icon: Activity, title: 'WGSL Shader Language', desc: "WebGPU's Rust-inspired typed shader language — replaces GLSL.", cat: 'WebGL / GPU' },
    { icon: Sparkles, title: 'PWA Web App Manifest', desc: 'Icons, theme colors, display: standalone, start_url for installability.', cat: 'PWA' },
    { icon: Zap, title: 'Service Worker Lifecycle', desc: 'Install → Activate → Fetch — cache assets, clean old caches, serve offline.', cat: 'PWA' },
    { icon: Database, title: 'Workbox Precaching', desc: 'InjectManifest plugin injects build manifest into custom service worker.', cat: 'PWA' },
    { icon: RefreshCw, title: 'Background Sync API', desc: 'Queue failed requests and retry when connectivity is restored.', cat: 'PWA' },
    { icon: Mail, title: 'Web Push Notifications', desc: 'VAPID-signed push messages wake service worker — no app open needed.', cat: 'PWA' },
    { icon: Monitor, title: 'beforeinstallprompt', desc: 'Defer install prompt, show custom in-app install button at the right moment.', cat: 'PWA' },
    { icon: HardDrive, title: 'OPFS File Storage', desc: 'Origin Private File System — fast private file I/O without blocking main thread.', cat: 'PWA' },
    { icon: Share2, title: 'Web Share + File Handling', desc: 'Native share dialog and open files double-clicked on the OS desktop.', cat: 'PWA' },
    { icon: Activity, title: 'OTel Distributed Traces', desc: 'Spans, trace IDs, W3C TraceContext propagation across all services.', cat: 'Observability' },
    { icon: Network, title: 'OpenTelemetry SDK', desc: '@opentelemetry/sdk-node auto-instruments HTTP, Express, pg, Redis.', cat: 'Observability' },
    { icon: BarChart, title: 'OTLP Export Protocol', desc: 'Vendor-neutral format for Jaeger, Tempo, Datadog, Honeycomb.', cat: 'Observability' },
    { icon: Gauge, title: 'OTel Metrics + Exemplars', desc: 'Counter, Gauge, Histogram — link trace IDs to metric spikes.', cat: 'Observability' },
    { icon: Eye, title: 'Tail-Based Sampling', desc: 'Sample after trace completion — keep 100% of error traces.', cat: 'Observability' },
    { icon: BookOpen, title: 'Baggage Propagation', desc: 'Carry user ID, tenant, and feature flags across all downstream spans.', cat: 'Observability' },
    { icon: Brain, title: 'DDD Ubiquitous Language', desc: 'Shared vocabulary between developers and domain experts in the code.', cat: 'DDD' },
    { icon: Layers3, title: 'Bounded Contexts', desc: 'Domain model boundary — different contexts use different models.', cat: 'DDD' },
    { icon: Network, title: 'Aggregates & Invariants', desc: 'Aggregate Root enforces all invariants; no direct child entity access.', cat: 'DDD' },
    { icon: Braces, title: 'Value Objects', desc: 'Immutable, identity-less objects compared by value: Money, Email, Address.', cat: 'DDD' },
    { icon: Zap, title: 'Domain Events', desc: 'Past-tense facts (OrderPlaced, PaymentFailed) — trigger side effects elsewhere.', cat: 'DDD' },
    { icon: GitBranch, title: 'Anti-Corruption Layer', desc: 'Translate between your domain model and external systems — no leakage.', cat: 'DDD' },
    { icon: Workflow, title: 'Event Storming', desc: 'Collaborative domain mapping with sticky notes before writing any code.', cat: 'DDD' },
    { icon: Repeat2, title: 'Saga / Process Manager', desc: 'Coordinate multi-step business processes across aggregates.', cat: 'DDD' },
    { icon: Activity, title: 'CloudEvents Standard', desc: 'Vendor-neutral event metadata (id, source, type, time) for interoperability.', cat: 'EDA' },
    { icon: Database, title: 'Schema Registry', desc: 'Confluent Registry enforces Avro/Protobuf backward compatibility.', cat: 'EDA' },
    { icon: Zap, title: 'Outbox Pattern', desc: 'Write domain events to DB in same transaction — reliably publish after.', cat: 'EDA' },
    { icon: RefreshCw, title: 'Event Replay', desc: 'Reprocess historical events to build new projections or fix bugs.', cat: 'EDA' },
    { icon: Shield, title: 'Idempotent Consumers', desc: 'Handle at-least-once delivery — use idempotency keys to deduplicate.', cat: 'EDA' },
    { icon: GitCommit, title: 'Dead Letter Queue', desc: 'Events failing N retries go to DLQ — inspect, fix, replay manually.', cat: 'EDA' },
    { icon: Network, title: 'GraphQL Federation v2', desc: '@key, @external, @requires, @provides — compose subgraphs into supergraph.', cat: 'GraphQL Fed' },
    { icon: Layers, title: 'Apollo Router (Rust)', desc: 'Rust-based GraphQL gateway — computes query plans, parallel fetches.', cat: 'GraphQL Fed' },
    { icon: Eye, title: '@defer Streaming', desc: 'Stream expensive fields lazily — render critical UI first.', cat: 'GraphQL Fed' },
    { icon: GitPullRequest, title: 'Schema Checks (Rover)', desc: 'Catch breaking schema changes in CI before merging to main.', cat: 'GraphQL Fed' },
    { icon: SquareCode, title: 'Contract Schemas', desc: 'Filtered supergraph views for public vs internal API consumers.', cat: 'GraphQL Fed' },
    { icon: Activity, title: 'EXPLAIN ANALYZE Mastery', desc: 'Read query plans: Seq Scan vs Index Scan, Hash Join, cost vs actual rows.', cat: 'DB Optimization' },
    { icon: Database, title: 'GIN + BRIN Indexes', desc: 'GIN for JSONB/full-text; BRIN for time-ordered append-only tables.', cat: 'DB Optimization' },
    { icon: Zap, title: 'Covering Indexes (INCLUDE)', desc: 'Satisfy queries entirely from index — zero heap fetches.', cat: 'DB Optimization' },
    { icon: Search, title: 'Partial + Expression Indexes', desc: 'Index only matching rows or function results — smaller, faster.', cat: 'DB Optimization' },
    { icon: BarChart, title: 'pg_stat_statements', desc: 'Query-level profiling — find top N by total_exec_time and mean time.', cat: 'DB Optimization' },
    { icon: Clock, title: 'Cursor-Based Pagination', desc: 'WHERE id > last_id avoids OFFSET O(n) cost on large tables.', cat: 'DB Optimization' },
    { icon: GitMerge, title: 'Table Partitioning', desc: 'Range/list/hash partitioning — prune irrelevant partitions at query time.', cat: 'DB Optimization' },
    { icon: Layers3, title: 'dbt SQL Transforms', desc: 'Version-controlled, tested SQL transformations — models, tests, docs.', cat: 'Data Engineering' },
    { icon: RefreshCw, title: 'Incremental dbt Models', desc: 'Process only new/changed rows — skip full table recomputation.', cat: 'Data Engineering' },
    { icon: Database, title: 'DuckDB + Polars', desc: 'Analytical SQL on Parquet/CSV in-process; Rust DataFrames — no Spark.', cat: 'Data Engineering' },
    { icon: Activity, title: 'Medallion Architecture', desc: 'Bronze (raw) → Silver (cleaned) → Gold (aggregated) data quality layers.', cat: 'Data Engineering' },
    { icon: Zap, title: 'CDC with Debezium', desc: 'Capture PostgreSQL WAL changes, publish to Kafka — real-time replication.', cat: 'Data Engineering' },
    { icon: Shield, title: 'Great Expectations', desc: 'Data quality validation gate — completeness, freshness, distribution checks.', cat: 'Data Engineering' },
    { icon: Star, title: 'Star Schema Design', desc: 'Fact tables + dimension tables — optimized for aggregation queries.', cat: 'Data Engineering' },
    { icon: GitCommit, title: 'Data Contracts', desc: 'Formal schema agreements between producers and consumers — reject invalid data.', cat: 'Data Engineering' },
    { icon: Network, title: 'API Gateway Auth', desc: 'Validate JWT at the edge — pass identity downstream, zero re-auth per service.', cat: 'API Gateway' },
    { icon: Shield, title: 'Circuit Breaker at Edge', desc: 'Stop routing to degraded backends automatically — return cached or error.', cat: 'API Gateway' },
    { icon: Server, title: 'Service Mesh mTLS', desc: 'Istio/Linkerd sidecars enforce encrypted auth for all east-west traffic.', cat: 'Service Mesh' },
    { icon: BarChart, title: 'Mesh Observability', desc: 'Automatic traces, per-service latency, and error rates — zero code changes.', cat: 'Service Mesh' },
    { icon: SlidersHorizontal, title: 'Weighted Traffic Routing', desc: 'Canary deployments and A/B routing configured in mesh without code.', cat: 'Service Mesh' },
    { icon: Code2, title: 'GoF Design Patterns', desc: 'Singleton, Factory, Builder, Adapter, Decorator, Strategy — all 23 applied.', cat: 'Design Patterns' },
    { icon: Layers, title: 'Null Object Pattern', desc: 'Default no-op objects instead of null checks — eliminates null exceptions.', cat: 'Design Patterns' },
    { icon: Repeat2, title: 'Chain of Responsibility', desc: 'Express middleware chain, pipeline processors — handlers in sequence.', cat: 'Design Patterns' },
    { icon: Braces, title: 'Specification Pattern', desc: 'Business rules as composable objects — isSatisfiedBy() returns boolean.', cat: 'Design Patterns' },
    { icon: Search, title: 'Elasticsearch Mappings', desc: 'text vs keyword, analyzers, GIN, edge_ngram — explicit types, no dynamic mapping.', cat: 'Search' },
    { icon: Zap, title: 'Vector kNN Search', desc: 'dense_vector + cosine similarity — semantic search alongside keyword.', cat: 'Search' },
    { icon: BarChart, title: 'Faceted Aggregations', desc: 'Terms, range, date_histogram aggs — sidebar filters with live counts.', cat: 'Search' },
    { icon: Eye, title: 'Relevance Tuning', desc: 'Field boosting, function_score for popularity/recency, BM25 tweaks.', cat: 'Search' },
    { icon: GitBranch, title: 'Zero-Downtime Reindex', desc: 'Index alias + swap pattern — reindex with new mapping, flip alias atomically.', cat: 'Search' },
    { icon: Layers3, title: 'Turborepo Remote Cache', desc: 'Share build artifacts across CI and laptops — cache hit skips entire task.', cat: 'Monorepo' },
    { icon: Network, title: 'Nx Affected Commands', desc: 'Run tasks only for changed packages since last commit — fast CI at scale.', cat: 'Monorepo' },
    { icon: Package, title: 'Changesets Versioning', desc: 'Automated version bumps and CHANGELOGs from PR-level change entries.', cat: 'Monorepo' },
    { icon: Shield, title: 'Module Boundary Linting', desc: 'Nx ESLint rules enforce which packages can import from which — clean arch.', cat: 'Monorepo' },
    { icon: Cpu, title: 'Container Queries', desc: '@container styles components based on their own size — truly reusable.', cat: 'Responsive' },
    { icon: Palette, title: 'clamp() Fluid Typography', desc: 'clamp(1rem, 2.5vw, 1.5rem) — font scales proportionally, no breakpoints.', cat: 'Responsive' },
    { icon: Monitor, title: '100dvh Mobile Viewport', desc: 'Dynamic viewport height accounts for collapsing mobile browser chrome.', cat: 'Responsive' },
    { icon: Compass, title: 'Safe Area Insets', desc: 'env(safe-area-inset-bottom) for notches and home indicators on mobile.', cat: 'Responsive' },
    { icon: ToggleLeft, title: 'Thumb Zone Design', desc: 'Place primary actions in lower-center — the easiest thumb-reach zone.', cat: 'Responsive' },
    { icon: BookOpen, title: 'Sanity GROQ Queries', desc: 'Graph-Relational Object Queries — filtering, joining, projections in Sanity.', cat: 'CMS' },
    { icon: Eye, title: 'Preview / Draft Mode', desc: 'Fetch unpublished CMS content — Next.js draft mode, Nuxt preview mode.', cat: 'CMS' },
    { icon: Zap, title: 'Webhook ISR Revalidation', desc: 'CMS change triggers Next.js on-demand revalidation — instant propagation.', cat: 'CMS' },
    { icon: Globe, title: 'Portable Text Rendering', desc: 'Serialize Sanity/Contentful rich text to React, HTML, or any target.', cat: 'CMS' },
    { icon: Code2, title: 'devcontainers', desc: 'Reproducible dev environment in Docker — VS Code and Codespaces support.', cat: 'Developer DX' },
    { icon: Terminal, title: 'direnv + mise', desc: 'Auto-load env vars per directory; manage Node, Python, Go versions.', cat: 'Developer DX' },
    { icon: GitCommit, title: 'Lefthook + commitlint', desc: 'Fast Git hooks for lint/format; enforce Conventional Commits format.', cat: 'Developer DX' },
    { icon: Lock, title: 'mkcert Local HTTPS', desc: 'Locally-trusted SSL certificate — test HTTPS features without cloud.', cat: 'Developer DX' },
    { icon: Globe2, title: 'Cloudflare Tunnel / Ngrok', desc: 'Expose localhost to internet — test webhooks and OAuth flows locally.', cat: 'Developer DX' },
    { icon: Shield, title: 'PII Masking in Logs', desc: 'Never log names, emails, IPs in plaintext — mask or hash at the logger.', cat: 'AI Safety' },
    { icon: Brain, title: 'Hallucination Mitigation', desc: 'RAG grounds AI in factual documents — always cite sources for accuracy.', cat: 'AI Safety' },
    { icon: Lock, title: 'Prompt Injection Defense', desc: 'Sanitize user input before including in prompts — never trust user fragments.', cat: 'AI Safety' },
    { icon: Eye, title: 'AI Output Validation', desc: 'Verify AI-generated code compiles and passes tests before accepting.', cat: 'AI Safety' },
    { icon: ShieldCheck, title: 'Bias Detection & Fairness', desc: 'Test AI features across demographic groups — measure outcome disparities.', cat: 'AI Safety' },
    { icon: BookOpen, title: 'Diátaxis Documentation', desc: 'Tutorial, How-To, Reference, Explanation — four distinct doc types.', cat: 'Documentation' },
    { icon: GitCommit, title: 'Architecture Decision Records', desc: 'Context + decision + consequences — stored as Markdown in /docs/adr/.', cat: 'Documentation' },
    { icon: Code2, title: 'Diagram as Code', desc: 'Mermaid/PlantUML version-controlled diagrams alongside code they describe.', cat: 'Documentation' },
    { icon: Layers, title: 'C4 Model Architecture', desc: 'Context → Container → Component → Code — four audience-appropriate levels.', cat: 'Documentation' },
    { icon: Globe, title: 'Lambda Cold Start Opt.', desc: 'Reduce bundle size, init clients outside handler, use ES modules + tree-shaking.', cat: 'Serverless' },
    { icon: Zap, title: 'Cloudflare Workers <1ms', desc: 'V8 isolate model — sub-millisecond cold starts at 200+ edge locations.', cat: 'Serverless' },
    { icon: Database, title: 'Durable Objects State', desc: 'Single-instance stateful serverless — rate limiting, sessions, game state.', cat: 'Serverless' },
    { icon: Server, title: 'Step Functions Workflows', desc: 'Orchestrate multi-step processes with catch/retry, parallel, wait for approval.', cat: 'Serverless' },
    { icon: Activity, title: 'ClickHouse Real-Time OLAP', desc: 'Sub-second aggregations on billions of rows — Kafka-native ingestion.', cat: 'Streaming Analytics' },
    { icon: Network, title: 'Apache Flink Streaming', desc: 'Stateful stream processing — windowed aggregations, exactly-once semantics.', cat: 'Streaming Analytics' },
    { icon: BarChart, title: 'ksqlDB SQL on Kafka', desc: 'Write streaming queries in SQL — materialize as Kafka topics or tables.', cat: 'Streaming Analytics' },
    { icon: Zap, title: 'Watermarks & Late Events', desc: 'Flink watermarks advance event time — handle late arrivals within a window.', cat: 'Streaming Analytics' },
    { icon: Eye, title: 'Storybook Stories (CSF)', desc: 'One file, many stories (Default, Loading, Error, Empty) — interactive controls.', cat: 'Component-Driven' },
    { icon: TestTube, title: 'Play Functions + axe-core', desc: 'Simulate clicks, test a11y violations automatically — same code in tests.', cat: 'Component-Driven' },
    { icon: Palette, title: 'Chromatic Visual Regression', desc: 'Screenshot every story in CI — flag visual diffs before merging PRs.', cat: 'Component-Driven' },
    { icon: Layers3, title: 'Storybook Composition', desc: 'Reference stories from multiple team repos in one Storybook portal.', cat: 'Component-Driven' },
  ];

  const totalFeatures = playgroundFeatures.length + workspaceFeatures.length + chatFeatures.length + powerFeatures.length + promptGeneratorFeatures.length + exploreFeatures.length + aiIntelligenceFeatures.length + aiUpgradeV2Features.length + aiUpgradeV3Features.length + aiUpgradeV4Features.length + aiUpgradeV5Features.length + aiUpgradeCoreFeatures.length + aiElite500Features.length;

  return (
    <PageLayout crumbs={[{ label: 'About' }]} backHref="/" withMeshBg>
      <div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="w-7 h-7 text-primary" />ZorvixAI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">The AI-powered coding platform — {totalFeatures}+ features</p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {[
            { val: `${OPENROUTER_MODELS.length}`, label: 'AI Models', icon: Brain, color: 'text-primary' },
            { val: '10+', label: 'Templates', icon: LayoutTemplate, color: 'text-violet-400' },
            { val: `${totalFeatures}+`, label: 'Features', icon: Zap, color: 'text-yellow-400' },
            { val: '6', label: 'Languages', icon: Terminal, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-5 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <div className="text-2xl font-bold">{s.val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── NEW: Power Features (9 new) ── */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Power Chat Features</h2>
              <p className="text-sm text-muted-foreground">Slash commands, vision input, in-chat search, drag & drop, context bar, inline annotations, project context, autonomous mode, and keyboard nav</p>
            </div>
            <Badge className="ml-auto bg-rose-500/20 text-rose-400 border-rose-500/30">9 NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {powerFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-rose-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-rose-500/40 text-rose-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slash commands quick reference */}
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Slash Commands Quick Reference</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { cmd: '/fix', icon: '🐛', desc: 'Fix bugs' },
                { cmd: '/explain', icon: '📖', desc: 'Explain code' },
                { cmd: '/test', icon: '✅', desc: 'Write tests' },
                { cmd: '/refactor', icon: '♻️', desc: 'Refactor' },
                { cmd: '/optimize', icon: '⚡', desc: 'Optimize' },
                { cmd: '/document', icon: '📝', desc: 'Add docs' },
                { cmd: '/review', icon: '🔍', desc: 'Code review' },
                { cmd: '/summarize', icon: '📋', desc: 'Summarize' },
              ].map(sc => (
                <div key={sc.cmd} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{sc.icon}</span>
                  <div>
                    <code className="text-xs font-mono text-primary">{sc.cmd}</code>
                    <p className="text-[10px] text-muted-foreground">{sc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts quick reference */}
          <div className="mt-4 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { keys: 'j / ↓', desc: 'Next message' },
                { keys: 'k / ↑', desc: 'Previous message' },
                { keys: 'c', desc: 'Copy focused message' },
                { keys: 'Ctrl+F', desc: 'Search in chat' },
                { keys: 'Ctrl+K', desc: 'New chat' },
                { keys: 'Ctrl+P', desc: 'Prompt library' },
                { keys: 'Ctrl+M', desc: 'AI Memory' },
                { keys: 'Ctrl+/', desc: 'All shortcuts' },
                { keys: 'Esc', desc: 'Close panels' },
              ].map(s => (
                <div key={s.keys} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 whitespace-nowrap">{s.keys}</kbd>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700">
              <Zap className="w-4 h-4" />Try Power Features
            </Button>
          </div>
        </section>

        {/* NEW: AI Playground Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Code Playground</h2>
              <p className="text-sm text-muted-foreground">Build complete apps from a single prompt — folders, files, live preview, console, and sharing</p>
            </div>
            <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playgroundFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/playground')} className="gap-2 shadow-lg shadow-primary/20">
              <Play className="w-4 h-4" />Try the AI Playground
            </Button>
            <Button variant="outline" onClick={() => setLocation('/templates')} className="gap-2 ml-3">
              <LayoutTemplate className="w-4 h-4" />Browse Templates
            </Button>
          </div>
        </section>

        {/* Workspace / IDE Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Full IDE Workspace</h2>
              <p className="text-sm text-muted-foreground">Monaco editor, terminal, Git, packages, database, secrets, collaboration, and deployment</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaceFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-violet-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setLocation('/projects')} className="gap-2">
              <FolderKanban className="w-4 h-4" />Go to My Projects
            </Button>
          </div>
        </section>

        {/* AI Chat Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Chat</h2>
              <p className="text-sm text-muted-foreground">{OPENROUTER_MODELS.length} free models, file attachments, system prompts, model comparison, and full history</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-blue-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400"><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prompt Generator Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Prompt Generator</h2>
              <p className="text-sm text-muted-foreground">Generate professional design and code prompts for Figma, Canva, Framer, and more</p>
            </div>
            <Badge className="ml-auto bg-violet-500/20 text-violet-400 border-violet-500/30">NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promptGeneratorFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-violet-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-violet-500/40 text-violet-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/prompt-generator')} className="gap-2 shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700">
              <Wand2 className="w-4 h-4" />Try Prompt Generator
            </Button>
          </div>
        </section>

        {/* Explore Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Explore Community</h2>
              <p className="text-sm text-muted-foreground">Discover, fork, and build on projects from the ZorvixAI community</p>
            </div>
            <Badge className="ml-auto bg-teal-500/20 text-teal-400 border-teal-500/30">NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exploreFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-teal-500/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-teal-500/40 text-teal-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setLocation('/explore')} className="gap-2">
              <Compass className="w-4 h-4" />Browse Community
            </Button>
          </div>
        </section>

        {/* AI Intelligence Section */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Intelligence Engine</h2>
              <p className="text-sm text-muted-foreground">500+ new expert-level instructions across security, performance, observability, testing, and system design</p>
            </div>
            <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">500+ NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiIntelligenceFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New AI Domains Quick Reference */}
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">New Expert Knowledge Domains Added</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Agent Architecture', icon: '🤖' },
                { label: 'TypeScript Mastery', icon: '🔷' },
                { label: 'React Internals', icon: '⚛️' },
                { label: 'Node.js & Express', icon: '🟢' },
                { label: 'Database Engineering', icon: '🗄️' },
                { label: 'Performance Tuning', icon: '⚡' },
                { label: 'Security (OWASP)', icon: '🛡️' },
                { label: 'LLM Engineering', icon: '🧠' },
                { label: 'DevOps & CI/CD', icon: '🚀' },
                { label: 'WebSockets & SSE', icon: '📡' },
                { label: 'Mobile & PWA', icon: '📱' },
                { label: 'Accessibility A11Y', icon: '♿' },
                { label: 'I18N & Localization', icon: '🌍' },
                { label: 'Monorepo Design', icon: '🏗️' },
                { label: 'System Patterns', icon: '🔗' },
                { label: 'Observability', icon: '📊' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-primary/20">
              <Brain className="w-4 h-4" />Try Upgraded AI
            </Button>
          </div>
        </section>

        {/* AI Upgrade V2 Section */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Layers3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Knowledge Update v2</h2>
              <p className="text-sm text-muted-foreground">500+ more expert instructions: Next.js App Router, GraphQL, Docker/K8s, Edge Computing, Payments, Advanced Patterns</p>
            </div>
            <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 border-indigo-500/30">500+ NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiUpgradeV2Features.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-indigo-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-indigo-500/40 text-indigo-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* V2 domains quick reference */}
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">New v2 Expert Knowledge Domains</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Next.js App Router', icon: '▲' },
                { label: 'GraphQL & Apollo', icon: '◆' },
                { label: 'Advanced CSS/Animation', icon: '🎨' },
                { label: 'Docker & Kubernetes', icon: '🐳' },
                { label: 'Microservices', icon: '🔗' },
                { label: 'Vitest & Playwright', icon: '🧪' },
                { label: 'Edge & Serverless', icon: '⚡' },
                { label: 'SSE & Streaming', icon: '📡' },
                { label: 'State Management', icon: '🔄' },
                { label: 'Error Handling', icon: '🛡️' },
                { label: 'Prisma & Drizzle', icon: '🗄️' },
                { label: 'Payments & Billing', icon: '💳' },
                { label: 'Prompt Engineering', icon: '🧠' },
                { label: 'Data Structures & Algos', icon: '📐' },
                { label: 'Auth & OAuth 2.0', icon: '🔐' },
                { label: 'Tailwind CSS Expert', icon: '🎯' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700">
              <Sigma className="w-4 h-4" />Chat with Upgraded AI
            </Button>
          </div>
        </section>

        {/* AI Knowledge Update v3 */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Knowledge Update v3</h2>
              <p className="text-sm text-muted-foreground">500+ more instructions: Python, Go, Rust, Vue 3, Astro, Browser APIs, SEO, Design Systems, Cloud Storage, Memory & DX</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">500+ NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiUpgradeV3Features.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-emerald-500/40 text-emerald-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">v3 Expert Knowledge Domains</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Python / FastAPI', icon: '🐍' },
                { label: 'Go (Golang)', icon: '🐹' },
                { label: 'Rust Systems', icon: '🦀' },
                { label: 'Vue 3 & Nuxt', icon: '💚' },
                { label: 'Astro Framework', icon: '🚀' },
                { label: 'Browser APIs', icon: '🌐' },
                { label: 'SEO & CWV', icon: '📈' },
                { label: 'Design Systems', icon: '🎨' },
                { label: 'Cloud Storage', icon: '☁️' },
                { label: 'Memory Management', icon: '🧠' },
                { label: 'Developer Experience', icon: '⚙️' },
                { label: 'Technical Writing', icon: '📝' },
                { label: 'Concurrency Patterns', icon: '⚡' },
                { label: 'Data Validation', icon: '✅' },
                { label: 'Async Patterns', icon: '🔄' },
                { label: 'CSS Animation', icon: '🎭' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
              <Code2 className="w-4 h-4" />Try v3 Upgraded AI
            </Button>
          </div>
        </section>

        {/* AI Knowledge Update v4 */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Knowledge Update v4</h2>
              <p className="text-sm text-muted-foreground">500+ more instructions: tRPC, React Native, Feature Flags, Analytics, Caching, WebRTC, ML Integration, Multi-Tenancy, CLI & Desktop</p>
            </div>
            <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/30">500+ NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiUpgradeV4Features.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-orange-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-orange-500/40 text-orange-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">v4 Expert Knowledge Domains</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'tRPC Type-Safe APIs', icon: '🔷' },
                { label: 'React Native / Expo', icon: '📱' },
                { label: 'Feature Flags', icon: '🚩' },
                { label: 'A/B Testing', icon: '🧪' },
                { label: 'Analytics & Funnels', icon: '📊' },
                { label: 'Caching Strategies', icon: '⚡' },
                { label: 'Rate Limiting', icon: '🛡️' },
                { label: 'Structured Logging', icon: '📋' },
                { label: 'WebRTC / P2P', icon: '📹' },
                { label: 'ML Integration', icon: '🤖' },
                { label: 'Multi-Tenancy', icon: '🏢' },
                { label: 'Real-Time Collab', icon: '🤝' },
                { label: 'CLI Tools', icon: '💻' },
                { label: 'Desktop (Tauri)', icon: '🖥️' },
                { label: 'Queue Architecture', icon: '📬' },
                { label: 'CRDT / Yjs', icon: '🔗' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-orange-500/20 bg-orange-600 hover:bg-orange-700">
              <Zap className="w-4 h-4" />Try v4 Upgraded AI
            </Button>
          </div>
        </section>

        {/* AI Knowledge Update v5 */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Knowledge Update v5</h2>
              <p className="text-sm text-muted-foreground">500+ more instructions: Email, IaC, Advanced SQL, NoSQL, Networking, API Versioning, Build Optimization, Game Dev, IoT, Blockchain & Product Mindset</p>
            </div>
            <Badge className="ml-auto bg-rose-500/20 text-rose-400 border-rose-500/30">500+ NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiUpgradeV5Features.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-rose-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-rose-500/40 text-rose-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">v5 Expert Knowledge Domains</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Email Deliverability', icon: '📧' },
                { label: 'Terraform / IaC', icon: '🏗️' },
                { label: 'Advanced SQL', icon: '🗄️' },
                { label: 'MongoDB / DynamoDB', icon: '📦' },
                { label: 'HTTP/2 & HTTP/3', icon: '🌐' },
                { label: 'API Versioning', icon: '🔖' },
                { label: 'Build Optimization', icon: '⚡' },
                { label: 'BullMQ / Kafka', icon: '📬' },
                { label: 'Web Game Dev', icon: '🎮' },
                { label: 'IoT & MQTT', icon: '📡' },
                { label: 'Blockchain / Web3', icon: '⛓️' },
                { label: 'Product Mindset', icon: '🧠' },
                { label: 'Networking Fundamentals', icon: '🔗' },
                { label: 'NoSQL Patterns', icon: '🔀' },
                { label: 'DNS & CDN', icon: '☁️' },
                { label: 'Chaos Engineering', icon: '💥' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700">
              <Lightbulb className="w-4 h-4" />Try v5 Upgraded AI
            </Button>
          </div>
        </section>

        {/* AI Knowledge Update — Replit Max Core */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Core Update — Replit Max Level</h2>
              <p className="text-sm text-muted-foreground">100 elite new instructions: autonomous agent behavior, full-stack codegen, React 19, LLM engineering, agent orchestration, advanced security & Core Web Vitals</p>
            </div>
            <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">100 NEW</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiUpgradeCoreFeatures.map(f => (
              <div key={f.title} className="bg-card border border-border/50 rounded-xl p-5 hover:border-yellow-500/20 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <Badge variant="outline" className="text-xs py-0 h-4 border-yellow-500/40 text-yellow-400">{f.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-muted/30 border border-border/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">100 Elite Instruction Domains</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Agent Self-Planning', icon: '🤖' },
                { label: 'Full-Stack Codegen', icon: '⚡' },
                { label: 'Zero-Config Dev', icon: '🚀' },
                { label: 'TypeScript: satisfies', icon: '🔷' },
                { label: 'Branded ID Types', icon: '🏷️' },
                { label: 'React 19 Patterns', icon: '⚛️' },
                { label: 'Server Actions', icon: '🔄' },
                { label: 'useOptimistic Hook', icon: '⚡' },
                { label: 'Blue-Green Deploy', icon: '🔵' },
                { label: 'Canary Releases', icon: '🐦' },
                { label: 'Prompt Caching 90%', icon: '💰' },
                { label: 'RAG + pgvector', icon: '🧠' },
                { label: 'Structured Output', icon: '📋' },
                { label: 'ReAct Agent Pattern', icon: '🔗' },
                { label: 'CSP with Nonces', icon: '🛡️' },
                { label: 'Core Web Vitals', icon: '📊' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2 px-3 py-2 bg-card border border-border/50 rounded-lg">
                  <span>{d.icon}</span>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2 shadow-lg shadow-yellow-500/20 bg-yellow-600 hover:bg-yellow-700">
              <Zap className="w-4 h-4" />Try Replit Max Core AI
            </Button>
          </div>
        </section>

        {/* AI Models Section */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Available AI Models</h2>
              <p className="text-sm text-muted-foreground">All {OPENROUTER_MODELS.length} free OpenRouter models — zero cost, no API key required</p>
            </div>
            <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">{OPENROUTER_MODELS.length} FREE</Badge>
          </div>

          {/* Large Models */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Large Models (70B+)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPENROUTER_MODELS.filter(m => m.category === 'large').map(m => (
                <div key={m.id} className="bg-card border border-border/50 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold">{m.label}</span>
                        {m.badge && <Badge variant="outline" className="text-[10px] py-0 h-4 border-purple-500/40 text-purple-400">{m.badge}</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{m.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Models */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Medium Models (20–49B)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPENROUTER_MODELS.filter(m => m.category === 'medium').map(m => (
                <div key={m.id} className="bg-card border border-border/50 rounded-xl p-4 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold">{m.label}</span>
                        {m.badge && <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-500/40 text-blue-400">{m.badge}</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{m.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Small Models */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Small & Fast (&lt;20B)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPENROUTER_MODELS.filter(m => m.category === 'small').map(m => (
                <div key={m.id} className="bg-card border border-border/50 rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold">{m.label}</span>
                        {m.badge && <Badge variant="outline" className="text-[10px] py-0 h-4 border-emerald-500/40 text-emerald-400">{m.badge}</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{m.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              All models are served via <strong className="text-foreground">OpenRouter</strong> at <strong className="text-foreground">$0 cost</strong>.
              The system automatically falls back to the next available model if one is busy or unavailable.
            </p>
          </div>
        </section>

        {/* Quick Nav */}
        <section className="mb-14">
          <div className="bg-card border border-border/50 rounded-2xl p-8">
            <h2 className="text-lg font-bold mb-2 text-center">Explore Everything</h2>
            <p className="text-muted-foreground text-sm text-center mb-8">Jump directly to any feature</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'AI Chat', icon: MessageSquare, path: '/' },
                { label: 'Projects & IDE', icon: FolderKanban, path: '/projects' },
                { label: 'Workspace', icon: Layout, path: '/projects' },
                { label: 'AI Playground', icon: Play, path: '/playground' },
                { label: 'Templates', icon: LayoutTemplate, path: '/templates' },
                { label: 'Prompt Generator', icon: Wand2, path: '/prompt-generator' },
                { label: 'Explore', icon: Compass, path: '/explore' },
                { label: 'Compare Models', icon: GitCompare, path: '/compare' },
                { label: 'Analytics', icon: BarChart3, path: '/analytics' },
                { label: 'Settings', icon: Sliders, path: '/settings' },
                { label: 'Developer API', icon: Terminal, path: '/developer' },
                { label: 'Usage', icon: Hash, path: '/usage' },
                { label: 'Our Apps', icon: Globe, path: '/our-apps' },
              ].map(link => (
                <button key={link.label} onClick={() => setLocation(link.path)} className="flex items-center gap-2 p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                    <link.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-medium">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 500 Elite Instructions — 100 AI Features */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">500 Elite AI Instructions</h2>
                <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] font-bold tracking-wider px-2">500 NEW</Badge>
                <Badge className="bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30 text-[10px] font-bold tracking-wider px-2">100 FEATURES</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">22 advanced engineering domains — the deepest knowledge tier in ZorvixAI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
            {aiElite500Features.map((f, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-3.5 hover:border-violet-500/30 transition-colors group">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors mt-0.5">
                    <f.icon className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight mb-0.5">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-violet-400/70 bg-violet-500/10 rounded px-1.5 py-0.5">{f.cat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
            <p className="text-sm text-muted-foreground">
              These <strong className="text-foreground">500 instructions</strong> span WebAssembly, WebGPU, PWA, OpenTelemetry, DDD, Event-Driven Architecture, GraphQL Federation, DB Optimization, Data Engineering, Service Mesh, Design Patterns, Search Engineering, Monorepo Tooling, Mobile-First Design, CMS/Headless, Developer DX, AI Safety, Code Documentation, Browser Extensions, Serverless, Real-Time Analytics, and Component-Driven Development.
            </p>
          </div>
        </section>

        {/* Mission */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/20 rounded-2xl p-10 mb-12 text-center">
          <Brain className="w-10 h-10 text-primary mx-auto mb-5" />
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-base">
            ZorvixAI was built for developers who want to move fast. We believe the best AI assistant is one that
            <strong className="text-foreground"> builds the code</strong>, runs it, deploys it, and manages it — not just explains how.
            Every feature is guided by one question: does this help you ship faster?
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={() => setLocation('/')} className="gap-2 px-10 bg-primary shadow-xl shadow-primary/25 text-base h-12">
            <Sparkles className="w-5 h-5" /> Start Building
          </Button>
          <p className="text-muted-foreground text-sm mt-4">Free to use · No credit card required · {totalFeatures}+ features</p>
        </div>
      </div>
    </PageLayout>
  );
}
