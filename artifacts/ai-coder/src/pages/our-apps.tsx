import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageLayout, PageHero } from '@/components/page-layout';
import { ExternalLink, Plus, Trash2, Grid3X3, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface App {
  id: number; name: string; description: string | null;
  url: string; iconUrl: string | null; category: string | null;
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
    } catch { setApps([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast({ title: 'App added successfully' });
      setIsAddOpen(false);
      setForm({ name: '', description: '', url: '', iconUrl: '', category: 'app' });
      fetchApps();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this app?')) return;
    try {
      await fetch(`/api/apps/${id}`, { method: 'DELETE', credentials: 'include' });
      toast({ title: 'App removed' });
      setApps(prev => prev.filter(a => a.id !== id));
    } catch { toast({ title: 'Failed to remove app', variant: 'destructive' }); }
  };

  const addButton = user?.isAdmin ? (
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary shadow-lg shadow-primary/20 h-8 text-xs gap-1.5" size="sm">
          <Plus className="w-3.5 h-3.5" /> Add App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base">Add App or Website</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">App Name *</Label>
            <Input placeholder="My Awesome App" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input placeholder="What does this app do?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL *</Label>
            <Input type="url" placeholder="https://myapp.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="h-9" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Icon URL <span className="text-muted-foreground/50">(optional)</span></Label>
            <Input type="url" placeholder="https://myapp.com/icon.png" value={form.iconUrl} onChange={e => setForm({ ...form, iconUrl: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground h-9">
              {['app', 'website', 'tool', 'game', 'other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full h-9 bg-primary" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</> : 'Add App'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  ) : undefined;

  return (
    <PageLayout crumbs={[{ label: 'Our Apps' }]} backHref="/" actions={addButton} withMeshBg>
      <PageHero
        icon={<Grid3X3 className="w-7 h-7 text-primary" />}
        title="Our Apps"
        description="Tools and websites built by the Zorvix team."
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-24 bg-surface-1 border border-border rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
            <Grid3X3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No apps yet</h3>
          <p className="text-sm text-muted-foreground">
            {user?.isAdmin ? 'Click "Add App" to add your first app.' : 'Check back soon for apps from the Zorvix team.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {apps.map(app => (
            <div key={app.id} className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
              {user?.isAdmin && (
                <button
                  onClick={() => handleDelete(app.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-bold text-primary">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{app.name}</h3>
                  {app.category && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{app.category}</span>
                  )}
                </div>
              </div>

              {app.description && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{app.description}</p>
              )}

              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
