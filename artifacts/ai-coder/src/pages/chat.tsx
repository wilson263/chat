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
    // migrate old Groq IDs that no longer exist
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

  // ── VOICE / TTS ─────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── EDITING ─────────────────────────────────────────────────────────────
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // ── REFS ────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); setPromptLibOpen(v => !v); }
        if (e.key === 'k') { e.preventDefault(); startNewChat(); }
        if (e.key === '/') { e.preventDefault(); setShowShortcuts(v => !v); }
        if (e.key === 'm') { e.preventDefault(); setShowMemory(v => !v); }
      }
      if (e.key === '?' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) setShowShortcuts(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, atts: Attachment[] = attachments) => {
    const trimmed = text.trim();
    if (!trimmed && atts.length === 0) return;
    if (aiLoading) return;

    setLastUserMessage(trimmed);
    setLastAttachments(atts);

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

    // Build system prompt with memory
    const memoryContext = memory.length > 0 ? `\n\nUser Memory Facts:\n${memory.map(m => `- ${m.fact}`).join('\n')}` : '';
    const langInstruction = language !== 'English' ? `\nRespond in ${language}.` : '';
    const personaContext = persona === 'coder' ? '\nYou are in Coder mode — prioritize code solutions.' : persona === 'teacher' ? '\nYou are in Teacher mode — explain concepts clearly with examples.' : persona === 'writer' ? '\nYou are in Writer mode — focus on writing quality and creativity.' : '';
    const categoryContext = codeCategory === 'frontend'
      ? '\nYou are answering a FRONTEND question. Focus ONLY on Frontend (HTML/CSS/JS/React/UI). Give a complete, self-contained answer for the frontend layer. Do not include backend or server code.'
      : codeCategory === 'backend'
      ? '\nYou are answering a BACKEND question. Focus ONLY on Backend (Node.js/Python/databases/APIs/business logic). Give a complete, self-contained answer for the backend layer. Do not include frontend UI code.'
      : codeCategory === 'server'
      ? '\nYou are answering a SERVER question. Focus ONLY on Server/DevOps topics (server config, deployment, hosting, nginx, docker, environment setup). Give a complete, self-contained answer.'
      : '';
    const finalSystemPrompt = (customSystemPrompt || '') + memoryContext + langInstruction + personaContext + categoryContext;

    // When model is 'auto', don't pass it — let the backend smart-route
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
  }, [messages, input, attachments, model, aiLoading, temperature, customSystemPrompt, activeChatId, imageGenMode, webSearchMode, memory, persona, language, activeFolder, stream, toast]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try { const att = await fileToAttachment(file); setAttachments(prev => [...prev, att]); }
      catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    }
  };

  const startNewChat = () => { setMessages([]); setActiveChatId(null); setInput(''); setAttachments([]); setLastUserMessage(''); setLastAttachments([]); setEditingIdx(null); };

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

      {/* ── TEMPLATES MODAL ───────────────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-primary"/><h2 className="font-semibold">Chat Templates</h2></div>
              <button onClick={()=>setShowTemplates(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {CHAT_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { startNewChat(); setInput(t.messages[0].content); setShowTemplates(false); setTimeout(()=>textareaRef.current?.focus(),100); }} className="p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-left transition-all group">
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.messages[0].content.slice(0,60)}…</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMORY MODAL ─────────────────────────────────────────────────── */}
      {showMemory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowMemory(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary"/><h2 className="font-semibold">AI Memory</h2></div>
              <button onClick={()=>setShowMemory(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Facts saved here are automatically included in every conversation.</p>
              <div className="flex gap-2">
                <input value={newMemoryFact} onChange={e=>setNewMemoryFact(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addMemory();}} placeholder="e.g. I prefer TypeScript over JavaScript" className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <Button size="sm" onClick={addMemory}><Plus className="w-3.5 h-3.5"/></Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {memory.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No memories saved yet</p>}
                {memory.map(m => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/30">
                    <Brain className="w-3.5 h-3.5 text-primary shrink-0"/>
                    <span className="flex-1 text-xs">{m.fact}</span>
                    <button onClick={()=>deleteMemory(m.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULED PROMPTS MODAL ───────────────────────────────────────── */}
      {showScheduled && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowScheduled(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/><h2 className="font-semibold">Scheduled Prompts</h2></div>
              <button onClick={()=>setShowScheduled(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Schedule a prompt to run automatically at a set time each day.</p>
              <div className="space-y-2">
                <textarea value={newScheduledPrompt} onChange={e=>setNewScheduledPrompt(e.target.value)} placeholder="Enter prompt to schedule..." rows={2} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"/>
                <div className="flex gap-2">
                  <input type="time" value={newScheduledTime} onChange={e=>setNewScheduledTime(e.target.value)} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"/>
                  <Button size="sm" onClick={addScheduledPrompt}><Plus className="w-3.5 h-3.5 mr-1"/>Add</Button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scheduledPrompts.length===0 && <p className="text-xs text-muted-foreground text-center py-4">No scheduled prompts</p>}
                {scheduledPrompts.map(sp => (
                  <div key={sp.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-1">{sp.prompt}</p>
                      <p className="text-xs text-muted-foreground">{sp.time} · {sp.model}</p>
                    </div>
                    <button onClick={()=>setScheduledPrompts(prev=>prev.filter(s=>s.id!==sp.id))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EMBED CODE MODAL ─────────────────────────────────────────────── */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowEmbed(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Code className="w-5 h-5 text-primary"/><h2 className="font-semibold">Chat Embed Widget</h2></div>
              <button onClick={()=>setShowEmbed(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Embed ZorvixAI on any website by copying this snippet:</p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono border border-border/50">{getEmbedCode()}</pre>
              <Button className="w-full" onClick={()=>{ navigator.clipboard.writeText(getEmbedCode()); toast({title:'Embed code copied!'}); }}>
                <Copy className="w-4 h-4 mr-2"/>Copy Embed Code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CURL HELPER MODAL ────────────────────────────────────────────── */}
      {showCurlHelper && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowCurlHelper(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Terminal className="w-5 h-5 text-primary"/><h2 className="font-semibold">CLI Companion</h2></div>
              <button onClick={()=>setShowCurlHelper(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Use the ZorvixAI API from your terminal:</p>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono border border-border/50">{getCurlCommand()}</pre>
              <Button className="w-full" onClick={()=>{ navigator.clipboard.writeText(getCurlCommand()); toast({title:'cURL command copied!'}); }}>
                <Copy className="w-4 h-4 mr-2"/>Copy Command
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ──────────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowShareModal(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Share2 className="w-5 h-5 text-primary"/><h2 className="font-semibold">Share Chat</h2></div>
              <button onClick={()=>setShowShareModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Anyone with this link can view this conversation:</p>
              <div className="flex gap-2">
                <input readOnly value={shareLink} className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono"/>
                <Button size="sm" onClick={()=>{ navigator.clipboard.writeText(shareLink); toast({title:'Link copied!'}); }}><Copy className="w-3.5 h-3.5"/></Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME PICKER ─────────────────────────────────────────────────── */}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="w-64 shrink-0 border-r border-border/50 bg-card flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><Bot className="w-4 h-4 text-white"/></div>
                <span className="font-bold text-sm">ZorvixAI</span>
              </div>
              <div className="flex items-center gap-1">
                {streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Flame className="w-3 h-3"/><span className="text-xs font-bold">{streak}</span>
                  </div>
                )}
                <button onClick={()=>setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4"/></button>
              </div>
            </div>
            <Button onClick={startNewChat} className="w-full bg-primary/90 hover:bg-primary text-sm h-8 shadow-md shadow-primary/20" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5"/>New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search chats..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"/>
            </div>
          </div>

          {/* Folder filter chips */}
          {allFolders.length > 0 && (
            <div className="px-3 py-2 border-b border-border/30 flex gap-1.5 flex-wrap">
              <button onClick={()=>setActiveFolder(null)} className={`px-2 py-0.5 rounded-full text-xs transition-colors ${activeFolder===null?'bg-primary text-white':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
              {allFolders.map(f=>(
                <button key={f} onClick={()=>setActiveFolder(activeFolder===f?null:f)} className={`px-2 py-0.5 rounded-full text-xs transition-colors flex items-center gap-1 ${activeFolder===f?'bg-primary text-white':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  <FolderOpen className="w-3 h-3"/>{f}
                </button>
              ))}
            </div>
          )}

          {/* Nav */}
          <div className="px-3 py-2 border-b border-border/30 space-y-0.5">
            <NavItem icon={FolderKanban} label="Projects" onClick={()=>setLocation('/projects')} />
            <NavItem icon={BarChart3} label="Analytics" onClick={()=>setLocation('/analytics')} />
            <NavItem icon={GitCompare} label="Compare Models" onClick={()=>setLocation('/compare')} />
            <NavItem icon={Code2} label="Code Playground" onClick={()=>setLocation('/playground')} />
            <NavItem icon={LayoutTemplate} label="Templates" onClick={()=>setShowTemplates(true)} />
            <NavItem icon={Brain} label="AI Memory" onClick={()=>setShowMemory(true)} />
            <NavItem icon={Clock} label="Scheduled Prompts" onClick={()=>setShowScheduled(true)} />
            <NavItem icon={BookMarked} label="Prompt Library" onClick={()=>setPromptLibOpen(true)} />
            <NavItem icon={Code} label="Embed Widget" onClick={()=>setShowEmbed(true)} />
            <NavItem icon={Terminal} label="CLI Companion" onClick={()=>setShowCurlHelper(true)} />
            <NavItem icon={Wand2} label="Prompt Generator" onClick={()=>setLocation('/prompt-generator')} highlight />
          </div>
          <div className="px-3 py-2 border-b border-border/30 space-y-0.5">
            <NavItem icon={Grid3X3} label="Our Apps" onClick={()=>setLocation('/our-apps')} />
            <NavItem icon={Zap} label="Usage" onClick={()=>setLocation('/usage')} />
            <NavItem icon={Settings} label="Settings" onClick={()=>setLocation('/settings')} />
            <NavItem icon={Shield} label="Admin" onClick={()=>setLocation('/admin')} />
            <NavItem icon={Info} label="About" onClick={()=>setLocation('/about')} />
            <NavItem icon={Terminal} label="Developer" onClick={()=>setLocation('/developer')} />
            <NavItem icon={Mail} label="Contact Us" onClick={()=>setLocation('/contact')} />
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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

        {/* Settings bar */}
        <div className="border-b border-border/30 bg-muted/20 px-4 py-1.5 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
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
          {messages.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <Hash className="w-3 h-3"/>
              <span>~{estimateTokens(messages.map(m=>m.content).join(' '))} tokens</span>
            </div>
          )}
          {webSearchMode && <span className="ml-auto flex items-center gap-1 text-blue-400"><Globe className="w-3 h-3"/>Web Search ON</span>}
          {imageGenMode && <span className="flex items-center gap-1 text-pink-400"><Wand2 className="w-3 h-3"/>Image Gen ON</span>}
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
              <div className="grid grid-cols-2 gap-3 text-left">
                {SUGGESTIONS.map(s => (
                  <button key={s.label} onClick={()=>sendMessage(s.prompt)} className="p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                    <s.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform"/>
                    <p className="text-sm font-semibold mb-1">{s.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2 justify-center flex-wrap">
                <button onClick={()=>setShowTemplates(true)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><LayoutTemplate className="w-3 h-3"/>Templates</button>
                <button onClick={()=>setPromptLibOpen(true)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><BookMarked className="w-3 h-3"/>Prompts</button>
                <button onClick={()=>setLocation('/compare')} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><GitCompare className="w-3 h-3"/>Compare Models</button>
                <button onClick={()=>setLocation('/playground')} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"><Code2 className="w-3 h-3"/>Playground</button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role==='user'?'flex-row-reverse':''}`}>
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
                          <MarkdownRenderer content={msg.content}/>
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
                      <div className="flex items-center gap-3 px-1">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(star=>(
                            <button key={star} onClick={()=>rateMessage(idx,star)} className={`transition-colors ${(msg.rating||0)>=star?'text-yellow-400':'text-muted-foreground/30 hover:text-yellow-400/60'}`}>
                              <Star className="w-3.5 h-3.5" fill={(msg.rating||0)>=star?'currentColor':'none'}/>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity [.group:hover_&]:opacity-100">
                          <button onClick={()=>copyToClipboard(msg.content)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Copy"><Copy className="w-3 h-3"/></button>
                          <button onClick={()=>readAloud(msg.content)} className={`p-1 rounded transition-colors ${isSpeaking?'text-primary':'text-muted-foreground hover:text-foreground'}`} title="Read aloud">{isSpeaking?<VolumeX className="w-3 h-3"/>:<Volume2 className="w-3 h-3"/>}</button>
                          <button onClick={regenerate} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Regenerate"><RefreshCw className="w-3 h-3"/></button>
                          <button onClick={()=>branchChat(idx)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Branch from here"><GitBranch className="w-3 h-3"/></button>
                          <button onClick={()=>{setCommentingIdx(idx);setCommentText(msg.comment||'');}} className="p-1 rounded text-muted-foreground hover:text-yellow-400 transition-colors" title="Add comment"><MessageCircle className="w-3 h-3"/></button>
                          {(msg.content.includes('```') || msg.content.includes('===FILE:')) && (
                            <button onClick={()=>saveCodeFromMessage(msg.content)} className="p-1 rounded text-muted-foreground hover:text-green-400 transition-colors" title="AI Write — save code to file"><Download className="w-3 h-3"/></button>
                          )}
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
              ))}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
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
              <div className="flex-1 bg-muted border border-border/50 rounded-2xl flex flex-col shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
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
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={imageGenMode?'Describe an image to generate…':webSearchMode?'Ask anything — web search enabled…':'Ask anything or describe what you want to build…'}
                  rows={1}
                  style={{ resize: 'none' }}
                  className="w-full bg-transparent px-4 pt-3 pb-2 text-sm focus:outline-none min-h-[44px] max-h-[180px] overflow-y-auto"
                  onInput={e => { const el = e.currentTarget; el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,180)+'px'; }}
                />
                <div className="flex items-center gap-1 px-3 pb-2">
                  {/* Model Pill — quick model switcher right in the input bar */}
                  <ModelPill value={model} onChange={(m) => { setModel(m); localStorage.setItem('last_model', m); }} />
                  <div className="w-px h-4 bg-border/40 mx-0.5" />
                  <button onClick={()=>fileInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Upload image"><Camera className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>documentInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Upload document"><FileText className="w-3.5 h-3.5"/></button>
                  <button onClick={startVoiceInput} className={`p-1.5 rounded-lg transition-colors ${isListening?'text-red-400 bg-red-400/10':'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}`} title="Voice input">{isListening?<MicOff className="w-3.5 h-3.5"/>:<Mic className="w-3.5 h-3.5"/>}</button>
                  <button onClick={()=>setPromptLibOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Prompt library (Ctrl+P)"><BookMarked className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>setShowTemplates(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Templates"><LayoutTemplate className="w-3.5 h-3.5"/></button>
                  <button onClick={saveInputAsPrompt} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Save as prompt"><Save className="w-3.5 h-3.5"/></button>
                  <button onClick={exportMarkdown} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Export chat"><FileDown className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>setLocation('/compare')} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors" title="Compare models"><GitCompare className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <Button onClick={()=>sendMessage(input)} disabled={aiLoading||(!input.trim()&&attachments.length===0)} className="h-11 px-5 bg-primary shadow-lg shadow-primary/20 rounded-xl shrink-0">
                {aiLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
              </Button>
            </div>
            {/* Active model info bar */}
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              {activeModelInfo && model === AUTO_MODEL_ID ? (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <Wand2 className="w-3 h-3 text-primary/60" />
                  <span>
                    Auto routed to <span className="text-primary/80 font-medium">{getModelLabel(activeModelInfo.model)}</span>
                    {' '}for <span className="text-foreground/60">{activeModelInfo.intent === 'build_app' ? 'app building' : activeModelInfo.intent === 'fix_code' ? 'debugging' : activeModelInfo.intent === 'explain_code' ? 'explanation' : activeModelInfo.intent === 'reasoning' ? 'reasoning' : 'chat'}</span>
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground/40">
                  {model === AUTO_MODEL_ID ? '✦ Auto mode — smart model routing enabled' : `Using ${getModelLabel(model)}`}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground/40">Enter · Shift+Enter newline · ? shortcuts</p>
            </div>
          </div>
        </div>
      </main>

      {agentPrompt && (
        <div className="fixed inset-0 z-50 bg-background">
          <AgentBuilder prompt={agentPrompt} onClose={() => setAgentPrompt(null)} />
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={documentInputRef} type="file" accept=".txt,.md,.js,.ts,.py,.json,.html,.css,.csv,.pdf" className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

function NavItem({ icon: Icon, label, onClick, highlight }: { icon: any; label: string; onClick: () => void; highlight?: boolean }) {
  if (highlight) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-violet-300 hover:text-violet-200 hover:bg-violet-500/10 transition-colors text-left font-medium">
        <Icon className="w-3.5 h-3.5 text-violet-400" />{label}
        <span className="ml-auto text-[9px] font-semibold px-1 py-0.5 rounded bg-violet-500/20 text-violet-300">NEW</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left">
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );
}

function ChatHistoryItem({ chat, active, onLoad, onDelete, onPin, onFolder }: {
  chat: HistoryItem; active: boolean;
  onLoad: (c: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onPin: (id: string, e: React.MouseEvent) => void;
  onFolder: (id: string) => void;
}) {
  return (
    <div onClick={() => onLoad(chat)} className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${active?'bg-muted text-foreground':'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
      {chat.pinned && <Pin className="w-2.5 h-2.5 text-primary shrink-0" />}
      {chat.folder && <FolderOpen className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
      <span className="flex-1 truncate">{chat.title}</span>
      <button onClick={e=>{e.stopPropagation();onFolder(chat.id);}} className="opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-opacity" title="Move to folder"><FolderOpen className="w-3 h-3"/></button>
      <button onClick={e=>onPin(chat.id,e)} className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity" title={chat.pinned?'Unpin':'Pin'}><Pin className="w-3 h-3"/></button>
      <button onClick={e=>onDelete(chat.id,e)} className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"><Trash2 className="w-3 h-3"/></button>
    </div>
  );
}
