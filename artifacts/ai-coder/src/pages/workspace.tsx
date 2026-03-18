import React, { useEffect, useState, useCallback } from 'react';
import { useRoute, Link } from 'wouter';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { WorkspaceSidebar } from '@/components/workspace/sidebar';
import { WorkspaceEditor } from '@/components/workspace/editor';
import { AiPanel } from '@/components/workspace/ai-panel';
import { LivePreview } from '@/components/workspace/preview';
import { DeployGuide } from '@/components/deploy-guide';
import { WorkspaceTerminal } from '@/components/workspace/terminal';
import { GitPanel } from '@/components/workspace/git-panel';
import { PackagesPanel } from '@/components/workspace/packages-panel';
import { DbPanel } from '@/components/workspace/db-panel';
import { SecretsPanel } from '@/components/workspace/secrets-panel';
import { PluginsPanel } from '@/components/workspace/plugins-panel';
import { CollabPresence } from '@/components/workspace/collab-presence';
import { CheckpointsPanel } from '@/components/workspace/checkpoints-panel';
import { KvPanel } from '@/components/workspace/kv-panel';
import { useWorkspaceStore } from '@/store/workspace';
import { useListFiles } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Code2, ArrowLeft, Download, Rocket, Eye, EyeOff, Terminal, GitBranch, Package, Database, KeyRound, Puzzle, ChevronDown, ChevronUp, Globe, Cloud, CloudOff, Copy, ExternalLink, CheckCircle2, Loader2, History, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';

type BottomTab = 'terminal' | 'git' | 'packages' | 'db' | 'secrets' | 'plugins' | 'checkpoints' | 'kv';
const BOTTOM_TABS: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'db', label: 'Database', icon: Database },
  { id: 'secrets', label: 'Secrets', icon: KeyRound },
  { id: 'plugins', label: 'Extensions', icon: Puzzle },
  { id: 'checkpoints', label: 'Checkpoints', icon: History },
  { id: 'kv', label: 'KV Store', icon: ServerCrash },
];

export default function WorkspacePage() {
  const [, params] = useRoute('/workspace/:id');
  const { setActiveProject, activeProjectId, openFiles, githubToken } = useWorkspaceStore();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [bottomOpen, setBottomOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishStatusLoading, setPublishStatusLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: files } = useListFiles(activeProjectId ?? 0, {
    query: { enabled: !!activeProjectId, queryKey: ['listFiles', activeProjectId] }
  });

  useEffect(() => {
    if (params?.id) setActiveProject(parseInt(params.id, 10));
  }, [params?.id, setActiveProject]);

  useEffect(() => {
    if (!activeProjectId) return;
    setPublishStatusLoading(true);
    fetch(`/api/hosting/status/${activeProjectId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setIsPublished(data.published ?? false); })
      .catch(() => setIsPublished(false))
      .finally(() => setPublishStatusLoading(false));
  }, [activeProjectId]);

  const liveUrl = activeProjectId ? `${window.location.origin}/hosted/${activeProjectId}/` : '';

  const handlePublish = useCallback(async () => {
    if (!activeProjectId) return;
    setPublishLoading(true);
    try {
      const endpoint = isPublished ? 'unpublish' : 'publish';
      const res = await fetch(`/api/hosting/${endpoint}/${activeProjectId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Request failed');
      setIsPublished(!isPublished);
      if (!isPublished) {
        toast({
          title: 'Project is now LIVE!',
          description: `Your app is live at /hosted/${activeProjectId}/`,
        });
      } else {
        toast({ title: 'Project unpublished', description: 'Your app is no longer publicly accessible.' });
      }
    } catch {
      toast({ title: 'Failed to update hosting', variant: 'destructive' });
    } finally {
      setPublishLoading(false);
    }
  }, [activeProjectId, isPublished, toast]);

  const copyLiveUrl = useCallback(() => {
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'URL copied!' });
    });
  }, [liveUrl, toast]);

  const openBottomTab = (tab: BottomTab) => { setBottomTab(tab); setBottomOpen(true); };

  const downloadZip = useCallback(async () => {
    const allFiles = openFiles.length > 0 ? openFiles : (files || []);
    if (allFiles.length === 0) { toast({ title: "No files to download", variant: "destructive" }); return; }
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const file of allFiles) zip.file(file.path || file.name, file.content || '');
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `project-${activeProjectId}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded project ZIP" });
    } catch { toast({ title: "Download failed", variant: "destructive" }); }
  }, [openFiles, files, activeProjectId, toast]);

  if (!activeProjectId) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading workspace...</div>;
  }

  const bottomPanelHeight = bottomOpen ? 260 : 32;

  return (
    <TooltipProvider>
      <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">

        {/* Live URL banner */}
        {isPublished && (
          <div className="bg-green-950/60 border-b border-green-700/40 px-4 py-1.5 flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-green-300/80 text-xs font-mono truncate flex-1">{liveUrl}</span>
            <button
              onClick={copyLiveUrl}
              className="flex items-center gap-1 text-green-400 hover:text-green-200 text-xs transition-colors"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-400 hover:text-green-200 text-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        )}

        {/* Top bar */}
        <header className="h-12 border-b border-border/50 bg-card flex items-center justify-between px-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center"><Code2 className="h-3.5 w-3.5 text-primary" /></div>
              <span className="font-semibold text-sm">ZorvixAI Workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CollabPresence projectId={activeProjectId} />
            <div className="w-px h-5 bg-border/50 mx-1" />
            <Button variant={showPreview ? "default" : "ghost"} size="sm" className="h-8 text-xs" onClick={() => setShowPreview(v => !v)}>
              {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
              {showPreview ? "Hide Preview" : "Live Preview"}
            </Button>

            {/* Cloud Publish Button */}
            <Button
              variant={isPublished ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${isPublished ? 'bg-green-700 hover:bg-green-800 text-white' : 'text-muted-foreground'}`}
              onClick={handlePublish}
              disabled={publishLoading || publishStatusLoading}
            >
              {publishLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : isPublished ? (
                <CloudOff className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Cloud className="h-3.5 w-3.5 mr-1.5" />
              )}
              {publishLoading ? 'Publishing...' : isPublished ? 'Unpublish' : 'Publish Live'}
            </Button>

            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={downloadZip}><Download className="h-3.5 w-3.5 mr-1.5" />ZIP</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => setIsDeployOpen(true)}><Rocket className="h-3.5 w-3.5 mr-1.5" />Deploy</Button>
          </div>
        </header>

        {/* Editor area */}
        <div className="flex-1 overflow-hidden" style={{ height: `calc(100vh - 3rem - ${bottomPanelHeight}px - ${isPublished ? 36 : 0}px)` }}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={16} minSize={13} maxSize={28} className="bg-panel-bg z-10">
              <WorkspaceSidebar />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border/50 w-1 hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize={showPreview ? 42 : 57} minSize={25}>
              {showPreview ? (
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={55} minSize={25}><WorkspaceEditor /></ResizablePanel>
                  <ResizableHandle withHandle className="bg-border/50 h-1 hover:bg-primary/50 transition-colors" />
                  <ResizablePanel defaultSize={45} minSize={20}><LivePreview /></ResizablePanel>
                </ResizablePanelGroup>
              ) : <WorkspaceEditor />}
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border/50 w-1 hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize={27} minSize={20} maxSize={42} className="bg-panel-bg z-10">
              <AiPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Bottom panel */}
        <div className="border-t border-border/50 bg-card shrink-0 flex flex-col" style={{ height: bottomPanelHeight }}>
          <div className="flex items-center gap-0 px-2 h-8 border-b border-border/30 bg-[#0d1117] shrink-0">
            {BOTTOM_TABS.map(tab => (
              <button key={tab.id}
                onClick={() => { if (bottomTab === tab.id && bottomOpen) setBottomOpen(false); else openBottomTab(tab.id); }}
                className={`flex items-center gap-1.5 px-3 h-7 text-[11px] rounded-sm transition-colors font-medium ${bottomTab === tab.id && bottomOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                <tab.icon className="h-3 w-3" />{tab.label}
              </button>
            ))}
            <div className="ml-auto">
              <button onClick={() => setBottomOpen(v => !v)} className="flex items-center gap-1 px-2 h-7 text-[11px] text-muted-foreground hover:text-foreground">
                {bottomOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {bottomOpen && (
            <div className="flex-1 overflow-hidden">
              {bottomTab === 'terminal' && <WorkspaceTerminal />}
              {bottomTab === 'git' && <GitPanel owner={undefined} repo={undefined} token={githubToken || undefined} />}
              {bottomTab === 'packages' && <PackagesPanel projectId={activeProjectId} />}
              {bottomTab === 'db' && <DbPanel />}
              {bottomTab === 'secrets' && <SecretsPanel projectId={activeProjectId} />}
              {bottomTab === 'plugins' && <PluginsPanel />}
              {bottomTab === 'checkpoints' && <CheckpointsPanel />}
              {bottomTab === 'kv' && <KvPanel />}
            </div>
          )}
        </div>

        {/* Status bar */}
        <footer className="h-6 bg-accent border-t border-border/50 flex items-center px-4 text-[10px] text-accent-foreground/80 justify-between shrink-0 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-2" />Ready</span>
            <span>Project #{activeProjectId}</span>
            <span>{openFiles.length} file{openFiles.length !== 1 ? 's' : ''} open</span>
            <button onClick={() => openBottomTab('terminal')} className="text-primary hover:underline">Terminal</button>
            <button onClick={() => openBottomTab('git')} className="text-primary hover:underline">Git</button>
            <button onClick={() => openBottomTab('secrets')} className="text-primary hover:underline">Secrets</button>
          </div>
          <div className="flex items-center gap-4">
            {isPublished && (
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            )}
            <span>AI Autocomplete: ON</span>
            <span>Collab: LIVE</span>
            <span className="text-primary font-semibold">ZorvixAI</span>
          </div>
        </footer>

        <DeployGuide open={isDeployOpen} onClose={() => setIsDeployOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
