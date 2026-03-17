import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Loader2, CheckCircle2, XCircle, FolderOpen, File, Download,
  Rocket, ChevronRight, ChevronDown, Sparkles, Globe, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface BuildFile { id: number; name: string; path: string; language: string }
interface BuildStep { step: string; message: string; errors?: string[]; project?: any; files?: BuildFile[]; fileTree?: any }

const STEP_LABELS: Record<string, string> = {
  generating: 'Generating project structure',
  writing: 'Writing files to project',
  checking: 'Checking for errors',
  fixing: 'Auto-fixing errors',
  fixed: 'All errors fixed',
  clean: 'Code is clean',
  done: 'Build complete!',
  error: 'Build failed',
};

function FileTreeNode({ name, node, depth = 0 }: { name: string; node: any; depth?: number }) {
  const [open, setOpen] = useState(true);
  const isFile = node === 'file';
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
        <FileTreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
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

export function AgentBuilder({ prompt, onClose }: AgentBuilderProps) {
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [fileTree, setFileTree] = useState<any>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startBuild();
  }, []);

  const startBuild = async () => {
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
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data: BuildStep = JSON.parse(line.slice(6));
            setCurrentStep(data.step);
            setSteps(prev => [...prev, data]);
            if (data.step === 'done') { setDone(true); setProject(data.project); setFiles(data.files ?? []); setFileTree(data.fileTree); }
            if (data.step === 'error') setFailed(true);
          } catch {}
        }
      }
    } catch (err: any) {
      setFailed(true);
      setSteps(prev => [...prev, { step: 'error', message: err.message }]);
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

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-semibold">AI Agent Builder</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>✕ Close</Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          <div className="text-sm text-muted-foreground mb-4 bg-card border border-border/50 rounded-lg px-4 py-2">
            <span className="text-primary font-medium">Building:</span> {prompt}
          </div>

          {steps.map((s, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.step === 'error' ? 'border-destructive/30 bg-destructive/5' : s.step === 'done' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/50 bg-card'}`}>
              <div className="mt-0.5">
                {s.step === 'error' ? <XCircle className="w-4 h-4 text-destructive" /> :
                 s.step === 'done' || s.step === 'fixed' || s.step === 'clean' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                 i === steps.length - 1 && !done && !failed ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> :
                 <CheckCircle2 className="w-4 h-4 text-primary/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{STEP_LABELS[s.step] ?? s.step}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.message}</p>
                {s.errors && s.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {s.errors.map((e, j) => (
                      <p key={j} className="text-xs text-destructive font-mono bg-destructive/5 px-2 py-1 rounded">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!done && !failed && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              {STEP_LABELS[currentStep] ?? 'Working...'}
            </div>
          )}

          {done && project && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => setLocation(`/workspace/${project.id}`)} className="gap-2">
                <FolderOpen className="w-4 h-4" />Open in Editor
              </Button>
              <Button variant="outline" className="gap-2" onClick={downloadZip} disabled={downloading}>
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download ZIP
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowDeploy(true)}>
                <Globe className="w-4 h-4" />Deploy
              </Button>
            </div>
          )}
        </div>

        {done && fileTree && (
          <div className="w-64 border-l border-border/50 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />{files.length} Files Created
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
