import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Sparkles, ExternalLink, Plus, Trash2, Grid3X3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface App {
  id: number;
  name: string;
  description: string | null;
  url: string;
  iconUrl: string | null;
  category: string | null;
}

export default function OurAppsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', url: '', iconUrl: '', category: 'app' });
  const [saving, setSaving] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps', { credentials: 'include' });
      const data = await res.json();
      setApps(Array.isArray(data) ? data : []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast({ title: 'App added successfully' });
      setIsAddOpen(false);
      setForm({ name: '', description: '', url: '', iconUrl: '', category: 'app' });
      fetchApps();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this app?')) return;
    try {
      await fetch(`/api/apps/${id}`, { method: 'DELETE', credentials: 'include' });
      toast({ title: 'App removed' });
      setApps(prev => prev.filter(a => a.id !== id));
    } catch {
      toast({ title: 'Failed to remove app', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">ZorvixAI</span>
            </div>
          </div>
          {user?.isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary shadow-lg shadow-primary/20" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add App
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add App or Website</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>App Name *</Label>
                    <Input placeholder="My Awesome App" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-background border-border/60" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input placeholder="What does this app do?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-background border-border/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>URL *</Label>
                    <Input type="url" placeholder="https://myapp.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="bg-background border-border/60" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input type="url" placeholder="https://myapp.com/icon.png" value={form.iconUrl} onChange={e => setForm({ ...form, iconUrl: e.target.value })} className="bg-background border-border/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground">
                      {['app', 'website', 'tool', 'game', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-primary" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add App'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Grid3X3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Apps</h1>
          <p className="text-muted-foreground text-lg">Tools and websites built by the Zorvix team.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-card border border-border/50 animate-pulse" />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border/50 rounded-2xl">
            <Grid3X3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No apps yet</h3>
            <p className="text-muted-foreground text-sm">
              {user?.isAdmin ? 'Click "Add App" to add your first app or website.' : 'Check back soon for apps from the Zorvix team.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {apps.map(app => (
              <div key={app.id} className="group relative bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                {user?.isAdmin && (
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
                <div className="flex items-center gap-3 mb-3">
                  {app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{app.name}</h3>
                    {app.category && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{app.category}</span>}
                  </div>
                </div>
                {app.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{app.description}</p>}
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  Open app <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
