import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace';
import { Play, Square, Trash2, Terminal as TerminalIcon, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalLine { type: 'stdout' | 'stderr' | 'info' | 'error' | 'exit'; text: string; }

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'ruby', label: 'Ruby' },
];

export function WorkspaceTerminal() {
  const { openFiles, activeFileId } = useWorkspaceStore();
  const { toast } = useToast();
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<TerminalLine[]>([{ type: 'info', text: '▶  Select a file or paste code and click Run.' }]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeFile = openFiles.find(f => f.id === activeFileId);

  useEffect(() => {
    if (activeFile?.language) {
      const found = LANGUAGES.find(l => l.value === activeFile.language);
      if (found) setLanguage(found.value);
    }
  }, [activeFile?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [output]);

  const runCode = async () => {
    const code = activeFile?.content;
    if (!code?.trim()) { toast({ title: 'No code to run', description: 'Open a file with code first', variant: 'destructive' }); return; }

    abortRef.current = new AbortController();
    setIsRunning(true);
    setOutput([{ type: 'info', text: `▶  Running ${activeFile?.name || 'file'} (${language})...` }]);

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) { const e = await res.json(); setOutput(p => [...p, { type: 'error', text: `Error: ${e.error}` }]); return; }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'exit') {
              setOutput(p => [...p, { type: 'info', text: `\n● Process exited with code ${data.code}` }]);
            } else if (data.text) {
              setOutput(p => [...p, { type: data.type, text: data.text }]);
            }
          } catch { /* */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setOutput(p => [...p, { type: 'error', text: `Error: ${err.message}` }]);
    } finally {
      setIsRunning(false);
    }
  };

  const stopExecution = () => {
    abortRef.current?.abort();
    setOutput(p => [...p, { type: 'info', text: '\n■ Execution stopped.' }]);
    setIsRunning(false);
  };

  const clearOutput = () => setOutput([{ type: 'info', text: '▶  Terminal cleared. Ready.' }]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output.map(l => l.text).join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineColor = (type: TerminalLine['type']) => {
    if (type === 'stderr' || type === 'error') return 'text-red-400';
    if (type === 'info') return 'text-blue-400';
    return 'text-green-300';
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-sm font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-[#161b22] shrink-0">
        <TerminalIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Terminal</span>
        <div className="ml-auto flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-7 text-xs w-32 bg-[#21262d] border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={copyOutput} variant="ghost" className="h-7 w-7 p-0">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" onClick={clearOutput} variant="ghost" className="h-7 w-7 p-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {isRunning ? (
            <Button size="sm" onClick={stopExecution} className="h-7 text-xs bg-red-600 hover:bg-red-700 px-3">
              <Square className="h-3 w-3 mr-1 fill-current" /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={runCode} className="h-7 text-xs bg-green-600 hover:bg-green-700 px-3" disabled={!activeFile}>
              <Play className="h-3 w-3 mr-1 fill-current" /> Run
            </Button>
          )}
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-0.5">
        {output.map((line, i) => (
          <pre key={i} className={`whitespace-pre-wrap break-all leading-5 text-xs ${lineColor(line.type)}`}>{line.text}</pre>
        ))}
        {isRunning && (
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs mt-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Running...
          </div>
        )}
      </div>
    </div>
  );
}
