import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Play, RotateCcw, Copy, Check, Download, Maximize2, Minimize2,
  Sparkles, Loader2, File, FolderOpen, ChevronRight, ChevronDown, Send,
  Code2, Eye, X, AlertCircle, Search, Share2, Terminal, Wand2, LayoutTemplate,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface ProjectFile { path: string; name: string; content: string; language: string; }
interface FileTreeNode { [key: string]: FileTreeNode | 'file'; }

function buildFileTree(files: ProjectFile[]): FileTreeNode {
  const tree: FileTreeNode = {};
  for (const file of files) {
    const parts = file.path.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = {};
      node = node[parts[i]] as FileTreeNode;
    }
    node[parts[parts.length - 1]] = 'file';
  }
  return tree;
}

function TreeNode({ name, node, depth = 0, onSelect, selectedPath, pathPrefix = '' }: {
  name: string; node: FileTreeNode | 'file'; depth?: number;
  onSelect: (p: string) => void; selectedPath: string; pathPrefix?: string;
}) {
  const [open, setOpen] = useState(true);
  const isFile = node === 'file';
  const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
  const ext = name.split('.').pop() ?? '';
  const iconColor = ext === 'html' ? 'text-orange-400' : ext === 'css' ? 'text-blue-400' : ext === 'js' ? 'text-yellow-400' : ext === 'ts' ? 'text-blue-300' : ext === 'json' ? 'text-green-400' : ext === 'md' ? 'text-gray-400' : 'text-muted-foreground';

  if (isFile) {
    return (
      <div style={{ paddingLeft: depth * 12 + 8 }} onClick={() => onSelect(fullPath)}
        className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-xs transition-colors ${selectedPath === fullPath ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}`}>
        <File className={`w-3 h-3 shrink-0 ${iconColor}`} /><span className="truncate">{name}</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ paddingLeft: depth * 12 + 8 }} onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer text-xs hover:bg-white/5 text-foreground font-medium">
        {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <FolderOpen className="w-3 h-3 shrink-0 text-yellow-400/80" /><span className="truncate">{name}</span>
      </div>
      {open && Object.entries(node as FileTreeNode).map(([cName, cNode]) => (
        <TreeNode key={cName} name={cName} node={cNode} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} pathPrefix={fullPath} />
      ))}
    </div>
  );
}

function buildPreviewHtml(files: ProjectFile[]): string {
  const indexFile = files.find(f => f.name === 'index.html' || f.path === 'index.html') ?? files.find(f => f.language === 'html');
  if (!indexFile) return `<html><body style="background:#0f0f1a;color:#94a3b8;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><p>No HTML entry file found</p></body></html>`;
  let result = indexFile.content;
  for (const file of files) {
    if (file.language === 'css') result = result.replace(new RegExp(`<link[^>]*href=["']\\.?\\/?${file.name.replace('.', '\\.')}["'][^>]*>`, 'gi'), `<style>${file.content}</style>`);
    if (file.language === 'javascript') result = result.replace(new RegExp(`<script[^>]*src=["']\\.?\\/?${file.name.replace('.', '\\.')}["'][^>]*><\\/script>`, 'gi'), `<script>${file.content}</script>`);
  }
  return result;
}

const EXAMPLE_PROMPTS = [
  'Build a todo app with local storage',
  'Create a snake game with canvas',
  'Make a calculator with glassmorphism',
  'Build a weather dashboard UI',
  'Create a music player with visualizer',
];

type Step = { step: string; message: string; file?: ProjectFile; project?: { projectName: string; files: ProjectFile[] }; };

export default function PlaygroundPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [codeCategory, setCodeCategory] = useState<'frontend' | 'backend' | 'server' | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [copied, setCopied] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState<'editor' | 'preview' | 'run'>('preview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [runOutput, setRunOutput] = useState<Array<{ type: string; text: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tpl = params.get('template');
    if (tpl) {
      try {
        const data = JSON.parse(decodeURIComponent(tpl));
        setFiles(data.files);
        setProjectName(data.projectName);
        const idx = data.files.find((f: ProjectFile) => f.name === 'index.html') ?? data.files[0];
        if (idx) setSelectedPath(idx.path);
        setPreviewHtml(buildPreviewHtml(data.files));
      } catch {}
    }
  }, []);

  const selectedFile = files.find(f => f.path === selectedPath);
  const searchResults = searchQuery.trim() ? files.flatMap(f => {
    const lines = f.content.split('\n');
    return lines.reduce<Array<{ file: string; line: number; text: string }>>((acc, l, i) => {
      if (l.toLowerCase().includes(searchQuery.toLowerCase())) acc.push({ file: f.path, line: i + 1, text: l.trim() });
      return acc;
    }, []);
  }) : [];

  const runPreview = useCallback(() => {
    setPreviewHtml(buildPreviewHtml(files));
    setActivePanel('preview');
  }, [files]);

  const runCode = async () => {
    if (!selectedFile) return;
    const lang = selectedFile.language;
    if (!['javascript', 'typescript', 'python'].includes(lang)) {
      toast({ title: `Cannot run ${lang} files directly. Try the preview instead.` });
      return;
    }
    setIsRunning(true);
    setRunOutput([]);
    setAiExplanation('');
    setActivePanel('run');
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: selectedFile.content, language: lang }),
      });
      if (!res.ok) { setRunOutput([{ type: 'error', text: 'Not authenticated. Please log in to run code.' }]); setIsRunning(false); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const output: Array<{ type: string; text: string }> = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          try { const d = JSON.parse(line.slice(6)); output.push(d); setRunOutput([...output]); } catch {}
        }
      }
    } catch (err: any) {
      setRunOutput([{ type: 'error', text: err.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  const aiExplainErrors = async () => {
    const errors = runOutput.filter(o => o.type === 'stderr' || o.type === 'error').map(o => o.text).join('\n');
    if (!errors) { toast({ title: 'No errors to explain' }); return; }
    setAiExplaining(true);
    setAiExplanation('');
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `Explain this error and how to fix it in simple terms:\n\nCode:\n${selectedFile?.content?.slice(0, 2000)}\n\nError:\n${errors}`,
          history: [], temperature: 0.3,
        }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) { try { const d = JSON.parse(line.slice(6)); if (d.content) { full += d.content; setAiExplanation(full); } } catch {} }
        }
      }
    } catch { toast({ title: 'AI explanation failed', variant: 'destructive' }); }
    finally { setAiExplaining(false); }
  };

  const shareProject = () => {
    if (!files.length) return;
    const encoded = encodeURIComponent(JSON.stringify({ projectName, files }));
    const url = `${window.location.origin}/playground?template=${encoded}`;
    navigator.clipboard.writeText(url);
    setShareUrl(url);
    toast({ title: 'Share link copied to clipboard!' });
    setTimeout(() => setShareUrl(''), 3000);
  };

  const handleBuild = async () => {
    const categoryPrefix = codeCategory === 'frontend'
      ? '[FRONTEND ONLY] Focus exclusively on Frontend (HTML/CSS/JS/React/UI). Do not include backend or server code. '
      : codeCategory === 'backend'
      ? '[BACKEND ONLY] Focus exclusively on Backend (Node.js/Python/databases/APIs). Do not include frontend UI code. '
      : codeCategory === 'server'
      ? '[SERVER ONLY] Focus exclusively on Server/DevOps (deployment, hosting, nginx, docker, config). '
      : '';
    if (!prompt.trim()) return;
    setIsBuilding(true); setBuildLog([]); setFiles([]); setSelectedPath(''); setPreviewHtml(''); setError(''); setProjectName(''); setRunOutput([]); setAiExplanation('');
    try {
      const res = await fetch('/api/playground/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: (categoryPrefix + prompt).trim() }),
      });
      if (!res.ok || !res.body) throw new Error('Server error');
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      const collected: ProjectFile[] = [];
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const d: Step = JSON.parse(line.slice(6));
            setBuildLog(prev => [...prev, d.message]);
            if (d.step === 'file' && d.file) { collected.push(d.file); setFiles([...collected]); }
            if (d.step === 'done' && d.project) {
              const all = d.project.files; setFiles(all); setProjectName(d.project.projectName);
              setPreviewHtml(buildPreviewHtml(all));
              const idx = all.find(f => f.name === 'index.html') ?? all[0];
              if (idx) setSelectedPath(idx.path);
            }
            if (d.step === 'error') setError(d.message);
          } catch {}
        }
      }
    } catch (err: any) { setError(err.message ?? 'Failed to generate app'); }
    finally { setIsBuilding(false); }
  };

  const copyCode = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const downloadZip = async () => {
    if (!files.length) return;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip(); const folder = zip.folder(projectName || 'my-app')!;
      for (const file of files) folder.file(file.path, file.content);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${projectName || 'my-app'}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded ZIP!' });
    } catch { toast({ title: 'Download failed', variant: 'destructive' }); }
  };

  const hasProject = files.length > 0;
  const fileTree = buildFileTree(files);
  const hasErrors = runOutput.some(o => o.type === 'stderr' || o.type === 'error');

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLocation('/')}><ArrowLeft className="w-4 h-4" /></Button>
          <Code2 className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold">AI Playground</h1>
          {projectName && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{projectName}</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLocation('/templates')}><LayoutTemplate className="w-3.5 h-3.5" />Templates</Button>
          {hasProject && <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(s => !s)} title="Search files"><Search className="w-3.5 h-3.5" /></Button>
            <Button variant="outline" size="sm" onClick={copyCode} disabled={!selectedFile} className="gap-1 text-xs h-7">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadZip} className="gap-1 text-xs h-7"><Download className="w-3 h-3" />ZIP</Button>
            <Button variant="outline" size="sm" onClick={shareProject} className="gap-1 text-xs h-7">
              {shareUrl ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}Share
            </Button>
            <Button size="sm" onClick={runPreview} className="gap-1 text-xs h-7 bg-primary shadow-md shadow-primary/20"><Play className="w-3 h-3" />Run</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSplitView(s => !s)}>
              {splitView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </>}
        </div>
      </header>

      {/* AI Prompt Bar */}
      <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isBuilding && handleBuild()}
              placeholder="Describe the app you want to build..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50" />
          </div>
          {/* Category selector */}
          <div className="flex items-center gap-1">
            {([
              { id: 'frontend' as const, label: '🎨', title: 'Frontend', active: 'bg-blue-500/20 text-blue-400 border-blue-500/50', inactive: 'border-border/40 text-muted-foreground hover:border-border' },
              { id: 'backend' as const, label: '⚙️', title: 'Backend', active: 'bg-orange-500/20 text-orange-400 border-orange-500/50', inactive: 'border-border/40 text-muted-foreground hover:border-border' },
              { id: 'server' as const, label: '🖥️', title: 'Server', active: 'bg-green-500/20 text-green-400 border-green-500/50', inactive: 'border-border/40 text-muted-foreground hover:border-border' },
            ]).map(cat => (
              <button key={cat.id} onClick={() => setCodeCategory(prev => prev === cat.id ? null : cat.id)} title={cat.title}
                className={`px-2 py-1 rounded-lg text-sm border transition-colors ${codeCategory === cat.id ? cat.active : cat.inactive}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <Button onClick={handleBuild} disabled={isBuilding || !prompt.trim()} className="gap-1.5 shrink-0 h-9 shadow-md shadow-primary/20">
            {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isBuilding ? 'Building...' : 'Build'}
          </Button>
          {hasProject && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setFiles([]); setPreviewHtml(''); setBuildLog([]); setError(''); setProjectName(''); setRunOutput([]); setAiExplanation(''); }}><X className="w-4 h-4" /></Button>}
        </div>
        {!hasProject && !isBuilding && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap max-w-4xl mx-auto">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLE_PROMPTS.map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)} className="text-xs text-primary/70 hover:text-primary border border-border/50 hover:border-primary/40 rounded-full px-2.5 py-0.5 transition-colors">{ex}</button>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && hasProject && (
        <div className="px-4 py-2 border-b border-border/50 bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across all files..." className="flex-1 bg-transparent text-sm outline-none" />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowSearch(false); setSearchQuery(''); }}><X className="w-3 h-3" /></Button>
          </div>
          {searchQuery && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
              {searchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No results found</p>
              ) : searchResults.slice(0, 20).map((r, i) => (
                <div key={i} onClick={() => { setSelectedPath(r.file); setShowSearch(false); setSearchQuery(''); }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-xs">
                  <span className="text-primary/70 shrink-0">{r.file}:{r.line}</span>
                  <span className="text-muted-foreground truncate">{r.text}</span>
                </div>
              ))}
              {searchResults.length > 20 && <p className="text-xs text-muted-foreground px-2 py-1">+{searchResults.length - 20} more results</p>}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        {hasProject && (
          <div className="w-48 shrink-0 border-r border-border/50 overflow-y-auto bg-muted/10 py-2">
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
              <span className="text-xs text-muted-foreground">{files.length}</span>
            </div>
            {Object.entries(fileTree).map(([name, node]) => (
              <TreeNode key={name} name={name} node={node} onSelect={setSelectedPath} selectedPath={selectedPath} />
            ))}
          </div>
        )}

        {/* Editor + Preview/Run */}
        {hasProject ? (
          <div className={`flex-1 flex ${splitView ? 'flex-row' : 'flex-col'} overflow-hidden divide-x divide-border/50`}>
            {/* Code Editor */}
            <div className={`${splitView ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden`}>
              <div className="px-3 py-1.5 border-b border-border/50 flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex gap-1 overflow-x-auto">
                  {files.map(f => (
                    <button key={f.path} onClick={() => setSelectedPath(f.path)}
                      className={`text-xs px-2 py-0.5 rounded shrink-0 transition-colors ${selectedPath === f.path ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedFile && ['javascript', 'typescript', 'python'].includes(selectedFile.language) && (
                    <Button variant="ghost" size="sm" className="h-5 text-xs gap-1 text-green-400 hover:text-green-300" onClick={runCode} disabled={isRunning}>
                      <Terminal className="w-3 h-3" />Run
                    </Button>
                  )}
                </div>
              </div>
              <textarea value={selectedFile?.content ?? ''} onChange={e => setFiles(prev => prev.map(f => f.path === selectedPath ? { ...f, content: e.target.value } : f))}
                spellCheck={false} className="flex-1 p-4 text-xs font-mono bg-background resize-none focus:outline-none text-foreground leading-relaxed"
                style={{ tabSize: 2 }} />
            </div>

            {/* Right Panel: Preview / Run Output */}
            <div className={`${splitView ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden`}>
              <div className="px-3 py-1.5 border-b border-border/50 flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex gap-1">
                  {[{ id: 'preview' as const, label: 'Preview', icon: Eye }, { id: 'run' as const, label: 'Console', icon: Terminal }].map(tab => (
                    <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                      className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${activePanel === tab.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <tab.icon className="w-3 h-3" />{tab.label}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={runPreview} className="h-5 text-xs gap-1 text-muted-foreground">
                  <RotateCcw className="w-3 h-3" />Refresh
                </Button>
              </div>

              {activePanel === 'preview' ? (
                <iframe ref={iframeRef} srcDoc={previewHtml} sandbox="allow-scripts allow-modals allow-same-origin" className="flex-1 bg-white" title="Preview" />
              ) : (
                <div className="flex-1 overflow-y-auto bg-[#0a0a0f] p-4 font-mono text-xs">
                  {runOutput.length === 0 && !isRunning && (
                    <div className="text-muted-foreground">Select a JS/TS/Python file and click <span className="text-green-400">Run</span> to execute it here.</div>
                  )}
                  {isRunning && <div className="text-yellow-400 animate-pulse">Running...</div>}
                  {runOutput.map((o, i) => (
                    <div key={i} className={`mb-0.5 ${o.type === 'stderr' || o.type === 'error' ? 'text-red-400' : o.type === 'exit' ? 'text-muted-foreground' : 'text-green-300'}`}>
                      {o.type === 'exit' ? `[Process exited with code ${o.code}]` : o.text}
                    </div>
                  ))}
                  {hasErrors && !isRunning && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs border-primary/40 text-primary" onClick={aiExplainErrors} disabled={aiExplaining}>
                        {aiExplaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        AI Explain Error
                      </Button>
                      {aiExplanation && (
                        <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap">
                          {aiExplanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {isBuilding ? (
              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center gap-3 mb-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /><span className="font-medium text-sm">AI is building your app...</span></div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
                  {buildLog.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-muted-foreground"><span className="text-primary/60 shrink-0">›</span><span>{log}</span></div>
                  ))}
                  {isBuilding && <div className="flex items-center gap-1 text-primary/60 animate-pulse"><span>›</span><span>_</span></div>}
                </div>
              </div>
            ) : error ? (
              <div className="text-center max-w-md space-y-3">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-sm text-destructive">{error}</p>
                <Button onClick={handleBuild} variant="outline" size="sm">Try Again</Button>
              </div>
            ) : (
              <div className="text-center space-y-5 max-w-lg">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">AI Code Playground</h2>
                  <p className="text-sm text-muted-foreground">Describe what you want to build. The AI creates the folder structure, writes all code files, and runs your app — just like Replit.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {[
                    { icon: FolderOpen, label: 'Creates folder & file structure' },
                    { icon: Code2, label: 'Writes complete working code' },
                    { icon: Play, label: 'Live preview in seconds' },
                    { icon: Terminal, label: 'Run JS/TS/Python in console' },
                    { icon: Search, label: 'Search across all files' },
                    { icon: Wand2, label: 'AI explains your errors' },
                    { icon: Share2, label: 'Share project via link' },
                    { icon: Download, label: 'Download as ZIP' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                      <Icon className="w-4 h-4 text-primary/70 shrink-0" /><span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setLocation('/templates')} className="gap-2">
                  <LayoutTemplate className="w-4 h-4" />Browse Templates
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
