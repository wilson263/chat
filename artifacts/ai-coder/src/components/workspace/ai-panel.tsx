import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { useAiStream } from '@/hooks/use-ai-stream';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useUpdateFile } from '@workspace/api-client-react';
import {
  Sparkles, MessageSquare, Wrench, Send, Bot, User, Code, FileText,
  Paperclip, X, Image, FileCode, Trash2, Loader2, Brain, FolderOpen,
  Bug, Wand2, RefreshCw, Copy, Check, Zap, CheckCircle2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Attachment { id: string; name: string; type: 'image' | 'text'; mimeType: string; data: string; preview?: string; size: number; }
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{ name: string; type: 'image' | 'text'; preview?: string }>;
  appliedFileId?: number;
}

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    const id = `${Date.now()}-${Math.random()}`;
    if (isImage) {
      reader.onload = () => resolve({ id, name: file.name, type: 'image', mimeType: file.type, data: reader.result as string, preview: reader.result as string, size: file.size });
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => resolve({ id, name: file.name, type: 'text', mimeType: file.type || 'text/plain', data: reader.result as string, size: file.size });
      reader.readAsText(file);
    }
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`));
  });
}

// Extract the largest code block from AI response
function extractCodeBlock(content: string): string | null {
  const blocks = [...content.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g)];
  if (blocks.length === 0) return null;
  // Return the longest code block found
  return blocks.reduce((best, b) => {
    const code = b[1]?.trim() ?? '';
    return code.length > (best?.length ?? 0) ? code : best;
  }, null as string | null);
}

const ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.yaml,.yml,.sh";

export function AiPanel() {
  const { openFiles, activeFileId, activeProjectId, updateFileContent } = useWorkspaceStore();
  const { toast } = useToast();
  const updateFileMutation = useUpdateFile();
  const activeFile = openFiles.find(f => f.id === activeFileId);
  const aiChat = useAiStream('chat/stream');
  const aiTools = useAiStream('chat/stream');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [injectContext, setInjectContext] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, aiChat.content]);

  const buildFileContext = () => {
    if (!injectContext || openFiles.length === 0) return undefined;
    return openFiles.slice(0, 5).map(f => `--- File: ${f.path || f.name} (${f.language}) ---\n${f.content?.slice(0, 3000) || ''}`).join('\n\n');
  };

  const sendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      attachments: attachments.map(a => ({ name: a.name, type: a.type, preview: a.preview })),
    };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);

    let aiMessage = '';
    await aiChat.stream({
      userMessage: userMsg.content,
      history,
      attachments: attachments.map(a => ({ name: a.name, type: a.type, mimeType: a.mimeType, data: a.data })),
      context: buildFileContext(),
      model: (() => { const m = localStorage.getItem('last_model'); return (!m || m === 'auto' || m === 'llama-3.3-70b-versatile' || m === 'mixtral-8x7b-32768' || m === 'gemma2-9b-it') ? undefined : m; })(),
      temperature: parseFloat(localStorage.getItem('chat_temperature') || '0.7'),
      systemPrompt: localStorage.getItem('custom_system_prompt') || undefined,
    }, { onChunk: c => { aiMessage += c; } });

    setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
  };

  const runTool = async (toolId: string, prompt: string) => {
    if (!activeFile) return;
    setActiveTool(toolId);
    await aiTools.stream({
      userMessage: `${prompt}\n\n\`\`\`${activeFile.language}\n${activeFile.content?.slice(0, 8000)}\n\`\`\``,
      history: [],
      model: (() => { const m = localStorage.getItem('last_model'); return (!m || m === 'auto' || m === 'llama-3.3-70b-versatile' || m === 'mixtral-8x7b-32768' || m === 'gemma2-9b-it') ? undefined : m; })(),
      temperature: 0.3,
    });
  };

  // Apply AI code suggestion to the currently active file
  const applyToFile = useCallback(async (msgIdx: number, content: string) => {
    if (!activeFile || !activeProjectId) {
      toast({ title: 'No file open', description: 'Open a file in the editor first.', variant: 'destructive' });
      return;
    }
    const code = extractCodeBlock(content);
    if (!code) {
      toast({ title: 'No code found', description: 'The AI response has no code block to apply.', variant: 'destructive' });
      return;
    }

    setApplyingIdx(msgIdx);
    try {
      await updateFileMutation.mutateAsync({
        params: { projectId: activeProjectId, fileId: activeFile.id },
        data: { content: code },
      });
      // Update the editor immediately (no reload needed)
      updateFileContent(activeFile.id, code);
      setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, appliedFileId: activeFile.id } : m));
      toast({ title: `Applied to ${activeFile.name}`, description: 'The file has been updated in the editor.' });
    } catch {
      toast({ title: 'Apply failed', description: 'Could not save the changes. Try again.', variant: 'destructive' });
    } finally {
      setApplyingIdx(null);
    }
  }, [activeFile, activeProjectId, updateFileMutation, updateFileContent, toast]);

  // Apply code from the Code Tools panel to the active file
  const applyToolResult = useCallback(async () => {
    if (!activeFile || !activeProjectId) {
      toast({ title: 'No file open', variant: 'destructive' });
      return;
    }
    const code = extractCodeBlock(aiTools.content);
    if (!code) {
      toast({ title: 'No code to apply', variant: 'destructive' });
      return;
    }
    try {
      await updateFileMutation.mutateAsync({
        params: { projectId: activeProjectId, fileId: activeFile.id },
        data: { content: code },
      });
      updateFileContent(activeFile.id, code);
      toast({ title: `Applied to ${activeFile.name}` });
    } catch {
      toast({ title: 'Apply failed', variant: 'destructive' });
    }
  }, [activeFile, activeProjectId, aiTools.content, updateFileMutation, updateFileContent, toast]);

  const copyMsg = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const tools = [
    { id: 'explain', name: 'Explain Code', desc: 'Understand this file', icon: Brain, prompt: 'Explain what this code does, its purpose, how it works, and any key patterns used:' },
    { id: 'review', name: 'Code Review', desc: 'Find issues & improvements', icon: Wand2, prompt: 'Review this code for bugs, performance issues, security vulnerabilities, and suggest improvements:' },
    { id: 'debug', name: 'Debug Issues', desc: 'Find & fix bugs', icon: Bug, prompt: 'Analyze this code for bugs and errors. Provide the complete fixed version of the file:' },
    { id: 'refactor', name: 'Refactor', desc: 'Improve code quality', icon: RefreshCw, prompt: 'Refactor this code to be cleaner and more maintainable. Show the complete improved version:' },
    { id: 'docs', name: 'Generate Docs', desc: 'Write documentation', icon: FileText, prompt: 'Generate comprehensive documentation for this code including function descriptions, params, return values, and usage examples:' },
    { id: 'tests', name: 'Write Tests', desc: 'Create test cases', icon: Code, prompt: 'Write comprehensive unit tests for this code. Include edge cases and use appropriate testing patterns:' },
  ];

  return (
    <div className="h-full w-full bg-panel-bg flex flex-col border-l border-border/50">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="border-b border-border/50 px-2 pt-2 bg-background/50 shrink-0">
          <TabsList className="bg-transparent h-9 p-0 w-full justify-start gap-4">
            <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 py-1.5 h-full font-medium text-xs">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> AI Chat
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 py-1.5 h-full font-medium text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Code Tools
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── AI Chat Tab ─────────────────────────────────────────────── */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          {openFiles.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 bg-primary/5 shrink-0">
              <FolderOpen className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-primary flex-1 truncate">
                {injectContext ? `AI sees ${Math.min(openFiles.length, 5)} open file(s) — changes apply to: ${activeFile?.name ?? 'none'}` : 'File context off'}
              </span>
              <button onClick={() => setInjectContext(!injectContext)} className="text-[10px] text-muted-foreground hover:text-foreground">
                {injectContext ? 'Disable' : 'Enable'}
              </button>
            </div>
          )}

          <ScrollArea className="flex-1" ref={scrollRef as any}>
            <div className="p-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                  <Bot className="h-8 w-8 text-primary opacity-60" />
                  <p className="text-sm font-medium">AI Workspace Assistant</p>
                  <p className="text-xs text-muted-foreground">
                    Ask for changes like "add dark mode" or "fix the button style" — the AI will update your file instantly.
                  </p>
                  {activeFile && (
                    <div className="mt-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      Active file: <span className="font-semibold">{activeFile.name}</span>
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, i) => {
                const hasCode = msg.role === 'assistant' && extractCodeBlock(msg.content) !== null;
                const alreadyApplied = msg.appliedFileId === activeFile?.id;
                return (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                    <div className={`group relative max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-card border border-border/50'}`}>
                      {msg.role === 'assistant' ? <MarkdownRenderer content={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}

                      {/* Action buttons for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/30">
                          {/* Apply to file button */}
                          {hasCode && activeFile && (
                            <button
                              onClick={() => applyToFile(i, msg.content)}
                              disabled={applyingIdx === i}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all
                                ${alreadyApplied
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
                                }`}
                            >
                              {applyingIdx === i ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : alreadyApplied ? (
                                <CheckCircle2 className="h-2.5 w-2.5" />
                              ) : (
                                <Zap className="h-2.5 w-2.5" />
                              )}
                              {applyingIdx === i ? 'Applying...' : alreadyApplied ? `Applied to ${activeFile.name}` : `Apply to ${activeFile.name}`}
                            </button>
                          )}
                          {/* Copy button */}
                          <button
                            onClick={() => copyMsg(i, msg.content)}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                          >
                            {copiedIdx === i ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                  </div>
                );
              })}

              {/* Streaming response */}
              {aiChat.isStreaming && aiChat.content && (
                <div className="flex gap-2">
                  <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs bg-card border border-border/50">
                    <MarkdownRenderer content={aiChat.content} />
                  </div>
                </div>
              )}
              {aiChat.isStreaming && !aiChat.content && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary" />
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border/30 shrink-0">
              {attachments.map(a => (
                <div key={a.id} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-[10px]">
                  {a.type === 'image' ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  <span className="max-w-[80px] truncate">{a.name}</span>
                  <button onClick={() => setAttachments(p => p.filter(x => x.id !== a.id))}><X className="h-3 w-3 text-muted-foreground hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border/50 shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={activeFile ? `Ask to change ${activeFile.name}... (Enter to send)` : 'Ask about your code...'}
                className="flex-1 text-xs resize-none min-h-[60px] max-h-[120px]"
              />
              <div className="flex flex-col gap-1">
                <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden"
                  onChange={async e => { const files = Array.from(e.target.files || []); const atts = await Promise.all(files.map(fileToAttachment)); setAttachments(p => [...p, ...atts]); e.target.value = ''; }} />
                <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 p-0"><Paperclip className="h-3.5 w-3.5" /></Button>
                <Button size="sm" onClick={sendMessage} disabled={aiChat.isStreaming || (!input.trim() && !attachments.length)} className="h-8 w-8 p-0"><Send className="h-3.5 w-3.5" /></Button>
                {messages.length > 0 && <Button size="sm" variant="ghost" onClick={() => { setMessages([]); aiChat.setContent(''); }} className="h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Code Tools Tab ───────────────────────────────────────────── */}
        <TabsContent value="tools" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
          {!activeFile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-2 text-muted-foreground">
              <FileCode className="h-8 w-8 opacity-30" />
              <p className="text-sm">Open a file to use Code Tools</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-border/30 shrink-0 bg-primary/5">
                <p className="text-[10px] text-primary">Active file: <span className="font-medium">{activeFile.name}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-2 shrink-0">
                {tools.map(tool => (
                  <button key={tool.id} onClick={() => runTool(tool.id, tool.prompt)} disabled={!activeFile || aiTools.isStreaming}
                    className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left ${activeTool === tool.id ? 'bg-primary/10 border-primary' : 'bg-card border-border/50 hover:border-primary/50 hover:bg-white/5'} ${aiTools.isStreaming ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <tool.icon className={`h-4 w-4 mb-1.5 ${activeTool === tool.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-semibold">{tool.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{tool.desc}</span>
                  </button>
                ))}
              </div>
              {(activeTool || aiTools.content) && (
                <div className="flex-1 flex flex-col border border-border/50 rounded-xl mx-2 mb-2 overflow-hidden">
                  <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50 flex items-center gap-2 shrink-0">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{tools.find(t => t.id === activeTool)?.name}</span>
                    {aiTools.isStreaming && <Loader2 className="h-3 w-3 text-primary animate-spin ml-auto" />}
                    {!aiTools.isStreaming && aiTools.content && (
                      <div className="ml-auto flex items-center gap-1">
                        {/* Apply tool result to file */}
                        {extractCodeBlock(aiTools.content) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={applyToolResult}
                            disabled={updateFileMutation.isPending}
                            className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1"
                          >
                            {updateFileMutation.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Zap className="h-2.5 w-2.5" />}
                            Apply to {activeFile.name}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(aiTools.content); toast({ title: 'Copied!' }); }} className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    {aiTools.content ? <MarkdownRenderer content={aiTools.content} /> :
                      aiTools.isStreaming ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Analyzing...</div> :
                      <p className="text-sm text-muted-foreground italic">Click a tool to analyze the active file.</p>}
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
