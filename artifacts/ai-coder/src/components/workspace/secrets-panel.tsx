import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Plus, Trash2, Eye, EyeOff, Download, RefreshCw, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Secret { id: number; key: string; description: string; created_at: string; updated_at: string; }
interface SecretsPanelProps { projectId: number | null; }

export function SecretsPanel({ projectId }: SecretsPanelProps) {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [adding, setAdding] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchSecrets = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/secrets/${projectId}`);
      if (res.ok) setSecrets(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSecrets(); }, [projectId]);

  const addSecret = async () => {
    if (!projectId || !newKey.trim() || !newValue.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/secrets/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey.trim(), value: newValue.trim(), description: newDesc.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: `Secret ${newKey.toUpperCase()} saved` });
      setNewKey(''); setNewValue(''); setNewDesc('');
      await fetchSecrets();
    } catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    finally { setAdding(false); }
  };

  const deleteSecret = async (id: number, key: string) => {
    try {
      await fetch(`/api/secrets/${projectId}/${id}`, { method: 'DELETE' });
      toast({ title: `Secret ${key} deleted` });
      await fetchSecrets();
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const exportEnv = () => {
    window.open(`/api/secrets/${projectId}/export/env`, '_blank');
  };

  const toggleVisible = (id: number) => {
    setVisibleValues(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
        <KeyRound className="h-8 w-8 opacity-30" />
        <p className="text-xs">Open a project to manage secrets</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <KeyRound className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Secrets Manager</span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={exportEnv} className="h-6 text-[10px] px-2 gap-1">
            <Download className="h-3 w-3" /> .env
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchSecrets} className="h-6 w-6 p-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="p-3 border-b border-border/30 space-y-2">
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" /> Keys are stored encrypted per project. Never committed to git.
        </div>
        <Input value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase())} placeholder="KEY_NAME" className="h-7 text-xs font-mono" />
        <div className="relative">
          <Input type={showValue ? 'text' : 'password'} value={newValue} onChange={e => setNewValue(e.target.value)}
            placeholder="value" className="h-7 text-xs font-mono pr-8" />
          <button onClick={() => setShowValue(!showValue)} className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground">
            {showValue ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="h-7 text-xs" />
        <Button size="sm" onClick={addSecret} disabled={adding || !newKey.trim() || !newValue.trim()} className="w-full h-7 text-xs">
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          Add Secret
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 pt-2">
        <div className="space-y-2 pb-4">
          {secrets.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
              <KeyRound className="h-6 w-6 opacity-30" />
              <p className="text-xs">No secrets yet</p>
            </div>
          )}
          {secrets.map(s => (
            <div key={s.id} className="border border-border/40 rounded-lg p-2.5 hover:border-border/70 transition-colors">
              <div className="flex items-center gap-2">
                <code className="text-xs font-semibold text-primary flex-1 truncate">{s.key}</code>
                <button onClick={() => toggleVisible(s.id)} className="text-muted-foreground hover:text-foreground">
                  {visibleValues.has(s.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <Button variant="ghost" size="sm" onClick={() => deleteSecret(s.id, s.key)} className="h-5 w-5 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {visibleValues.has(s.id) && (
                <div className="mt-1.5">
                  {editingId === s.id ? (
                    <div className="flex gap-1">
                      <Input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-6 text-xs font-mono flex-1" />
                      <Button size="sm" className="h-6 text-[10px] px-2" onClick={async () => {
                        await fetch(`/api/secrets/${projectId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: s.key, value: editValue, description: s.description }) });
                        setEditingId(null); await fetchSecrets(); toast({ title: 'Secret updated' });
                      }}>Save</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setEditingId(s.id); setEditValue(''); }}>
                      <code className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded flex-1">{'•'.repeat(12)}</code>
                      <span className="text-[10px] text-muted-foreground">click to edit</span>
                    </div>
                  )}
                </div>
              )}
              {s.description && <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>}
              <p className="text-[9px] text-muted-foreground/50 mt-1">Updated {new Date(s.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
