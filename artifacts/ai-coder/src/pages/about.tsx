import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Command, ArrowUp, ArrowDown, Folder, Image, Keyboard,
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

  const totalFeatures = playgroundFeatures.length + workspaceFeatures.length + chatFeatures.length + powerFeatures.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Code2 className="w-7 h-7 text-primary" />ZorvixAI</h1>
            <p className="text-muted-foreground text-sm mt-0.5">The AI-powered coding platform — {totalFeatures}+ features</p>
          </div>
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
                { label: 'AI Playground', icon: Play, path: '/playground' },
                { label: 'Templates', icon: LayoutTemplate, path: '/templates' },
                { label: 'Compare Models', icon: GitCompare, path: '/compare' },
                { label: 'Analytics', icon: BarChart3, path: '/analytics' },
                { label: 'Settings', icon: Sliders, path: '/settings' },
                { label: 'Developer API', icon: Terminal, path: '/developer' },
                { label: 'Usage', icon: Hash, path: '/usage' },
                { label: 'Our Apps', icon: Globe, path: '/our-apps' },
                { label: 'Explore', icon: Globe, path: '/explore' },
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
    </div>
  );
}
