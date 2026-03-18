import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace';
import { Play, Square, Trash2, Terminal as TerminalIcon, Copy, Check, Globe, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalLine { type: 'stdout' | 'stderr' | 'info' | 'error' | 'exit'; text: string; }

// Languages handled by the native backend (SSE streaming)
const NATIVE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', ext: ['js', 'mjs'] },
  { value: 'typescript', label: 'TypeScript', ext: ['ts'] },
  { value: 'python', label: 'Python', ext: ['py'] },
  { value: 'bash', label: 'Bash / Shell', ext: ['sh', 'bash'] },
  { value: 'ruby', label: 'Ruby', ext: ['rb'] },
];

// Languages powered by the free Piston API (no API key needed)
const PISTON_LANGUAGES = [
  { value: 'c', label: 'C', pistonId: 'c', version: '10.2.0', ext: ['c'] },
  { value: 'cpp', label: 'C++', pistonId: 'c++', version: '10.2.0', ext: ['cpp', 'cxx', 'cc'] },
  { value: 'java', label: 'Java', pistonId: 'java', version: '15.0.2', ext: ['java'] },
  { value: 'go', label: 'Go', pistonId: 'go', version: '1.16.2', ext: ['go'] },
  { value: 'rust', label: 'Rust', pistonId: 'rust', version: '1.50.0', ext: ['rs'] },
  { value: 'php', label: 'PHP', pistonId: 'php', version: '8.0.1', ext: ['php'] },
  { value: 'swift', label: 'Swift', pistonId: 'swift', version: '5.3.3', ext: ['swift'] },
  { value: 'kotlin', label: 'Kotlin', pistonId: 'kotlin', version: '1.4.21', ext: ['kt', 'kts'] },
  { value: 'csharp', label: 'C#', pistonId: 'csharp', version: '6.12.0', ext: ['cs'] },
  { value: 'r', label: 'R', pistonId: 'r', version: '4.0.5', ext: ['r', 'R'] },
  { value: 'lua', label: 'Lua', pistonId: 'lua', version: '5.4.2', ext: ['lua'] },
  { value: 'perl', label: 'Perl', pistonId: 'perl', version: '5.32.0', ext: ['pl', 'pm'] },
  { value: 'scala', label: 'Scala', pistonId: 'scala', version: '3.0.0', ext: ['scala'] },
  { value: 'elixir', label: 'Elixir', pistonId: 'elixir', version: '1.11.3', ext: ['ex', 'exs'] },
  { value: 'haskell', label: 'Haskell', pistonId: 'haskell', version: '9.0.1', ext: ['hs'] },
  { value: 'dart', label: 'Dart', pistonId: 'dart', version: '2.12.2', ext: ['dart'] },
  { value: 'fsharp', label: 'F#', pistonId: 'fsharp', version: '5.0.201', ext: ['fs', 'fsx'] },
  { value: 'clojure', label: 'Clojure', pistonId: 'clojure', version: '1.10.3', ext: ['clj', 'cljs'] },
  { value: 'erlang', label: 'Erlang', pistonId: 'erlang', version: '23.0', ext: ['erl'] },
  { value: 'nim', label: 'Nim', pistonId: 'nim', version: '1.4.4', ext: ['nim'] },
  { value: 'zig', label: 'Zig', pistonId: 'zig', version: '0.7.1', ext: ['zig'] },
  { value: 'julia', label: 'Julia', pistonId: 'julia', version: '1.6.0', ext: ['jl'] },
  { value: 'groovy', label: 'Groovy', pistonId: 'groovy', version: '3.0.7', ext: ['groovy'] },
  { value: 'powershell', label: 'PowerShell', pistonId: 'powershell', version: '7.1.4', ext: ['ps1'] },
  { value: 'sqlite3', label: 'SQLite', pistonId: 'sqlite3', version: '3.36.0', ext: ['sql'] },
];

const ALL_LANGUAGES = [
  { group: '⚡ Native (fast streaming)', langs: NATIVE_LANGUAGES },
  { group: '🌐 50+ Languages via Piston', langs: PISTON_LANGUAGES },
];

const PISTON_API = 'https://emkc.org/api/v2/piston';

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  for (const l of NATIVE_LANGUAGES) { if (l.ext.includes(ext)) return l.value; }
  for (const l of PISTON_LANGUAGES) { if (l.ext.includes(ext)) return l.value; }
  return 'javascript';
}

export function WorkspaceTerminal() {
  const { openFiles, activeFileId } = useWorkspaceStore();
  const { toast } = useToast();
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<TerminalLine[]>([{ type: 'info', text: '▶  Select a file or paste code and click Run.\n   Supports 50+ languages including C++, Java, Go, Rust, Swift, Kotlin, PHP, R, Lua and more.' }]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeFile = openFiles.find(f => f.id === activeFileId);

  useEffect(() => {
    if (activeFile?.name) {
      const detected = detectLanguage(activeFile.name);
      setLanguage(detected);
    } else if (activeFile?.language) {
      const allLangs = [...NATIVE_LANGUAGES, ...PISTON_LANGUAGES];
      const found = allLangs.find(l => l.value === activeFile.language);
      if (found) setLanguage(found.value);
    }
  }, [activeFile?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [output]);

  const stopCode = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setOutput(p => [...p, { type: 'info', text: '\n● Stopped.' }]);
  };

  const runNative = async (code: string, lang: string) => {
    const res = await fetch('/api/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: lang }),
      signal: abortRef.current?.signal,
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: 'Unknown error' }));
      setOutput(p => [...p, { type: 'error', text: `Error: ${e.error}` }]);
      return;
    }

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
        } catch { }
      }
    }
  };

  const runPiston = async (code: string, pistonLang: typeof PISTON_LANGUAGES[number]) => {
    const body = {
      language: pistonLang.pistonId,
      version: pistonLang.version,
      files: [{ name: `main.${pistonLang.ext[0]}`, content: code }],
      stdin: '',
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    setOutput(p => [...p, { type: 'info', text: `🌐 Running via Piston (${pistonLang.label})…` }]);

    const res = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortRef.current?.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      setOutput(p => [...p, { type: 'error', text: `Piston error ${res.status}: ${text}` }]);
      return;
    }

    const data = await res.json();

    if (data.compile && data.compile.output?.trim()) {
      setOutput(p => [...p, { type: 'info', text: '📦 Compile output:' }, { type: data.compile.code === 0 ? 'stdout' : 'stderr', text: data.compile.output }]);
    }

    if (data.run) {
      if (data.run.stdout?.trim()) {
        setOutput(p => [...p, { type: 'stdout', text: data.run.stdout }]);
      }
      if (data.run.stderr?.trim()) {
        setOutput(p => [...p, { type: 'stderr', text: data.run.stderr }]);
      }
      setOutput(p => [...p, { type: 'info', text: `\n● Process exited with code ${data.run.code}` }]);
    }
  };

  const runCode = async () => {
    const code = activeFile?.content;
    if (!code?.trim()) {
      toast({ title: 'No code to run', description: 'Open a file with code first', variant: 'destructive' });
      return;
    }

    abortRef.current = new AbortController();
    setIsRunning(true);
    setOutput([{ type: 'info', text: `▶  Running ${activeFile?.name || 'file'} as ${language}…` }]);

    try {
      const isNative = NATIVE_LANGUAGES.some(l => l.value === language);
      if (isNative) {
        await runNative(code, language);
      } else {
        const pistonLang = PISTON_LANGUAGES.find(l => l.value === language);
        if (pistonLang) {
          await runPiston(code, pistonLang);
        } else {
          setOutput(p => [...p, { type: 'error', text: `Language "${language}" not supported.` }]);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setOutput(p => [...p, { type: 'error', text: `Error: ${err.message}` }]);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output.map(l => l.text).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPiston = PISTON_LANGUAGES.some(l => l.value === language);

  return (
    <div className="h-full flex flex-col bg-[#0d0d14] text-sm font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        <TerminalIcon className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground mr-2">Terminal</span>

        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-6 text-xs w-44 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            {ALL_LANGUAGES.map(group => (
              <React.Fragment key={group.group}>
                <div className="px-2 py-1 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium border-b border-border/30 mt-1">{group.group}</div>
                {group.langs.map(l => (
                  <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>

        {isPiston && (
          <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
            <Globe className="w-2.5 h-2.5" /> Piston
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {isRunning ? (
            <Button size="sm" variant="ghost" onClick={stopCode} className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs">
              <Square className="w-3 h-3 mr-1" />Stop
            </Button>
          ) : (
            <Button size="sm" onClick={runCode} className="h-6 px-2 text-xs bg-primary hover:bg-primary/90">
              <Play className="w-3 h-3 mr-1" />Run
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={copyOutput} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOutput([{ type: 'info', text: '▶  Terminal cleared.' }])} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {output.map((line, i) => (
          <div key={i} className={`leading-5 whitespace-pre-wrap break-all text-xs ${
            line.type === 'error' || line.type === 'stderr' ? 'text-red-400' :
            line.type === 'info' || line.type === 'exit' ? 'text-blue-400/70' :
            'text-green-300'
          }`}>
            {line.text}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-1.5 text-blue-400/70 text-xs">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Running…
          </div>
        )}
      </div>

      {/* Language count footer */}
      <div className="px-3 py-1 border-t border-white/5 text-[10px] text-muted-foreground/40 shrink-0 flex items-center gap-2">
        <Zap className="w-2.5 h-2.5" />
        {NATIVE_LANGUAGES.length + PISTON_LANGUAGES.length}+ languages supported
        {isPiston && <span className="text-blue-400/60">· Powered by Piston API</span>}
      </div>
    </div>
  );
}
