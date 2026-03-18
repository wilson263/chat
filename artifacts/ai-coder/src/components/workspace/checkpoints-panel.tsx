import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History, Save, RotateCcw, Trash2, Clock, FileText, CheckCircle2, Plus, Camera,
} from 'lucide-react';

interface Checkpoint {
  id: string;
  label: string;
  createdAt: number;
  files: Array<{ id: number; name: string; content: string; language: string }>;
  auto: boolean;
}

const STORAGE_KEY = 'workspace_checkpoints';
const AUTO_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function loadCheckpoints(projectId: number): Checkpoint[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCheckpoints(projectId: number, cps: Checkpoint[]) {
  try {
    // Keep max 20 checkpoints per project
    const trimmed = cps.slice(-20);
    localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(trimmed));
  } catch { }
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (diff < 60_000) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function CheckpointsPanel() {
  const { openFiles, activeProjectId } = useWorkspaceStore();
  const { toast } = useToast();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [label, setLabel] = useState('');
  const [tick, setTick] = useState(0);

  // Force re-render for "time ago" display
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    setCheckpoints(loadCheckpoints(activeProjectId));
  }, [activeProjectId]);

  const createCheckpoint = useCallback((auto = false, customLabel?: string) => {
    if (!activeProjectId || openFiles.length === 0) return;
    const cp: Checkpoint = {
      id: Date.now().toString(),
      label: customLabel || label.trim() || `Checkpoint ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      files: openFiles.map(f => ({ id: f.id, name: f.name, content: f.content, language: f.language })),
      auto,
    };
    setCheckpoints(prev => {
      const next = [...prev, cp];
      saveCheckpoints(activeProjectId, next);
      return next;
    });
    if (!auto) {
      setLabel('');
      toast({ title: `✅ Checkpoint saved: ${cp.label}` });
    }
  }, [activeProjectId, openFiles, label, toast]);

  // Auto-checkpoint every 5 minutes when files are open
  useEffect(() => {
    if (!activeProjectId || openFiles.length === 0) return;
    const interval = setInterval(() => {
      createCheckpoint(true, `Auto-save ${new Date().toLocaleTimeString()}`);
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeProjectId, openFiles, createCheckpoint]);

  const restoreCheckpoint = (cp: Checkpoint) => {
    const { setOpenFiles } = useWorkspaceStore.getState();
    // Restore files — map back to OpenFile shape
    const restored = cp.files.map(f => ({ ...f, modified: false }));
    setOpenFiles(restored as any);
    toast({ title: `↩️ Restored: ${cp.label}`, description: `${cp.files.length} file(s) restored` });
  };

  const deleteCheckpoint = (id: string) => {
    if (!activeProjectId) return;
    setCheckpoints(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCheckpoints(activeProjectId, next);
      return next;
    });
  };

  const clearAll = () => {
    if (!activeProjectId) return;
    if (!confirm('Delete all checkpoints for this project?')) return;
    setCheckpoints([]);
    saveCheckpoints(activeProjectId, []);
    toast({ title: 'All checkpoints cleared' });
  };

  if (!activeProjectId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="text-muted-foreground text-sm">Open a project to use checkpoints.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Checkpoints</span>
            <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">{checkpoints.length} / 20</span>
          </div>
          {checkpoints.length > 0 && (
            <button onClick={clearAll} className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors">Clear all</button>
          )}
        </div>

        {/* Create checkpoint */}
        <div className="flex gap-1.5">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createCheckpoint(false); }}
            placeholder="Checkpoint label (optional)"
            className="flex-1 bg-muted border border-border/40 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="sm" onClick={() => createCheckpoint(false)} className="h-7 px-2 text-xs shrink-0">
            <Camera className="w-3 h-3 mr-1" />Save
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />Auto-saves every 5 minutes · Max 20 checkpoints
        </p>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {checkpoints.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <History className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No checkpoints yet.</p>
            <p className="text-xs mt-1 opacity-70">Click Save to snapshot your files now.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {[...checkpoints].reverse().map(cp => (
              <div key={cp.id} className="group p-3 rounded-lg border border-border/40 hover:border-primary/30 bg-card/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {cp.auto
                        ? <Clock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        : <Camera className="w-3 h-3 text-primary shrink-0" />
                      }
                      <span className="text-xs font-medium truncate">{cp.label}</span>
                      {cp.auto && <span className="text-[9px] text-muted-foreground/50 bg-muted px-1 py-0.5 rounded shrink-0">auto</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                      <span>{timeAgo(cp.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{cp.files.length} file{cp.files.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => restoreCheckpoint(cp)} className="p-1 rounded text-primary hover:bg-primary/10 transition-colors" title="Restore">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteCheckpoint(cp.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
