import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  Code2, ArrowLeft, Github, Folder, File, ChevronRight, ChevronDown,
  Plus, Trash2, Download, Save, FolderOpen, X, Loader2, GitBranch,
  Bot, Send, Sparkles, Wand2, MessageSquare, RefreshCw, Copy, Check,
  Eye, Monitor, ExternalLink, Search, FileCode,
} from 'lucide-react';

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const LANG_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'scss',
  json: 'json', md: 'markdown', mdx: 'markdown',
  sh: 'bash', bash: 'bash', yaml: 'yaml', yml: 'yaml',
  xml: 'xml', sql: 'sql', rs: 'rust', go: 'go', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', rb: 'ruby', php: 'php',
  swift: 'swift', kt: 'kotlin', r: 'r', lua: 'lua', txt: 'plaintext',
  vue: 'html', svelte: 'html', toml: 'plaintext', ini: 'plaintext',
  env: 'plaintext', dockerfile: 'dockerfile', graphql: 'graphql',
};

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return LANG_MAP[ext] || 'plaintext';
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    js: 'text-yellow-400', jsx: 'text-yellow-400', mjs: 'text-yellow-400',
    ts: 'text-blue-400', tsx: 'text-blue-400',
    py: 'text-green-400', html: 'text-orange-400', htm: 'text-orange-400',
    css: 'text-purple-400', scss: 'text-pink-400', sass: 'text-pink-400',
    json: 'text-yellow-300', md: 'text-gray-300', mdx: 'text-gray-300',
    rs: 'text-orange-500', go: 'text-cyan-400', java: 'text-red-400',
    kt: 'text-purple-500', rb: 'text-red-500', php: 'text-indigo-400',
    cs: 'text-green-500', cpp: 'text-blue-500', c: 'text-blue-500',
    sh: 'text-gray-300', bash: 'text-gray-300', sql: 'text-cyan-300',
    yaml: 'text-red-300', yml: 'text-red-300', xml: 'text-orange-300',
    vue: 'text-green-400', svelte: 'text-orange-500',
  };
  return <FileCode className={`h-3.5 w-3.5 shrink-0 ${colorMap[ext] || 'text-muted-foreground'}`} />;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  language?: string;
  sha?: string;
  size?: number;
  children?: FileNode[];
  expanded?: boolean;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  sha?: string;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildTree(files: FileNode[]): FileNode[] {
  const root: FileNode[] = [];
  const map: Record<string, FileNode> = {};
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  for (const file of sorted) {
    map[file.path] = { ...file, children: file.type === 'dir' ? [] : undefined, expanded: false };
  }
  for (const file of sorted) {
    const parts = file.path.split('/');
    if (parts.length === 1) {
      root.push(map[file.path]);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      if (map[parentPath]?.children) {
        map[parentPath].children!.push(map[file.path]);
      } else {
        root.push(map[file.path]);
      }
    }
  }
  return root;
}

function TreeNode({ node, depth, onSelect, selectedPath, onToggle }: {
  node: FileNode; depth: number; onSelect: (n: FileNode) => void;
  selectedPath: string | null; onToggle: (p: string) => void;
}) {
  const isSelected = selectedPath === node.path;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-[3px] cursor-pointer rounded-sm text-xs transition-colors group
          ${isSelected ? 'bg-primary/20 text-white' : 'text-[#c9d1d9] hover:bg-[#21262d]'}`}
        style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: '8px' }}
        onClick={() => node.type === 'dir' ? onToggle(node.path) : onSelect(node)}
      >
        {node.type === 'dir' ? (
          node.expanded
            ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : <span className="w-3 shrink-0" />}
        {node.type === 'dir'
          ? (node.expanded
            ? <FolderOpen className="h-3.5 w-3.5 text-yellow-400 shrink-0 ml-0.5" />
            : <Folder className="h-3.5 w-3.5 text-yellow-400 shrink-0 ml-0.5" />)
          : <span className="ml-0.5">{getFileIcon(node.name)}</span>
        }
        <span className="truncate ml-1">{node.name}</span>
      </div>
      {node.type === 'dir' && node.expanded && node.children?.map(child => (
        <TreeNode
          key={child.path} node={child} depth={depth + 1}
          onSelect={onSelect} selectedPath={selectedPath} onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function extractCodeFromMarkdown(text: string): string {
  const fenced = text.match(/```[\w]*\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export default function DeveloperPage() {
  const { toast } = useToast();

  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [branch, setBranch] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [repoLoaded, setRepoLoaded] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [flatFiles, setFlatFiles] = useState<FileNode[]>([]);

  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewKey, setPreviewKey] = useState(0);

  const [aiTab, setAiTab] = useState<'chat' | 'rewrite'>('chat');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState('');
  const [rewriteDone, setRewriteDone] = useState(false);
  const [rewriteMode, setRewriteMode] = useState<'build' | 'rewrite'>('build');
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [isBuildingApp, setIsBuildingApp] = useState(false);
  const [buildStatus, setBuildStatus] = useState('');
  const [buildDone, setBuildDone] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const rewriteScrollRef = useRef<HTMLDivElement>(null);

  const cloneRepo = async () => {
    if (!repoUrl.trim()) { toast({ title: 'Enter a GitHub repo URL', variant: 'destructive' }); return; }
    setIsCloning(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/github/import-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repoUrl: repoUrl.trim(), token: token.trim() || undefined, branch: branch.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Clone failed'); }
      const data = await res.json();

      const files: FileNode[] = (data.files || []).map((f: any) => ({
        name: f.path.split('/').pop() || f.path,
        path: f.path,
        type: 'file' as const,
        content: f.content ?? '',
        language: f.language || getLanguage(f.path),
        sha: f.sha,
        size: f.size,
      }));

      const dirSet = new Set<string>();
      for (const f of files) {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          dirSet.add(parts.slice(0, i).join('/'));
        }
      }
      const dirNodes: FileNode[] = Array.from(dirSet).map(p => ({
        name: p.split('/').pop() || p,
        path: p,
        type: 'dir' as const,
      }));

      setFlatFiles(files);
      setFileTree(buildTree([...dirNodes, ...files]));
      setRepoName(data.repoName || repoUrl.split('/').pop()?.replace('.git', '') || 'repo');
      setRepoLoaded(true);
      if (token) localStorage.setItem('github_token', token);
      toast({ title: `Loaded ${files.length} files from ${data.repoName || 'repo'}` });
    } catch (err: any) {
      toast({ title: 'Clone failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsCloning(false);
    }
  };

  const toggleDir = useCallback((path: string) => {
    const toggle = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => n.path === path
        ? { ...n, expanded: !n.expanded }
        : { ...n, children: n.children ? toggle(n.children) : undefined });
    setFileTree(toggle);
  }, []);

  const openFileFromTree = async (node: FileNode) => {
    setSelectedPath(node.path);
    const existing = openTabs.find(t => t.path === node.path);
    if (existing) { setActiveTab(node.path); return; }

    const flatFile = flatFiles.find(f => f.path === node.path);
    if (flatFile?.content !== undefined) {
      const tab: OpenTab = {
        path: node.path, name: node.name,
        content: flatFile.content, language: flatFile.language || getLanguage(node.name),
        isDirty: false, sha: flatFile.sha,
      };
      setOpenTabs(prev => [...prev, tab]);
      setActiveTab(node.path);
      return;
    }

    setIsLoadingFile(true);
    try {
      const parts = repoUrl.replace('https://github.com/', '').split('/');
      const owner = parts[0]; const repo = parts[1];
      const params = new URLSearchParams({ path: node.path, ...(token ? { token } : {}) });
      const res = await fetch(`${BASE_PATH}/api/github/repos/${owner}/${repo}/file?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch file');
      const data = await res.json();
      const tab: OpenTab = {
        path: node.path, name: node.name,
        content: data.content || '', language: getLanguage(node.name),
        isDirty: false, sha: data.sha,
      };
      setOpenTabs(prev => [...prev, tab]);
      setActiveTab(node.path);
    } catch (err: any) {
      toast({ title: 'Failed to open file', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoadingFile(false);
    }
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = openTabs.findIndex(t => t.path === path);
    const newTabs = openTabs.filter(t => t.path !== path);
    setOpenTabs(newTabs);
    if (activeTab === path) {
      setActiveTab(newTabs[Math.max(0, idx - 1)]?.path || null);
    }
  };

  const updateTabContent = (content: string) => {
    if (!activeTab) return;
    setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, content, isDirty: true } : t));
    setFlatFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content } : f));
  };

  const saveCurrentFile = () => {
    if (!activeTab) return;
    setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, isDirty: false } : t));
    toast({ title: 'File saved' });
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const lang = getLanguage(name);
    const tab: OpenTab = { path: name, name, content: '', language: lang, isDirty: false };
    setOpenTabs(prev => [...prev, tab]);
    setFlatFiles(prev => [...prev, { name, path: name, type: 'file', content: '', language: lang }]);
    setFileTree(prev => [...prev, { name, path: name, type: 'file' }]);
    setActiveTab(name); setSelectedPath(name);
    setNewFileName(''); setIsCreatingFile(false);
  };

  const runPreview = useCallback(() => {
    const html = openTabs.find(t => t.name.match(/\.html?$/i))?.content || '';
    if (!html) { toast({ title: 'No HTML file open to preview', variant: 'destructive' }); return; }
    const css = openTabs.filter(t => t.name.endsWith('.css')).map(t => `<style>${t.content}</style>`).join('\n');
    const js = openTabs.filter(t => t.name.match(/\.js$/) && !t.name.endsWith('.min.js')).map(t => `<script>${t.content}</script>`).join('\n');
    const combined = html.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
    setPreviewContent(combined);
    setPreviewKey(k => k + 1);
    setShowPreview(true);
  }, [openTabs, toast]);

  const downloadFiles = async () => {
    if (openTabs.length === 0) { toast({ title: 'No open files to download', variant: 'destructive' }); return; }
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const tab of openTabs) zip.file(tab.path, tab.content);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${repoName || 'project'}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded successfully' });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const detectCloneRequest = (msg: string): string | null => {
    const patterns = [
      /clone\s+(https?:\/\/github\.com\/[^\s]+)/i,
      /import\s+(https?:\/\/github\.com\/[^\s]+)/i,
      /load\s+(https?:\/\/github\.com\/[^\s]+)/i,
      /open\s+(https?:\/\/github\.com\/[^\s]+)/i,
      /fetch\s+(https?:\/\/github\.com\/[^\s]+)/i,
    ];
    for (const pattern of patterns) {
      const match = msg.match(pattern);
      if (match) return match[1].replace(/[.,;!?]$/, '');
    }
    return null;
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiStreaming) return;
    const activeTabData = openTabs.find(t => t.path === activeTab);
    const userMsg = aiInput.trim();
    setAiInput('');
    const newMessages: AiMessage[] = [...aiMessages, { role: 'user', content: userMsg }];
    setAiMessages(newMessages);

    const cloneUrl = detectCloneRequest(userMsg);
    if (cloneUrl) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `⏳ Cloning repository from ${cloneUrl}...` }]);
      setRepoUrl(cloneUrl);
      setIsCloning(true);
      try {
        const res = await fetch(`${BASE_PATH}/api/github/import-repo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ repoUrl: cloneUrl, token: token.trim() || undefined }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Clone failed'); }
        const data = await res.json();
        const files: FileNode[] = (data.files || []).map((f: any) => ({
          name: f.path.split('/').pop() || f.path,
          path: f.path,
          type: 'file' as const,
          content: f.content ?? '',
          language: f.language || getLanguage(f.path),
          sha: f.sha,
          size: f.size,
        }));
        const dirSet = new Set<string>();
        for (const f of files) {
          const parts = f.path.split('/');
          for (let i = 1; i < parts.length; i++) dirSet.add(parts.slice(0, i).join('/'));
        }
        const dirNodes: FileNode[] = Array.from(dirSet).map(p => ({ name: p.split('/').pop() || p, path: p, type: 'dir' as const }));
        setFlatFiles(files);
        setFileTree(buildTree([...dirNodes, ...files]));
        const rName = data.repoName || cloneUrl.split('/').pop()?.replace('.git', '') || 'repo';
        setRepoName(rName);
        setRepoLoaded(true);
        if (token) localStorage.setItem('github_token', token);
        setAiMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: `✅ Successfully cloned **${rName}** — loaded ${files.length} files. You can now browse and edit the files in the Explorer panel on the left.` };
          return msgs;
        });
        toast({ title: `Loaded ${files.length} files from ${rName}` });
      } catch (err: any) {
        setAiMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: `❌ Clone failed: ${err.message}. Please use the "Clone GitHub" button in the top-right corner and enter the repository URL manually.` };
          return msgs;
        });
        toast({ title: 'Clone failed', description: err.message, variant: 'destructive' });
      } finally {
        setIsCloning(false);
      }
      return;
    }

    setIsAiStreaming(true);
    let assistantContent = '';
    const context = activeTabData
      ? `Current file: ${activeTabData.name}\n\`\`\`${activeTabData.language}\n${activeTabData.content.slice(0, 4000)}\n\`\`\``
      : undefined;
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userMessage: userMsg, history: aiMessages.slice(-6), context }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) break;
                if (data.content) {
                  assistantContent += data.content;
                  setAiMessages(prev => {
                    const msgs = [...prev];
                    msgs[msgs.length - 1] = { role: 'assistant', content: assistantContent };
                    return msgs;
                  });
                }
              } catch { }
            }
          }
        }
      }
    } catch (err: any) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsAiStreaming(false);
    }
  };

  const rewriteCurrentFile = async () => {
    const activeTabData = openTabs.find(t => t.path === activeTab);
    if (!activeTabData) { toast({ title: 'Open a file first', variant: 'destructive' }); return; }
    if (!rewriteInstruction.trim()) { toast({ title: 'Enter rewrite instructions', variant: 'destructive' }); return; }
    setIsRewriting(true);
    setRewriteResult('');
    setRewriteDone(false);

    const prompt = `You are rewriting the following ${activeTabData.language} file named "${activeTabData.name}".

Instructions: ${rewriteInstruction}

Current code:
\`\`\`${activeTabData.language}
${activeTabData.content}
\`\`\`

Rewrite the ENTIRE file based on the instructions. Return ONLY the complete rewritten code in a single code block, no explanations before or after.`;

    let fullCode = '';
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userMessage: prompt, history: [] }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) break;
                if (data.content) { fullCode += data.content; setRewriteResult(fullCode); }
              } catch { }
            }
          }
        }
      }
      const cleanCode = extractCodeFromMarkdown(fullCode);
      setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, content: cleanCode, isDirty: false } : t));
      setFlatFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content: cleanCode } : f));
      setRewriteDone(true);
      toast({ title: `"${activeTabData.name}" rewritten and saved` });
    } catch (err: any) {
      toast({ title: 'Rewrite failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsRewriting(false);
    }
  };

  const buildApp = async () => {
    if (!builderPrompt.trim() || isBuildingApp) return;
    setIsBuildingApp(true);
    setBuildStatus('');
    setBuildDone(false);

    const prompt = `Build a complete, production-ready application: "${builderPrompt}"

Format your response EXACTLY like this — NO other text outside the file blocks:

===FILE: filename.ext===
[complete file content here]
===FILE: filename2.ext===
[complete file content here]

CRITICAL RULES FOR HTML/CSS/JS WEBSITES:
- Use a SINGLE index.html that contains ALL pages as hidden <section> elements
- Each page must be a section: <section id="page-home" class="page">, <section id="page-menu" class="page hidden">, etc.
- script.js MUST implement a showPage(id) function that hides all sections and shows the requested one
- ALL navigation buttons/links MUST call showPage() — NEVER use href="#" or broken onclick handlers
- This is required because the live preview uses an inline iframe (srcDoc) — separate .html files CANNOT be navigated to
- styles.css handles all visual styling including .page { display:none } and .page.active { display:block }`;

    // System prompt tells the backend exactly which file format to use — overrides the default
    const buildSystemPrompt = `You are an expert software engineer building apps for a live browser-preview IDE.
Output ONLY file blocks — no introductions, explanations, or text outside the blocks.

Format EXACTLY like this (one block per file):
===FILE: filename.ext===
[complete file content]
===FILE: styles.css===
[complete CSS]
===FILE: script.js===
[complete JS]

━━━ CRITICAL: HTML MULTI-PAGE NAVIGATION RULES ━━━
The preview renders HTML using srcDoc (inline iframe). Separate .html files CANNOT navigate between each other.
You MUST use Single-Page App (SPA) routing inside index.html:

1. ALL pages go inside index.html as <section> elements:
   <section id="page-home" class="page active">...</section>
   <section id="page-menu" class="page">...</section>
   <section id="page-reservations" class="page">...</section>
   <section id="page-about" class="page">...</section>
   <section id="page-contact" class="page">...</section>

2. styles.css MUST include:
   .page { display: none; }
   .page.active { display: block; }

3. script.js MUST include a working showPage function:
   function showPage(id) {
     document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
     document.getElementById('page-' + id)?.classList.add('active');
     document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
     document.querySelector('nav a[data-page="' + id + '"]')?.classList.add('active');
   }

4. Every nav link MUST use data-page and onclick:
   <a href="#" data-page="menu" onclick="showPage('menu'); return false;">Menu</a>
   NEVER: <a href="menu.html"> — this will NOT work in the preview
   NEVER: <a href="#"> with no onclick — buttons will do nothing

━━━ GENERAL RULES ━━━
- Write complete, working code — no placeholders, no TODOs
- Visually stunning with modern CSS, smooth animations, gradient backgrounds
- Fully functional — every button, form, and feature must work
- ANY language supported for non-web apps: Python, Rust, Go, Java, etc.`;

    let fullResponse = '';
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userMessage: `Build this: ${builderPrompt.trim()}`, history: [], systemPrompt: buildSystemPrompt }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) break;
                if (data.content) { fullResponse += data.content; setBuildStatus(fullResponse); }
              } catch { }
            }
          }
        }
      }

      // Parse ===FILE: filename=== format (primary — what we instruct the AI to output)
      const filePattern = /===FILE:\s*([^\n=]+?)===\n?([\s\S]*?)(?====FILE:|$)/g;
      const parsedFiles: { name: string; content: string }[] = [];
      let match;
      while ((match = filePattern.exec(fullResponse)) !== null) {
        const name = match[1].trim();
        const content = match[2].trim();
        if (name && content) parsedFiles.push({ name, content });
      }

      // Fallback: parse === filename === format (used by some models)
      if (parsedFiles.length === 0) {
        const altPattern = /===\s*([^\n=]+\.[a-zA-Z0-9]+)\s*===\n?([\s\S]*?)(?====\s*[^\n=]+\.[a-zA-Z0-9]+\s*===|$)/g;
        while ((match = altPattern.exec(fullResponse)) !== null) {
          const name = match[1].trim();
          const content = match[2].trim();
          if (name && content) parsedFiles.push({ name, content });
        }
      }

      // Last resort: treat entire response as index.html
      if (parsedFiles.length === 0) {
        parsedFiles.push({ name: 'index.html', content: extractCodeFromMarkdown(fullResponse) });
      }

      const newTabs: OpenTab[] = parsedFiles.map(f => ({
        path: f.name, name: f.name, content: f.content, language: getLanguage(f.name), isDirty: false,
      }));
      const newFlatFiles: FileNode[] = parsedFiles.map(f => ({
        name: f.name, path: f.name, type: 'file' as const, content: f.content, language: getLanguage(f.name),
      }));

      setOpenTabs(prev => [...prev.filter(t => !parsedFiles.some(f => f.name === t.path)), ...newTabs]);
      setFlatFiles(prev => [...prev.filter(f => !parsedFiles.some(pf => pf.name === f.path)), ...newFlatFiles]);
      setFileTree(prev => [...prev.filter(n => !parsedFiles.some(f => f.name === n.path)), ...newFlatFiles]);
      setActiveTab(newTabs[0].path);
      setSelectedPath(newTabs[0].path);
      setRepoLoaded(true);

      const htmlFile = newTabs.find(t => t.name.match(/\.html?$/i));
      if (htmlFile) {
        const css = newTabs.filter(t => t.name.endsWith('.css')).map(t => `<style>${t.content}</style>`).join('\n');
        const js = newTabs.filter(t => t.name.match(/\.js$/) && !t.name.endsWith('.min.js')).map(t => `<script>${t.content}</script>`).join('\n');
        const combined = htmlFile.content.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
        setPreviewContent(combined);
        setPreviewKey(k => k + 1);
        setShowPreview(true);
      }

      setBuildDone(true);
      toast({ title: `App built — ${parsedFiles.length} file${parsedFiles.length !== 1 ? 's' : ''} created` });
    } catch (err: any) {
      toast({ title: 'Build failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsBuildingApp(false);
    }
  };

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  useEffect(() => {
    if (rewriteScrollRef.current) rewriteScrollRef.current.scrollTop = rewriteScrollRef.current.scrollHeight;
  }, [rewriteResult]);

  const activeTabData = openTabs.find(t => t.path === activeTab);
  const filteredFiles = searchQuery
    ? flatFiles.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="h-screen w-full flex flex-col bg-[#0d1117] text-foreground overflow-hidden">
      <header className="h-11 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <Code2 className="h-3 w-3 text-primary" />
            </div>
            <span className="font-semibold text-sm text-white">Developer</span>
            {repoLoaded && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-[#21262d] border-[#30363d]">
                <GitBranch className="h-2.5 w-2.5 mr-1" />{repoName}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTabData && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-white" onClick={saveCurrentFile}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          )}
          {openTabs.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-400/10" onClick={downloadFiles}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download ZIP
            </Button>
          )}
          {activeTabData?.name.match(/\.html?$/i) && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-white" onClick={runPreview}>
              <Monitor className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90">
                <Github className="h-3.5 w-3.5 mr-1" /> Clone GitHub
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#161b22] border-[#30363d] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Github className="h-5 w-5" /> Clone GitHub Repository
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Repository URL</label>
                  <Input placeholder="https://github.com/owner/repo" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} className="bg-[#0d1117] border-[#30363d] text-white text-sm" onKeyDown={e => e.key === 'Enter' && cloneRepo()} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Branch (optional)</label>
                  <Input placeholder="main" value={branch} onChange={e => setBranch(e.target.value)} className="bg-[#0d1117] border-[#30363d] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">GitHub Token <span className="text-muted-foreground/60">(for private repos or rate limits)</span></label>
                  <Input type="password" placeholder="ghp_..." value={token} onChange={e => setToken(e.target.value)} className="bg-[#0d1117] border-[#30363d] text-white text-sm" />
                  <p className="text-[10px] text-muted-foreground mt-1">GitHub Settings - Developer settings - Personal access tokens</p>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={cloneRepo} disabled={isCloning || !repoUrl.trim()}>
                  {isCloning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading all files...</> : <><Github className="h-4 w-4 mr-2" />Clone and Load All Files</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* FILE EXPLORER */}
        <div className="w-56 shrink-0 border-r border-[#30363d] bg-[#161b22] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#30363d] shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Explorer</span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white" onClick={() => setShowSearch(s => !s)}>
                <Search className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white" onClick={() => setIsCreatingFile(true)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {showSearch && (
            <div className="px-2 py-1.5 border-b border-[#30363d] shrink-0">
              <Input placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-6 text-xs bg-[#0d1117] border-[#30363d] text-white" autoFocus />
            </div>
          )}

          {isCreatingFile && (
            <div className="px-2 py-1.5 border-b border-[#30363d] shrink-0 flex items-center gap-1">
              <Input placeholder="filename.js" value={newFileName} onChange={e => setNewFileName(e.target.value)} className="h-6 text-xs bg-[#0d1117] border-[#30363d] text-white flex-1" autoFocus onKeyDown={e => { if (e.key === 'Enter') createNewFile(); if (e.key === 'Escape') setIsCreatingFile(false); }} />
              <Button size="icon" variant="ghost" className="h-5 w-5 text-green-400 shrink-0" onClick={createNewFile}><Check className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground shrink-0" onClick={() => setIsCreatingFile(false)}><X className="h-3 w-3" /></Button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="py-1">
              {searchQuery ? (
                filteredFiles.length > 0
                  ? filteredFiles.map(f => (
                    <div key={f.path} onClick={() => openFileFromTree(f as FileNode)}
                      className={`flex items-center gap-1.5 px-2 py-[3px] text-xs cursor-pointer rounded-sm ${activeTab === f.path ? 'bg-primary/20 text-white' : 'text-[#c9d1d9] hover:bg-[#21262d]'}`}>
                      {getFileIcon(f.name)}
                      <span className="truncate text-[11px]">{f.path}</span>
                    </div>
                  ))
                  : <p className="text-xs text-muted-foreground px-3 py-4 text-center">No results</p>
              ) : !repoLoaded ? (
                <div className="px-3 py-8 text-center">
                  <Github className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Clone a GitHub repo or create a new file to get started</p>
                </div>
              ) : (
                fileTree.map(node => (
                  <TreeNode key={node.path} node={node} depth={0} onSelect={openFileFromTree} selectedPath={selectedPath} onToggle={toggleDir} />
                ))
              )}
            </div>
          </ScrollArea>

          {repoLoaded && (
            <div className="px-3 py-1.5 border-t border-[#30363d] shrink-0">
              <p className="text-[10px] text-muted-foreground">{flatFiles.length} files loaded</p>
            </div>
          )}
        </div>

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center border-b border-[#30363d] bg-[#161b22] overflow-x-auto shrink-0 min-h-[34px]">
            {openTabs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-2 gap-1.5">
                {isLoadingFile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isLoadingFile ? 'Loading file...' : 'Open a file from the explorer on the left'}
              </div>
            ) : (
              openTabs.map(tab => (
                <div key={tab.path} onClick={() => { setActiveTab(tab.path); setSelectedPath(tab.path); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-[#30363d] shrink-0 text-xs whitespace-nowrap transition-colors group
                    ${activeTab === tab.path ? 'bg-[#0d1117] text-white border-t-2 border-t-primary' : 'text-muted-foreground hover:text-white hover:bg-[#21262d]'}`}>
                  {getFileIcon(tab.name)}
                  <span>{tab.name}</span>
                  {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                  <button onClick={e => closeTab(tab.path, e)} className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {activeTabData ? (
            <div className="flex-1 overflow-hidden">
              <Editor
                key={activeTab}
                height="100%"
                language={activeTabData.language}
                value={activeTabData.content}
                onChange={val => updateTabContent(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 12 },
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0d1117]">
              <Code2 className="h-16 w-16 text-muted-foreground/15 mb-4" />
              <p className="text-muted-foreground text-sm font-medium">No file open</p>
              <p className="text-muted-foreground/50 text-xs mt-1">Select a file from the explorer or clone a GitHub repository</p>
            </div>
          )}

          {showPreview && previewContent && (
            <div className="h-72 border-t border-[#30363d] flex flex-col shrink-0">
              <div className="flex items-center justify-between px-3 py-1 border-b border-[#30363d] bg-[#21262d] shrink-0">
                <div className="flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-medium text-white">Live Preview</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white" onClick={runPreview}><RefreshCw className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white"
                    onClick={() => { const blob = new Blob([previewContent], { type: 'text/html' }); const url = URL.createObjectURL(blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 10000); }}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white" onClick={() => setShowPreview(false)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
              <iframe key={previewKey} title="Live Preview" srcDoc={previewContent} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" />
            </div>
          )}
        </div>

        {/* AI PANEL */}
        <div className="w-96 shrink-0 border-l border-[#30363d] bg-[#161b22] flex flex-col overflow-hidden">
          <div className="flex border-b border-[#30363d] shrink-0">
            <button onClick={() => setAiTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2
                ${aiTab === 'chat' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}>
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
            <button onClick={() => setAiTab('rewrite')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2
                ${aiTab === 'rewrite' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}>
              <Wand2 className="h-3.5 w-3.5" /> AI Rewrite
            </button>
          </div>

          {/* CHAT TAB */}
          {aiTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[200px]">
                    <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-xs text-white font-medium">AI Code Assistant</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">Ask anything about your code.<br />Open a file to get context-aware help.</p>
                  </div>
                ) : (
                  aiMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-primary/20' : 'bg-[#21262d]'}`}>
                        {msg.role === 'user' ? <span className="text-[8px] text-primary font-bold">YOU</span> : <Bot className="h-3 w-3 text-primary" />}
                      </div>
                      <div className={`flex-1 text-xs rounded-lg px-2.5 py-2 overflow-hidden min-w-0 ${msg.role === 'user' ? 'bg-primary/10 text-white' : 'bg-[#21262d] text-[#c9d1d9]'}`}>
                        {msg.role === 'assistant' ? <MarkdownRenderer content={msg.content} /> : <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                      </div>
                    </div>
                  ))
                )}
                {isAiStreaming && aiMessages[aiMessages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#21262d] shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-[#8b949e]">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[#30363d] shrink-0">
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Ask about your code..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                    className="flex-1 h-8 text-xs bg-[#0d1117] border-[#30363d] text-white"
                    disabled={isAiStreaming}
                  />
                  <Button size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90 shrink-0" onClick={sendAiMessage} disabled={isAiStreaming || !aiInput.trim()}>
                    {isAiStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* REWRITE TAB */}
          {aiTab === 'rewrite' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-[#30363d] shrink-0">
                <button onClick={() => setRewriteMode('build')}
                  className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${rewriteMode === 'build' ? 'text-white bg-[#21262d]' : 'text-muted-foreground hover:text-white'}`}>
                  <Sparkles className="h-3 w-3 inline mr-1" />Build App
                </button>
                <button onClick={() => setRewriteMode('rewrite')}
                  className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${rewriteMode === 'rewrite' ? 'text-white bg-[#21262d]' : 'text-muted-foreground hover:text-white'}`}>
                  <Wand2 className="h-3 w-3 inline mr-1" />Rewrite File
                </button>
              </div>

              {/* BUILD APP MODE */}
              {rewriteMode === 'build' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-[#30363d] shrink-0 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-xs font-semibold text-white">AI App Builder</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Describe your app</label>
                      <Textarea
                        placeholder="Examples: A todo app, A Python web scraper, A React dashboard"
                        value={builderPrompt}
                        onChange={e => { setBuilderPrompt(e.target.value); setBuildDone(false); }}
                        className="text-xs bg-[#0d1117] border-[#30363d] text-white resize-none min-h-[90px]"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-xs h-8" onClick={buildApp} disabled={isBuildingApp || !builderPrompt.trim()}>
                      {isBuildingApp
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Building...</>
                        : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Build App</>}
                    </Button>
                    {buildDone && !isBuildingApp && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-400/10 rounded-md px-2.5 py-2">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-[11px] font-medium">App built and opened in editor!</p>
                      </div>
                    )}
                  </div>
                  <div ref={rewriteScrollRef} className="flex-1 overflow-y-auto p-3">
                    {isBuildingApp && (
                      <div className="flex items-center gap-2 text-xs text-primary mb-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Building your app...</span>
                      </div>
                    )}
                    {buildStatus ? (
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">AI Output</span>
                        <div className="text-xs mt-1"><MarkdownRenderer content={buildStatus} /></div>
                      </div>
                    ) : !isBuildingApp ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[150px]">
                        <Sparkles className="h-8 w-8 text-muted-foreground/20 mb-3" />
                        <p className="text-xs text-muted-foreground">AI will build a complete app</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Supports any language or framework</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* REWRITE FILE MODE */}
              {rewriteMode === 'rewrite' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-[#30363d] shrink-0 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-xs font-semibold text-white">AI Code Rewriter</p>
                    </div>
                    {activeTabData ? (
                      <div className="flex items-center gap-1.5 bg-[#21262d] rounded-md px-2 py-1.5">
                        {getFileIcon(activeTabData.name)}
                        <span className="text-xs text-[#c9d1d9] truncate flex-1">{activeTabData.name}</span>
                        <Badge className="text-[9px] h-3.5 px-1 bg-green-500/20 text-green-400 border-green-500/30 shrink-0">Active</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 rounded-md px-2 py-1.5">
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[11px]">Open a file from the explorer first</span>
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">What should the AI change?</label>
                      <Textarea
                        placeholder="Examples: Add dark mode, Refactor to async/await, Add error handling"
                        value={rewriteInstruction}
                        onChange={e => { setRewriteInstruction(e.target.value); setRewriteDone(false); }}
                        className="text-xs bg-[#0d1117] border-[#30363d] text-white resize-none min-h-[90px]"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-xs h-8" onClick={rewriteCurrentFile} disabled={isRewriting || !activeTabData || !rewriteInstruction.trim()}>
                      {isRewriting
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rewriting...</>
                        : <><Wand2 className="h-3.5 w-3.5 mr-1.5" />Rewrite and Auto-Save</>}
                    </Button>
                    {rewriteDone && !isRewriting && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-400/10 rounded-md px-2.5 py-2">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-[11px] font-medium">File rewritten and saved to editor!</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {isRewriting && (
                      <div className="flex items-center gap-2 text-xs text-primary mb-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Generating rewrite...</span>
                      </div>
                    )}
                    {rewriteResult ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">AI Output</span>
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] text-muted-foreground hover:text-white px-1.5"
                            onClick={() => { navigator.clipboard.writeText(extractCodeFromMarkdown(rewriteResult)); toast({ title: 'Copied' }); }}>
                            <Copy className="h-3 w-3 mr-1" />Copy
                          </Button>
                        </div>
                        <div className="text-xs"><MarkdownRenderer content={rewriteResult} /></div>
                      </div>
                    ) : !isRewriting ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[150px]">
                        <Sparkles className="h-8 w-8 text-muted-foreground/20 mb-3" />
                        <p className="text-xs text-muted-foreground">AI will rewrite your entire file</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Changes are auto-saved immediately</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
