import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Loader2, CheckCircle2, XCircle, FolderOpen, File, Download,
  Rocket, ChevronRight, ChevronDown, Sparkles, Globe, ExternalLink,
  Brain, Code2, FileCode, Pencil, Save, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface BuildFile { id: number; name: string; path: string; language: string }

interface BuildEvent {
  step: string;
  message?: string;
  errors?: string[];
  project?: any;
  files?: BuildFile[];
  fileTree?: any;
  thinking?: string;
  filePlan?: string[];
  filePath?: string;
  token?: string;
  lineCount?: number;
  projectName?: string;
}

function FileTreeNode({ name, node, depth = 0 }: { name: string; node: any; depth?: number }) {
  const [open, setOpen] = useState(true);
  const isFile = node === null;
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        className={`flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-white/5 cursor-pointer text-sm ${isFile ? 'text-muted-foreground' : 'text-foreground font-medium'}`}
        onClick={() => !isFile && setOpen(o => !o)}
      >
        {!isFile && (open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />)}
        {isFile ? <File className="w-3.5 h-3.5 shrink-0 text-primary/70" /> : <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-400/70" />}
        <span className="truncate">{name}</span>
      </div>
      {!isFile && open && Object.entries(node).map(([childName, childNode]) => (
        <FileTreeNode key={childName} name={childName} node={childNode as any} depth={depth + 1} />
      ))}
    </div>
  );
}

function DeployModal({ projectId, projectName, onClose }: { projectId: number; projectName: string; onClose: () => void }) {
  const [provider, setProvider] = useState<'netlify' | 'vercel' | 'render'>('netlify');
  const [token, setToken] = useState('');
  const [siteName, setSiteName] = useState(projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  const [deployHookUrl, setDeployHookUrl] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const { toast } = useToast();

  const deploy = async () => {
    setDeploying(true);
    try {
      const body: any = { provider, siteName };
      if (provider !== 'render') body.token = token;
      else body.deployHookUrl = deployHookUrl;
      const res = await fetch(`/api/agent/deploy/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ url: data.url });
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setDeploying(false);
    }
  };

  const providers = [
    { id: 'netlify', label: 'Netlify', color: 'bg-teal-500', desc: 'Free static hosting' },
    { id: 'vercel', label: 'Vercel', color: 'bg-black border border-white/20', desc: 'Serverless platform' },
    { id: 'render', label: 'Render', color: 'bg-violet-600', desc: 'Full-stack hosting' },
  ] as const;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-primary" />Deploy Project</DialogTitle>
        <DialogDescription>Choose a platform and enter your API token to deploy.</DialogDescription>
      </DialogHeader>
      {result ? (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-5 h-5" />Deployed successfully!
          </div>
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm break-all">
            <ExternalLink className="w-4 h-4 shrink-0" />{result.url}
          </a>
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            {providers.map(p => (
              <button key={p.id} type="button" onClick={() => setProvider(p.id)}
                className={`rounded-xl p-3 text-center border-2 transition-all ${provider === p.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/30'}`}>
                <div className={`w-6 h-6 rounded mx-auto mb-1.5 ${p.color}`} />
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Site Name</Label>
            <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="my-app-name" />
          </div>
          {provider !== 'render' ? (
            <div className="space-y-2">
              <Label>{provider === 'netlify' ? 'Netlify' : 'Vercel'} Personal Access Token</Label>
              <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your API token here" />
              <p className="text-xs text-muted-foreground">
                {provider === 'netlify'
                  ? 'netlify.com → User Settings → Applications → Personal access tokens'
                  : 'vercel.com → Settings → Tokens → Create Token'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Render Deploy Hook URL</Label>
              <Input value={deployHookUrl} onChange={e => setDeployHookUrl(e.target.value)} placeholder="https://api.render.com/deploy/..." />
              <p className="text-xs text-muted-foreground">render.com → your service → Settings → Deploy Hooks</p>
            </div>
          )}
          <Button className="w-full gap-2" onClick={deploy} disabled={deploying || (!token && provider !== 'render') || (!deployHookUrl && provider === 'render')}>
            {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {deploying ? 'Deploying...' : `Deploy to ${providers.find(p => p.id === provider)?.label}`}
          </Button>
        </div>
      )}
    </DialogContent>
  );
}

interface AgentBuilderProps {
  prompt: string;
  onClose: () => void;
}

type PhaseState = 'idle' | 'thinking' | 'planning' | 'writing' | 'saving' | 'checking' | 'done' | 'error';

interface FileProgress {
  path: string;
  content: string;
  done: boolean;
  lineCount?: number;
}

export function AgentBuilder({ prompt, onClose }: AgentBuilderProps) {
  const [phase, setPhase] = useState<PhaseState>('idle');
  const [thinkingText, setThinkingText] = useState('');
  const [filePlan, setFilePlan] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [fileProgresses, setFileProgresses] = useState<Record<string, FileProgress>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [fileTree, setFileTree] = useState<any>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Starting...');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const started = useRef(false);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const activeFileRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startBuild();
  }, []);

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinkingText]);

  useEffect(() => {
    if (activeFileRef.current) {
      activeFileRef.current.scrollTop = activeFileRef.current.scrollHeight;
    }
  }, [fileProgresses, activeFile]);

  const startBuild = async () => {
    setPhase('thinking');
    try {
      const res = await fetch('/api/agent/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data: BuildEvent = JSON.parse(line.slice(6));
            handleEvent(data);
          } catch {
            // ignore partial JSON
          }
        }
      }
    } catch (err: any) {
      setFailed(true);
      setPhase('error');
      setStatusMessage(err.message);
    }
  };

  const handleEvent = (data: BuildEvent) => {
    switch (data.step) {
      case 'thinking':
        setPhase('thinking');
        setStatusMessage(data.message ?? 'Thinking...');
        break;

      case 'thinking_token':
        // Raw JSON tokens arrive here — accumulate in a ref and display as-is for now
        // They get replaced by the clean parsed thinking text in the 'analysed' event
        if (data.token) {
          setThinkingText(prev => prev + data.token);
        }
        break;

      case 'analysed':
        // Replace raw streamed tokens with the clean extracted thinking text
        setThinkingText(data.thinking ?? '');
        if (data.projectName) setProjectName(data.projectName);
        break;

      case 'planning':
        setPhase('planning');
        setStatusMessage(data.message ?? 'Planning files...');
        if (data.files) setFilePlan(data.files);
        if (data.projectName) setProjectName(data.projectName);
        if (data.files) {
          const initial: Record<string, FileProgress> = {};
          for (const fp of data.files) {
            initial[fp] = { path: fp, content: '', done: false };
          }
          setFileProgresses(initial);
        }
        break;

      case 'writing_file':
        setPhase('writing');
        if (data.filePath) {
          setActiveFile(data.filePath);
          setStatusMessage(`Writing ${data.filePath}...`);
        }
        break;

      case 'file_token':
        if (data.filePath && data.token) {
          setFileProgresses(prev => ({
            ...prev,
            [data.filePath!]: {
              ...prev[data.filePath!],
              content: (prev[data.filePath!]?.content ?? '') + data.token,
            },
          }));
        }
        break;

      case 'file_done':
        if (data.filePath) {
          setFileProgresses(prev => ({
            ...prev,
            [data.filePath!]: {
              ...prev[data.filePath!],
              done: true,
              lineCount: data.lineCount,
            },
          }));
        }
        break;

      case 'file_error':
        if (data.filePath) {
          setFileProgresses(prev => ({
            ...prev,
            [data.filePath!]: {
              ...prev[data.filePath!],
              done: true,
              content: `// Error generating this file: ${data.message}`,
            },
          }));
        }
        break;

      case 'saving':
        setPhase('saving');
        setStatusMessage('Saving project to database...');
        break;

      case 'checking':
        setPhase('checking');
        setStatusMessage('Checking for errors...');
        break;

      case 'fixing':
        setStatusMessage(`Auto-fixing ${data.errors?.length ?? 0} issue(s)...`);
        break;

      case 'clean':
        setStatusMessage('All files look good!');
        break;

      case 'done':
        setPhase('done');
        setDone(true);
        setActiveFile(null);
        setProject(data.project);
        setFiles(data.files ?? []);
        setFileTree(data.fileTree);
        setStatusMessage('Your app is ready!');
        break;

      case 'error':
        setPhase('error');
        setFailed(true);
        setStatusMessage(data.message ?? 'Build failed');
        break;
    }
  };

  const downloadZip = async () => {
    if (!project) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { credentials: 'include' });
      const data = await res.json();
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const file of data.files ?? []) zip.file(file.path, file.content);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${project.name}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ title: 'Failed to download', variant: 'destructive' }); }
    finally { setDownloading(false); }
  };

  const doneFileCount = Object.values(fileProgresses).filter(f => f.done).length;
  const totalFileCount = filePlan.length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-semibold">AI Agent Builder</span>
          {projectName && (
            <span className="text-sm text-muted-foreground">— {projectName}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>✕ Close</Button>
      </div>

      {/* Prompt */}
      <div className="px-6 py-3 border-b border-border/30 shrink-0">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">Building: </span>{prompt}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Live progress */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Status bar */}
          <div className={`px-6 py-2.5 border-b border-border/30 flex items-center gap-2 text-sm shrink-0
            ${phase === 'error' ? 'bg-destructive/10 text-destructive' :
              phase === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
              'bg-primary/5 text-primary'}`}>
            {phase === 'error' ? <XCircle className="w-4 h-4" /> :
             phase === 'done' ? <CheckCircle2 className="w-4 h-4" /> :
             <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="font-medium">{statusMessage}</span>
            {totalFileCount > 0 && phase === 'writing' && (
              <span className="ml-auto text-xs text-muted-foreground">
                {doneFileCount}/{totalFileCount} files
              </span>
            )}
          </div>

          {/* Thinking section */}
          {(thinkingText || phase === 'thinking') && (
            <div className="mx-6 mt-4 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Thinking</span>
                {phase === 'thinking' && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
              </div>
              <div
                ref={thinkingRef}
                className="px-4 py-3 text-sm text-muted-foreground leading-relaxed max-h-28 overflow-y-auto font-mono"
              >
                {thinkingText || <span className="opacity-50">Analysing your request...</span>}
                {phase === 'thinking' && <span className="animate-pulse text-primary">▌</span>}
              </div>
            </div>
          )}

          {/* File plan */}
          {filePlan.length > 0 && (
            <div className="mx-6 mt-3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Files to create ({totalFileCount})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filePlan.map(fp => {
                  const prog = fileProgresses[fp];
                  const isActive = fp === activeFile;
                  const isDone = prog?.done;
                  return (
                    <button
                      key={fp}
                      onClick={() => setActiveFile(fp)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all
                        ${isActive ? 'border-primary bg-primary/10 text-primary' :
                          isDone ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
                          prog?.content ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' :
                          'border-border/40 text-muted-foreground'}`}
                    >
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> :
                       isActive ? <Loader2 className="w-3 h-3 animate-spin" /> :
                       prog?.content ? <Pencil className="w-3 h-3" /> :
                       <File className="w-3 h-3" />}
                      {fp}
                      {isDone && prog?.lineCount && (
                        <span className="opacity-60">{prog.lineCount}L</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live file content viewer */}
          {activeFile && fileProgresses[activeFile] && (
            <div className="mx-6 mt-3 flex-1 min-h-0 flex flex-col rounded-xl border border-border/40 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-card shrink-0">
                <FileCode className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-mono text-muted-foreground">{activeFile}</span>
                {!fileProgresses[activeFile].done && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />
                )}
                {fileProgresses[activeFile].done && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
                )}
              </div>
              <pre
                ref={activeFileRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 text-xs font-mono text-muted-foreground leading-relaxed bg-background/50 whitespace-pre-wrap break-all"
              >
                {fileProgresses[activeFile].content || (
                  <span className="opacity-40">Generating...</span>
                )}
                {!fileProgresses[activeFile].done && (
                  <span className="animate-pulse text-primary">▌</span>
                )}
              </pre>
            </div>
          )}

          {/* Done actions */}
          {done && project && (
            <div className="px-6 py-4 border-t border-border/30 shrink-0">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setLocation(`/workspace/${project.id}`)} className="gap-2">
                  <FolderOpen className="w-4 h-4" />Open in Editor
                </Button>
                <Button variant="outline" className="gap-2" onClick={downloadZip} disabled={downloading}>
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download ZIP
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowDeploy(true)}>
                  <Globe className="w-4 h-4" />Deploy
                </Button>
              </div>
            </div>
          )}

          {/* Error retry */}
          {failed && (
            <div className="px-6 py-4 border-t border-border/30 shrink-0">
              <p className="text-sm text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {statusMessage}
              </p>
              <Button variant="outline" onClick={() => {
                started.current = false;
                setPhase('idle');
                setFailed(false);
                setThinkingText('');
                setFilePlan([]);
                setFileProgresses({});
                setActiveFile(null);
                setStatusMessage('Starting...');
                started.current = true;
                startBuild();
              }}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Right: File tree (shown when done) */}
        {done && fileTree && (
          <div className="w-56 border-l border-border/50 p-4 overflow-y-auto shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />{files.length} Files
            </p>
            <div className="space-y-0.5">
              {Object.entries(fileTree).map(([name, node]) => (
                <FileTreeNode key={name} name={name} node={node} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showDeploy && project && (
        <Dialog open onOpenChange={() => setShowDeploy(false)}>
          <DeployModal projectId={project.id} projectName={project.name} onClose={() => setShowDeploy(false)} />
        </Dialog>
      )}
    </div>
  );
}

export function isAgentBuildRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = ['create', 'build', 'make', 'generate', 'develop', 'write', 'code'];
  const appWords = ['app', 'website', 'web', 'project', 'program', 'tool', 'dashboard', 'site', 'page', 'portfolio', 'game', 'api', 'backend', 'frontend'];
  return triggers.some(t => lower.includes(t)) && appWords.some(t => lower.includes(t)) && message.length > 10;
}
