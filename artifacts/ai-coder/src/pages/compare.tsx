import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ArrowLeft, Send, Loader2, Copy, Check, RefreshCw, GitCompare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MODELS_A = ['llama-3.3-70b-versatile','llama-3.1-70b-versatile','mixtral-8x7b-32768','gemma2-9b-it'];
const MODELS_B = ['gpt-4o','gpt-4o-mini','o1-mini'];

async function callModel(prompt: string, model: string, openaiKey?: string): Promise<string> {
  const isOpenAI = ['gpt-4o','gpt-4o-mini','o1-mini'].includes(model);
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      userMessage: prompt,
      history: [],
      model,
      stream: false,
      ...(isOpenAI && openaiKey ? { openaiApiKey: openaiKey } : {}),
    }),
  });
  if (!res.ok) throw new Error('Model call failed');
  const data = await res.json();
  return data.content || data.message || data.text || '';
}

export default function ComparePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [modelA, setModelA] = useState('llama-3.3-70b-versatile');
  const [modelB, setModelB] = useState('gpt-4o');
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);
  const openaiKey = localStorage.getItem('openai_api_key') || '';

  const runComparison = async () => {
    if (!prompt.trim()) return;
    setResponseA(''); setResponseB('');
    setLoadingA(true); setLoadingB(true);

    const isAOpenAI = ['gpt-4o','gpt-4o-mini','o1-mini'].includes(modelA);
    const isBOpenAI = ['gpt-4o','gpt-4o-mini','o1-mini'].includes(modelB);

    if ((isAOpenAI || isBOpenAI) && !openaiKey) {
      toast({ title: 'OpenAI API key required for GPT models. Add it in Settings.', variant: 'destructive' });
    }

    await Promise.allSettled([
      callModel(prompt, modelA, openaiKey).then(r => { setResponseA(r); setLoadingA(false); }).catch(e => { setResponseA(`Error: ${e.message}`); setLoadingA(false); }),
      callModel(prompt, modelB, openaiKey).then(r => { setResponseB(r); setLoadingB(false); }).catch(e => { setResponseB(`Error: ${e.message}`); setLoadingB(false); }),
    ]);
  };

  const copyResponse = (text: string, side: 'A'|'B') => {
    navigator.clipboard.writeText(text);
    if (side === 'A') { setCopiedA(true); setTimeout(() => setCopiedA(false), 2000); }
    else { setCopiedB(true); setTimeout(() => setCopiedB(false), 2000); }
  };

  const allModels = [...MODELS_A, ...MODELS_B];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Response Comparison</h1>
        </div>
        <span className="text-xs text-muted-foreground">Send the same prompt to two models and compare</span>
      </header>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-6 gap-6">
        {/* Prompt input */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Model A</label>
              <select value={modelA} onChange={e => setModelA(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {allModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Model B</label>
              <select value={modelB} onChange={e => setModelB(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {allModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runComparison();} }}
              placeholder="Enter a prompt to compare both models' responses..."
              rows={3}
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={runComparison} disabled={!prompt.trim() || loadingA || loadingB} className="self-end px-6 bg-primary shadow-lg shadow-primary/20">
              {(loadingA || loadingB) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Side-by-side responses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {(['A','B'] as const).map(side => {
            const response = side === 'A' ? responseA : responseB;
            const loading = side === 'A' ? loadingA : loadingB;
            const model = side === 'A' ? modelA : modelB;
            const copied = side === 'A' ? copiedA : copiedB;
            return (
              <div key={side} className="flex flex-col border border-border/50 rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${side==='A'?'bg-violet-500':'bg-blue-500'} text-white`}>{side}</span>
                    <span className="text-sm font-medium">{model}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {response && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyResponse(response, side)}>
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={runComparison}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating response...</span>
                    </div>
                  ) : response ? (
                    <MarkdownRenderer content={response} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Response will appear here
                    </div>
                  )}
                </div>
                {response && (
                  <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
                    {response.split(/\s+/).length} words · {response.length} chars
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
