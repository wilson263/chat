import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Plus, Trash2, Search, Loader2, RefreshCw, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PackagesPanelProps { projectId: number | null; }
interface NpmPackage { name: string; version: string; description?: string; }

export function PackagesPanel({ projectId }: PackagesPanelProps) {
  const { toast } = useToast();
  const [deps, setDeps] = useState<Record<string, string>>({});
  const [devDeps, setDevDeps] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NpmPackage[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPackages = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${projectId}`);
      if (res.ok) { const d = await res.json(); setDeps(d.dependencies || {}); setDevDeps(d.devDependencies || {}); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPackages(); }, [projectId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/packages/npm/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } finally { setSearching(false); }
    }, 400);
  }, [searchQuery]);

  const installPackage = async (name: string, dev = isDev) => {
    if (!projectId) return;
    setInstalling(name);
    try {
      const res = await fetch(`/api/packages/${projectId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dev }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const d = await res.json();
      toast({ title: `Added ${name}@${d.version}` });
      setSearchQuery(''); setSearchResults([]);
      await fetchPackages();
    } catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    finally { setInstalling(null); }
  };

  const removePackage = async (name: string) => {
    if (!projectId) return;
    try {
      await fetch(`/api/packages/${projectId}/${encodeURIComponent(name)}`, { method: 'DELETE' });
      toast({ title: `Removed ${name}` });
      await fetchPackages();
    } catch { toast({ title: 'Failed to remove package', variant: 'destructive' }); }
  };

  const allDeps = [...Object.entries(deps).map(([n, v]) => ({ name: n, version: v, dev: false })),
    ...Object.entries(devDeps).map(([n, v]) => ({ name: n, version: v, dev: true }))];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <Package className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Packages</span>
        <Button variant="ghost" size="sm" onClick={fetchPackages} className="ml-auto h-6 w-6 p-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="p-3 border-b border-border/30 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search npm packages..." className="pl-7 h-8 text-xs" />
          {searching && <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={isDev} onChange={e => setIsDev(e.target.checked)} className="rounded" />
            <span className="text-muted-foreground">Add as devDependency</span>
          </label>
        </div>
        {searchResults.length > 0 && (
          <div className="border border-border/50 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map(pkg => (
              <div key={pkg.name} className="flex items-center gap-2 p-2 hover:bg-muted/30 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{pkg.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{pkg.description}</p>
                </div>
                <code className="text-[10px] text-muted-foreground shrink-0">{pkg.version}</code>
                <Button size="sm" onClick={() => installPackage(pkg.name)} disabled={!!installing} className="h-6 text-[10px] px-2 shrink-0">
                  {installing === pkg.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 pt-2">
        {allDeps.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-xs">No packages yet. Search and add above.</p>
          </div>
        )}
        <div className="space-y-1 pb-4">
          {allDeps.map(pkg => (
            <div key={pkg.name} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{pkg.name}</span>
                  {pkg.dev && <Badge variant="outline" className="text-[9px] h-4 px-1">dev</Badge>}
                </div>
                <span className="text-[10px] text-muted-foreground">{pkg.version}</span>
              </div>
              <a href={`https://npmjs.com/package/${pkg.name}`} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <Button variant="ghost" size="sm" onClick={() => removePackage(pkg.name)} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
