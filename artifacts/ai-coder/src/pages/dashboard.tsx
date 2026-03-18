import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useListProjects, useCreateProject, useDeleteProject, useCreateFile } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorkspaceStore } from '@/store/workspace';
import { DeployGuide } from '@/components/deploy-guide';
import { useAuth, logout } from '@/hooks/use-auth';
import {
  Code2, FolderKanban, Plus, Clock, TerminalSquare, Trash2, ArrowRight, Github, Rocket,
  Loader2, Globe, Sparkles, Info, Mail, Grid3X3, LogOut, MessageSquare, Terminal, Settings,
  BarChart3, Wand2, ChevronDown, ExternalLink, Layout, Play, LayoutTemplate, GitCompare, Compass,
  ShieldCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: projects, isLoading, refetch } = useListProjects();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const createFileMutation = useCreateFile();
  const { setActiveProject } = useWorkspaceStore();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', language: 'javascript' });
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('github_token') || '');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    try {
      const proj = await createProjectMutation.mutateAsync({ data: newProject });
      setIsCreateOpen(false);
      setNewProject({ name: '', description: '', language: 'javascript' });
      refetch();
      toast({ title: "Project created successfully" });
      openProject(proj.id);
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  };

  const handleImportGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    if (githubToken) localStorage.setItem('github_token', githubToken);

    setIsImporting(true);
    setImportProgress('Fetching repository info...');
    try {
      const resp = await fetch('/api/github/import-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: githubUrl.trim(), token: githubToken || undefined }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Import failed');
      }
      const data = await resp.json();
      setImportProgress(`Creating project "${data.repoName}" with ${data.files.length} files...`);

      const proj = await createProjectMutation.mutateAsync({
        data: { name: data.repoName, description: data.description || `Imported from GitHub`, language: data.language || 'javascript' },
      });

      setImportProgress(`Saving ${data.files.length} files...`);
      const batchSize = 5;
      for (let i = 0; i < data.files.length; i += batchSize) {
        const batch = data.files.slice(i, i + batchSize);
        await Promise.all(batch.map((f: any) =>
          createFileMutation.mutateAsync({
            projectId: proj.id,
            data: { name: f.name, path: f.path, content: f.content, language: f.language },
          })
        ));
        setImportProgress(`Saved ${Math.min(i + batchSize, data.files.length)} / ${data.files.length} files...`);
      }

      setIsImportOpen(false);
      setGithubUrl('');
      setIsImporting(false);
      setImportProgress('');
      refetch();
      toast({ title: `✅ Imported "${data.repoName}" — ${data.files.length} files`, description: data.skippedFiles > 0 ? `${data.skippedFiles} binary/large files skipped` : undefined });
      openProject(proj.id);
    } catch (err: any) {
      setIsImporting(false);
      setImportProgress('');
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  };

  const openProject = (id: number) => {
    setActiveProject(id);
    setLocation(`/workspace/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this project?")) {
      try {
        await deleteProjectMutation.mutateAsync({ id });
        refetch();
        toast({ title: "Project deleted" });
      } catch {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background"></div>
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="" className="w-full h-full object-cover mix-blend-screen opacity-20" />
      </div>

      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">AI Coder</h1>
            <p className="text-xs text-muted-foreground">Powered by GPT-5 Codex</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation('/')}>
            <MessageSquare className="h-4 w-4 mr-2" /> AI Chat
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 hover:border-violet-500/40"
            onClick={() => setLocation('/prompt-generator')}
          >
            <Wand2 className="h-4 w-4 mr-2 text-violet-400" />
            <span className="text-violet-300">Prompt Generator</span>
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation('/developer')}>
            <Terminal className="h-4 w-4 mr-2" /> Developer
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40"
            onClick={() => {
              if (projects && projects.length > 0) {
                openProject(projects[0].id);
              } else {
                setIsCreateOpen(true);
              }
            }}
          >
            <Layout className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-blue-300">Workspace</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                More <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border-border/70">
              <DropdownMenuItem onClick={() => setLocation('/playground')} className="cursor-pointer">
                <Play className="h-4 w-4 mr-2" /> AI Playground
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/templates')} className="cursor-pointer">
                <LayoutTemplate className="h-4 w-4 mr-2" /> Templates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/explore')} className="cursor-pointer">
                <Compass className="h-4 w-4 mr-2" /> Explore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/compare')} className="cursor-pointer">
                <GitCompare className="h-4 w-4 mr-2" /> Compare Models
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/analytics')} className="cursor-pointer">
                <BarChart3 className="h-4 w-4 mr-2" /> Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/usage')} className="cursor-pointer">
                <BarChart3 className="h-4 w-4 mr-2" /> Usage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/settings')} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/our-apps')} className="cursor-pointer">
                <Grid3X3 className="h-4 w-4 mr-2" /> Our Apps
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/admin')} className="cursor-pointer">
                <ShieldCheck className="h-4 w-4 mr-2" /> Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/about')} className="cursor-pointer">
                <Info className="h-4 w-4 mr-2" /> About
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/contact')} className="cursor-pointer">
                <Mail className="h-4 w-4 mr-2" /> Contact Us
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground" onClick={() => setIsDeployOpen(true)}>
            <Rocket className="h-4 w-4 mr-2 text-primary" /> Deploy
          </Button>
          {user && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={async () => { await logout(); setLocation('/login'); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {["Code Generation", "Live Preview", "GitHub Import", "50+ Languages", "AI Chat", "Error Checking", "Download ZIP", "Publish to Browser"].map(f => (
            <Badge key={f} variant="secondary" className="text-xs bg-secondary/50 border border-border/30">{f}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setLocation('/prompt-generator')}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-pink-500/5 hover:border-violet-500/40 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Prompt Generator</h3>
                <Badge className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30 px-1.5 py-0">New</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Generate professional UI/UX prompts for Figma, Canva & more design tools.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform mt-1 shrink-0" />
          </button>

          <button
            onClick={() => setLocation('/contact')}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Contact Us</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Get support, share feedback, or connect with our team via email or social channels.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 shrink-0" />
          </button>

          <button
            onClick={() => setIsDeployOpen(true)}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Deploy Project</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Publish your project to the web and share it with the world instantly.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 shrink-0" />
          </button>

          <button
            onClick={() => {
              if (projects && projects.length > 0) {
                openProject(projects[0].id);
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:border-blue-500/40 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Layout className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Workspace</h3>
                <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30 px-1.5 py-0">IDE</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Open your full IDE workspace with Monaco editor, terminal, Git, and AI assistant.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform mt-1 shrink-0" />
          </button>

          <button
            onClick={() => setLocation('/explore')}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 hover:border-teal-500/40 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Explore</h3>
                <Badge className="text-[10px] bg-teal-500/20 text-teal-300 border-teal-500/30 px-1.5 py-0">New</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Discover and fork community projects. Find inspiration from what others are building.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-teal-400 group-hover:translate-x-1 transition-transform mt-1 shrink-0" />
          </button>

          <button
            onClick={() => setLocation('/admin')}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 hover:border-orange-500/40 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Admin</h3>
                <Badge className="text-[10px] bg-orange-500/20 text-orange-300 border-orange-500/30 px-1.5 py-0">Admin</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Manage users, view platform stats, and control system settings.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-orange-400 group-hover:translate-x-1 transition-transform mt-1 shrink-0" />
          </button>

          <button
            onClick={() => setLocation('/settings')}
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center shrink-0">
              <Settings className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Settings</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Manage your account, API keys, preferences, and appearance settings.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 shrink-0" />
          </button>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Projects</h2>
            <p className="text-muted-foreground mt-1">Build websites, apps, and scripts with AI assistance.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isImportOpen} onOpenChange={v => { if (!isImporting) setIsImportOpen(v); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border/50 hover:border-primary/50">
                  <Github className="mr-2 h-4 w-4" /> Import from GitHub
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Github className="h-5 w-5" /> Import GitHub Repository</DialogTitle>
                  <DialogDescription>Paste any public GitHub URL to import all its files into a new project.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleImportGithub} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Repository URL</Label>
                    <Input
                      placeholder="https://github.com/owner/repo"
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                      className="bg-background border-border/50 font-mono text-sm"
                      disabled={isImporting}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Works with any public GitHub repository. No login required for public repos.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub Token <span className="text-muted-foreground font-normal">(optional — for private repos)</span></Label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={githubToken}
                      onChange={e => setGithubToken(e.target.value)}
                      className="bg-background border-border/50 font-mono text-sm"
                      disabled={isImporting}
                    />
                  </div>
                  {isImporting && (
                    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                      <span className="text-sm text-primary">{importProgress}</span>
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-primary" disabled={isImporting}>
                    {isImporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : <><Github className="h-4 w-4 mr-2" /> Import Repository</>}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Setup a new AI-powered coding workspace.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input placeholder="my-awesome-app" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="bg-background border-border/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input placeholder="A brief description..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-background border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Language</Label>
                    <select value={newProject.language} onChange={e => setNewProject({ ...newProject, language: e.target.value })} className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground">
                      {["javascript","typescript","python","html","css","java","cpp","c","csharp","go","rust","swift","kotlin","php","ruby","sql","bash"].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-primary" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-card border border-border/50 animate-pulse" />)}
          </div>
        ) : projects?.length === 0 ? (
          <div className="rounded-3xl p-12 text-center border border-border/30 bg-card/50 max-w-2xl mx-auto mt-12">
            <FolderKanban className="h-16 w-16 mx-auto mb-6 text-primary/40" />
            <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-8">Create a new project or import one from GitHub to get started.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsImportOpen(true)} variant="outline" className="border-border/50">
                <Github className="mr-2 h-4 w-4" /> Import from GitHub
              </Button>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects?.map(project => (
              <Card key={project.id} className="group cursor-pointer bg-card hover:bg-card/80 border-border/50 hover:border-primary/30 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-primary/5 overflow-hidden relative" onClick={() => openProject(project.id)}>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={e => handleDelete(e, project.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors mb-3">
                    <TerminalSquare className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[36px] text-xs">{project.description || "No description"}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-2 pb-3 text-xs text-muted-foreground flex justify-between items-center border-t border-border/30 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/hosted/${project.id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-muted-foreground hover:text-green-400 transition-colors"
                      title="View live site"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <DeployGuide open={isDeployOpen} onClose={() => setIsDeployOpen(false)} />
    </div>
  );
}
