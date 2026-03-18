import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { Monitor, ExternalLink, RefreshCw, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  ts: number;
}

export function LivePreview() {
  const { activeProjectId, openFiles } = useWorkspaceStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen to console messages from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleEntries(prev => [...prev, {
          level: e.data.level as ConsoleEntry['level'],
          message: e.data.message,
          ts: Date.now(),
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Auto-refresh preview whenever files change
  useEffect(() => {
    if (!activeProjectId) return;
    const timer = setTimeout(() => {
      setRefreshKey(k => k + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [openFiles, activeProjectId]);

  const refresh = useCallback(() => {
    setConsoleEntries([]);
    setIsLoading(true);
    setRefreshKey(k => k + 1);
  }, []);

  const openInNewTab = useCallback(() => {
    if (!activeProjectId) return;
    window.open(`/api/hosting/preview/${activeProjectId}/`, '_blank');
  }, [activeProjectId]);

  if (!activeProjectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-[#0d0d0d]">
        <Monitor className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No project selected</p>
        <p className="text-xs mt-1 opacity-60">Open a project to see a live preview</p>
      </div>
    );
  }

  const previewUrl = `/api/hosting/preview/${activeProjectId}/`;

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/40 bg-card shrink-0">
        <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <div className="flex-1 bg-background/60 border border-border/40 rounded px-2 py-0.5 text-[11px] text-muted-foreground font-mono truncate select-none">
          {previewUrl}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={refresh}
          title="Refresh preview"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={openInNewTab}
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-muted-foreground px-2 shrink-0"
          onClick={() => setConsoleOpen(v => !v)}
        >
          Console {consoleEntries.length > 0 && (
            <span className="ml-1 bg-primary/20 text-primary text-[10px] rounded px-1">
              {consoleEntries.length}
            </span>
          )}
        </Button>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0d]/80 pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          </div>
        )}
        <iframe
          key={refreshKey}
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          title="Live Preview"
        />
      </div>

      {/* Console drawer */}
      {consoleOpen && (
        <div className="h-36 border-t border-border/50 bg-[#0d0d0d] flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-1 border-b border-border/30">
            <span className="text-[10px] text-muted-foreground font-mono">Console Output</span>
            <button
              onClick={() => setConsoleEntries([])}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] space-y-0.5">
            {consoleEntries.length === 0 ? (
              <span className="text-muted-foreground italic">No console output yet.</span>
            ) : (
              consoleEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap break-all ${
                    entry.level === 'error' ? 'text-red-400' :
                    entry.level === 'warn' ? 'text-yellow-400' :
                    entry.level === 'info' ? 'text-blue-400' :
                    'text-green-300'
                  }`}
                >
                  <span className="text-muted-foreground/50 mr-2">{entry.level.toUpperCase()}</span>
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
