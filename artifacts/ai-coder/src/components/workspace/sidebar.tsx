import React, { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { useGetProject, useListFiles, useCreateFile, useDeleteFile, useUpdateFile } from '@workspace/api-client-react';
import { Folder, FileCode, ChevronRight, ChevronDown, Plus, Trash2, Github, RefreshCw, Loader2, FolderOpen, Check, X, ExternalLink, GitBranch, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const LANG_EXT_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', htm: 'html', css: 'css', scss: 'scss',
  json: 'json', md: 'markdown', sh: 'bash', yaml: 'yaml', yml: 'yaml',
  xml: 'xml', sql: 'sql', rs: 'rust', go: 'go', java: 'java', rb: 'ruby',
  php: 'php', txt: 'plaintext',
};
function getLanguage(name: string) {
  return LANG_EXT_MAP[name.split('.').pop()?.toLowerCase() || ''] || 'plaintext';
}

interface RepoItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha?: string;
  expanded?: boolean;
  children?: RepoItem[];
  loaded?: boolean;
}

export function WorkspaceSidebar() {
  const { activeProjectId } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<'explorer' | 'github'>('explorer');

  if (!activeProjectId) {
    return (
      <div className="h-full w-full bg-panel-bg flex flex-col items-center justify-center p-4 text-center text-muted-foreground border-r border-border/50">
        <Folder className="h-12 w-12 mb-4 opacity-20" />
        <p>No project selected.</p>
        <p className="text-xs mt-2">Select or create a project from the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-panel-bg flex flex-col border-r border-border/50">
      <div className="flex border-b border-border/50 p-1.5 gap-1">
        <Button
          variant={activeTab === 'explorer' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 justify-start h-7 text-xs font-medium"
          onClick={() => setActiveTab('explorer')}
        >
          <Folder className="h-3 w-3 mr-1.5" /> Explorer
        </Button>
        <Button
          variant={activeTab === 'github' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 justify-start h-7 text-xs font-medium"
          onClick={() => setActiveTab('github')}
        >
          <Github className="h-3 w-3 mr-1.5" /> GitHub
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'explorer' && <FileExplorer projectId={activeProjectId} />}
        {activeTab === 'github' && <GithubPanel projectId={activeProjectId} />}
      </div>

      <div className="border-t border-border/50 p-1.5">
        <Link href="/developer">
          <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground">
            <Code2 className="h-3 w-3 mr-1.5" /> Open Developer IDE
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FileExplorer({ projectId }: { projectId: number }) {
  const { data: files, isLoading, refetch } = useListFiles(projectId);
  const { data: project } = useGetProject(projectId);
  const { openFile, activeFileId } = useWorkspaceStore();
  const createFileMutation = useCreateFile();
  const deleteFileMutation = useDeleteFile();
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    const ext = newFileName.split('.').pop() || 'txt';
    const lang = getLanguage(newFileName);
    try {
      await createFileMutation.mutateAsync({
        projectId,
        data: { name: newFileName, path: `/${newFileName}`, language: lang, content: '' }
      });
      setIsCreateOpen(false);
      setNewFileName('');
      refetch();
      toast({ title: "File created" });
    } catch (err) {
      toast({ title: "Failed to create file", variant: "destructive" });
    }
  };

  const handleDelete = async (e: React.MouseEvent, fileId: number) => {
    e.stopPropagation();
    try {
      await deleteFileMutation.mutateAsync({ projectId, fileId });
      refetch();
      toast({ title: "File deleted" });
    } catch (err) {
      toast({ title: "Failed to delete file", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground animate-pulse">Loading files...</div>;

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div
          className="flex items-center justify-between p-1 hover:bg-white/5 rounded cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center text-xs font-bold text-foreground uppercase tracking-wider">
            {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
            {project?.name || 'Project'}
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-border/50 bg-card">
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFile} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="filename">File Name</Label>
                  <Input
                    id="filename"
                    placeholder="index.ts"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    autoFocus
                    className="bg-background border-border/50"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {createFileMutation.isPending ? "Creating..." : "Create File"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isExpanded && (
          <div className="mt-1 space-y-0.5">
            {files?.length === 0 ? (
              <div className="px-6 py-2 text-xs text-muted-foreground italic">No files yet.</div>
            ) : (
              files?.map(file => (
                <div
                  key={file.id}
                  onClick={() => openFile(file)}
                  className={`flex items-center justify-between px-6 py-1.5 text-sm cursor-pointer rounded-md group transition-colors ${activeFileId === file.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                >
                  <div className="flex items-center truncate">
                    <FileCode className="h-3.5 w-3.5 mr-2 opacity-70" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={(e) => handleDelete(e, file.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function GithubPanel({ projectId }: { projectId: number }) {
  const { githubToken, setGithubToken } = useWorkspaceStore();
  const { toast } = useToast();
  const createFileMutation = useCreateFile();
  const { refetch } = useListFiles(projectId);

  const [tokenInput, setTokenInput] = useState(githubToken || '');
  const [repoUrl, setRepoUrl] = useState('');
  const [tree, setTree] = useState<RepoItem[]>([]);
  const [repoLoaded, setRepoLoaded] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [importedPaths, setImportedPaths] = useState<Set<string>>(new Set());
  const [ownerRepo, setOwnerRepo] = useState('');

  const saveToken = () => {
    setGithubToken(tokenInput);
    toast({ title: 'GitHub token saved' });
  };

  const parseRepoUrl = (url: string) => {
    const cleaned = url.replace(/\/$/, '').replace(/\.git$/, '');
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    return match ? `${match[1]}/${match[2]}` : null;
  };

  const loadRepo = async () => {
    const or = parseRepoUrl(repoUrl);
    if (!or) { toast({ title: 'Invalid GitHub URL', variant: 'destructive' }); return; }
    setIsCloning(true);
    try {
      const params = new URLSearchParams({ ...(githubToken ? { token: githubToken } : {}) });
      const res = await fetch(`${BASE_PATH}/api/github/repos/${or}/contents?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data: RepoItem[] = await res.json();
      const sorted = [...data].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setTree(sorted);
      setOwnerRepo(or);
      setRepoName(or.split('/')[1]);
      setRepoLoaded(true);
      toast({ title: `Loaded ${or}` });
    } catch (err: any) {
      toast({ title: 'Failed to load repo', description: err.message, variant: 'destructive' });
    } finally {
      setIsCloning(false);
    }
  };

  const toggleDir = async (item: RepoItem, path: string[]) => {
    if (!item.loaded) {
      setLoadingPath(item.path);
      try {
        const params = new URLSearchParams({ path: item.path, ...(githubToken ? { token: githubToken } : {}) });
        const res = await fetch(`${BASE_PATH}/api/github/repos/${ownerRepo}/contents?${params}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const children: RepoItem[] = await res.json();
        const sorted = [...children].sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        updateTree(tree, item.path, { ...item, expanded: true, loaded: true, children: sorted }, setTree);
      } catch {
        toast({ title: 'Failed to load directory', variant: 'destructive' });
      } finally {
        setLoadingPath(null);
      }
    } else {
      updateTree(tree, item.path, { ...item, expanded: !item.expanded }, setTree);
    }
  };

  const importFile = async (item: RepoItem) => {
    if (importedPaths.has(item.path)) return;
    setLoadingPath(item.path);
    try {
      const params = new URLSearchParams({ path: item.path, ...(githubToken ? { token: githubToken } : {}) });
      const res = await fetch(`${BASE_PATH}/api/github/repos/${ownerRepo}/file?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await createFileMutation.mutateAsync({
        projectId,
        data: {
          name: item.name,
          path: `/${item.path}`,
          language: getLanguage(item.name),
          content: data.content || '',
        }
      });
      setImportedPaths(prev => new Set([...prev, item.path]));
      refetch();
      toast({ title: `Imported ${item.name}` });
    } catch (err: any) {
      toast({ title: `Failed to import ${item.name}`, variant: 'destructive' });
    } finally {
      setLoadingPath(null);
    }
  };

  const importAllRepo = async () => {
    setIsImportingAll(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/github/import-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repoUrl: repoUrl.trim(), token: githubToken || undefined }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Import failed'); }
      const data = await res.json();
      const files = data.files || [];
      let count = 0;
      for (const f of files) {
        try {
          await createFileMutation.mutateAsync({
            projectId,
            data: {
              name: f.name || f.path.split('/').pop(),
              path: `/${f.path}`,
              language: f.language || getLanguage(f.path),
              content: f.content || '',
            }
          });
          count++;
        } catch {}
      }
      refetch();
      toast({ title: `Imported ${count} files from ${repoName}` });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsImportingAll(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {!githubToken ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Add your GitHub Personal Access Token to access private repos and avoid rate limits.</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Personal Access Token</Label>
                <Input
                  type="password"
                  placeholder="ghp_..."
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveToken()}
                  className="h-7 text-xs bg-background border-border/50"
                />
              </div>
              <Button size="sm" className="w-full h-7 text-xs bg-primary" onClick={saveToken}>
                Save Token
              </Button>
              <div className="text-xs text-muted-foreground text-center">or use without token (60 req/hr)</div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <Check className="h-3 w-3" />
                <span>Token saved</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => { setGithubToken(null); setTokenInput(''); }}>
                Clear
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Repository URL</Label>
            <Input
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadRepo()}
              className="h-7 text-xs bg-background border-border/50"
            />
          </div>

          <div className="flex gap-1.5">
            <Button size="sm" className="flex-1 h-7 text-xs bg-primary" onClick={loadRepo} disabled={isCloning}>
              {isCloning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Github className="h-3 w-3 mr-1" />}
              Browse
            </Button>
            {repoLoaded && (
              <Button size="sm" variant="outline" className="h-7 text-xs border-border/50" onClick={importAllRepo} disabled={isImportingAll}>
                {isImportingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                Import All
              </Button>
            )}
          </div>

          {repoLoaded && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-foreground">{repoName}</span>
                <span className="ml-auto text-[10px]">click file to import</span>
              </div>
              <div className="space-y-0.5">
                {tree.map(item => (
                  <GithubTreeItem
                    key={item.path}
                    item={item}
                    depth={0}
                    onToggle={toggleDir}
                    onImport={importFile}
                    loadingPath={loadingPath}
                    importedPaths={importedPaths}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function updateTree(
  nodes: RepoItem[],
  targetPath: string,
  updated: RepoItem,
  setTree: React.Dispatch<React.SetStateAction<RepoItem[]>>
) {
  function update(items: RepoItem[]): RepoItem[] {
    return items.map(item => {
      if (item.path === targetPath) return updated;
      if (item.children) return { ...item, children: update(item.children) };
      return item;
    });
  }
  setTree(prev => update(prev));
}

function GithubTreeItem({ item, depth, onToggle, onImport, loadingPath, importedPaths }: {
  item: RepoItem;
  depth: number;
  onToggle: (item: RepoItem, path: string[]) => void;
  onImport: (item: RepoItem) => void;
  loadingPath: string | null;
  importedPaths: Set<string>;
}) {
  const isLoading = loadingPath === item.path;
  const isImported = importedPaths.has(item.path);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer text-xs group transition-colors hover:bg-accent/30 ${isImported ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'}`}
        style={{ paddingLeft: `${4 + depth * 12}px` }}
        onClick={() => item.type === 'dir' ? onToggle(item, []) : onImport(item)}
        title={item.type === 'file' ? 'Click to import into project' : 'Click to expand'}
      >
        {item.type === 'dir' ? (
          <>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin shrink-0" /> : item.expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
            {item.expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-400" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-400" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary" /> : isImported ? <Check className="h-3.5 w-3.5 shrink-0 text-green-400" /> : <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </>
        )}
        <span className="truncate flex-1">{item.name}</span>
        {item.type === 'file' && !isLoading && !isImported && (
          <Plus className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 text-primary" />
        )}
      </div>
      {item.type === 'dir' && item.expanded && item.children?.map(child => (
        <GithubTreeItem
          key={child.path}
          item={child}
          depth={depth + 1}
          onToggle={onToggle}
          onImport={onImport}
          loadingPath={loadingPath}
          importedPaths={importedPaths}
        />
      ))}
    </div>
  );
}
