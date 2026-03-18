import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { AgentBuilder, isAgentBuildRequest } from '@/components/agent-builder';
import { ModelSelector, ModelPill, MODELS, getModelProvider, getModelLabel, AUTO_MODEL_ID } from '@/components/model-selector';
import type { ModelInfo as StreamModelInfo } from '@/hooks/use-ai-stream';
import { useAiStream } from '@/hooks/use-ai-stream';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { NotificationBell } from '@/components/notification-bell';
import { ShortcutsModal } from '@/components/shortcuts-modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth, logout } from '@/hooks/use-auth';
import {
  Send, Bot, User, Paperclip, X, Image as ImageIcon,
  FileText, Sparkles, Code2, Lightbulb, PenLine, Trash2,
  FolderKanban, Plus, Loader2, Info, Mail, Grid3X3, LogOut,
  Camera, Copy, ThumbsUp, ThumbsDown, RefreshCw, Download,
  Pin, Menu, ChevronLeft, Keyboard, Moon, Sun, Globe, Wand2, Check, Github, Terminal,
  BarChart3, Settings, Square, Shield, Search, BookMarked, Edit3, Volume2, VolumeX,
  Mic, MicOff, Sliders, Zap, Save, BookOpen, MessageSquarePlus, Hash, FileDown,
  Star, Share2, Brain, GitBranch, Flame, Palette, Minimize2, Maximize2,
  Code, MessageSquare, Link2, GitCompare, Clock, MessageCircle, Webhook, Play,
  FolderOpen, FolderPlus, ChevronDown, ChevronRight, Trophy, LayoutTemplate,
  Monitor, ExternalLink, Cpu, ArrowUp, ArrowDown, Bot as BotIcon,
} from 'lucide-react';

interface Attachment {
  id: string; name: string; type: 'image' | 'text'; mimeType: string; data: string; preview?: string; size: number;
}
interface ChatMessage {
  role: 'user' | 'assistant'; content: string;
  attachments?: Array<{ name: string; type: 'image' | 'text'; preview?: string }>;
  reaction?: 'up' | 'down'; isImage?: boolean; rating?: number; comment?: string;
}
interface HistoryItem {
  id: string; title: string; messages: ChatMessage[];
  pinned?: boolean; tags?: string[]; folder?: string; createdAt?: number;
}
interface SavedPrompt { id: string; title: string; prompt: string; category: string; }
interface MemoryItem { id: string; fact: string; }
interface ScheduledPrompt { id: string; prompt: string; time: string; model: string; enabled: boolean; }

// ── SLASH COMMANDS ─────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  { cmd: '/fix', label: '/fix', desc: 'Fix bugs in selected code', icon: '🐛', expand: (input: string) => `Fix the following code — find and fix all bugs, errors, and issues:\n\n${input.replace('/fix', '').trim()}` },
  { cmd: '/explain', label: '/explain', desc: 'Explain code in plain English', icon: '📖', expand: (input: string) => `Explain the following code in plain English, step by step:\n\n${input.replace('/explain', '').trim()}` },
  { cmd: '/test', label: '/test', desc: 'Generate unit tests', icon: '✅', expand: (input: string) => `Write comprehensive unit tests (with edge cases) for the following code:\n\n${input.replace('/test', '').trim()}` },
  { cmd: '/refactor', label: '/refactor', desc: 'Refactor and improve code', icon: '♻️', expand: (input: string) => `Refactor the following code to improve readability, performance, and maintainability:\n\n${input.replace('/refactor', '').trim()}` },
  { cmd: '/optimize', label: '/optimize', desc: 'Optimize for performance', icon: '⚡', expand: (input: string) => `Optimize the following code for maximum performance. Identify bottlenecks and rewrite:\n\n${input.replace('/optimize', '').trim()}` },
  { cmd: '/document', label: '/document', desc: 'Add JSDoc / docstrings', icon: '📝', expand: (input: string) => `Add comprehensive documentation (JSDoc comments / docstrings) to the following code:\n\n${input.replace('/document', '').trim()}` },
  { cmd: '/review', label: '/review', desc: 'Code review with feedback', icon: '🔍', expand: (input: string) => `Do a thorough code review of the following. Give actionable feedback on security, performance, style, and correctness:\n\n${input.replace('/review', '').trim()}` },
  { cmd: '/summarize', label: '/summarize', desc: 'Summarize a long text', icon: '📋', expand: (input: string) => `Summarize the following text concisely, keeping all key points:\n\n${input.replace('/summarize', '').trim()}` },
];

// Max context window tokens (~128k chars ≈ 32k tokens for most models)
const MAX_CONTEXT_CHARS = 128_000;

const SUGGESTIONS = [
  { icon: Code2, label: 'Write code', prompt: 'Write me a Python script that reads a CSV file and plots a bar chart using matplotlib.' },
  { icon: Lightbulb, label: 'Brainstorm', prompt: 'Brainstorm 10 unique SaaS app ideas for developers that could be built in a weekend.' },
  { icon: PenLine, label: 'Help me write', prompt: 'Write a professional email to request a project deadline extension.' },
  { icon: FolderKanban, label: 'Analyze data', prompt: 'Explain how to analyze and visualize sales data using Python pandas and seaborn.' },
];

const PERSONAS = [
  { id: 'general', label: 'General', emoji: '🌟' },
  { id: 'coder', label: 'Coder', emoji: '💻' },
  { id: 'teacher', label: 'Teacher', emoji: '📚' },
  { id: 'writer', label: 'Writer', emoji: '✍️' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Hindi', 'Chinese'];

const THEMES = [
  { id: 'default', label: 'Violet', primary: '#8b5cf6' },
  { id: 'ocean', label: 'Ocean', primary: '#0ea5e9' },
  { id: 'forest', label: 'Forest', primary: '#22c55e' },
  { id: 'sunset', label: 'Sunset', primary: '#f97316' },
  { id: 'rose', label: 'Rose', primary: '#f43f5e' },
  { id: 'gold', label: 'Gold', primary: '#eab308' },
];

const CHAT_TEMPLATES = [
  { id: 't1', name: 'Code Review', icon: '🔍', messages: [
    { role: 'user' as const, content: 'Please review the following code for bugs, security issues, and improvements:', content_suffix: '' },
  ]},
  { id: 't2', name: 'Debug Helper', icon: '🐛', messages: [
    { role: 'user' as const, content: 'I have this error in my code. Please help me debug it:\n\nError: \n\nCode:\n' },
  ]},
  { id: 't3', name: 'Build a Feature', icon: '🚀', messages: [
    { role: 'user' as const, content: 'Build a complete, working implementation for the following feature:\n' },
  ]},
  { id: 't4', name: 'Explain Concept', icon: '📚', messages: [
    { role: 'user' as const, content: 'Explain the following concept with examples, analogies, and code snippets where relevant:\n' },
  ]},
  { id: 't5', name: 'API Design', icon: '⚡', messages: [
    { role: 'user' as const, content: 'Design a RESTful API for the following use case. Include endpoints, request/response schemas, and authentication approach:\n' },
  ]},
  { id: 't6', name: 'Unit Tests', icon: '✅', messages: [
    { role: 'user' as const, content: 'Write comprehensive unit tests with edge cases for the following code:\n' },
  ]},
];

const DEFAULT_PROMPTS: SavedPrompt[] = [
  { id: 'dp1', title: 'React Component', prompt: 'Create a reusable React component with TypeScript that accepts props for title, description, and an onClick handler.', category: 'Code' },
  { id: 'dp2', title: 'API Endpoint', prompt: 'Write a Node.js/Express REST API endpoint that handles CRUD operations with proper error handling and validation.', category: 'Code' },
  { id: 'dp3', title: 'Explain Code', prompt: 'Explain this code step by step, identify any potential bugs, and suggest improvements:', category: 'Analysis' },
  { id: 'dp4', title: 'Blog Post', prompt: 'Write an engaging blog post about the topic below. Include an introduction, 3 key sections with subheadings, and a conclusion:', category: 'Writing' },
  { id: 'dp5', title: 'SQL Query', prompt: 'Write an optimized SQL query that:', category: 'Code' },
  { id: 'dp6', title: 'Unit Tests', prompt: 'Write comprehensive unit tests for the following code using Jest:', category: 'Code' },
];

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    const id = `${Date.now()}-${Math.random()}`;
    if (isImage) {
      reader.onload = () => resolve({ id, name: file.name, type: 'image', mimeType: file.type, data: reader.result as string, preview: reader.result as string, size: file.size });
      reader.readAsDataURL(file);
    } else {
      if (file.size > 500_000) { reject(new Error(`File "${file.name}" is too large (max 500KB for text files)`)); return; }
      reader.onload = () => resolve({ id, name: file.name, type: 'text', mimeType: file.type || 'text/plain', data: reader.result as string, size: file.size });
      reader.readAsText(file);
    }
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
  });
}

function estimateTokens(text: string): number { return Math.ceil(text.split(/\s+/).length * 1.3); }

function applyTheme(themeId: string) {
  const t = THEMES.find(t => t.id === themeId);
  if (!t) return;
  const r = document.documentElement;
  const hex = t.primary;
  r.style.setProperty('--primary', hex);
  r.style.setProperty('--ring', hex);
  localStorage.setItem('chat_theme', themeId);
}

// ── INLINE CODE ANNOTATION TOOLTIP ─────────────────────────────────────────
function CodeAnnotationTooltip({ code, language }: { code: string; language: string }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const lines = code.split('\n');

  const explainLine = async (line: string, lineNum: number) => {
    if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('#')) return;
    setHoveredLine(lineNum);
    setLoading(true);
    setTooltip(null);
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          userMessage: `In one short sentence (max 15 words), explain what this single line of ${language || 'code'} does: \`${line.trim()}\``,
          history: [], model: undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTooltip(data.content || data.message || 'No explanation available.');
      } else {
        setTooltip('Hover again to get an AI explanation for this line.');
      }
    } catch {
      setTooltip('AI explanation unavailable.');
    }
    setLoading(false);
  };

  return (
    <div className="font-mono text-xs leading-relaxed">
      {lines.map((line, i) => (
        <div
          key={i}
          className="group relative flex items-start hover:bg-primary/5 rounded px-1 cursor-default transition-colors"
          onMouseEnter={() => explainLine(line, i)}
          onMouseLeave={() => { setHoveredLine(null); setTooltip(null); }}
        >
          <span className="select-none text-muted-foreground/40 w-6 shrink-0 text-right mr-3">{i + 1}</span>
          <span className="flex-1 whitespace-pre">{line || ' '}</span>
          {hoveredLine === i && line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#') && (
            <div className="absolute left-8 -top-8 z-50 max-w-xs bg-popover border border-border rounded-lg px-3 py-1.5 shadow-xl text-xs text-foreground pointer-events-none">
              {loading ? <span className="text-muted-foreground animate-pulse">AI explaining…</span> : tooltip}
              <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-popover border-b border-r border-border rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { stream, loading: aiLoading } = useAiStream();

  // ── CORE STATE ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('last_model');
    if (!saved || saved === 'llama-3.3-70b-versatile' || saved === 'mixtral-8x7b-32768' || saved === 'gemma2-9b-it') return AUTO_MODEL_ID;
    return saved;
  });
  const [activeModelInfo, setActiveModelInfo] = useState<StreamModelInfo | null>(null);
  const [temperature, setTemperature] = useState<number>(() => parseFloat(localStorage.getItem('chat_temperature') || '0.7'));
  const [persona, setPersona] = useState<string>('general');
  const [language, setLanguage] = useState('English');
  const [customSystemPrompt, setCustomSystemPrompt] = useState(() => localStorage.getItem('custom_system_prompt') || '');
  const [codeCategory, setCodeCategory] = useState<'frontend' | 'backend' | 'server' | null>(null);
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [lastAttachments, setLastAttachments] = useState<Attachment[]>([]);

  // ── HISTORY / FOLDERS ───────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('ichat_history') || '[]'); } catch { return []; }
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAssignFolder, setShowAssignFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // ── UI PANELS ───────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [miniMode, setMiniMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [promptLibOpen, setPromptLibOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showCurlHelper, setShowCurlHelper] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [commentingIdx, setCommentingIdx] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  // ── PROMPT LIBRARY ──────────────────────────────────────────────────────
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try { return JSON.parse(localStorage.getItem('saved_prompts') || '[]'); } catch { return DEFAULT_PROMPTS; }
  });
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('General');
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [promptCategory, setPromptCategory] = useState('All');

  // ── AI MEMORY ───────────────────────────────────────────────────────────
  const [memory, setMemory] = useState<MemoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('ai_memory') || '[]'); } catch { return []; }
  });
  const [newMemoryFact, setNewMemoryFact] = useState('');

  // ── SCHEDULED PROMPTS ───────────────────────────────────────────────────
  const [scheduledPrompts, setScheduledPrompts] = useState<ScheduledPrompt[]>(() => {
    try { return JSON.parse(localStorage.getItem('scheduled_prompts') || '[]'); } catch { return []; }
  });
  const [newScheduledPrompt, setNewScheduledPrompt] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('09:00');

  // ── GAMIFICATION ────────────────────────────────────────────────────────
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem('usage_streak') || '0'));

  // ── SETTINGS ────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('chat_theme') || 'default');
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [imageGenMode, setImageGenMode] = useState(false);

  // ── LIVE PREVIEW PANEL ──────────────────────────────────────────────────
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [smartPasteChip, setSmartPasteChip] = useState<{ label: string; prompt: string } | null>(null);

  // ── VOICE / TTS ─────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── EDITING ─────────────────────────────────────────────────────────────
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // ── SLASH COMMANDS STATE ─────────────────────────────────────────────────
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuIdx, setSlashMenuIdx] = useState(0);

  // ── IN-CHAT SEARCH ───────────────────────────────────────────────────────
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatSearchIdx, setChatSearchIdx] = useState(0);

  // ── DRAG & DROP ──────────────────────────────────────────────────────────
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── MULTI-FILE PROJECT CONTEXT ───────────────────────────────────────────
  const [projectFiles, setProjectFiles] = useState<Attachment[]>([]);
  const [showProjectContext, setShowProjectContext] = useState(false);

  // ── AGENT AUTONOMOUS MODE ────────────────────────────────────────────────
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [autonomousSteps, setAutonomousSteps] = useState<string[]>([]);
  const [autonomousRunning, setAutonomousRunning] = useState(false);

  // ── KEYBOARD NAVIGATION ──────────────────────────────────────────────────
  const [focusedMsgIdx, setFocusedMsgIdx] = useState<number | null>(null);

  // ── REFS ────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const projectFilesInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatSearchRef = useRef<HTMLInputElement>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── EFFECTS ─────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('ichat_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('saved_prompts', JSON.stringify(savedPrompts)); }, [savedPrompts]);
  useEffect(() => { localStorage.setItem('ai_memory', JSON.stringify(memory)); }, [memory]);
  useEffect(() => { localStorage.setItem('scheduled_prompts', JSON.stringify(scheduledPrompts)); }, [scheduledPrompts]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('last_model', model); }, [model]);
  useEffect(() => { applyTheme(activeTheme); }, [activeTheme]);

  // streak update
  useEffect(() => {
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem('last_usage_day');
    if (lastDay !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const newStreak = lastDay === yesterday.toDateString() ? streak + 1 : 1;
      setStreak(newStreak);
      localStorage.setItem('usage_streak', String(newStreak));
      localStorage.setItem('last_usage_day', today);
    }
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+F — in-chat search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (messages.length > 0) { e.preventDefault(); setShowChatSearch(v => !v); setTimeout(() => chatSearchRef.current?.focus(), 100); }
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); setPromptLibOpen(v => !v); }
        if (e.key === 'k') { e.preventDefault(); startNewChat(); }
        if (e.key === '/') { e.preventDefault(); setShowShortcuts(v => !v); }
        if (e.key === 'm') { e.preventDefault(); setShowMemory(v => !v); }
      }
      if (e.key === 'Escape') {
        if (showChatSearch) { setShowChatSearch(false); setChatSearchQuery(''); }
        if (slashMenuOpen) setSlashMenuOpen(false);
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) setShowShortcuts(v => !v);

      // j/k keyboard navigation through messages
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedMsgIdx(prev => {
          const next = prev === null ? 0 : Math.min(prev + 1, messages.length - 1);
          messageRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return next;
        });
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedMsgIdx(prev => {
          const next = prev === null ? messages.length - 1 : Math.max(prev - 1, 0);
          messageRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return next;
        });
      }
      if (e.key === 'c' && focusedMsgIdx !== null) {
        const msg = messages[focusedMsgIdx];
        if (msg) { navigator.clipboard.writeText(msg.content); toast({ title: 'Copied!' }); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [messages, showChatSearch, slashMenuOpen, focusedMsgIdx]);

  // drag & drop on the main area
  useEffect(() => {
    const area = mainAreaRef.current;
    if (!area) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
    const onDragLeave = () => setIsDraggingOver(false);
    const onDrop = async (e: DragEvent) => {
      e.preventDefault(); setIsDraggingOver(false);
      const files = e.dataTransfer?.files;
      if (files) await handleFiles(files);
    };
    area.addEventListener('dragover', onDragOver);
    area.addEventListener('dragleave', onDragLeave);
    area.addEventListener('drop', onDrop);
    return () => { area.removeEventListener('dragover', onDragOver); area.removeEventListener('dragleave', onDragLeave); area.removeEventListener('drop', onDrop); };
  }, []);

  // ── CONTEXT WINDOW CALCULATION ───────────────────────────────────────────
  const totalContextChars = messages.reduce((acc, m) => acc + m.content.length, 0)
    + projectFiles.reduce((acc, f) => acc + f.data.length, 0);
  const contextPercent = Math.min(100, Math.round((totalContextChars / MAX_CONTEXT_CHARS) * 100));
  const contextColor = contextPercent < 50 ? 'bg-green-500' : contextPercent < 80 ? 'bg-yellow-500' : 'bg-red-500';

  // ── CHAT SEARCH MATCHES ──────────────────────────────────────────────────
  const chatSearchMatches = chatSearchQuery.trim()
    ? messages.reduce<number[]>((acc, m, i) => {
        if (m.content.toLowerCase().includes(chatSearchQuery.toLowerCase())) acc.push(i);
        return acc;
      }, [])
    : [];

  // ── AUTO TITLE ───────────────────────────────────────────────────────────
  const autoTitle = async (firstMsg: string): Promise<string> => {
    try {
      const res = await fetch('/api/chat/auto-title', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ firstMessage: firstMsg }),
      });
      if (res.ok) { const d = await res.json(); return d.title || firstMsg.slice(0, 40); }
    } catch {}
    return firstMsg.slice(0, 40);
  };

  // ── SHARE CHAT ───────────────────────────────────────────────────────────
  const shareChat = async () => {
    if (messages.length === 0) { toast({ title: 'No messages to share' }); return; }
    try {
      const res = await fetch('/api/chat/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title: history.find(h => h.id === activeChatId)?.title || 'Chat', messages }),
      });
      if (res.ok) {
        const d = await res.json();
        const link = `${window.location.origin}${d.url}`;
        setShareLink(link);
        setShowShareModal(true);
      }
    } catch { toast({ title: 'Failed to create share link', variant: 'destructive' }); }
  };

  // ── BRANCH CHAT ──────────────────────────────────────────────────────────
  const branchChat = async (upToIdx: number) => {
    const branchedMessages = messages.slice(0, upToIdx + 1);
    const branchedId = `${Date.now()}-branch`;
    const firstMsg = branchedMessages.find(m => m.role === 'user')?.content || 'Branch';
    const title = await autoTitle(firstMsg + ' (branch)');
    const newChat: HistoryItem = { id: branchedId, title, messages: branchedMessages, createdAt: Date.now() };
    setHistory(prev => [newChat, ...prev]);
    setMessages(branchedMessages);
    setActiveChatId(branchedId);
    toast({ title: '🌿 Branched chat created!' });
  };

  // ── RATE MESSAGE ─────────────────────────────────────────────────────────
  const rateMessage = (idx: number, rating: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, rating } : m));
    if (activeChatId) {
      setHistory(prev => prev.map(h => h.id === activeChatId
        ? { ...h, messages: h.messages.map((m, i) => i === idx ? { ...m, rating } : m) }
        : h
      ));
    }
  };

  // ── ADD COMMENT ──────────────────────────────────────────────────────────
  const saveComment = (idx: number) => {
    if (!commentText.trim()) { setCommentingIdx(null); return; }
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, comment: commentText.trim() } : m));
    setCommentingIdx(null);
    setCommentText('');
    toast({ title: 'Comment saved!' });
  };

  // ── MEMORY ───────────────────────────────────────────────────────────────
  const addMemory = () => {
    if (!newMemoryFact.trim()) return;
    const item: MemoryItem = { id: Date.now().toString(), fact: newMemoryFact.trim() };
    setMemory(prev => [...prev, item]);
    setNewMemoryFact('');
    toast({ title: '🧠 Memory saved!' });
  };
  const deleteMemory = (id: string) => setMemory(prev => prev.filter(m => m.id !== id));

  // ── SCHEDULED PROMPTS ────────────────────────────────────────────────────
  const addScheduledPrompt = () => {
    if (!newScheduledPrompt.trim()) return;
    const sp: ScheduledPrompt = { id: Date.now().toString(), prompt: newScheduledPrompt.trim(), time: newScheduledTime, model, enabled: true };
    setScheduledPrompts(prev => [...prev, sp]);
    setNewScheduledPrompt('');
    toast({ title: `⏰ Scheduled for ${newScheduledTime}` });
  };

  // ── EMBED CODE ───────────────────────────────────────────────────────────
  const getEmbedCode = () => {
    return `<iframe
  src="${window.location.origin}/"
  width="400"
  height="600"
  style="border:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2)"
  title="ZorvixAI Chat"
></iframe>`;
  };

  // ── CURL HELPER ──────────────────────────────────────────────────────────
  const getCurlCommand = () => {
    const lastMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || 'Hello';
    return `curl -X POST ${window.location.origin}/api/chat/message \\
  -H "Content-Type: application/json" \\
  -d '{
    "userMessage": "${lastMsg.replace(/"/g, '\\"').slice(0, 100)}",
    "history": [],
    "model": "${model}"
  }'`;
  };

  // ── AUTONOMOUS MODE ──────────────────────────────────────────────────────
  const runAutonomous = async (goal: string) => {
    setAutonomousRunning(true);
    setAutonomousSteps([]);
    const steps: string[] = [];

    const addStep = (step: string) => {
      steps.push(step);
      setAutonomousSteps([...steps]);
    };

    try {
      addStep(`🎯 Goal: ${goal}`);
      addStep('🔍 Analyzing task and planning steps...');

      // Step 1: Plan
      const planRes = await fetch('/api/chat/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          userMessage: `You are an autonomous AI agent. Break down this task into 3-5 numbered steps, then immediately execute step 1:\n\nTask: ${goal}`,
          history: [],
        }),
      });
      const planData = await planRes.json();
      const plan = planData.content || planData.message || '';
      addStep(`📋 Plan ready — executing...`);

      const planMsg: ChatMessage = { role: 'assistant', content: `**🤖 Autonomous Mode — Starting task**\n\n${plan}` };
      setMessages(prev => [...prev, { role: 'user', content: goal }, planMsg]);

      // Step 2: Execute
      addStep('⚙️ Executing task autonomously...');
      await new Promise(r => setTimeout(r, 800));

      const execRes = await fetch('/api/chat/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          userMessage: `Continue and complete all remaining steps for this task. Provide the complete solution:\n\nTask: ${goal}\n\nPrevious planning:\n${plan}`,
          history: [{ role: 'user', content: goal }, { role: 'assistant', content: plan }],
        }),
      });
      const execData = await execRes.json();
      const result = execData.content || execData.message || '';

      addStep('✅ Task complete!');
      const resultMsg: ChatMessage = { role: 'assistant', content: result };
      setMessages(prev => [...prev, resultMsg]);

      if (activeChatId) {
        setHistory(prev => prev.map(h => h.id === activeChatId
          ? { ...h, messages: [...h.messages, { role: 'user', content: goal }, planMsg, resultMsg] }
          : h
        ));
      } else {
        const id = Date.now().toString();
        const title = await autoTitle(goal);
        setHistory(prev => [{ id, title, messages: [{ role: 'user', content: goal }, planMsg, resultMsg], createdAt: Date.now() }, ...prev]);
        setActiveChatId(id);
      }
    } catch (err) {
      addStep('❌ Error during autonomous execution');
      toast({ title: 'Autonomous mode failed', variant: 'destructive' });
    }
    setAutonomousRunning(false);
  };

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, atts: Attachment[] = attachments) => {
    // Expand slash commands
    let processedText = text.trim();
    for (const sc of SLASH_COMMANDS) {
      if (processedText.startsWith(sc.cmd)) {
        processedText = sc.expand(processedText);
        break;
      }
    }

    const trimmed = processedText;
    if (!trimmed && atts.length === 0) return;
    if (aiLoading) return;

    // Autonomous mode
    if (autonomousMode && trimmed) {
      setInput(''); setAttachments([]);
      await runAutonomous(trimmed);
      return;
    }

    setLastUserMessage(trimmed);
    setLastAttachments(atts);
    setFollowUpSuggestions([]);
    setSmartPasteChip(null);

    // Image generation mode
    if (imageGenMode && trimmed) {
      const userMsg: ChatMessage = { role: 'user', content: trimmed, attachments: atts.map(a => ({ name: a.name, type: a.type, preview: a.preview })) };
      setMessages(prev => [...prev, userMsg]);
      setInput(''); setAttachments([]);
      const loadingMsg: ChatMessage = { role: 'assistant', content: '🎨 Generating image...' };
      setMessages(prev => [...prev, loadingMsg]);
      try {
        const res = await fetch('/api/chat/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ prompt: trimmed }) });
        const data = await res.json();
        if (data.imageData) {
          const imgMsg: ChatMessage = { role: 'assistant', content: `![Generated Image](data:${data.mimeType};base64,${data.imageData})\n\n*Generated image for: "${trimmed}"*`, isImage: true };
          setMessages(prev => [...prev.slice(0, -1), imgMsg]);
        } else throw new Error('No image data');
      } catch { setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Image generation failed. Please try again.' }]); }
      return;
    }

    // Web search mode
    let enhancedText = trimmed;
    if (webSearchMode) {
      try {
        const sRes = await fetch('/api/chat/websearch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: trimmed }) });
        if (sRes.ok) { const sd = await sRes.json(); enhancedText = `[Web Search Results]\n${sd.answer}\n\n[User Question]\n${trimmed}`; }
      } catch {}
    }

    // Agent build check
    if (isAgentBuildRequest(trimmed)) { setAgentPrompt(trimmed); return; }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, attachments: atts.map(a => ({ name: a.name, type: a.type, preview: a.preview })) };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput(''); setAttachments([]);

    const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantPlaceholder]);

    const hist = newMessages.slice(-10).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const provider = getModelProvider(model);
    const openaiApiKey = provider === 'openai' ? (localStorage.getItem('openai_api_key') ?? undefined) : undefined;

    // Build system prompt with memory + multi-file project context
    const memoryContext = memory.length > 0 ? `\n\nUser Memory Facts:\n${memory.map(m => `- ${m.fact}`).join('\n')}` : '';
    const projectContext = projectFiles.length > 0
      ? `\n\nProject Files Context:\n${projectFiles.map(f => `\`\`\`${f.name}\n${f.data}\n\`\`\``).join('\n\n')}`
      : '';
    const langInstruction = language !== 'English' ? `\nRespond in ${language}.` : '';
    const personaContext = persona === 'coder' ? '\nYou are in Coder mode — prioritize code solutions.' : persona === 'teacher' ? '\nYou are in Teacher mode — explain concepts clearly with examples.' : persona === 'writer' ? '\nYou are in Writer mode — focus on writing quality and creativity.' : '';
    const categoryContext = codeCategory === 'frontend'
      ? '\nYou are answering a FRONTEND question. Focus ONLY on Frontend (HTML/CSS/JS/React/UI). Give a complete, self-contained answer for the frontend layer. Do not include backend or server code.'
      : codeCategory === 'backend'
      ? '\nYou are answering a BACKEND question. Focus ONLY on Backend (Node.js/Python/databases/APIs/business logic). Give a complete, self-contained answer for the backend layer. Do not include frontend UI code.'
      : codeCategory === 'server'
      ? '\nYou are answering a SERVER question. Focus ONLY on Server/DevOps topics (server config, deployment, hosting, nginx, docker, environment setup). Give a complete, self-contained answer.'
      : '';
    const finalSystemPrompt = (customSystemPrompt || '') + memoryContext + projectContext + langInstruction + personaContext + categoryContext;

    const modelToSend = model === AUTO_MODEL_ID ? undefined : model;

    stream(
      { userMessage: webSearchMode ? enhancedText : trimmed, history: hist.slice(0, -1), attachments: atts, model: modelToSend, temperature, systemPrompt: finalSystemPrompt || undefined, ...(openaiApiKey ? { openaiApiKey } : {}) },
      {
        onModelInfo: (info) => {
          setActiveModelInfo(info);
        },
        onChunk: (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        },
        onFinish: async (fullText) => {
          const finalMessages = [...newMessages, { role: 'assistant' as const, content: fullText }];
          setMessages(finalMessages);
          setFollowUpSuggestions(generateFollowUps(fullText));
          let chatId = activeChatId;
          if (!chatId) {
            chatId = Date.now().toString();
            const title = await autoTitle(trimmed);
            const newChat: HistoryItem = { id: chatId, title, messages: finalMessages, pinned: false, tags: [], folder: activeFolder || undefined, createdAt: Date.now() };
            setHistory(prev => [newChat, ...prev]);
            setActiveChatId(chatId);
          } else {
            setHistory(prev => prev.map(h => h.id === chatId ? { ...h, messages: finalMessages } : h));
          }
        },
        onError: (err) => {
          const errMsg = err?.message || 'Something went wrong.';
          setMessages(prev => { const u = [...prev]; if (u[u.length-1]?.role==='assistant' && !u[u.length-1].content) u[u.length-1] = { role: 'assistant', content: `Error: ${errMsg}` }; return u; });
          toast({ title: 'Error', description: errMsg, variant: 'destructive' });
        },
      }
    );
  }, [messages, input, attachments, model, aiLoading, temperature, customSystemPrompt, activeChatId, imageGenMode, webSearchMode, memory, persona, language, activeFolder, stream, toast, projectFiles, autonomousMode]);

  // ── REGENERATE ──────────────────────────────────────────────────────────
  const regenerate = () => {
    if (!lastUserMessage) return;
    const trimmed = messages.findLastIndex(m => m.role === 'assistant');
    if (trimmed >= 0) setMessages(prev => prev.slice(0, trimmed));
    setTimeout(() => sendMessage(lastUserMessage, lastAttachments), 50);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copied!' }); };

  const saveCodeFromMessage = async (content: string) => {
    const filePattern = /===FILE:\s*([^\n=]+?)===\n?([\s\S]*?)(?====FILE:|$)/g;
    const fileBlocks: { name: string; content: string }[] = [];
    let match;
    while ((match = filePattern.exec(content)) !== null) {
      const name = match[1].trim();
      const text = match[2].trim();
      if (name && text) fileBlocks.push({ name, content: text });
    }
    if (fileBlocks.length > 1) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const f of fileBlocks) zip.file(f.name, f.content);
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'ai-generated-files.zip'; a.click(); URL.revokeObjectURL(url);
        toast({ title: `Downloaded ${fileBlocks.length} files as ZIP` });
      } catch { toast({ title: 'Failed to create ZIP', variant: 'destructive' }); }
      return;
    }
    if (fileBlocks.length === 1) {
      const blob = new Blob([fileBlocks[0].content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileBlocks[0].name; a.click(); URL.revokeObjectURL(url);
      toast({ title: `Saved ${fileBlocks[0].name}` });
      return;
    }
    const codeMatch = content.match(/```(?:\w+)?\n([\s\S]+?)```/);
    if (codeMatch) {
      const langMatch = content.match(/```(\w+)/);
      const ext = langMatch ? { javascript:'js', typescript:'ts', python:'py', html:'html', css:'css', json:'json', bash:'sh', shell:'sh' }[langMatch[1]] || 'txt' : 'txt';
      const filename = window.prompt('Save as filename:', `code.${ext}`) || `code.${ext}`;
      const blob = new Blob([codeMatch[1]], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      toast({ title: `Saved ${filename}` });
    } else {
      toast({ title: 'No code found in this message', variant: 'destructive' });
    }
  };

  const openPreview = (html: string) => {
    setPreviewContent(html);
    setShowPreviewPanel(true);
  };

  const handleSmartPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.length < 80) { setSmartPasteChip(null); return; }
    const codePatterns = [
      /^\s*(function|const|let|var|class|import|export|def |if |for |while )/m,
      /[{};]\s*$/m,
      /^\s{2,}/m,
      /<\/?[a-z][a-z0-9]*[\s>]/i,
      /SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i,
    ];
    const looksLikeCode = codePatterns.some(p => p.test(pasted));
    if (looksLikeCode) {
      const isHTML = /<html|<body|<div|<script/i.test(pasted);
      const isPython = /def |import |print\(/.test(pasted);
      const isSQL = /SELECT|INSERT|CREATE TABLE/i.test(pasted);
      const label = isHTML ? 'Preview this HTML →' : isPython ? 'Explain this Python →' : isSQL ? 'Explain this SQL →' : 'Analyze this code →';
      const prompt = isHTML
        ? `Explain and review this HTML:\n\`\`\`html\n${pasted}\n\`\`\``
        : isPython
        ? `Explain and review this Python code:\n\`\`\`python\n${pasted}\n\`\`\``
        : isSQL
        ? `Explain this SQL query:\n\`\`\`sql\n${pasted}\n\`\`\``
        : `Explain and review this code:\n\`\`\`\n${pasted}\n\`\`\``;
      setSmartPasteChip({ label, prompt });
    } else {
      setSmartPasteChip(null);
    }
  };

  const generateFollowUps = (content: string): string[] => {
    const hasHTML = /```html/i.test(content);
    const hasJS = /```(?:javascript|js|typescript|ts)/i.test(content);
    const hasPython = /```python/i.test(content);
    const hasCss = /```css/i.test(content);
    const hasCode = content.includes('```');
    const lower = content.toLowerCase();
    const hasError = lower.includes('error') || lower.includes('bug') || lower.includes('exception') || lower.includes('fix');
    const hasExplanation = lower.includes('in simple terms') || lower.includes('this means') || lower.includes('concept');
    const hasSteps = lower.includes('step 1') || lower.includes('first,') || lower.includes('follow these');

    if (hasHTML) return ['Make it mobile responsive', 'Add smooth CSS animations', 'Add a dark mode toggle'];
    if (hasJS && hasCss) return ['Add interactivity to the UI', 'Make it responsive', 'Add a loading animation'];
    if (hasJS) return ['Add error handling', 'Write unit tests for this', 'Optimize performance'];
    if (hasPython) return ['Add type hints and docstrings', 'Handle edge cases', 'Convert to async/await'];
    if (hasError) return ['How do I prevent this in the future?', 'Show the complete working solution', 'Explain the root cause'];
    if (hasSteps) return ['Show me the full code', 'What could go wrong?', 'How do I test this?'];
    if (hasExplanation) return ['Give me a hands-on example', 'How do I implement this?', 'What are the tradeoffs?'];
    if (hasCode) return ['Add more comments to explain', 'Show example usage', 'What edge cases should I handle?'];
    return ['Explain with a real example', 'How do I get started?', 'What should I do next?'];
  };

  const exportMarkdown = () => {
    const lines = [`# ZorvixAI Chat Export\n_${new Date().toLocaleString()}_\n`];
    messages.forEach(m => { lines.push(`\n## ${m.role === 'user' ? '👤 You' : '🤖 ZorvixAI'}\n`); lines.push(m.content); });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `zorvixai-chat-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  const startEditing = (idx: number, content: string) => { setEditingIdx(idx); setEditingText(content); };
  const cancelEditing = () => { setEditingIdx(null); setEditingText(''); };
  const saveEdit = () => {
    if (editingIdx === null || !editingText.trim()) return;
    const updatedMessages = messages.slice(0, editingIdx + 1).map((m, i) => i === editingIdx ? { ...m, content: editingText.trim() } : m);
    setMessages(updatedMessages); setEditingIdx(null); setEditingText('');
    setTimeout(() => {
      const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' };
      setMessages([...updatedMessages, assistantPlaceholder]);
      const hist = updatedMessages.slice(-10).map(m => ({ role: m.role as 'user'|'assistant', content: m.content }));
      const provider = getModelProvider(model);
      const openaiApiKey = provider === 'openai' ? (localStorage.getItem('openai_api_key') ?? undefined) : undefined;
      const editModelToSend = model === AUTO_MODEL_ID ? undefined : model;
      stream({ userMessage: editingText.trim(), history: hist.slice(0,-1), attachments: [], model: editModelToSend, temperature, systemPrompt: customSystemPrompt||undefined, ...(openaiApiKey?{openaiApiKey}:{}) }, {
        onModelInfo: (info) => setActiveModelInfo(info),
        onChunk: (chunk) => setMessages(prev => { const u=[...prev]; const l=u[u.length-1]; if(l?.role==='assistant') u[u.length-1]={...l,content:l.content+chunk}; return u; }),
        onFinish: (fullText) => {
          const fm = [...updatedMessages, {role:'assistant' as const, content:fullText}];
          setMessages(fm);
          if(activeChatId) setHistory(prev => prev.map(h => h.id===activeChatId?{...h,messages:fm}:h));
        },
        onError: () => toast({ title: 'Failed to regenerate', variant: 'destructive' }),
      });
    }, 100);
  };

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g,'code block').replace(/[#*`]/g,''));
      utterance.rate = 1; utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else toast({ title: 'TTS not supported', variant: 'destructive' });
  };

  const startVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: 'Voice input not supported', variant: 'destructive' }); return; }
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); return; }
    const recognition = new SR(); recognitionRef.current = recognition;
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(prev => prev + (prev ? ' ' : '') + t); };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone permission in your browser settings.',
        'no-speech': 'No speech detected. Please speak clearly and try again.',
        'network': 'Network error. Voice input requires an internet connection.',
        'audio-capture': 'No microphone found. Please connect a microphone and try again.',
        'aborted': 'Voice input was cancelled.',
        'service-not-allowed': 'Voice input is not allowed. Try using HTTPS or check browser permissions.',
      };
      const description = errorMessages[e?.error] || (e?.error ? `Error: ${e.error}` : 'Could not access microphone. Please check permissions.');
      toast({ title: 'Voice input error', description, variant: 'destructive' });
    };
    recognition.start();
  };

  const saveCurrentPrompt = () => {
    if (!newPromptText.trim() || !newPromptTitle.trim()) { toast({ title: 'Fill in title and prompt', variant: 'destructive' }); return; }
    setSavedPrompts(prev => [...prev, { id: Date.now().toString(), title: newPromptTitle.trim(), prompt: newPromptText.trim(), category: newPromptCategory }]);
    setNewPromptTitle(''); setNewPromptText('');
    toast({ title: 'Prompt saved!' });
  };

  const saveInputAsPrompt = () => {
    if (!input.trim()) { toast({ title: 'Type a prompt first' }); return; }
    const title = input.trim().slice(0, 40) + (input.trim().length > 40 ? '…' : '');
    setSavedPrompts(prev => [{ id: Date.now().toString(), title, prompt: input.trim(), category: 'My Prompts' }, ...prev]);
    toast({ title: 'Prompt saved!' });
  };

  // ── SLASH COMMAND INPUT HANDLER ──────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val === '') { setSmartPasteChip(null); setSlashMenuOpen(false); return; }
    // Slash command detection
    if (val.startsWith('/')) {
      const query = val.slice(1).toLowerCase();
      setSlashFilter(query);
      setSlashMenuOpen(true);
      setSlashMenuIdx(0);
    } else {
      setSlashMenuOpen(false);
    }
  };

  const filteredSlashCommands = slashMenuOpen
    ? SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().includes('/' + slashFilter) || c.label.toLowerCase().includes(slashFilter) || c.desc.toLowerCase().includes(slashFilter))
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashMenuIdx(i => Math.min(i + 1, filteredSlashCommands.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashMenuIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const chosen = filteredSlashCommands[slashMenuIdx];
        if (chosen) { setInput(chosen.cmd + ' '); setSlashMenuOpen(false); textareaRef.current?.focus(); }
        return;
      }
      if (e.key === 'Escape') { setSlashMenuOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try { const att = await fileToAttachment(file); setAttachments(prev => [...prev, att]); }
      catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    }
  };

  const handleProjectFiles = async (files: FileList | null) => {
    if (!files) return;
    const newFiles: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const att = await fileToAttachment(file);
        newFiles.push(att);
      } catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    }
    setProjectFiles(prev => [...prev, ...newFiles]);
    toast({ title: `Added ${newFiles.length} file(s) to project context` });
  };

  const startNewChat = () => { setMessages([]); setActiveChatId(null); setInput(''); setAttachments([]); setLastUserMessage(''); setLastAttachments([]); setEditingIdx(null); setFocusedMsgIdx(null); };

  const loadChat = (chat: HistoryItem) => { setMessages(chat.messages); setActiveChatId(chat.id); };
  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    if (activeChatId === id) { setMessages([]); setActiveChatId(null); }
  };
  const togglePin = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setHistory(prev => prev.map(h => h.id === id ? { ...h, pinned: !h.pinned } : h)); };
  const assignFolder = (id: string, folder: string) => { setHistory(prev => prev.map(h => h.id === id ? { ...h, folder } : h)); setShowAssignFolder(false); };

  // ── FILTERED HISTORY ────────────────────────────────────────────────────
  const allFolders = [...new Set(history.map(h => h.folder).filter(Boolean))] as string[];
  const filteredHistory = history.filter(h => {
    const matchesSearch = !searchQuery || h.title.toLowerCase().includes(searchQuery.toLowerCase()) || h.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = activeFolder === null || h.folder === activeFolder || (activeFolder === '__none__' && !h.folder);
    return matchesSearch && matchesFolder;
  });
  const pinnedChats = filteredHistory.filter(h => h.pinned);
  const recentChats = filteredHistory.filter(h => !h.pinned);
  const isEmpty = messages.length === 0;
  const currentPersona = PERSONAS.find(p => p.id === persona)!;
  const filteredPrompts = savedPrompts.filter(p =>
    (promptCategory === 'All' || p.category === promptCategory) &&
    (!promptSearchQuery || p.title.toLowerCase().includes(promptSearchQuery.toLowerCase()) || p.prompt.toLowerCase().includes(promptSearchQuery.toLowerCase()))
  );
  const promptCategories = ['All', ...Array.from(new Set(savedPrompts.map(p => p.category)))];

  // ── MINI MODE ───────────────────────────────────────────────────────────
  if (miniMode) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">ZorvixAI</span></div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMiniMode(false)}><Maximize2 className="w-3 h-3" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.slice(-4).map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role==='user'?'justify-end':''}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.role==='user'?'bg-primary text-white':'bg-muted'}`}>{m.content.slice(0,200)}{m.content.length>200?'…':''}</div>
            </div>
          ))}
          {isEmpty && <p className="text-xs text-muted-foreground text-center mt-4">Start chatting...</p>}
        </div>
        <div className="p-2 border-t border-border">
          <div className="flex gap-1">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);}}} placeholder="Ask anything..." className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            <Button size="icon" className="h-7 w-7 shrink-0 bg-primary" onClick={() => sendMessage(input)} disabled={aiLoading || !input.trim()}>{aiLoading?<Loader2 className="w-3 h-3 animate-spin"/>:<Send className="w-3 h-3"/>}</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT HISTORY ITEM ───────────────────────────────────────────────────
  const ChatHistoryItem = ({ chat, active, onLoad, onDelete, onPin, onFolder }: { chat: HistoryItem; active: boolean; onLoad: (c: HistoryItem)=>void; onDelete: (id: string, e: React.MouseEvent)=>void; onPin: (id: string, e: React.MouseEvent)=>void; onFolder: (id: string)=>void; }) => (
    <div onClick={() => onLoad(chat)} className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'}`}>
      {chat.pinned && <Pin className="w-2.5 h-2.5 shrink-0 text-primary/70" />}
      <span className="flex-1 text-xs truncate">{chat.title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => onPin(chat.id, e)} className="p-0.5 rounded hover:text-primary" title="Pin"><Pin className="w-2.5 h-2.5"/></button>
        <button onClick={(e) => onDelete(chat.id, e)} className="p-0.5 rounded hover:text-destructive" title="Delete"><Trash2 className="w-2.5 h-2.5"/></button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* ── PROMPT LIBRARY MODAL ───────────────────────────────────────── */}
      {promptLibOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPromptLibOpen(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><BookMarked className="w-5 h-5 text-primary" /><h2 className="font-semibold">Prompt Library</h2></div>
              <button onClick={() => setPromptLibOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 border-b border-border space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Save New Prompt</p>
              <div className="flex gap-2">
                <input value={newPromptTitle} onChange={e=>setNewPromptTitle(e.target.value)} placeholder="Prompt title..." className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <select value={newPromptCategory} onChange={e=>setNewPromptCategory(e.target.value)} className="bg-muted border border-border rounded-lg px-2 py-2 text-sm focus:outline-none">
                  {['General','Code','Writing','Analysis','My Prompts'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <textarea value={newPromptText} onChange={e=>setNewPromptText(e.target.value)} placeholder="Enter your prompt..." rows={2} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                <Button size="sm" onClick={saveCurrentPrompt} className="shrink-0"><Save className="w-3.5 h-3.5 mr-1"/>Save</Button>
              </div>
            </div>
            <div className="p-3 border-b border-border">
              <div className="relative"><Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={promptSearchQuery} onChange={e=>setPromptSearchQuery(e.target.value)} placeholder="Search prompts..." className="w-full pl-9 pr-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" /></div>
            </div>
            <div className="p-3 border-b border-border flex gap-2 flex-wrap">
              {promptCategories.map(c=><button key={c} onClick={()=>setPromptCategory(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${promptCategory===c?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{c}</button>)}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPrompts.map(p => (
                <div key={p.id} className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { setInput(p.prompt); setPromptLibOpen(false); setTimeout(() => textareaRef.current?.focus(), 100); }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium">{p.title}</span><span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">{p.category}</span></div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.prompt}</p>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setSavedPrompts(prev=>prev.filter(sp=>sp.id!==p.id));}} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              ))}
              {filteredPrompts.length===0&&<p className="text-center text-sm text-muted-foreground py-4">No prompts found</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES MODAL ─────────────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-primary" /><h2 className="font-semibold">Chat Templates</h2></div>
              <button onClick={() => setShowTemplates(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {CHAT_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setInput(t.messages[0].content); setShowTemplates(false); setTimeout(() => textareaRef.current?.focus(), 100); }} className="p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left">
                  <span className="text-xl mb-2 block">{t.icon}</span>
                  <span className="text-sm font-medium block">{t.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.messages[0].content.slice(0, 60)}…</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMORY MODAL ────────────────────────────────────────────────── */}
      {showMemory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowMemory(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /><h2 className="font-semibold">AI Memory</h2></div>
              <button onClick={() => setShowMemory(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Facts you save here are automatically added to every conversation as context.</p>
              <div className="flex gap-2">
                <input value={newMemoryFact} onChange={e=>setNewMemoryFact(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addMemory();}} placeholder="Add a fact about you or your project..." className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <Button size="sm" onClick={addMemory}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {memory.map(m => (
                  <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                    <p className="flex-1 text-sm">{m.fact}</p>
                    <button onClick={() => deleteMemory(m.id)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {memory.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No memories yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROJECT CONTEXT MODAL ────────────────────────────────────────── */}
      {showProjectContext && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProjectContext(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" /><h2 className="font-semibold">Multi-File Project Context</h2></div>
              <button onClick={() => setShowProjectContext(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">Upload your entire project folder. All files will be sent as context to the AI, so it understands your full codebase.</p>
              <div
                onClick={() => projectFilesInputRef.current?.click()}
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Click to upload project files</p>
                <p className="text-xs text-muted-foreground">Select multiple files (JS, TS, Python, CSS, JSON, etc.)</p>
                <input ref={projectFilesInputRef} type="file" multiple accept=".js,.ts,.jsx,.tsx,.py,.css,.html,.json,.md,.txt,.yaml,.yml,.env.example" className="hidden" onChange={e => { handleProjectFiles(e.target.files); e.target.value = ''; }} />
              </div>
              {projectFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{projectFiles.length} file(s) in context</p>
                  {projectFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="flex-1 text-xs truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)}KB</span>
                      <button onClick={() => setProjectFiles(prev => prev.filter(p => p.id !== f.id))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => setProjectFiles([])} className="text-xs text-destructive/70 hover:text-destructive">Clear all files</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AUTONOMOUS MODE PANEL ────────────────────────────────────────── */}
      {autonomousMode && autonomousSteps.length > 0 && (
        <div className="fixed bottom-24 right-4 z-40 w-72 bg-card border border-primary/30 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className={`w-3.5 h-3.5 text-primary ${autonomousRunning ? 'animate-spin' : ''}`} />
              <span className="text-xs font-semibold text-primary">Autonomous Mode</span>
            </div>
            {!autonomousRunning && <button onClick={() => setAutonomousSteps([])} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
          </div>
          <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {autonomousSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{i + 1}.</span>
                <span className="text-xs">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ──────────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" /><h2 className="font-semibold">Share Chat</h2></div>
              <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Anyone with this link can view this conversation:</p>
              <div className="flex gap-2">
                <input readOnly value={shareLink} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm" />
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(shareLink); toast({ title: 'Link copied!' }); }}>Copy</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW PANEL ────────────────────────────────────────────────── */}
      {showPreviewPanel && previewContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPreviewPanel(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">Live Preview</span></div>
              <button onClick={() => setShowPreviewPanel(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <iframe srcDoc={previewContent} className="flex-1 rounded-b-xl" sandbox="allow-scripts" title="Preview" />
          </div>
        </div>
      )}

      {/* ── AGENT BUILDER ────────────────────────────────────────────────── */}
      {agentPrompt && <AgentBuilder prompt={agentPrompt} onClose={() => setAgentPrompt(null)} />}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="w-60 shrink-0 border-r border-border/50 bg-card/80 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="p-3 border-b border-border/30 flex items-center gap-2">
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-sm font-semibold flex-1">Chats</span>
            <button onClick={startNewChat} className="text-muted-foreground hover:text-primary transition-colors" title="New chat"><Plus className="w-4 h-4"/></button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats…" className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Sidebar quick actions */}
          <div className="px-3 py-1.5 border-b border-border/30 flex flex-wrap gap-1">
            {[
              { icon: BookMarked, label: 'Prompts', action: () => setPromptLibOpen(true) },
              { icon: LayoutTemplate, label: 'Templates', action: () => setShowTemplates(true) },
              { icon: Brain, label: 'Memory', action: () => setShowMemory(true) },
              { icon: FolderOpen, label: 'Project', action: () => setShowProjectContext(true) },
            ].map(a => (
              <button key={a.label} onClick={a.action} title={a.label} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                <a.icon className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Folder management */}
          <div className="px-3 py-1.5 border-b border-border/30">
            {showFolderInput ? (
              <div className="flex gap-1">
                <input value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newFolderName.trim()){activeChatId&&assignFolder(activeChatId,newFolderName.trim());setShowFolderInput(false);setNewFolderName('');toast({title:`📁 Folder "${newFolderName}" created!`});}}} placeholder="Folder name..." autoFocus className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={()=>setShowFolderInput(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
              </div>
            ) : (
              <button onClick={()=>setShowFolderInput(true)} className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5">
                <FolderPlus className="w-3 h-3"/><span>New Folder</span>
              </button>
            )}
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {pinnedChats.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs text-muted-foreground/60 uppercase tracking-wider font-medium flex items-center gap-1"><Pin className="w-2.5 h-2.5"/>Pinned</p>
                {pinnedChats.map(c=><ChatHistoryItem key={c.id} chat={c} active={activeChatId===c.id} onLoad={loadChat} onDelete={deleteChat} onPin={togglePin} onFolder={(id)=>{ if(allFolders.length>0){const f=allFolders[0];assignFolder(id,f);} else setShowFolderInput(true);}} />)}
              </div>
            )}
            {recentChats.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">Recent</p>
                {recentChats.map(c=><ChatHistoryItem key={c.id} chat={c} active={activeChatId===c.id} onLoad={loadChat} onDelete={deleteChat} onPin={togglePin} onFolder={(id)=>{ if(allFolders.length>0){const f=allFolders[0];assignFolder(id,f);} else setShowFolderInput(true);}} />)}
              </div>
            )}
            {filteredHistory.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">{searchQuery ? 'No matching chats' : 'No chats yet. Start a conversation!'}</div>
            )}
          </div>

          {/* Page navigation */}
          <div className="px-3 py-2 border-t border-border/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5">Navigate</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { icon: FolderKanban, label: 'Dashboard', path: '/projects', color: 'hover:text-primary' },
                { icon: Monitor, label: 'Workspace', path: '/projects', color: 'hover:text-blue-400' },
                { icon: Wand2, label: 'Prompt Gen', path: '/prompt-generator', color: 'hover:text-violet-400' },
                { icon: Globe, label: 'Explore', path: '/explore', color: 'hover:text-teal-400' },
                { icon: Play, label: 'Playground', path: '/playground', color: 'hover:text-green-400' },
                { icon: LayoutTemplate, label: 'Templates', path: '/templates', color: 'hover:text-yellow-400' },
                { icon: GitCompare, label: 'Compare', path: '/compare', color: 'hover:text-pink-400' },
                { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'hover:text-cyan-400' },
                { icon: Hash, label: 'Usage', path: '/usage', color: 'hover:text-indigo-400' },
                { icon: Terminal, label: 'Developer', path: '/developer', color: 'hover:text-emerald-400' },
                { icon: Settings, label: 'Settings', path: '/settings', color: 'hover:text-muted-foreground' },
                { icon: Shield, label: 'Admin', path: '/admin', color: 'hover:text-orange-400' },
                { icon: Grid3X3, label: 'Our Apps', path: '/our-apps', color: 'hover:text-purple-400' },
                { icon: Info, label: 'About', path: '/about', color: 'hover:text-blue-300' },
                { icon: Mail, label: 'Contact', path: '/contact', color: 'hover:text-rose-400' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground ${item.color} hover:bg-muted/60 transition-colors text-left w-full`}
                >
                  <item.icon className="w-3 h-3 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User footer */}
          {user && (
            <div className="p-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button onClick={async()=>{await logout();setLocation('/login');}} className="text-muted-foreground hover:text-destructive transition-colors"><LogOut className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── MAIN AREA ────────────────────────────────────────────────────── */}
      <main ref={mainAreaRef} className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${isDraggingOver ? 'ring-2 ring-primary ring-inset' : ''}`}>
        {/* Drag & Drop overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-card border-2 border-dashed border-primary rounded-2xl px-12 py-8 text-center">
              <Paperclip className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold text-primary">Drop files here</p>
              <p className="text-sm text-muted-foreground mt-1">Images and text files supported</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 shrink-0">
          {!sidebarOpen && (
            <button onClick={()=>setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors"><Menu className="w-4 h-4"/></button>
          )}
          <ModelSelector value={model} onChange={(m) => { setModel(m); localStorage.setItem('last_model', m); }} />
          <div className="flex items-center gap-1 ml-auto">
            {/* Personas */}
            <div className="flex items-center gap-1 mr-2">
              {PERSONAS.map(p=>(
                <button key={p.id} onClick={()=>setPersona(p.id)} title={p.label} className={`px-1.5 py-0.5 rounded text-xs transition-colors ${persona===p.id?'bg-primary/20 text-primary':'text-muted-foreground hover:text-foreground'}`}>{p.emoji}</button>
              ))}
            </div>
            {/* In-chat search */}
            <button onClick={() => { setShowChatSearch(v => !v); setTimeout(() => chatSearchRef.current?.focus(), 100); }} title="Search in chat (Ctrl+F)" className={`p-1.5 rounded-lg transition-colors ${showChatSearch?'bg-primary/20 text-primary':'text-muted-foreground hover:text-foreground'}`}>
              <Search className="w-4 h-4"/>
            </button>
            {/* Project context */}
            <button onClick={() => setShowProjectContext(true)} title={`Multi-file project context${projectFiles.length > 0 ? ` (${projectFiles.length} files)` : ''}`} className={`p-1.5 rounded-lg transition-colors ${projectFiles.length>0?'bg-green-500/20 text-green-400':'text-muted-foreground hover:text-foreground'}`}>
              <FolderOpen className="w-4 h-4"/>
              {projectFiles.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[9px] bg-green-500 text-white rounded-full flex items-center justify-center">{projectFiles.length}</span>}
            </button>
            {/* Autonomous mode toggle */}
            <button onClick={() => { setAutonomousMode(v => !v); if (!autonomousMode) toast({ title: '🤖 Autonomous Mode ON — AI will plan and execute tasks automatically' }); }} title="Agent autonomous mode" className={`p-1.5 rounded-lg transition-colors ${autonomousMode?'bg-violet-500/20 text-violet-400':'text-muted-foreground hover:text-foreground'}`}>
              <Cpu className="w-4 h-4"/>
            </button>
            {/* Web search toggle */}
            <button onClick={()=>setWebSearchMode(v=>!v)} title={webSearchMode?'Disable web search':'Enable web search'} className={`p-1.5 rounded-lg transition-colors ${webSearchMode?'bg-blue-500/20 text-blue-400':'text-muted-foreground hover:text-foreground'}`}>
              <Globe className="w-4 h-4"/>
            </button>
            {/* Image gen toggle */}
            <button onClick={()=>setImageGenMode(v=>!v)} title={imageGenMode?'Disable image gen':'Enable image gen'} className={`p-1.5 rounded-lg transition-colors ${imageGenMode?'bg-pink-500/20 text-pink-400':'text-muted-foreground hover:text-foreground'}`}>
              <ImageIcon className="w-4 h-4"/>
            </button>
            {/* Theme picker */}
            <div className="relative group">
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Palette className="w-4 h-4"/></button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl p-2 flex gap-1.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all shadow-xl z-20">
                {THEMES.map(t=>(
                  <button key={t.id} onClick={()=>setActiveTheme(t.id)} title={t.label} className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${activeTheme===t.id?'border-white scale-110':'border-transparent'}`} style={{background:t.primary}}/>
                ))}
              </div>
            </div>
            {/* Mini mode */}
            <button onClick={()=>setMiniMode(true)} title="Mini mode" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Minimize2 className="w-4 h-4"/></button>
            {/* Share */}
            <button onClick={shareChat} title="Share chat" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Share2 className="w-4 h-4"/></button>
            {/* Dark mode */}
            <button onClick={()=>{ document.documentElement.classList.toggle('dark'); setIsDark(d=>!d); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">{isDark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
            <NotificationBell/>
            <button onClick={()=>setShowShortcuts(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><Keyboard className="w-4 h-4"/></button>
            {user && <button onClick={async()=>{await logout();setLocation('/login');}} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"><LogOut className="w-4 h-4"/></button>}
          </div>
        </header>

        {/* ── IN-CHAT SEARCH BAR ─────────────────────────────────────────── */}
        {showChatSearch && (
          <div className="border-b border-border/30 bg-muted/30 px-4 py-2 flex items-center gap-3 shrink-0">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={chatSearchRef}
              value={chatSearchQuery}
              onChange={e => { setChatSearchQuery(e.target.value); setChatSearchIdx(0); }}
              placeholder="Search messages… (Ctrl+F to close)"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            {chatSearchMatches.length > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                {chatSearchIdx + 1} / {chatSearchMatches.length}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button disabled={chatSearchMatches.length === 0} onClick={() => { const ni = Math.max(0, chatSearchIdx - 1); setChatSearchIdx(ni); messageRefs.current[chatSearchMatches[ni]]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
              <button disabled={chatSearchMatches.length === 0} onClick={() => { const ni = Math.min(chatSearchMatches.length - 1, chatSearchIdx + 1); setChatSearchIdx(ni); messageRefs.current[chatSearchMatches[ni]]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => { setShowChatSearch(false); setChatSearchQuery(''); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-3 h-3" /></button>
            </div>
          </div>
        )}

        {/* Settings bar + Context Window Progress Bar */}
        <div className="border-b border-border/30 bg-muted/20 px-4 py-1.5 flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sliders className="w-3 h-3"/>
              <span>Creativity:</span>
              <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e=>setTemperature(parseFloat(e.target.value))} className="w-20 h-1 accent-primary cursor-pointer"/>
              <span>{temperature.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3"/>
              <select value={language} onChange={e=>setLanguage(e.target.value)} className="bg-transparent text-xs focus:outline-none cursor-pointer">
                {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {/* Context window bar */}
            {(messages.length > 0 || projectFiles.length > 0) && (
              <div className="flex items-center gap-2 ml-auto">
                <Cpu className="w-3 h-3" />
                <span>Context:</span>
                <div className="w-24 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${contextColor}`} style={{ width: `${contextPercent}%` }} />
                </div>
                <span className={contextPercent > 80 ? 'text-red-400' : contextPercent > 50 ? 'text-yellow-400' : 'text-green-400'}>{contextPercent}%</span>
              </div>
            )}
            {messages.length > 0 && !(messages.length > 0 || projectFiles.length > 0) && (
              <div className="flex items-center gap-1 ml-auto">
                <Hash className="w-3 h-3"/>
                <span>~{estimateTokens(messages.map(m=>m.content).join(' '))} tokens</span>
              </div>
            )}
            {webSearchMode && <span className={`${!(messages.length > 0 || projectFiles.length > 0) ? '' : ''} flex items-center gap-1 text-blue-400`}><Globe className="w-3 h-3"/>Web Search ON</span>}
            {imageGenMode && <span className="flex items-center gap-1 text-pink-400"><Wand2 className="w-3 h-3"/>Image Gen ON</span>}
            {autonomousMode && <span className="flex items-center gap-1 text-violet-400"><Cpu className="w-3 h-3"/>Autonomous ON</span>}
          </div>
          {/* Keyboard nav hint */}
          {messages.length > 1 && !showChatSearch && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
              <span>j/k or ↑↓ — navigate messages</span>
              <span>c — copy focused message</span>
              <span>Ctrl+F — search</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {isEmpty ? (
            <div className="max-w-2xl mx-auto text-center pt-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                <Bot className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-2xl font-bold mb-2">What can I help you build?</h2>
              <p className="text-muted-foreground mb-8">Your AI coding companion. Ask me to write code, debug issues, explain concepts, or build entire applications.</p>
              <div className="grid grid-cols-2 gap-3 text-left mb-6">
                {SUGGESTIONS.map(s => (
                  <button key={s.label} onClick={()=>sendMessage(s.prompt)} className="p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                    <s.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform"/>
                    <p className="text-sm font-semibold mb-1">{s.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</p>
                  </button>
                ))}
              </div>
              {/* Slash commands preview */}
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Slash Commands</p>
                <div className="grid grid-cols-2 gap-2">
                  {SLASH_COMMANDS.slice(0, 6).map(sc => (
                    <button key={sc.cmd} onClick={() => { setInput(sc.cmd + ' '); textareaRef.current?.focus(); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-left">
                      <span className="text-sm">{sc.icon}</span>
                      <span className="text-xs font-mono text-primary">{sc.cmd}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">— {sc.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={()=>setShowTemplates(true)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><LayoutTemplate className="w-3 h-3"/>Templates</button>
                <button onClick={()=>setPromptLibOpen(true)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><BookMarked className="w-3 h-3"/>Prompts</button>
                <button onClick={()=>setLocation('/compare')} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><GitCompare className="w-3 h-3"/>Compare Models</button>
                <button onClick={()=>setLocation('/playground')} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><Code2 className="w-3 h-3"/>Playground</button>
                <button onClick={()=>setShowProjectContext(true)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><FolderOpen className="w-3 h-3"/>Project Files</button>
                <button onClick={()=>setLocation('/explore')} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><Globe className="w-3 h-3"/>Explore Community</button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => {
                const isSearchMatch = chatSearchQuery && msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
                const isFocused = focusedMsgIdx === idx;
                return (
                  <div
                    key={idx}
                    ref={el => { messageRefs.current[idx] = el; }}
                    className={`flex gap-3 ${msg.role==='user'?'flex-row-reverse':''} ${isFocused ? 'ring-1 ring-primary/30 rounded-2xl' : ''} ${isSearchMatch ? 'bg-yellow-500/5 rounded-2xl' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role==='user'?'bg-primary/20':'bg-muted'}`}>
                      {msg.role==='user'?<User className="w-3.5 h-3.5 text-primary"/>:<Bot className="w-3.5 h-3.5 text-muted-foreground"/>}
                    </div>
                    <div className={`flex-1 max-w-[85%] ${msg.role==='user'?'items-end':''} flex flex-col gap-1`}>
                      {editingIdx === idx ? (
                        <div className="space-y-2">
                          <textarea value={editingText} onChange={e=>setEditingText(e.target.value)} rows={3} autoFocus className="w-full bg-muted border border-primary rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"/>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} className="bg-primary"><Check className="w-3.5 h-3.5 mr-1"/>Save & Regenerate</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-2xl px-4 py-3 ${msg.role==='user'?'bg-primary text-primary-foreground':'bg-muted/50 border border-border/30'}`}>
                          {msg.isImage ? (
                            <img src={msg.content.match(/!\[.*?\]\((.*?)\)/)?.[1] || ''} alt="Generated" className="max-w-sm rounded-lg"/>
                          ) : msg.role === 'assistant' && !msg.content ? (
                            <div className="flex gap-1 py-1"><span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"/><span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.15s]"/><span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.3s]"/></div>
                          ) : msg.role === 'assistant' ? (
                            <MarkdownRenderer content={msg.content} onPreview={openPreview}/>
                          ) : (
                            <div>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              {msg.attachments?.map((a,i)=>(
                                <div key={i} className="mt-2">
                                  {a.type==='image'&&a.preview?<img src={a.preview} alt={a.name} className="max-h-32 rounded-lg object-contain"/>:<span className="inline-flex items-center gap-1 text-xs bg-white/10 rounded px-2 py-1"><FileText className="w-3 h-3"/>{a.name}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Search match highlight label */}
                      {isSearchMatch && (
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[10px] bg-yellow-400/20 text-yellow-500 px-1.5 py-0.5 rounded">match</span>
                        </div>
                      )}

                      {/* Token count badge */}
                      {msg.content && msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[10px] text-muted-foreground/35 tabular-nums">
                            ~{Math.ceil(msg.content.length / 4).toLocaleString()} tokens
                          </span>
                        </div>
                      )}

                      {/* Message comment */}
                      {msg.comment && (
                        <div className="flex items-center gap-1.5 px-1">
                          <MessageCircle className="w-3 h-3 text-yellow-400"/>
                          <span className="text-xs text-yellow-400/80 italic">{msg.comment}</span>
                        </div>
                      )}
                      {commentingIdx === idx && (
                        <div className="flex gap-2 px-1">
                          <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveComment(idx);}} placeholder="Add annotation..." autoFocus className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"/>
                          <Button size="sm" onClick={()=>saveComment(idx)} className="h-7 text-xs">Save</Button>
                          <Button size="sm" variant="ghost" onClick={()=>setCommentingIdx(null)} className="h-7 text-xs">Cancel</Button>
                        </div>
                      )}

                      {/* Star rating for AI messages */}
                      {msg.role === 'assistant' && msg.content && editingIdx !== idx && (
                        <div className="flex flex-col gap-2 px-1">
                          {(msg.content.includes('```') || msg.content.includes('===FILE:')) && (
                            <div>
                              <button
                                onClick={()=>saveCodeFromMessage(msg.content)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 hover:border-green-500/50 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5"/>
                                AI Write — Save to File
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(star=>(
                                <button key={star} onClick={()=>rateMessage(idx,star)} className={`transition-colors ${(msg.rating||0)>=star?'text-yellow-400':'text-muted-foreground/30 hover:text-yellow-400/60'}`}>
                                  <Star className="w-3.5 h-3.5" fill={(msg.rating||0)>=star?'currentColor':'none'}/>
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={()=>copyToClipboard(msg.content)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Copy"><Copy className="w-3 h-3"/></button>
                              <button onClick={()=>readAloud(msg.content)} className={`p-1 rounded transition-colors ${isSpeaking?'text-primary':'text-muted-foreground hover:text-foreground'}`} title="Read aloud">{isSpeaking?<VolumeX className="w-3 h-3"/>:<Volume2 className="w-3 h-3"/>}</button>
                              <button onClick={regenerate} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Regenerate"><RefreshCw className="w-3 h-3"/></button>
                              <button onClick={()=>branchChat(idx)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Branch from here"><GitBranch className="w-3 h-3"/></button>
                              <button onClick={()=>{setCommentingIdx(idx);setCommentText(msg.comment||'');}} className="p-1 rounded text-muted-foreground hover:text-yellow-400 transition-colors" title="Add comment"><MessageCircle className="w-3 h-3"/></button>
                            </div>
                          </div>
                        </div>
                      )}
                      {msg.role === 'user' && editingIdx !== idx && (
                        <div className="flex items-center gap-1 px-1">
                          <button onClick={()=>startEditing(idx, msg.content)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Edit3 className="w-3 h-3"/></button>
                          <button onClick={()=>branchChat(idx)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Branch from here"><GitBranch className="w-3 h-3"/></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* ── FOLLOW-UP SUGGESTION CHIPS ────────────────────────── */}
              {!aiLoading && followUpSuggestions.length > 0 && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
                <div className="flex flex-wrap gap-2 px-1 pb-2">
                  {followUpSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { sendMessage(s); }}
                      className="px-3 py-1.5 rounded-full text-xs border border-primary/30 text-primary/80 hover:bg-primary/10 hover:border-primary/60 hover:text-primary transition-all flex items-center gap-1.5 bg-primary/5"
                    >
                      <Sparkles className="w-3 h-3" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Smart paste chip */}
            {smartPasteChip && (
              <div className="mb-2">
                <button onClick={() => { setInput(smartPasteChip.prompt); setSmartPasteChip(null); setTimeout(() => textareaRef.current?.focus(), 50); }} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5">
                  <Wand2 className="w-3 h-3" />{smartPasteChip.label}
                </button>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {attachments.map(a=>(
                  <div key={a.id} className="flex items-center gap-1.5 bg-muted border border-border/50 rounded-lg px-2 py-1">
                    {a.type==='image'&&a.preview?<img src={a.preview} alt={a.name} className="w-5 h-5 rounded object-cover"/>:<FileText className="w-3.5 h-3.5 text-muted-foreground"/>}
                    <span className="text-xs max-w-[120px] truncate">{a.name}</span>
                    <button onClick={()=>setAttachments(prev=>prev.filter(x=>x.id!==a.id))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1 bg-muted border border-border/50 rounded-2xl flex flex-col shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all relative">
                {/* Slash command menu */}
                {slashMenuOpen && filteredSlashCommands.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-1.5 border-b border-border/50 bg-muted/50">
                      <p className="text-xs text-muted-foreground font-medium">Slash Commands — Tab or Enter to select</p>
                    </div>
                    {filteredSlashCommands.map((sc, i) => (
                      <button
                        key={sc.cmd}
                        onClick={() => { setInput(sc.cmd + ' '); setSlashMenuOpen(false); textareaRef.current?.focus(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${i === slashMenuIdx ? 'bg-muted' : ''}`}
                      >
                        <span className="text-base">{sc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-mono text-primary block">{sc.label}</span>
                          <span className="text-xs text-muted-foreground">{sc.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Category selector */}
                <div className="flex items-center gap-1.5 px-3 pt-2 pb-0 flex-wrap">
                  {([
                    { id: 'frontend' as const, label: '🎨 Frontend', active: 'bg-blue-500/20 text-blue-400 border-blue-500/50', inactive: 'border-border/30 text-muted-foreground hover:border-border/60' },
                    { id: 'backend' as const, label: '⚙️ Backend', active: 'bg-orange-500/20 text-orange-400 border-orange-500/50', inactive: 'border-border/30 text-muted-foreground hover:border-border/60' },
                    { id: 'server' as const, label: '🖥️ Server', active: 'bg-green-500/20 text-green-400 border-green-500/50', inactive: 'border-border/30 text-muted-foreground hover:border-border/60' },
                  ]).map(cat => (
                    <button key={cat.id} onClick={() => setCodeCategory(prev => prev === cat.id ? null : cat.id)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${codeCategory === cat.id ? cat.active : cat.inactive}`}>
                      {cat.label}
                    </button>
                  ))}
                  {codeCategory && <span className="ml-1 text-[10px] text-muted-foreground/50">AI focused on {codeCategory} only</span>}
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handleSmartPaste}
                  placeholder={autonomousMode ? '🤖 Describe a task — AI will plan and execute it autonomously…' : imageGenMode?'Describe an image to generate…':webSearchMode?'Ask anything — web search enabled…':'Ask anything or /command…'}
                  rows={1}
                  style={{ resize: 'none' }}
                  className="w-full bg-transparent px-4 pt-3 pb-2 text-sm focus:outline-none min-h-[44px] max-h-[180px] overflow-y-auto"
                  onInput={e => { const el = e.currentTarget; el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,180)+'px'; }}
                />
                <div className="flex items-center gap-1 px-3 pb-2">
                  {/* Model Pill */}
                  <ModelPill value={model} onChange={(m) => { setModel(m); localStorage.setItem('last_model', m); }} />
                  <div className="w-px h-4 bg-border/40 mx-0.5" />
                  <button onClick={()=>fileInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Upload image"><Camera className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>documentInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Upload document"><FileText className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>setShowProjectContext(true)} className={`p-1.5 rounded-lg transition-colors ${projectFiles.length>0?'text-green-400':'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`} title="Project context files"><FolderOpen className="w-3.5 h-3.5"/></button>
                  <button onClick={startVoiceInput} className={`p-1.5 rounded-lg transition-colors ${isListening?'text-red-400 bg-red-400/10':'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`} title="Voice input">{isListening?<MicOff className="w-3.5 h-3.5"/>:<Mic className="w-3.5 h-3.5"/>}</button>
                  <button onClick={saveInputAsPrompt} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Save as prompt"><Save className="w-3.5 h-3.5"/></button>
                  {messages.length > 0 && <button onClick={exportMarkdown} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Export chat"><FileDown className="w-3.5 h-3.5"/></button>}
                  <div className="ml-auto text-[10px] text-muted-foreground/40 tabular-nums">{input.length}</div>
                </div>
              </div>

              {/* Send button */}
              <Button
                onClick={() => sendMessage(input)}
                disabled={(aiLoading || autonomousRunning) || (!input.trim() && attachments.length === 0)}
                className={`h-12 w-12 rounded-xl shrink-0 shadow-lg ${autonomousMode ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25' : 'bg-primary hover:bg-primary/90 shadow-primary/25'}`}
                size="icon"
              >
                {(aiLoading || autonomousRunning) ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>{handleFiles(e.target.files);e.target.value='';}} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>{handleFiles(e.target.files);e.target.value='';}} />
            <input ref={documentInputRef} type="file" accept=".txt,.md,.pdf,.csv,.json,.js,.ts,.py,.html,.css,.xml" multiple className="hidden" onChange={e=>{handleFiles(e.target.files);e.target.value='';}} />
          </div>
        </div>
      </main>
    </div>
  );
}
