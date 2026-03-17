import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, GitCommit, GitPullRequest, Plus, RefreshCw, Loader2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GitPanelProps { owner?: string; repo?: string; token?: string; }

interface Commit { sha: string; shortSha: string; message: string; author: string; date: string; url: string; }
interface Branch { name: string; sha: string; protected: boolean; }
interface PR { number: number; title: string; head: string; base: string; author: string; url: string; createdAt: string; }

export function GitPanel({ owner, repo, token }: GitPanelProps) {
  const { toast } = useToast();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [prs, setPRs] = useState<PR[]>([]);
  const [activeBranch, setActiveBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!owner || !repo) return;
    setLoading(true);
    try {
      const q = token ? `?token=${token}` : '';
      const [branchRes, commitRes, prRes] = await Promise.all([
        fetch(`/api/gitops/${owner}/${repo}/branches${q}`),
        fetch(`/api/gitops/${owner}/${repo}/commits?branch=${activeBranch}${token ? `&token=${token}` : ''}`),
        fetch(`/api/gitops/${owner}/${repo}/pull-requests${q}`),
      ]);
      if (branchRes.ok) setBranches(await branchRes.json());
      if (commitRes.ok) setCommits(await commitRes.json());
      if (prRes.ok) setPRs(await prRes.json());
    } catch { toast({ title: 'Failed to load git data', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [owner, repo, activeBranch]);

  const createBranch = async () => {
    if (!newBranch.trim() || !owner || !repo || !token) return;
    const fromSha = branches.find(b => b.name === activeBranch)?.sha;
    if (!fromSha) { toast({ title: 'Could not find base branch SHA', variant: 'destructive' }); return; }
    setCreatingBranch(true);
    try {
      const res = await fetch(`/api/gitops/${owner}/${repo}/create-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, branchName: newBranch.trim(), fromSha }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: `Branch "${newBranch}" created!` });
      setNewBranch('');
      await fetchAll();
    } catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    finally { setCreatingBranch(false); }
  };

  if (!owner || !repo) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6">
        <GitBranch className="h-10 w-10 opacity-30" />
        <p className="text-sm text-center">Import a GitHub repository to use Git features</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0 bg-background/50">
        <GitBranch className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">{owner}/{repo}</span>
        <Button variant="ghost" size="sm" onClick={fetchAll} className="ml-auto h-6 w-6 p-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <Tabs defaultValue="commits" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 grid grid-cols-3 h-8">
          <TabsTrigger value="commits" className="text-xs">Commits</TabsTrigger>
          <TabsTrigger value="branches" className="text-xs">Branches</TabsTrigger>
          <TabsTrigger value="prs" className="text-xs">PRs</TabsTrigger>
        </TabsList>
        <TabsContent value="commits" className="flex-1 overflow-hidden mt-2">
          <div className="px-3 mb-2">
            <select value={activeBranch} onChange={e => setActiveBranch(e.target.value)}
              className="w-full text-xs bg-card border border-border/50 rounded px-2 py-1.5 text-foreground">
              {branches.map(b => <option key={b.name} value={b.name}>{b.name}{b.protected ? ' 🔒' : ''}</option>)}
            </select>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-2 pb-4">
              {commits.map(c => (
                <div key={c.sha} className="border border-border/40 rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedCommit(expandedCommit === c.sha ? null : c.sha)}
                    className="w-full flex items-start gap-2 p-2.5 hover:bg-muted/30 text-left">
                    <GitCommit className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.message.split('\n')[0]}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.author} · {new Date(c.date).toLocaleDateString()}</p>
                    </div>
                    <code className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{c.shortSha}</code>
                    {expandedCommit === c.sha ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                  {expandedCommit === c.sha && (
                    <div className="px-3 pb-2 border-t border-border/30 bg-muted/20">
                      <pre className="text-[10px] text-muted-foreground mt-2 whitespace-pre-wrap">{c.message}</pre>
                      <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary mt-2 hover:underline">
                        <ExternalLink className="h-2.5 w-2.5" /> View on GitHub
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {!loading && commits.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No commits found</p>}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="branches" className="flex-1 overflow-hidden mt-2 flex flex-col gap-2 px-3">
          {token && (
            <div className="flex gap-2">
              <Input value={newBranch} onChange={e => setNewBranch(e.target.value)} placeholder="new-branch-name" className="h-8 text-xs" onKeyDown={e => e.key === 'Enter' && createBranch()} />
              <Button size="sm" onClick={createBranch} disabled={creatingBranch || !newBranch.trim()} className="h-8 text-xs px-3">
                {creatingBranch ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1">
            <div className="space-y-1.5 pb-4">
              {branches.map(b => (
                <button key={b.name} onClick={() => setActiveBranch(b.name)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${b.name === activeBranch ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}>
                  <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs flex-1 truncate">{b.name}</span>
                  {b.protected && <Badge variant="outline" className="text-[9px] h-4 px-1">protected</Badge>}
                  {b.name === activeBranch && <Badge className="text-[9px] h-4 px-1">active</Badge>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="prs" className="flex-1 overflow-hidden mt-2">
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-2 pb-4">
              {prs.map(pr => (
                <div key={pr.number} className="border border-border/40 rounded-lg p-2.5 hover:border-border/70 transition-colors">
                  <div className="flex items-start gap-2">
                    <GitPullRequest className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{pr.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{pr.head} → {pr.base} · {pr.author}</p>
                    </div>
                    <a href={pr.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" /></a>
                  </div>
                </div>
              ))}
              {!loading && prs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No open pull requests</p>}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
