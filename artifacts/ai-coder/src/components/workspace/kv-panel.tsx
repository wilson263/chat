import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Database, Plus, Trash2, Edit3, Check, X, Copy, Search, RefreshCw } from 'lucide-react';

interface KVEntry { key: string; value: string; updatedAt: number; }

const STORAGE_KEY = 'zorvixai_kv_store';

function loadKV(): KVEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveKV(entries: KVEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { }
}

export function KvPanel() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<KVEntry[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { setEntries(loadKV()); }, []);

  const filtered = entries.filter(e =>
    !search || e.key.toLowerCase().includes(search.toLowerCase()) || e.value.toLowerCase().includes(search.toLowerCase())
  );

  const set = () => {
    if (!newKey.trim()) { toast({ title: 'Key is required', variant: 'destructive' }); return; }
    const entry: KVEntry = { key: newKey.trim(), value: newVal, updatedAt: Date.now() };
    setEntries(prev => {
      const next = prev.filter(e => e.key !== entry.key);
      const updated = [...next, entry];
      saveKV(updated);
      return updated;
    });
    setNewKey(''); setNewVal('');
    toast({ title: `✅ Set "${entry.key}"` });
  };

  const del = (key: string) => {
    setEntries(prev => { const next = prev.filter(e => e.key !== key); saveKV(next); return next; });
    toast({ title: `Deleted "${key}"` });
  };

  const startEdit = (e: KVEntry) => { setEditKey(e.key); setEditVal(e.value); };
  const saveEdit = () => {
    if (!editKey) return;
    setEntries(prev => {
      const next = prev.map(e => e.key === editKey ? { ...e, value: editVal, updatedAt: Date.now() } : e);
      saveKV(next);
      return next;
    });
    setEditKey(null);
    toast({ title: `Updated "${editKey}"` });
  };

  const copyVal = (val: string) => { navigator.clipboard.writeText(val); toast({ title: 'Copied!' }); };

  const clearAll = () => {
    if (!confirm('Delete ALL keys from the KV store?')) return;
    setEntries([]);
    saveKV([]);
    toast({ title: 'KV store cleared' });
  };

  const getSnippet = () => {
    return [
      '// Built-in ZorvixAI KV Store — access anywhere in your project:',
      'const db = {',
      '  get: (key) => JSON.parse(localStorage.getItem("zorvix_" + key)),',
      '  set: (key, val) => localStorage.setItem("zorvix_" + key, JSON.stringify(val)),',
      '  del: (key) => localStorage.removeItem("zorvix_" + key),',
      '};',
      '',
      '// Usage:',
      'db.set("user", { name: "Alice", score: 42 });',
      'console.log(db.get("user")); // { name: "Alice", score: 42 }',
    ].join('\n');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Built-in KV Database</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{entries.length} keys</span>
          </div>
          {entries.length > 0 && (
            <button onClick={clearAll} className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors">Clear all</button>
          )}
        </div>

        {/* Set new key */}
        <div className="flex gap-1.5">
          <input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') set(); }}
            placeholder="key"
            className="w-28 bg-muted border border-border/40 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <input
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') set(); }}
            placeholder="value"
            className="flex-1 bg-muted border border-border/40 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          <Button size="sm" onClick={set} className="h-7 px-2 text-xs shrink-0">
            <Plus className="w-3 h-3 mr-1" />Set
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search keys or values…"
            className="w-full pl-6 pr-3 py-1 bg-muted border border-border/40 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Entries */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {entries.length === 0 ? (
              <>
                <p>No keys yet.</p>
                <p className="text-xs mt-1 opacity-70">Add a key-value pair above to get started.</p>
              </>
            ) : <p>No keys match your search.</p>}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map(e => (
              <div key={e.key} className="group p-2.5 rounded-lg border border-border/40 hover:border-primary/30 bg-card/50 transition-colors">
                {editKey === e.key ? (
                  <div className="space-y-1.5">
                    <code className="text-xs text-primary font-mono">{e.key}</code>
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        value={editVal}
                        onChange={ev => setEditVal(ev.target.value)}
                        onKeyDown={ev => { if (ev.key === 'Enter') saveEdit(); if (ev.key === 'Escape') setEditKey(null); }}
                        className="flex-1 bg-muted border border-border/40 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button onClick={saveEdit} className="p-1 rounded text-green-400 hover:bg-green-400/10"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setEditKey(null)} className="p-1 rounded text-muted-foreground hover:bg-muted"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs text-primary font-mono block truncate">{e.key}</code>
                      <code className="text-xs text-muted-foreground font-mono block truncate mt-0.5">{e.value || <span className="opacity-40 italic">empty</span>}</code>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => copyVal(e.value)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="Copy value"><Copy className="w-3 h-3" /></button>
                      <button onClick={() => startEdit(e)} className="p-1 rounded text-muted-foreground hover:text-primary" title="Edit"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={() => del(e.key)} className="p-1 rounded text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Code snippet */}
      <div className="p-2 border-t border-border/30 shrink-0">
        <div className="rounded-lg bg-muted/50 border border-border/30 p-2 text-[10px] font-mono text-muted-foreground leading-relaxed overflow-x-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Usage snippet</span>
            <button onClick={() => { navigator.clipboard.writeText(getSnippet()); toast({ title: 'Snippet copied!' }); }} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3 h-3" /></button>
          </div>
          <pre className="whitespace-pre-wrap">{`db.set("key", "value")\ndb.get("key")  → "value"\ndb.del("key")`}</pre>
        </div>
      </div>
    </div>
  );
}
