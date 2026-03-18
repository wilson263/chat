import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  Code2, ArrowLeft, Github, Folder, File, ChevronRight, ChevronDown,
  Plus, Trash2, Download, Save, FolderOpen, X, Loader2, GitBranch,
  Bot, Send, Sparkles, Wand2, MessageSquare, RefreshCw, Copy, Check,
  Eye, Monitor, ExternalLink, Search, FileCode,
  Terminal, Play, Square, Settings, ZoomIn, ZoomOut, Map,
  FileSearch, Bug, TestTube2, BookOpen, ArrowRightLeft, FileText,
  Wrench, AlignLeft, ChevronUp, ChevronDown as ChevronDownIcon,
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

interface LayoutOption {
  name: string;
  style: string;
  description: string;
  colorScheme: string;
  sections: string;
  emoji: string;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  layoutOptions?: LayoutOption[];
  isPicker?: boolean;
  chosenLayout?: string;
}

interface TerminalLine {
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'exit';
  text: string;
}

interface FindResult {
  path: string;
  line: number;
  text: string;
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

function TreeNode({ node, depth, onSelect, selectedPath, onToggle, onDelete }: {
  node: FileNode; depth: number; onSelect: (n: FileNode) => void;
  selectedPath: string | null; onToggle: (p: string) => void;
  onDelete?: (path: string, type: 'file' | 'dir') => void;
}) {
  const isSelected = selectedPath === node.path;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-[3px] cursor-pointer rounded-sm text-xs transition-colors group
          ${isSelected ? 'bg-primary/20 text-white' : 'text-[#c9d1d9] hover:bg-[#21262d]'}`}
        style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: '4px' }}
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
        <span className="truncate ml-1 flex-1">{node.name}</span>
        {onDelete && (
          <button
            className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-muted-foreground transition-all shrink-0"
            onClick={e => { e.stopPropagation(); onDelete(node.path, node.type); }}
            title={`Delete ${node.type === 'dir' ? 'folder' : 'file'}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {node.type === 'dir' && node.expanded && node.children?.map(child => (
        <TreeNode
          key={child.path} node={child} depth={depth + 1}
          onSelect={onSelect} selectedPath={selectedPath} onToggle={onToggle}
          onDelete={onDelete}
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

const TERMINAL_LANGS = ['javascript', 'typescript', 'python', 'bash', 'ruby'];

const CODEGEN_TOOLS = [
  { id: 'explain', label: 'Explain Code', icon: BookOpen, color: 'text-blue-400', desc: 'Understand what the code does' },
  { id: 'fix', label: 'Fix Bugs', icon: Bug, color: 'text-red-400', desc: 'Find & fix errors in the code' },
  { id: 'review', label: 'Review', icon: Eye, color: 'text-yellow-400', desc: 'Quality, security & best practices' },
  { id: 'test', label: 'Generate Tests', icon: TestTube2, color: 'text-green-400', desc: 'Write unit tests for this file' },
  { id: 'document', label: 'Add Docs', icon: FileText, color: 'text-purple-400', desc: 'Add comments & documentation' },
  { id: 'convert', label: 'Convert', icon: ArrowRightLeft, color: 'text-cyan-400', desc: 'Convert to another language' },
];

export default function DeveloperPage() {
  const { toast } = useToast();

  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem('dev_repoUrl') || '');
  const [token, setToken] = useState(() => localStorage.getItem('github_token') || '');
  const [branch, setBranch] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [repoLoaded, setRepoLoaded] = useState(() => localStorage.getItem('dev_repoLoaded') === 'true');
  const [repoName, setRepoName] = useState(() => localStorage.getItem('dev_repoName') || '');
  const [fileTree, setFileTree] = useState<FileNode[]>(() => { try { return JSON.parse(localStorage.getItem('dev_fileTree') || '[]'); } catch { return []; } });
  const [flatFiles, setFlatFiles] = useState<FileNode[]>(() => { try { return JSON.parse(localStorage.getItem('dev_flatFiles') || '[]'); } catch { return []; } });

  const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => { try { return JSON.parse(localStorage.getItem('dev_openTabs') || '[]'); } catch { return []; } });
  const [activeTab, setActiveTab] = useState<string | null>(() => localStorage.getItem('dev_activeTab') || null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewKey, setPreviewKey] = useState(0);

  // --- NEW: Terminal ---
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([{ type: 'info', text: '▶  Press Run to execute the current file, or open a file first.' }]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalLang, setTerminalLang] = useState('javascript');
  const terminalAbortRef = useRef<AbortController | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  // --- NEW: Editor settings ---
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [editorMinimap, setEditorMinimap] = useState(false);
  const [editorWordWrap, setEditorWordWrap] = useState<'on' | 'off'>('on');
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const editorRef = useRef<any>(null);

  // --- NEW: Find in files ---
  const [showFindInFiles, setShowFindInFiles] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState<FindResult[]>([]);

  // --- NEW: AI Tools tab ---
  const [convertTargetLang, setConvertTargetLang] = useState('python');
  const [toolsResult, setToolsResult] = useState('');
  const [toolsRunning, setToolsRunning] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const toolsScrollRef = useRef<HTMLDivElement>(null);

  const [aiTab, setAiTab] = useState<'chat' | 'rewrite' | 'tools'>('chat');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiCategory, setAiCategory] = useState<'frontend' | 'backend' | 'server' | null>(null);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState('');
  const [rewriteDone, setRewriteDone] = useState(false);
  const [rewriteCleanCode, setRewriteCleanCode] = useState('');
  const [rewriteMode, setRewriteMode] = useState<'build' | 'rewrite'>('build');
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [layoutPendingPrompt, setLayoutPendingPrompt] = useState('');
  const [layoutPendingMsgs, setLayoutPendingMsgs] = useState<{role:string;content:string}[]>([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  const [buildPhase, setBuildPhase] = useState<'frontend' | 'backend' | 'api' | null>(null);
  const [phaseStatuses, setPhaseStatuses] = useState<{
    frontend: { text: string; done: boolean; count: number };
    backend:  { text: string; done: boolean; count: number };
    api:      { text: string; done: boolean; count: number };
  }>({
    frontend: { text: '', done: false, count: 0 },
    backend:  { text: '', done: false, count: 0 },
    api:      { text: '', done: false, count: 0 },
  });
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const rewriteScrollRef = useRef<HTMLDivElement>(null);

  // Sync terminal lang with active file
  useEffect(() => {
    const lang = activeTab ? getLanguage(activeTab) : 'javascript';
    if (TERMINAL_LANGS.includes(lang)) setTerminalLang(lang);
  }, [activeTab]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalScrollRef.current) terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
  }, [terminalOutput]);

  // Scroll tools result
  useEffect(() => {
    if (toolsScrollRef.current) toolsScrollRef.current.scrollTop = toolsScrollRef.current.scrollHeight;
  }, [toolsResult]);

  // --- NEW: Run current file in terminal ---
  const runCurrentFile = async () => {
    const activeTabData = openTabs.find(t => t.path === activeTab);
    if (!activeTabData?.content?.trim()) {
      toast({ title: 'No code to run', description: 'Open a file first', variant: 'destructive' });
      return;
    }
    setShowTerminal(true);
    setTerminalRunning(true);
    setTerminalOutput([{ type: 'info', text: `▶  Running ${activeTabData.name} (${terminalLang})...` }]);
    terminalAbortRef.current = new AbortController();
    try {
      const res = await fetch(`${BASE_PATH}/api/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: activeTabData.content, language: terminalLang }),
        signal: terminalAbortRef.current.signal,
      });
      if (!res.ok) { const e = await res.json(); setTerminalOutput(p => [...p, { type: 'error', text: `Error: ${e.error}` }]); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'exit') {
              setTerminalOutput(p => [...p, { type: 'info', text: `\n● Process exited with code ${data.code}` }]);
            } else if (data.text) {
              setTerminalOutput(p => [...p, { type: data.type, text: data.text }]);
            }
          } catch { }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setTerminalOutput(p => [...p, { type: 'error', text: `Error: ${err.message}` }]);
    } finally {
      setTerminalRunning(false);
    }
  };

  const stopRun = () => {
    terminalAbortRef.current?.abort();
    setTerminalOutput(p => [...p, { type: 'info', text: '\n■ Execution stopped.' }]);
    setTerminalRunning(false);
  };

  // --- NEW: Find in files ---
  const searchInFiles = useCallback((query: string) => {
    if (!query.trim()) { setFindResults([]); return; }
    const q = query.toLowerCase();
    const results: FindResult[] = [];
    for (const file of flatFiles) {
      if (!file.content) continue;
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(q)) {
          results.push({ path: file.path, line: idx + 1, text: lineText.trim() });
        }
      });
      if (results.length >= 100) break;
    }
    setFindResults(results);
  }, [flatFiles]);

  useEffect(() => { searchInFiles(findQuery); }, [findQuery, searchInFiles]);

  // --- NEW: AI Codegen tools ---
  const callCodegenTool = async (toolId: string) => {
    const activeTabData = openTabs.find(t => t.path === activeTab);
    if (!activeTabData?.content?.trim()) {
      toast({ title: 'Open a file first', variant: 'destructive' }); return;
    }
    setActiveTool(toolId);
    setToolsRunning(true);
    setToolsResult('');
    const lang = activeTabData.language;
    const code = activeTabData.content.slice(0, 8000);
    let endpoint = '';
    let body: Record<string, string> = { code, language: lang };
    switch (toolId) {
      case 'explain': endpoint = 'explain'; break;
      case 'fix': endpoint = 'fix'; break;
      case 'review': endpoint = 'review'; break;
      case 'test': endpoint = 'test'; break;
      case 'document': endpoint = 'document'; body = { ...body, style: 'inline' }; break;
      case 'convert': endpoint = 'convert'; body = { code, fromLanguage: lang, toLanguage: convertTargetLang }; break;
      default: return;
    }
    try {
      const res = await fetch(`${BASE_PATH}/api/codegen/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) { result += data.content; setToolsResult(result); }
          } catch { }
        }
      }
    } catch (err: any) {
      setToolsResult(`Error: ${err.message}`);
    } finally {
      setToolsRunning(false);
    }
  };

  // Apply generated code from tools back to file
  const applyToolResult = () => {
    if (!activeTab || !toolsResult) return;
    const clean = extractCodeFromMarkdown(toolsResult);
    setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, content: clean, isDirty: true } : t));
    setFlatFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content: clean } : f));
    toast({ title: 'Applied to file' });
  };

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

  const deleteFileOrFolder = (path: string, type: 'file' | 'dir') => {
    if (type === 'file') {
      setFlatFiles(prev => prev.filter(f => f.path !== path));
      setFileTree(prev => {
        const remove = (nodes: FileNode[]): FileNode[] =>
          nodes.filter(n => n.path !== path).map(n => ({ ...n, children: n.children ? remove(n.children) : undefined }));
        return remove(prev);
      });
      setOpenTabs(prev => prev.filter(t => t.path !== path));
      if (activeTab === path) {
        setActiveTab(null);
        setSelectedPath(null);
      }
    } else {
      setFlatFiles(prev => prev.filter(f => !f.path.startsWith(path + '/') && f.path !== path));
      setFileTree(prev => {
        const remove = (nodes: FileNode[]): FileNode[] =>
          nodes.filter(n => n.path !== path).map(n => ({ ...n, children: n.children ? remove(n.children) : undefined }));
        return remove(prev);
      });
      setOpenTabs(prev => prev.filter(t => !t.path.startsWith(path + '/') && t.path !== path));
      if (activeTab && (activeTab.startsWith(path + '/') || activeTab === path)) {
        setActiveTab(null);
        setSelectedPath(null);
      }
    }
  };

  const clearAllFiles = () => {
    setFlatFiles([]);
    setFileTree([]);
    setOpenTabs([]);
    setActiveTab(null);
    setSelectedPath(null);
    setRepoLoaded(false);
    setRepoName('');
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

  const parseChatFileBlocks = (text: string): { name: string; content: string }[] => {
    const parsed: { name: string; content: string }[] = [];
    const pattern = /===FILE:\s*([^\n=]+?)===\n?([\s\S]*?)(?====FILE:|$)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      const content = match[2].trim();
      if (name && content) parsed.push({ name, content });
    }
    return parsed;
  };

  const applyChatFiles = (responseText: string) => {
    const parsed = parseChatFileBlocks(responseText);
    if (parsed.length === 0) return 0;
    const newFileNodes: FileNode[] = parsed.map(f => ({
      name: f.name.split('/').pop()!,
      path: f.name,
      type: 'file' as const,
      content: f.content,
      language: getLanguage(f.name),
    }));
    const newTabs: OpenTab[] = parsed.map(f => ({
      path: f.name,
      name: f.name.split('/').pop()!,
      content: f.content,
      language: getLanguage(f.name),
      isDirty: false,
    }));
    const dirSet = new Set<string>();
    for (const f of newFileNodes) {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) dirSet.add(parts.slice(0, i).join('/'));
    }
    const dirNodes: FileNode[] = Array.from(dirSet).map(p => ({ name: p.split('/').pop()!, path: p, type: 'dir' as const }));
    setFlatFiles(newFileNodes);
    setFileTree(buildTree([...dirNodes, ...newFileNodes]));
    setOpenTabs(newTabs);
    setRepoLoaded(true);
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].path);
      setSelectedPath(newTabs[0].path);
    }
    return parsed.length;
  };

  const fetchLayoutOptions = async (prompt: string): Promise<LayoutOption[]> => {
    const systemPrompt = `You are a UI/UX layout expert. Given a project request, suggest exactly 20 DISTINCT layout designs tailored to that specific project type.
Return ONLY a valid JSON array with exactly 20 items — no text before or after it.
Each layout must be genuinely different in style, color, structure, and feel. Cover a wide range: minimal, bold, dark, vibrant, elegant, retro, glassmorphism, brutalist, corporate, playful, magazine, sidebar, fullscreen, card-grid, editorial, neon, earthy, pastel, futuristic, luxury.
Format for each item:
{"name":"2-3 word name","style":"one word style tag","description":"15-25 words describing the visual style and layout","colorScheme":"primary + accent colors","sections":"comma-separated main sections","emoji":"one relevant emoji"}
Tailor all 20 layouts specifically to this project: "${prompt}". Every layout must be unique — no duplicates in style or structure.`;
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: [{ role: 'user', content: `Suggest 20 layout designs for: ${prompt}` }], systemPrompt }),
      });
      if (!res.ok || !res.body) return [];
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || parsed.content || '';
              if (delta) fullText += delta;
            } catch {}
          }
        }
      }
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]) as LayoutOption[];
    } catch { return []; }
  };

  const generateWithLayout = async (layout: LayoutOption, pendingPrompt: string, pendingMsgs: {role:string;content:string}[], pickerIndex: number) => {
    setAiMessages(prev => prev.map((m, i) => i === pickerIndex ? { ...m, isPicker: false, chosenLayout: layout.name, layoutOptions: undefined, content: `${layout.emoji} **${layout.name}** layout selected — generating your code...` } : m));
    const layoutContext = `\nUSER SELECTED LAYOUT: "${layout.name}" (${layout.style} style)\nDescription: ${layout.description}\nColor scheme: ${layout.colorScheme}\nMain sections: ${layout.sections}\nYou MUST implement this exact layout style. Make the design match the description precisely.`;
    const activeTabData = openTabs.find(t => t.path === activeTab);
    const context = activeTabData ? `\n\nCurrent file (${activeTabData.name}):\n\`\`\`${activeTabData.language}\n${activeTabData.content.slice(0, 3000)}\n\`\`\`` : '';
    let systemPrompt = `You are a senior frontend developer helping with code in an IDE.
Focus ONLY on Frontend (HTML/CSS/JS/React/UI). Do not include backend or server code.
RULE: When generating multi-page HTML sites, you MUST create a SEPARATE .html file for EACH page. NEVER put multiple pages inside one index.html. NEVER say "I cannot create separate HTML files" — always create them.
When generating files, use this exact format so they are auto-created in the editor:
===FILE: index.html===
[complete home page html only]
===FILE: about.html===
[complete about page html]
===FILE: styles.css===
[complete shared css]
===FILE: script.js===
[complete shared js]
Navigation links MUST use real hrefs pointing to the correct file: <a href="about.html">About</a> — NEVER use href="#"
Every HTML page must include the full shared header/navbar and footer (duplicate them per file).
Write complete, working code. No placeholders. No TODO comments.${layoutContext}`;
    setIsAiStreaming(true);
    let assistantContent = '';
    setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    try {
      const msgs = [...pendingMsgs, { role: 'user', content: pendingPrompt + `\n\nLayout: ${layout.name} — ${layout.description}. Color: ${layout.colorScheme}. Sections: ${layout.sections}.` }];
      const res = await fetch(`${BASE_PATH}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: msgs, systemPrompt, context }),
      });
      if (!res.ok || !res.body) { const d = await res.json(); throw new Error(d.error || 'AI error'); }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || parsed.content || '';
              if (delta) {
                assistantContent += delta;
                setAiMessages(prev => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: 'assistant', content: assistantContent }; return msgs; });
              }
            } catch {}
          }
        }
      }
      const fileCount = applyChatFiles(assistantContent);
      if (fileCount > 0) {
        toast({ title: `${fileCount} file${fileCount !== 1 ? 's' : ''} created in editor` });
        setAiMessages(prev => { const m = [...prev]; m[m.length - 1] = { role: 'assistant', content: assistantContent + `\n\n✅ **${fileCount} file${fileCount !== 1 ? 's' : ''} created** with the ${layout.name} layout.` }; return m; });
      }
    } catch (err: any) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsAiStreaming(false);
    }
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

    const isCodeRequest = /\b(build|create|make|generate|write|code|implement|fix|refactor|add|develop|update|rewrite|change|modify|create the|build the|can you make|can you create|i need|help me build|help me create)\b/i.test(userMsg);
    if (!isCodeRequest) {
      const conversationalPrompt = `You are ZorvixAI, a helpful AI coding assistant. The user is asking a casual or general question. Reply in plain, friendly conversational text. Do NOT output any ===FILE:=== blocks. Do NOT generate code unless asked directly.`;
      setIsAiStreaming(true);
      let assistantContent = '';
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      try {
        const res = await fetch(`${BASE_PATH}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ messages: [...newMessages.map(m => ({ role: m.role, content: m.content }))], systemPrompt: conversationalPrompt }),
        });
        if (!res.ok || !res.body) { const d = await res.json(); throw new Error(d.error || 'AI error'); }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  assistantContent += delta;
                  setAiMessages(prev => {
                    const msgs = [...prev];
                    msgs[msgs.length - 1] = { role: 'assistant', content: assistantContent };
                    return msgs;
                  });
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        setAiMessages(prev => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }; return msgs; });
      } finally {
        setIsAiStreaming(false);
      }
      return;
    }

    const isUIBuildRequest = /\b(build|create|make|generate|design|develop)\b.*\b(website|site|page|app|portfolio|landing|store|shop|dashboard|blog|restaurant|hotel|agency|business|company|school|clinic|hospital|gym|salon|gallery|travel|booking|ecommerce|e-commerce|saas|startup|service|product)\b|\b(website|site|landing page|web app)\b.*\b(build|create|make|generate)\b/i.test(userMsg);
    const shouldShowLayouts = isUIBuildRequest && (aiCategory === 'frontend' || aiCategory === null);
    if (shouldShowLayouts) {
      setIsLoadingLayouts(true);
      setAiMessages(prev => [...prev, { role: 'assistant', content: '🎨 Generating layout options tailored to your project...', isPicker: false }]);
      const layouts = await fetchLayoutOptions(userMsg);
      setIsLoadingLayouts(false);
      if (layouts.length > 0) {
        const pickerIndex = newMessages.length;
        setAiMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: 'Choose a layout for your project:', layoutOptions: layouts, isPicker: true };
          return msgs;
        });
        const msgHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
        setLayoutPendingPrompt(userMsg);
        setLayoutPendingMsgs(msgHistory);
        return;
      }
    }

    let systemPrompt: string | undefined;
    if (aiCategory === 'frontend') {
      systemPrompt = `You are a senior frontend developer helping with code in an IDE.
Focus ONLY on Frontend (HTML/CSS/JS/React/UI). Do not include backend or server code.
RULE: When generating multi-page HTML sites, you MUST create a SEPARATE .html file for EACH page. NEVER put multiple pages inside one index.html. NEVER say "I cannot create separate HTML files" — always create them.
When generating files, use this exact format so they are auto-created in the editor:
===FILE: index.html===
[complete home page html only]
===FILE: about.html===
[complete about page html]
===FILE: contact.html===
[complete contact page html]
===FILE: styles.css===
[complete shared css]
===FILE: script.js===
[complete shared js]
Navigation links MUST use real hrefs pointing to the correct file: <a href="about.html">About</a> — NEVER use href="#"
Every HTML page must include the full shared header/navbar and footer (duplicate them per file).
Write complete, working code. No placeholders. No TODO comments.`;
    } else if (aiCategory === 'backend') {
      systemPrompt = `You are a senior backend developer helping with code in an IDE.
Focus ONLY on Backend (Node.js/Python/databases/APIs/business logic). Do not include frontend UI code.
When generating files, use this exact format so they are auto-created in the editor:
===FILE: server.js===
[complete file content here]
===FILE: package.json===
[complete package.json here]
Write complete, working code. No placeholders. No TODO comments.`;
    } else if (aiCategory === 'server') {
      systemPrompt = `You are a senior DevOps/server engineer helping with configuration in an IDE.
Focus ONLY on Server/DevOps (deployment, nginx, docker, CI/CD, environment config).
When generating config files, use this exact format so they are auto-created in the editor:
===FILE: Dockerfile===
[complete file content here]
===FILE: nginx.conf===
[complete config here]
Write complete, working configurations. No placeholders.`;
    } else {
      systemPrompt = `You are ZorvixAI, an expert developer code assistant embedded in a code editor IDE.
You help with code questions, debugging, refactoring, and building features.
For general questions, greetings, or explanations — respond in plain conversational text. Do NOT output file blocks.
Only use the FILE format below when the user explicitly asks you to BUILD, CREATE, or WRITE files:
===FILE: path/filename.ext===
[complete file content here]
===FILE: path/filename2.ext===
[complete file content here]
Write complete, working code. No placeholders. No TODO comments. No truncation.`;
    }

    setIsAiStreaming(true);
    let assistantContent = '';
    const context = activeTabData
      ? `Current file: ${activeTabData.name}\n\`\`\`${activeTabData.language}\n${activeTabData.content.slice(0, 4000)}\n\`\`\``
      : undefined;
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userMessage: userMsg, history: aiMessages.slice(-6), context, systemPrompt }),
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
      const isCodeRequest2 = /\b(build|create|make|generate|write|code|implement|fix|refactor|add|develop|update the file|rewrite|change the file)\b/i.test(userMsg);
      const fileCount = isCodeRequest2 ? applyChatFiles(assistantContent) : 0;
      if (fileCount > 0) {
        toast({ title: `${fileCount} file${fileCount !== 1 ? 's' : ''} created in editor` });
        setAiMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = {
            role: 'assistant',
            content: assistantContent + `\n\n✅ **${fileCount} file${fileCount !== 1 ? 's' : ''} auto-created in the editor.**`,
          };
          return msgs;
        });
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
      setRewriteCleanCode(cleanCode);
      setRewriteDone(true);
      toast({ title: `Rewrite ready — click "Apply to File" to save` });
    } catch (err: any) {
      toast({ title: 'Rewrite failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsRewriting(false);
    }
  };

  const PHASE_PROMPTS: Record<'frontend' | 'backend' | 'api', { system: string; user: (p: string) => string }> = {
    frontend: {
      system: `You are building the FRONTEND ONLY for a code editor IDE.
Output ONLY file blocks — no text outside the blocks.

Format EXACTLY like this:
===FILE: index.html===
[complete html]
===FILE: about.html===
[complete html for about page]
===FILE: styles.css===
[complete css]
===FILE: script.js===
[complete js]

━━━ FILE STRUCTURE RULES ━━━
- Create a SEPARATE .html file for EACH page (index.html, about.html, contact.html, menu.html, etc.)
- NEVER put multiple pages inside a single index.html
- All HTML pages link to shared styles.css and script.js
- Navigation links use real hrefs: <a href="about.html">About</a>
- script.js auto-highlights the active nav link using location.pathname
- index.html is the home/landing page only

━━━ SHARED ELEMENTS ━━━
- Every HTML page must include the full header/navbar and footer (duplicate them per-page)
- Link shared files in every page: <link rel="stylesheet" href="styles.css"> and <script src="script.js" defer></script>

━━━ QUALITY RULES ━━━
- Visually stunning: gradients, animations, modern dark or light design
- Every section fully built — no lorem ipsum, no placeholder content
- Forms, buttons, interactive elements all functional with JS
- Responsive design with media queries`,
      user: (p) => `Build the complete FRONTEND (UI only) for: "${p}"\nCreate SEPARATE .html files for each page (index.html, about.html, contact.html, etc.), plus styles.css and script.js.\nUse mock/sample data for any dynamic content.`,
    },
    backend: {
      system: `You are building the BACKEND SERVER only.
Output ONLY file blocks — no text outside the blocks.

Format EXACTLY like this:
===FILE: server.js===
[complete server code]
===FILE: package.json===
[complete package.json]

━━━ RULES ━━━
- Use Node.js + Express (preferred) OR Python + Flask/FastAPI
- Enable CORS for all origins (the frontend will call this API)
- Include ALL API endpoints the frontend will need (GET, POST, PUT, DELETE)
- Use a simple storage solution: JSON file, SQLite, or in-memory array
- Include proper error handling and JSON responses
- Include a README.md showing how to run: npm install && node server.js
- No auth complexity unless the app explicitly needs it`,
      user: (p) => `Build the complete BACKEND SERVER for: "${p}"\nInclude: server.js (Express), package.json, and a README.md with run instructions.`,
    },
    api: {
      system: `You are building the API ROUTES / ENDPOINTS only.
Output ONLY file blocks — no text outside the blocks.

Format EXACTLY like this:
===FILE: routes/api.js===
[complete route file]
===FILE: middleware/validate.js===
[complete middleware]

━━━ RULES ━━━
- Define all RESTful CRUD endpoints with proper HTTP methods
- Include input validation and error responses
- Include any database models or schemas needed
- Use clear, consistent JSON response format: {success, data, error}
- Add comments documenting each endpoint (method, path, params, response)
- If the app needs auth, include JWT middleware`,
      user: (p) => `Build all API ROUTES and ENDPOINTS for: "${p}"\nInclude: routes/api.js with full CRUD, middleware/validate.js, and any model files needed.`,
    },
  };

  const runBuildPhase = async (phase: 'frontend' | 'backend' | 'api') => {
    if (!builderPrompt.trim() || buildPhase !== null) return;
    setBuildPhase(phase);
    setPhaseStatuses(prev => ({ ...prev, [phase]: { text: '', done: false, count: 0 } }));

    const { system, user } = PHASE_PROMPTS[phase];
    let fullResponse = '';
    try {
      const res = await fetch(`${BASE_PATH}/api/chat/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userMessage: user(builderPrompt.trim()), history: [], systemPrompt: system }),
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
                if (data.content) { fullResponse += data.content; setPhaseStatuses(prev => ({ ...prev, [phase]: { ...prev[phase], text: fullResponse } })); }
              } catch { }
            }
          }
        }
      }

      const parsedFiles: { name: string; content: string }[] = [];
      const filePattern = /===FILE:\s*([^\n=]+?)===\n?([\s\S]*?)(?====FILE:|$)/g;
      let match;
      while ((match = filePattern.exec(fullResponse)) !== null) {
        const name = match[1].trim(); const content = match[2].trim();
        if (name && content) parsedFiles.push({ name, content });
      }
      if (parsedFiles.length === 0) {
        const alt = /===\s*([^\n=]+\.[a-zA-Z0-9]+)\s*===\n?([\s\S]*?)(?====\s*[^\n=]+\.[a-zA-Z0-9]+\s*===|$)/g;
        while ((match = alt.exec(fullResponse)) !== null) {
          const name = match[1].trim(); const content = match[2].trim();
          if (name && content) parsedFiles.push({ name, content });
        }
      }
      if (parsedFiles.length === 0) {
        const ext = phase === 'backend' ? 'server.js' : phase === 'api' ? 'routes/api.js' : 'index.html';
        parsedFiles.push({ name: ext, content: extractCodeFromMarkdown(fullResponse) });
      }

      const newTabs: OpenTab[] = parsedFiles.map(f => ({ path: f.name, name: f.name.split('/').pop()!, content: f.content, language: getLanguage(f.name), isDirty: false }));
      const newFlatFiles: FileNode[] = parsedFiles.map(f => ({ name: f.name.split('/').pop()!, path: f.name, type: 'file' as const, content: f.content, language: getLanguage(f.name) }));

      const dirSet2 = new Set<string>();
      for (const f of newFlatFiles) {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) dirSet2.add(parts.slice(0, i).join('/'));
      }
      const dirNodes2: FileNode[] = Array.from(dirSet2).map(p => ({ name: p.split('/').pop()!, path: p, type: 'dir' as const }));

      setOpenTabs(newTabs);
      setFlatFiles(newFlatFiles);
      setFileTree(buildTree([...dirNodes2, ...newFlatFiles]));
      setActiveTab(newTabs[0].path);
      setSelectedPath(newTabs[0].path);
      setRepoLoaded(true);

      if (phase === 'frontend') {
        const htmlFile = newTabs.find(t => t.name.match(/\.html?$/i));
        if (htmlFile) {
          const css = newTabs.filter(t => t.name.endsWith('.css')).map(t => `<style>${t.content}</style>`).join('\n');
          const js  = newTabs.filter(t => t.name.match(/\.js$/) && !t.name.endsWith('.min.js')).map(t => `<script>${t.content}</script>`).join('\n');
          const combined = htmlFile.content.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
          setPreviewContent(combined); setPreviewKey(k => k + 1); setShowPreview(true);
        }
      }

      setPhaseStatuses(prev => ({ ...prev, [phase]: { text: fullResponse, done: true, count: parsedFiles.length } }));
      toast({ title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} built — ${parsedFiles.length} file${parsedFiles.length !== 1 ? 's' : ''} created` });
    } catch (err: any) {
      toast({ title: `${phase} build failed`, description: err.message, variant: 'destructive' });
    } finally {
      setBuildPhase(null);
    }
  };

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  useEffect(() => {
    if (rewriteScrollRef.current) rewriteScrollRef.current.scrollTop = rewriteScrollRef.current.scrollHeight;
  }, [rewriteResult]);

  useEffect(() => {
    if (rewriteScrollRef.current) rewriteScrollRef.current.scrollTop = rewriteScrollRef.current.scrollHeight;
  }, [phaseStatuses]);

  useEffect(() => { localStorage.setItem('dev_flatFiles', JSON.stringify(flatFiles)); }, [flatFiles]);
  useEffect(() => { localStorage.setItem('dev_fileTree', JSON.stringify(fileTree)); }, [fileTree]);
  useEffect(() => { localStorage.setItem('dev_openTabs', JSON.stringify(openTabs)); }, [openTabs]);
  useEffect(() => { if (activeTab) localStorage.setItem('dev_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('dev_repoName', repoName); }, [repoName]);
  useEffect(() => { localStorage.setItem('dev_repoLoaded', String(repoLoaded)); }, [repoLoaded]);
  useEffect(() => { localStorage.setItem('dev_repoUrl', repoUrl); }, [repoUrl]);

  const [isSavingProject, setIsSavingProject] = useState(false);

  const saveToMyProjects = async () => {
    if (flatFiles.length === 0) {
      toast({ title: 'No files to save', description: 'Generate or create some files first.', variant: 'destructive' });
      return;
    }
    setIsSavingProject(true);
    try {
      const name = repoName || `Project ${new Date().toLocaleDateString()}`;
      const lang = flatFiles.some(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx')) ? 'typescript'
        : flatFiles.some(f => f.name.endsWith('.py')) ? 'python'
        : flatFiles.some(f => f.name.endsWith('.html')) ? 'html'
        : 'javascript';
      const projRes = await fetch(`${BASE_PATH}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description: `Created in Developer Studio`, language: lang }),
      });
      if (!projRes.ok) throw new Error('Failed to create project');
      const proj = await projRes.json();
      const filesToSave = openTabs.length > 0 ? openTabs.map(t => ({ name: t.name, path: t.path, content: t.content, language: t.language })) : flatFiles.map(f => ({ name: f.name, path: f.path, content: f.content || '', language: f.language || getLanguage(f.name) }));
      await Promise.all(filesToSave.map(f =>
        fetch(`${BASE_PATH}/api/files/${proj.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: f.name, path: f.path, content: f.content, language: f.language }),
        })
      ));
      toast({ title: `"${name}" saved to My Projects!`, description: `${filesToSave.length} files saved.` });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingProject(false);
    }
  };

  const activeTabData = openTabs.find(t => t.path === activeTab);
  const filteredFiles = searchQuery
    ? flatFiles.filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const terminalLineColor = (type: TerminalLine['type']) => {
    if (type === 'stderr' || type === 'error') return 'text-red-400';
    if (type === 'info') return 'text-blue-400';
    if (type === 'exit') return 'text-yellow-400';
    return 'text-green-300';
  };

  const isRunnable = activeTabData && TERMINAL_LANGS.includes(activeTabData.language);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0d1117] text-foreground overflow-hidden">

      {/* HEADER */}
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
          {/* Run button */}
          {isRunnable && (
            terminalRunning ? (
              <Button variant="ghost" size="sm" className="h-7 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30" onClick={stopRun}>
                <Square className="h-3 w-3 mr-1 fill-current" /> Stop
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30" onClick={runCurrentFile}>
                <Play className="h-3 w-3 mr-1 fill-current" /> Run
              </Button>
            )
          )}

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
          {flatFiles.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" onClick={saveToMyProjects} disabled={isSavingProject}>
              {isSavingProject ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1" />Save to Projects</>}
            </Button>
          )}
          {activeTabData?.name.match(/\.html?$/i) && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-white" onClick={runPreview}>
              <Monitor className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          )}

          {/* Editor Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" title="Editor Settings">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-[#161b22] border-[#30363d] text-white p-3" align="end">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Editor Settings</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Font Size: {editorFontSize}px</label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 border border-[#30363d]" onClick={() => setEditorFontSize(s => Math.max(10, s - 1))}><ZoomOut className="h-3 w-3" /></Button>
                    <div className="flex-1 text-center text-xs text-white font-mono">{editorFontSize}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 border border-[#30363d]" onClick={() => setEditorFontSize(s => Math.min(24, s + 1))}><ZoomIn className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Word Wrap</label>
                  <button
                    onClick={() => setEditorWordWrap(w => w === 'on' ? 'off' : 'on')}
                    className={`w-8 h-4 rounded-full transition-colors relative ${editorWordWrap === 'on' ? 'bg-primary' : 'bg-[#30363d]'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${editorWordWrap === 'on' ? 'left-4.5 translate-x-0' : 'left-0.5'}`} style={{ left: editorWordWrap === 'on' ? '18px' : '2px' }} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Minimap</label>
                  <button
                    onClick={() => setEditorMinimap(m => !m)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${editorMinimap ? 'bg-primary' : 'bg-[#30363d]'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`} style={{ left: editorMinimap ? '18px' : '2px' }} />
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Terminal toggle */}
          <Button
            variant="ghost" size="icon"
            className={`h-7 w-7 ${showTerminal ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground hover:text-white'}`}
            title="Toggle Terminal"
            onClick={() => setShowTerminal(s => !s)}
          >
            <Terminal className="h-3.5 w-3.5" />
          </Button>

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
              <Button variant="ghost" size="icon" className={`h-5 w-5 ${showFindInFiles ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                title="Find in Files" onClick={() => { setShowFindInFiles(s => !s); setShowSearch(false); }}>
                <FileSearch className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-5 w-5 ${showSearch ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                onClick={() => { setShowSearch(s => !s); setShowFindInFiles(false); }}>
                <Search className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-white" onClick={() => setIsCreatingFile(true)}>
                <Plus className="h-3 w-3" />
              </Button>
              {flatFiles.length > 0 && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-red-400" onClick={clearAllFiles} title="Clear all files">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* File name search */}
          {showSearch && (
            <div className="px-2 py-1.5 border-b border-[#30363d] shrink-0">
              <Input placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-6 text-xs bg-[#0d1117] border-[#30363d] text-white" autoFocus />
            </div>
          )}

          {/* Find in files */}
          {showFindInFiles && (
            <div className="border-b border-[#30363d] shrink-0">
              <div className="px-2 py-1.5">
                <Input
                  placeholder="Search in all files..."
                  value={findQuery}
                  onChange={e => setFindQuery(e.target.value)}
                  className="h-6 text-xs bg-[#0d1117] border-[#30363d] text-white"
                  autoFocus
                />
              </div>
              {findQuery && (
                <div className="max-h-48 overflow-y-auto">
                  {findResults.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground px-3 py-2">No results found</p>
                  ) : (
                    <>
                      <p className="text-[9px] text-muted-foreground px-2 py-1">{findResults.length}{findResults.length >= 100 ? '+' : ''} matches</p>
                      {findResults.map((r, i) => (
                        <div key={i}
                          className="px-2 py-1 hover:bg-[#21262d] cursor-pointer"
                          onClick={() => {
                            const node = flatFiles.find(f => f.path === r.path);
                            if (node) openFileFromTree(node as FileNode);
                          }}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            {getFileIcon(r.path.split('/').pop() || '')}
                            <span className="text-[10px] text-[#8b949e] truncate">{r.path}</span>
                            <span className="text-[9px] text-muted-foreground/50 ml-auto shrink-0">:{r.line}</span>
                          </div>
                          <p className="text-[10px] text-[#c9d1d9] truncate font-mono ml-4">{r.text.slice(0, 50)}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
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
                  <TreeNode key={node.path} node={node} depth={0} onSelect={openFileFromTree} selectedPath={selectedPath} onToggle={toggleDir} onDelete={deleteFileOrFolder} />
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
          {/* Tabs */}
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

          {/* Editor + Terminal flex column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTabData ? (
              <div className={`${showTerminal ? 'flex-1' : 'flex-1'} overflow-hidden`} style={{ flex: showTerminal ? '1 1 0' : '1 1 0' }}>
                <Editor
                  key={`${activeTab}-${editorFontSize}-${editorWordWrap}-${editorMinimap}`}
                  height="100%"
                  language={activeTabData.language}
                  value={activeTabData.content}
                  onChange={val => updateTabContent(val || '')}
                  theme="vs-dark"
                  onMount={(editor) => {
                    editorRef.current = editor;
                    editor.onDidChangeCursorPosition((e: any) => {
                      setCursorLine(e.position.lineNumber);
                      setCursorCol(e.position.column);
                    });
                  }}
                  options={{
                    fontSize: editorFontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                    minimap: { enabled: editorMinimap },
                    scrollBeyondLastLine: false,
                    wordWrap: editorWordWrap,
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

            {/* TERMINAL PANEL */}
            {showTerminal && (
              <div className="h-52 border-t border-[#30363d] flex flex-col shrink-0 bg-[#0d1117]">
                {/* Terminal toolbar */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#30363d] bg-[#161b22] shrink-0">
                  <Terminal className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-white">Terminal</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Select value={terminalLang} onValueChange={setTerminalLang}>
                      <SelectTrigger className="h-6 text-[11px] w-28 bg-[#21262d] border-[#30363d]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                        {TERMINAL_LANGS.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => { navigator.clipboard.writeText(terminalOutput.map(l => l.text).join('')); toast({ title: 'Copied' }); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => setTerminalOutput([{ type: 'info', text: '▶  Terminal cleared.' }])}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {terminalRunning ? (
                      <Button size="sm" onClick={stopRun} className="h-6 text-[11px] bg-red-600 hover:bg-red-700 px-2">
                        <Square className="h-2.5 w-2.5 mr-1 fill-current" /> Stop
                      </Button>
                    ) : (
                      <Button size="sm" onClick={runCurrentFile} className="h-6 text-[11px] bg-green-600 hover:bg-green-700 px-2" disabled={!activeTabData}>
                        <Play className="h-2.5 w-2.5 mr-1 fill-current" /> Run
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setShowTerminal(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {/* Terminal output */}
                <div ref={terminalScrollRef} className="flex-1 overflow-auto p-3 font-mono space-y-0.5">
                  {terminalOutput.map((line, i) => (
                    <pre key={i} className={`whitespace-pre-wrap break-all leading-5 text-[11px] ${terminalLineColor(line.type)}`}>{line.text}</pre>
                  ))}
                  {terminalRunning && (
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      Running...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
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

          {/* STATUS BAR */}
          <div className="h-5 shrink-0 bg-[#0078d4] flex items-center px-3 gap-4 text-white text-[10px] font-mono select-none">
            {activeTabData ? (
              <>
                <span className="opacity-90">{activeTabData.language}</span>
                <span className="opacity-70">|</span>
                <span className="opacity-90">Ln {cursorLine}, Col {cursorCol}</span>
                <span className="opacity-70">|</span>
                <span className="opacity-90">{activeTabData.content.split('\n').length} lines</span>
                <span className="opacity-70">|</span>
                <span className="opacity-90">{(new TextEncoder().encode(activeTabData.content).length / 1024).toFixed(1)} KB</span>
                {activeTabData.isDirty && <><span className="opacity-70">|</span><span className="text-yellow-200">● unsaved</span></>}
              </>
            ) : (
              <span className="opacity-60">No file open</span>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="opacity-80">UTF-8</span>
              <span className="opacity-80">Spaces: 2</span>
              <span className="opacity-80 capitalize">{editorWordWrap === 'on' ? 'Wrap On' : 'Wrap Off'}</span>
            </div>
          </div>
        </div>

        {/* AI PANEL */}
        <div className="w-96 shrink-0 border-l border-[#30363d] bg-[#161b22] flex flex-col overflow-hidden">
          <div className="flex border-b border-[#30363d] shrink-0">
            <button onClick={() => setAiTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2
                ${aiTab === 'chat' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}>
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
            <button onClick={() => setAiTab('tools')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2
                ${aiTab === 'tools' ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}>
              <Wrench className="h-3.5 w-3.5" /> Tools
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
                      <div className={`flex-1 min-w-0 ${msg.isPicker ? '' : `text-xs rounded-lg px-2.5 py-2 overflow-hidden ${msg.role === 'user' ? 'bg-primary/10 text-white' : 'bg-[#21262d] text-[#c9d1d9]'}`}`}>
                        {msg.isPicker && msg.layoutOptions ? (
                          <div className="w-full">
                            <p className="text-xs text-white font-medium mb-2">🎨 Choose a layout — {msg.layoutOptions.length} options tailored to your project:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                            {msg.layoutOptions.map((layout, li) => {
                              const styleColors: Record<string, string> = {
                                bold: 'border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/10',
                                minimal: 'border-gray-500/40 hover:border-gray-400 hover:bg-gray-500/10',
                                vibrant: 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10',
                                dark: 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/10',
                                elegant: 'border-yellow-500/40 hover:border-yellow-400 hover:bg-yellow-500/10',
                                modern: 'border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10',
                                corporate: 'border-green-500/40 hover:border-green-400 hover:bg-green-500/10',
                                playful: 'border-pink-500/40 hover:border-pink-400 hover:bg-pink-500/10',
                                retro: 'border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10',
                                glassmorphism: 'border-sky-500/40 hover:border-sky-400 hover:bg-sky-500/10',
                                brutalist: 'border-red-500/40 hover:border-red-400 hover:bg-red-500/10',
                                magazine: 'border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-500/10',
                                sidebar: 'border-teal-500/40 hover:border-teal-400 hover:bg-teal-500/10',
                                fullscreen: 'border-violet-500/40 hover:border-violet-400 hover:bg-violet-500/10',
                                editorial: 'border-rose-500/40 hover:border-rose-400 hover:bg-rose-500/10',
                                neon: 'border-lime-500/40 hover:border-lime-400 hover:bg-lime-500/10',
                                earthy: 'border-stone-500/40 hover:border-stone-400 hover:bg-stone-500/10',
                                pastel: 'border-fuchsia-500/40 hover:border-fuchsia-400 hover:bg-fuchsia-500/10',
                                futuristic: 'border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10',
                                luxury: 'border-yellow-600/40 hover:border-yellow-500 hover:bg-yellow-600/10',
                              };
                              const badgeColors: Record<string, string> = {
                                bold: 'bg-orange-500/20 text-orange-300',
                                minimal: 'bg-gray-500/20 text-gray-300',
                                vibrant: 'bg-purple-500/20 text-purple-300',
                                dark: 'bg-blue-500/20 text-blue-300',
                                elegant: 'bg-yellow-500/20 text-yellow-300',
                                modern: 'bg-cyan-500/20 text-cyan-300',
                                corporate: 'bg-green-500/20 text-green-300',
                                playful: 'bg-pink-500/20 text-pink-300',
                                retro: 'bg-amber-500/20 text-amber-300',
                                glassmorphism: 'bg-sky-500/20 text-sky-300',
                                brutalist: 'bg-red-500/20 text-red-300',
                                magazine: 'bg-indigo-500/20 text-indigo-300',
                                sidebar: 'bg-teal-500/20 text-teal-300',
                                fullscreen: 'bg-violet-500/20 text-violet-300',
                                editorial: 'bg-rose-500/20 text-rose-300',
                                neon: 'bg-lime-500/20 text-lime-300',
                                earthy: 'bg-stone-500/20 text-stone-300',
                                pastel: 'bg-fuchsia-500/20 text-fuchsia-300',
                                futuristic: 'bg-emerald-500/20 text-emerald-300',
                                luxury: 'bg-yellow-600/20 text-yellow-300',
                              };
                              const borderClass = styleColors[layout.style] || 'border-[#30363d] hover:border-[#6e7681] hover:bg-[#21262d]/50';
                              const badgeClass = badgeColors[layout.style] || 'bg-[#30363d] text-gray-300';
                              return (
                                <button
                                  key={li}
                                  disabled={isAiStreaming}
                                  onClick={() => generateWithLayout(layout, layoutPendingPrompt, layoutPendingMsgs, i)}
                                  className={`text-left border rounded-lg p-2 transition-all cursor-pointer ${borderClass} bg-[#0d1117] border-solid`}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm leading-none">{layout.emoji}</span>
                                    <span className="text-[11px] font-semibold text-white leading-tight flex-1 min-w-0 truncate">{layout.name}</span>
                                  </div>
                                  <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium ${badgeClass}`}>{layout.style}</span>
                                  <p className="text-[10px] text-[#8b949e] leading-relaxed mt-1 line-clamp-2">{layout.description}</p>
                                  <p className="text-[9px] text-muted-foreground/60 mt-1 italic truncate">{layout.colorScheme}</p>
                                </button>
                              );
                            })}
                            </div>
                          </div>
                        ) : msg.role === 'assistant' ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {(isAiStreaming || isLoadingLayouts) && aiMessages[aiMessages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#21262d] shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-[#8b949e]">{isLoadingLayouts ? 'Generating layout options...' : 'Thinking...'}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[#30363d] shrink-0">
                <div className="flex gap-1 mb-1.5">
                  {([
                    { id: 'frontend' as const, label: '🎨 Frontend', active: 'bg-blue-500/20 text-blue-400 border-blue-500/40', inactive: 'border-[#30363d] text-muted-foreground hover:text-white hover:border-[#6e7681]' },
                    { id: 'backend' as const, label: '⚙️ Backend', active: 'bg-orange-500/20 text-orange-400 border-orange-500/40', inactive: 'border-[#30363d] text-muted-foreground hover:text-white hover:border-[#6e7681]' },
                    { id: 'server' as const, label: '🖥️ Server', active: 'bg-green-500/20 text-green-400 border-green-500/40', inactive: 'border-[#30363d] text-muted-foreground hover:text-white hover:border-[#6e7681]' },
                  ]).map(cat => (
                    <button key={cat.id} onClick={() => setAiCategory(prev => prev === cat.id ? null : cat.id)}
                      className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${aiCategory === cat.id ? cat.active : cat.inactive}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
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

          {/* TOOLS TAB */}
          {aiTab === 'tools' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[#30363d] shrink-0">
                {activeTabData ? (
                  <div className="flex items-center gap-1.5 bg-[#21262d] rounded-md px-2 py-1.5 mb-3">
                    {getFileIcon(activeTabData.name)}
                    <span className="text-xs text-[#c9d1d9] truncate flex-1">{activeTabData.name}</span>
                    <Badge className="text-[9px] h-3.5 px-1 bg-green-500/20 text-green-400 border-green-500/30 shrink-0">{activeTabData.language}</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 rounded-md px-2 py-1.5 mb-3">
                    <FileCode className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px]">Open a file to use AI tools</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  {CODEGEN_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id && toolsRunning;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => callCodegenTool(tool.id)}
                        disabled={toolsRunning || !activeTabData}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all
                          ${isActive
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-[#30363d] hover:border-[#6e7681] hover:bg-[#21262d]'}
                          ${!activeTabData ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isActive
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 mt-0.5" />
                          : <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${tool.color}`} />}
                        <div>
                          <p className="text-[11px] font-medium text-white leading-tight">{tool.label}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{tool.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Convert language selector */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">Convert to:</span>
                  <Select value={convertTargetLang} onValueChange={setConvertTargetLang}>
                    <SelectTrigger className="h-6 text-[11px] flex-1 bg-[#21262d] border-[#30363d] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                      {['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'php', 'ruby', 'csharp', 'cpp'].map(l => (
                        <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tools result */}
              <div ref={toolsScrollRef} className="flex-1 overflow-y-auto p-3">
                {toolsRunning && !toolsResult && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing code...</span>
                  </div>
                )}
                {toolsResult ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        {CODEGEN_TOOLS.find(t => t.id === activeTool)?.label || 'Result'}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] text-muted-foreground hover:text-white px-1.5"
                          onClick={() => { navigator.clipboard.writeText(toolsResult); toast({ title: 'Copied' }); }}>
                          <Copy className="h-3 w-3 mr-1" />Copy
                        </Button>
                        {(activeTool === 'test' || activeTool === 'document' || activeTool === 'convert') && (
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] text-green-400 hover:text-green-300 px-1.5"
                            onClick={applyToolResult}>
                            <Check className="h-3 w-3 mr-1" />Apply
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs"><MarkdownRenderer content={toolsResult} /></div>
                  </div>
                ) : !toolsRunning ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[150px]">
                    <Wrench className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-xs text-muted-foreground">AI-powered code tools</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Open a file and click any tool above</p>
                  </div>
                ) : null}
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
                        placeholder="e.g. A restaurant website with menu, reservations, and contact pages"
                        value={builderPrompt}
                        onChange={e => { setBuilderPrompt(e.target.value); setPhaseStatuses({ frontend: { text: '', done: false, count: 0 }, backend: { text: '', done: false, count: 0 }, api: { text: '', done: false, count: 0 } }); }}
                        className="text-xs bg-[#0d1117] border-[#30363d] text-white resize-none min-h-[80px]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['frontend', 'backend', 'api'] as const).map(phase => {
                        const icons = { frontend: '🎨', backend: '⚙️', api: '🔌' };
                        const labels = { frontend: 'Frontend', backend: 'Backend', api: 'API' };
                        const status = phaseStatuses[phase];
                        const isBuilding = buildPhase === phase;
                        const isDisabled = buildPhase !== null || !builderPrompt.trim();
                        return (
                          <button key={phase} onClick={() => runBuildPhase(phase)} disabled={isDisabled}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium border transition-colors
                              ${status.done ? 'border-green-500/50 bg-green-500/10 text-green-400' :
                                isBuilding ? 'border-primary/60 bg-primary/10 text-primary' :
                                isDisabled ? 'border-[#30363d] text-muted-foreground/40 cursor-not-allowed' :
                                'border-[#30363d] text-muted-foreground hover:border-primary/50 hover:text-white hover:bg-[#21262d]'}`}>
                            {isBuilding
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : status.done
                              ? <Check className="h-3.5 w-3.5" />
                              : <span className="text-sm leading-none">{icons[phase]}</span>}
                            <span>{labels[phase]}</span>
                            {status.done && <span className="text-[9px] opacity-70">{status.count} file{status.count !== 1 ? 's' : ''}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                      Build each part separately: <span className="text-muted-foreground">Frontend</span> → UI &amp; pages,{' '}
                      <span className="text-muted-foreground">Backend</span> → server &amp; data,{' '}
                      <span className="text-muted-foreground">API</span> → routes &amp; endpoints
                    </p>
                  </div>
                  <div ref={rewriteScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                    {buildPhase && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        <span>Building {buildPhase}...</span>
                      </div>
                    )}
                    {(['frontend', 'backend', 'api'] as const).map(phase => {
                      const s = phaseStatuses[phase];
                      if (!s.text) return null;
                      const labels = { frontend: '🎨 Frontend', backend: '⚙️ Backend', api: '🔌 API' };
                      return (
                        <div key={phase} className="border border-[#30363d] rounded-md overflow-hidden">
                          <div className={`flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold border-b border-[#30363d] ${s.done ? 'text-green-400 bg-green-400/5' : 'text-primary bg-primary/5'}`}>
                            <span>{labels[phase]}</span>
                            {s.done && <span className="text-green-400/70">{s.count} file{s.count !== 1 ? 's' : ''} created</span>}
                          </div>
                          <div className="p-2 text-xs"><MarkdownRenderer content={s.text} /></div>
                        </div>
                      );
                    })}
                    {!buildPhase && !Object.values(phaseStatuses).some(s => s.text) && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[150px]">
                        <div className="flex gap-3 mb-3 text-2xl">🎨⚙️🔌</div>
                        <p className="text-xs text-muted-foreground">Build your app in focused steps</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Each button makes one focused AI request</p>
                      </div>
                    )}
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
                        onChange={e => { setRewriteInstruction(e.target.value); setRewriteDone(false); setRewriteCleanCode(''); setRewriteResult(''); }}
                        className="text-xs bg-[#0d1117] border-[#30363d] text-white resize-none min-h-[90px]"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-xs h-8" onClick={rewriteCurrentFile} disabled={isRewriting || !activeTabData || !rewriteInstruction.trim()}>
                      {isRewriting
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rewriting...</>
                        : <><Wand2 className="h-3.5 w-3.5 mr-1.5" />Preview Rewrite</>}
                    </Button>
                    {rewriteDone && !isRewriting && rewriteCleanCode && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-xs h-8"
                        onClick={() => {
                          if (!activeTab) return;
                          setOpenTabs(prev => prev.map(t => t.path === activeTab ? { ...t, content: rewriteCleanCode, isDirty: false } : t));
                          setFlatFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content: rewriteCleanCode } : f));
                          setRewriteDone(false);
                          setRewriteCleanCode('');
                          setRewriteResult('');
                          toast({ title: `File updated successfully` });
                        }}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />Apply to File
                      </Button>
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
