import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Play, Square, RotateCcw, Copy, Check, Download,
  ChevronDown, Terminal, AlertCircle, Sparkles, Loader2,
  Clock, Cpu, ChevronRight, BookOpen, Trash2, Share2, CheckCircle2,
  Code2, Globe, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Runtime { language: string; version: string; aliases: string[]; }
interface ExecResult {
  language: string;
  version: string;
  run?: { stdout: string; stderr: string; code: number; signal: string | null; output: string };
  compile?: { stdout: string; stderr: string; code: number; signal: string | null; output: string };
  elapsed?: number;
  error?: string;
}

const STARTER_CODE: Record<string, string> = {
  python: `# Python — ZorvixAI Code Runner
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=' ')
        a, b = b, a + b
    print()

print("Hello from Python!")
fibonacci(10)

# Try editing and pressing Run ▶
`,
  javascript: `// JavaScript (Node.js) — ZorvixAI Code Runner
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("ZorvixAI"));

// Fibonacci
const fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2);
console.log("Fibonacci:", Array.from({length:10}, (_,i) => fib(i)).join(', '));
`,
  typescript: `// TypeScript — ZorvixAI Code Runner
interface User { name: string; age: number; }

const greet = (user: User): string =>
  \`Hello, \${user.name}! You are \${user.age} years old.\`;

const user: User = { name: "ZorvixAI", age: 1 };
console.log(greet(user));

const numbers: number[] = [1, 2, 3, 4, 5];
const doubled = numbers.map((n: number) => n * 2);
console.log("Doubled:", doubled);
`,
  java: `// Java — ZorvixAI Code Runner
public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
    }

    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.print("Fibonacci: ");
        for (int i = 0; i < 10; i++) {
            System.out.print(fibonacci(i) + " ");
        }
        System.out.println();
    }
}
`,
  c: `// C — ZorvixAI Code Runner
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    printf("Hello from C!\\n");
    printf("Fibonacci: ");
    for (int i = 0; i < 10; i++) {
        printf("%d ", fibonacci(i));
    }
    printf("\\n");
    return 0;
}
`,
  cpp: `// C++ — ZorvixAI Code Runner
#include <iostream>
#include <vector>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    cout << "Hello from C++!" << endl;
    cout << "Fibonacci: ";
    for (int i = 0; i < 10; i++) {
        cout << fibonacci(i) << " ";
    }
    cout << endl;
    return 0;
}
`,
  go: `// Go — ZorvixAI Code Runner
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 { return n }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println("Hello from Go!")
    fmt.Print("Fibonacci: ")
    for i := 0; i < 10; i++ {
        fmt.Printf("%d ", fibonacci(i))
    }
    fmt.Println()
}
`,
  rust: `// Rust — ZorvixAI Code Runner
fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    println!("Hello from Rust!");
    let fibs: Vec<u32> = (0..10).map(fibonacci).collect();
    println!("Fibonacci: {:?}", fibs);
}
`,
  ruby: `# Ruby — ZorvixAI Code Runner
def fibonacci(n)
  return n if n <= 1
  fibonacci(n-1) + fibonacci(n-2)
end

puts "Hello from Ruby!"
fibs = (0...10).map { |i| fibonacci(i) }
puts "Fibonacci: #{fibs.join(', ')}"
`,
  php: `<?php
// PHP — ZorvixAI Code Runner
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n-1) + fibonacci($n-2);
}

echo "Hello from PHP!\\n";
$fibs = array_map('fibonacci', range(0, 9));
echo "Fibonacci: " . implode(', ', $fibs) . "\\n";
?>`,
  swift: `// Swift — ZorvixAI Code Runner
func fibonacci(_ n: Int) -> Int {
    if n <= 1 { return n }
    return fibonacci(n-1) + fibonacci(n-2)
}

print("Hello from Swift!")
let fibs = (0..<10).map { fibonacci($0) }
print("Fibonacci:", fibs.map(String.init).joined(separator: ", "))
`,
  kotlin: `// Kotlin — ZorvixAI Code Runner
fun fibonacci(n: Int): Int = if (n <= 1) n else fibonacci(n-1) + fibonacci(n-2)

fun main() {
    println("Hello from Kotlin!")
    val fibs = (0 until 10).map { fibonacci(it) }
    println("Fibonacci: $fibs")
}
`,
  csharp: `// C# — ZorvixAI Code Runner
using System;
using System.Linq;

class Program {
    static int Fibonacci(int n) => n <= 1 ? n : Fibonacci(n-1) + Fibonacci(n-2);

    static void Main() {
        Console.WriteLine("Hello from C#!");
        var fibs = Enumerable.Range(0, 10).Select(Fibonacci);
        Console.WriteLine($"Fibonacci: {string.Join(", ", fibs)}");
    }
}
`,
  bash: `#!/bin/bash
# Bash — ZorvixAI Code Runner
echo "Hello from Bash!"

fibonacci() {
    local n=$1
    if [ $n -le 1 ]; then echo $n; return; fi
    local a=$(fibonacci $((n-1)))
    local b=$(fibonacci $((n-2)))
    echo $((a+b))
}

echo -n "Fibonacci: "
for i in $(seq 0 9); do
    echo -n "$(fibonacci $i) "
done
echo
`,
  r: `# R — ZorvixAI Code Runner
cat("Hello from R!\\n")

fibonacci <- function(n) {
  if (n <= 1) return(n)
  return(fibonacci(n-1) + fibonacci(n-2))
}

fibs <- sapply(0:9, fibonacci)
cat("Fibonacci:", fibs, "\\n")
`,
  lua: `-- Lua — ZorvixAI Code Runner
print("Hello from Lua!")

local function fibonacci(n)
    if n <= 1 then return n end
    return fibonacci(n-1) + fibonacci(n-2)
end

local fibs = {}
for i = 0, 9 do
    table.insert(fibs, fibonacci(i))
end
print("Fibonacci: " .. table.concat(fibs, ", "))
`,
  perl: `#!/usr/bin/perl
# Perl — ZorvixAI Code Runner
use strict;
use warnings;

print "Hello from Perl!\\n";

sub fibonacci {
    my $n = shift;
    return $n if $n <= 1;
    return fibonacci($n-1) + fibonacci($n-2);
}

my @fibs = map { fibonacci($_) } (0..9);
print "Fibonacci: @fibs\\n";
`,
  haskell: `-- Haskell — ZorvixAI Code Runner
fibonacci :: Int -> Int
fibonacci 0 = 0
fibonacci 1 = 1
fibonacci n = fibonacci (n-1) + fibonacci (n-2)

main :: IO ()
main = do
    putStrLn "Hello from Haskell!"
    let fibs = map fibonacci [0..9]
    putStrLn $ "Fibonacci: " ++ show fibs
`,
  scala: `// Scala — ZorvixAI Code Runner
object Main extends App {
    def fibonacci(n: Int): Int = if (n <= 1) n else fibonacci(n-1) + fibonacci(n-2)

    println("Hello from Scala!")
    val fibs = (0 until 10).map(fibonacci)
    println(s"Fibonacci: $fibs")
}
`,
  elixir: `# Elixir — ZorvixAI Code Runner
defmodule Main do
  def fibonacci(0), do: 0
  def fibonacci(1), do: 1
  def fibonacci(n), do: fibonacci(n-1) + fibonacci(n-2)
end

IO.puts("Hello from Elixir!")
fibs = Enum.map(0..9, &Main.fibonacci/1)
IO.inspect(fibs, label: "Fibonacci")
`,
  dart: `// Dart — ZorvixAI Code Runner
int fibonacci(int n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

void main() {
  print('Hello from Dart!');
  var fibs = List.generate(10, fibonacci);
  print('Fibonacci: $fibs');
}
`,
};

const LANGUAGE_CATEGORIES: Record<string, { label: string; color: string; langs: Array<{ id: string; name: string; ext: string }> }> = {
  popular: {
    label: '⭐ Popular',
    color: 'text-yellow-400',
    langs: [
      { id: 'python', name: 'Python', ext: 'py' },
      { id: 'javascript', name: 'JavaScript', ext: 'js' },
      { id: 'typescript', name: 'TypeScript', ext: 'ts' },
      { id: 'java', name: 'Java', ext: 'java' },
      { id: 'cpp', name: 'C++', ext: 'cpp' },
      { id: 'c', name: 'C', ext: 'c' },
      { id: 'go', name: 'Go', ext: 'go' },
      { id: 'rust', name: 'Rust', ext: 'rs' },
      { id: 'csharp', name: 'C#', ext: 'cs' },
      { id: 'kotlin', name: 'Kotlin', ext: 'kt' },
      { id: 'swift', name: 'Swift', ext: 'swift' },
      { id: 'ruby', name: 'Ruby', ext: 'rb' },
    ],
  },
  scripting: {
    label: '📜 Scripting',
    color: 'text-green-400',
    langs: [
      { id: 'bash', name: 'Bash', ext: 'sh' },
      { id: 'php', name: 'PHP', ext: 'php' },
      { id: 'perl', name: 'Perl', ext: 'pl' },
      { id: 'lua', name: 'Lua', ext: 'lua' },
      { id: 'r', name: 'R', ext: 'r' },
      { id: 'powershell', name: 'PowerShell', ext: 'ps1' },
    ],
  },
  functional: {
    label: '🔬 Functional',
    color: 'text-purple-400',
    langs: [
      { id: 'haskell', name: 'Haskell', ext: 'hs' },
      { id: 'elixir', name: 'Elixir', ext: 'ex' },
      { id: 'erlang', name: 'Erlang', ext: 'erl' },
      { id: 'clojure', name: 'Clojure', ext: 'clj' },
      { id: 'fsharp', name: 'F#', ext: 'fs' },
      { id: 'ocaml', name: 'OCaml', ext: 'ml' },
      { id: 'scala', name: 'Scala', ext: 'scala' },
    ],
  },
  modern: {
    label: '🚀 Modern',
    color: 'text-blue-400',
    langs: [
      { id: 'dart', name: 'Dart', ext: 'dart' },
      { id: 'julia', name: 'Julia', ext: 'jl' },
      { id: 'nim', name: 'Nim', ext: 'nim' },
      { id: 'crystal', name: 'Crystal', ext: 'cr' },
      { id: 'zig', name: 'Zig', ext: 'zig' },
      { id: 'groovy', name: 'Groovy', ext: 'groovy' },
    ],
  },
  systems: {
    label: '⚙️ Systems',
    color: 'text-orange-400',
    langs: [
      { id: 'nasm', name: 'Assembly (x86)', ext: 'asm' },
      { id: 'fortran', name: 'Fortran', ext: 'f90' },
      { id: 'pascal', name: 'Pascal', ext: 'pas' },
      { id: 'd', name: 'D', ext: 'd' },
    ],
  },
  esoteric: {
    label: '🎭 Esoteric',
    color: 'text-pink-400',
    langs: [
      { id: 'brainfuck', name: 'Brainfuck', ext: 'bf' },
      { id: 'cow', name: 'COW', ext: 'cow' },
      { id: 'lolcode', name: 'LOLCODE', ext: 'lol' },
    ],
  },
};

const ALL_LANGS = Object.values(LANGUAGE_CATEGORIES).flatMap(c => c.langs);

function getLangColor(langId: string): string {
  const map: Record<string, string> = {
    python: 'text-blue-400', javascript: 'text-yellow-400', typescript: 'text-blue-300',
    java: 'text-orange-400', cpp: 'text-purple-400', c: 'text-blue-500',
    go: 'text-cyan-400', rust: 'text-orange-500', csharp: 'text-purple-300',
    kotlin: 'text-violet-400', swift: 'text-orange-300', ruby: 'text-red-400',
    php: 'text-indigo-400', bash: 'text-green-400', r: 'text-blue-400',
    lua: 'text-blue-300', haskell: 'text-purple-400', scala: 'text-red-500',
    elixir: 'text-violet-400', dart: 'text-cyan-500',
  };
  return map[langId] ?? 'text-muted-foreground';
}

export default function CodeRunnerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedLang, setSelectedLang] = useState('python');
  const [code, setCode] = useState(STARTER_CODE['python']);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'ai'>('output');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = ALL_LANGS.find(l => l.id === selectedLang) ?? { id: selectedLang, name: selectedLang, ext: 'txt' };
  const runtimeInfo = runtimes.find(r => r.language === selectedLang);

  useEffect(() => {
    fetch('/api/execute/runtimes')
      .then(r => r.json())
      .then(d => { if (d.runtimes) setRuntimes(d.runtimes); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowLangDropdown(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLangChange = (langId: string) => {
    setSelectedLang(langId);
    setCode(STARTER_CODE[langId] ?? `// ${langId} code here\n`);
    setResult(null);
    setAiExplanation('');
    setShowLangDropdown(false);
    setLangSearch('');
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart, selectionEnd, value } = el;
      const newVal = value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd);
      setCode(newVal);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  };

  const runCode = useCallback(async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setResult(null);
    setAiExplanation('');
    setActiveTab('output');
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLang, version: '*', code, stdin }),
      });
      const data: ExecResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ language: selectedLang, version: '', error: err.message ?? 'Network error' });
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLang, stdin, isRunning]);

  const explainErrors = async () => {
    if (!result) return;
    const errors = [result.compile?.stderr, result.compile?.output, result.run?.stderr].filter(Boolean).join('\n');
    if (!errors.trim()) { toast({ title: 'No errors to explain' }); return; }
    setIsExplaining(true);
    setAiExplanation('');
    setActiveTab('ai');
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `I'm writing ${selectedLang} code and got this error. Explain what's wrong and show me the fix:\n\nCode:\n\`\`\`${selectedLang}\n${code.slice(0, 3000)}\n\`\`\`\n\nError:\n${errors}`,
          history: [],
          temperature: 0.3,
        }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ')) {
            try { const d = JSON.parse(line.slice(6)); if (d.content) { full += d.content; setAiExplanation(full); } } catch {}
          }
        }
      }
    } catch { toast({ title: 'AI explanation failed', variant: 'destructive' }); }
    finally { setIsExplaining(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    const encoded = btoa(encodeURIComponent(JSON.stringify({ lang: selectedLang, code })));
    const url = `${window.location.origin}/code-runner?s=${encoded}`;
    navigator.clipboard.writeText(url);
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 2000);
    toast({ title: 'Share link copied!' });
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${currentLang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      try {
        const { lang, code: c } = JSON.parse(decodeURIComponent(atob(s)));
        setSelectedLang(lang);
        setCode(c);
      } catch {}
    }
  }, []);

  const filteredLangs = langSearch.trim()
    ? ALL_LANGS.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.id.toLowerCase().includes(langSearch.toLowerCase()))
    : null;

  const hasErrors = result && (
    (result.compile?.code !== undefined && result.compile.code !== 0) ||
    (result.run?.code !== undefined && result.run.code !== 0) ||
    result.error
  );

  const hasOutput = result && (result.run?.stdout || result.run?.stderr || result.compile?.stderr || result.error || result.compile?.output);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Terminal className="w-4 h-4 text-green-400 shrink-0" />
          <h1 className="text-sm font-semibold truncate">Code Runner</h1>
          <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400 shrink-0">100+ Languages</Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyCode}>
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={downloadCode}>
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={shareCode}>
            {sharedCopied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={runCode} disabled={isRunning} size="sm"
            className="h-7 gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30">
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Running...' : 'Run'}
            <span className="hidden sm:inline text-white/60 ml-0.5">⌘↵</span>
          </Button>
        </div>
      </header>

      {/* Language + Stdin Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/10 shrink-0">
        {/* Language Picker */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowLangDropdown(d => !d)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:border-primary/40 transition-colors text-sm font-medium ${getLangColor(selectedLang)}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {currentLang.name}
            {runtimeInfo && <span className="text-[10px] text-muted-foreground font-normal">{runtimeInfo.version}</span>}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showLangDropdown && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-2 border-b border-border/50">
                <input
                  autoFocus
                  placeholder="Search languages..."
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  className="w-full bg-muted/50 rounded-lg px-3 py-1.5 text-xs outline-none"
                />
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filteredLangs ? (
                  <div className="space-y-0.5">
                    {filteredLangs.map(l => (
                      <button key={l.id} onClick={() => handleLangChange(l.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted/50 transition-colors text-left ${l.id === selectedLang ? 'bg-primary/10 text-primary' : ''}`}>
                        <span className={`font-medium ${getLangColor(l.id)}`}>{l.name}</span>
                        <span className="text-muted-foreground">.{l.ext}</span>
                      </button>
                    ))}
                    {filteredLangs.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">No languages found</p>}
                  </div>
                ) : (
                  Object.entries(LANGUAGE_CATEGORIES).map(([catId, cat]) => (
                    <div key={catId} className="mb-2">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 ${cat.color}`}>{cat.label}</p>
                      <div className="grid grid-cols-2 gap-0.5">
                        {cat.langs.map(l => (
                          <button key={l.id} onClick={() => handleLangChange(l.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs hover:bg-muted/50 transition-colors text-left ${l.id === selectedLang ? 'bg-primary/10 text-primary' : ''}`}>
                            <span className={`font-medium ${getLangColor(l.id)}`}>{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Stdin toggle */}
        <button onClick={() => setShowStdin(s => !s)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${showStdin ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'}`}>
          <ChevronRight className={`w-3 h-3 transition-transform ${showStdin ? 'rotate-90' : ''}`} />
          stdin
        </button>

        <button onClick={() => { setCode(STARTER_CODE[selectedLang] ?? ''); setResult(null); setAiExplanation(''); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:border-border transition-colors">
          <BookOpen className="w-3 h-3" /> Example
        </button>

        <button onClick={() => { setCode(''); setResult(null); setAiExplanation(''); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Stdin Panel */}
      {showStdin && (
        <div className="px-4 py-2 border-b border-border/50 bg-muted/5 shrink-0">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">stdin (standard input)</label>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            placeholder="Enter input that your program reads from stdin..."
            rows={3}
            className="w-full bg-background border border-border/50 rounded-lg p-2 text-xs font-mono resize-none outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      )}

      {/* Main Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50 min-w-0">
          {/* Editor header */}
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/5 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-xs text-muted-foreground ml-1">main.{currentLang.ext}</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground">{code.split('\n').length} lines · {code.length} chars</span>
          </div>

          {/* Textarea editor */}
          <div className="flex flex-1 overflow-hidden">
            {/* Line numbers */}
            <div className="w-10 shrink-0 bg-muted/5 border-r border-border/20 overflow-hidden select-none pt-4">
              {code.split('\n').map((_, i) => (
                <div key={i} className="text-right pr-2 text-[10px] text-muted-foreground/40 leading-[1.625rem]">{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleTabKey}
              spellCheck={false}
              className="flex-1 p-4 text-sm font-mono bg-background resize-none focus:outline-none text-foreground leading-[1.625rem] overflow-auto"
              style={{ tabSize: 2 }}
              placeholder={`Write your ${currentLang.name} code here...\n\nPress Ctrl+Enter or ⌘+Enter to run`}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-[45%] min-w-[300px] flex flex-col overflow-hidden">
          {/* Output tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/50 bg-muted/5 shrink-0">
            {[
              { id: 'output' as const, label: 'Output', icon: Terminal },
              { id: 'ai' as const, label: 'AI Explain', icon: Sparkles },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                <tab.icon className="w-3 h-3" />{tab.label}
              </button>
            ))}
            <div className="flex-1" />
            {hasErrors && (
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-amber-400 hover:text-amber-300"
                onClick={explainErrors} disabled={isExplaining}>
                {isExplaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Fix with AI
              </Button>
            )}
          </div>

          {/* Output content */}
          <div className="flex-1 overflow-y-auto bg-[#080b10] p-4">
            {activeTab === 'output' ? (
              <>
                {!result && !isRunning && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Play className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border border-border">Run</kbd> to execute your code</p>
                    <p className="text-xs text-muted-foreground/60">Powered by Piston — 100+ languages, no setup needed</p>
                  </div>
                )}

                {isRunning && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Executing {currentLang.name}...</p>
                  </div>
                )}

                {result && !isRunning && (
                  <div className="space-y-3 font-mono text-xs">
                    {/* Stats bar */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 border-b border-border/20 pb-2">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{result.language} {result.version}</span>
                      {result.elapsed && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.elapsed}ms</span>}
                      {result.run?.code !== undefined && (
                        <span className={`flex items-center gap-1 font-semibold ${result.run.code === 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <Zap className="w-3 h-3" />exit {result.run.code}
                        </span>
                      )}
                    </div>

                    {result.error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Network Error</p>
                        <p className="text-red-300">{result.error}</p>
                      </div>
                    )}

                    {result.compile && (result.compile.stderr || result.compile.output) && (
                      <div>
                        <p className="text-yellow-400/80 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Compile {result.compile.code === 0 ? '' : '❌ Error'}
                        </p>
                        {result.compile.stderr && <pre className="text-yellow-300 whitespace-pre-wrap break-all leading-relaxed">{result.compile.stderr}</pre>}
                        {result.compile.output && result.compile.output !== result.compile.stderr && (
                          <pre className="text-yellow-200/70 whitespace-pre-wrap break-all leading-relaxed">{result.compile.output}</pre>
                        )}
                      </div>
                    )}

                    {result.run?.stdout && (
                      <div>
                        <p className="text-green-400/80 text-[10px] font-semibold uppercase tracking-wider mb-1.5">stdout</p>
                        <pre className="text-green-300 whitespace-pre-wrap break-all leading-relaxed">{result.run.stdout}</pre>
                      </div>
                    )}

                    {result.run?.stderr && (
                      <div>
                        <p className="text-red-400/80 text-[10px] font-semibold uppercase tracking-wider mb-1.5">stderr</p>
                        <pre className="text-red-300 whitespace-pre-wrap break-all leading-relaxed">{result.run.stderr}</pre>
                      </div>
                    )}

                    {result.run && !result.run.stdout && !result.run.stderr && result.run.code === 0 && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Program exited successfully (no output)</span>
                      </div>
                    )}

                    {hasErrors && (
                      <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5">
                        <button onClick={() => { explainErrors(); setActiveTab('ai'); }}
                          className="flex items-center gap-2 text-amber-400 text-xs hover:text-amber-300 transition-colors">
                          <Sparkles className="w-3.5 h-3.5" />
                          Click to get AI explanation and fix →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="font-mono text-xs">
                {!aiExplanation && !isExplaining && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <Sparkles className="w-8 h-8 text-primary/40" />
                    <p className="text-sm text-muted-foreground">Run your code first, then click<br />"Fix with AI" to get AI-powered error explanations.</p>
                  </div>
                )}
                {isExplaining && !aiExplanation && (
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is analyzing your error...</span>
                  </div>
                )}
                {aiExplanation && (
                  <div className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {aiExplanation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-1 bg-muted/20 border-t border-border/30 shrink-0">
        <span className={`text-[10px] flex items-center gap-1 ${getLangColor(selectedLang)}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
          {currentLang.name}
        </span>
        {runtimes.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Cpu className="w-3 h-3" />{runtimes.length} runtimes available
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">Tab = 2 spaces · ⌘↵ = Run</span>
        {result?.run?.code === 0 && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Success
          </span>
        )}
        {result?.run?.code !== undefined && result.run.code !== 0 && (
          <span className="text-[10px] text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Error (exit {result.run.code})
          </span>
        )}
      </div>
    </div>
  );
}
