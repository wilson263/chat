import React, { useEffect, useState, useCallback, useRef } from 'react';
import Editor, { DiffEditor, useMonaco } from '@monaco-editor/react';
import { useWorkspaceStore } from '@/store/workspace';
import { useUpdateFile } from '@workspace/api-client-react';
import { Code2, Save, X, GitCompare, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function WorkspaceEditor() {
  const { openFiles, activeFileId, activeProjectId, setActiveFile, closeFile, updateFileContent } = useWorkspaceStore();
  const updateFileMutation = useUpdateFile();
  const { toast } = useToast();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const [localContent, setLocalContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState('');
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  useEffect(() => {
    if (activeFile) {
      setLocalContent(activeFile.content);
      setSavedContent(activeFile.content);
      setIsDirty(false);
      setShowDiff(false);
      setAutocompleteSuggestion('');
    }
  }, [activeFile?.id]);

  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('ai-coder-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [{ background: '0f111a', token: '' }],
      colors: {
        'editor.background': '#0f111a',
        'editor.lineHighlightBackground': '#1a1d2e',
        'editorLineNumber.foreground': '#4b5563',
        'editorIndentGuide.background': '#1f2937',
        'diffEditor.insertedTextBackground': '#16a34a22',
        'diffEditor.removedTextBackground': '#dc262622',
      }
    });
    monaco.editor.setTheme('ai-coder-dark');

    // Register AI autocomplete provider
    const disposable = monaco.languages.registerInlineCompletionsProvider(
      { pattern: '**' },
      {
        provideInlineCompletions: async (model, position) => {
          const textUntilCursor = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 20),
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          if (textUntilCursor.trim().length < 5) return { items: [] };
          try {
            const res = await fetch('/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userMessage: `Complete the following code. Only output the completion text, no explanation, no markdown, no backticks:\n\n${textUntilCursor}`,
                model: 'llama-3.3-70b-versatile',
                history: [],
                temperature: 0.2,
              }),
            });
            if (!res.ok) return { items: [] };
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              for (const line of chunk.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                try { const d = JSON.parse(line.slice(6)); if (d.content) fullText += d.content; } catch { /* */ }
              }
            }
            const completion = fullText.trim().replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
            if (!completion) return { items: [] };
            return { items: [{ insertText: completion, range: { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column } }] };
          } catch { return { items: [] }; }
        },
        freeInlineCompletions: () => {},
      }
    );
    return () => disposable.dispose();
  }, [monaco]);

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalContent(value);
      setIsDirty(value !== savedContent);
      if (activeFile) updateFileContent(activeFile.id, value);
    }
  };

  const handleSave = useCallback(async () => {
    if (!activeFile || !activeProjectId) return;
    try {
      await updateFileMutation.mutateAsync({ projectId: activeProjectId, fileId: activeFile.id, data: { content: localContent } });
      setSavedContent(localContent);
      setIsDirty(false);
      toast({ title: 'File saved' });
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
  }, [activeFile, activeProjectId, localContent, updateFileMutation, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (openFiles.length === 0) {
    return (
      <div className="h-full w-full bg-[#0f111a] flex flex-col items-center justify-center text-muted-foreground">
        <Code2 className="h-16 w-16 mb-4 opacity-10" />
        <p className="text-lg font-medium text-foreground opacity-80">ZorvixAI Workspace</p>
        <p className="text-sm mt-2 text-center max-w-xs">Select a file from the sidebar to start editing. AI autocomplete is active.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0f111a] overflow-hidden relative">
      {/* Tabs */}
      <div className="flex bg-[#0d1117] border-b border-border/50 overflow-x-auto hide-scrollbar shrink-0">
        {openFiles.map(file => (
          <div key={file.id} onClick={() => setActiveFile(file.id)}
            className={`group flex items-center min-w-max px-4 py-2 text-xs border-r border-border/30 cursor-pointer transition-all ${activeFileId === file.id ? 'bg-[#0f111a] text-foreground border-t-2 border-t-primary' : 'text-muted-foreground hover:text-foreground hover:bg-[#0f111a]/60'}`}>
            <span className="max-w-[120px] truncate">{file.name}</span>
            {activeFileId === file.id && isDirty && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
            <button onClick={e => { e.stopPropagation(); closeFile(file.id); }}
              className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Action bar */}
      {activeFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 bg-[#0d1117]/80 shrink-0">
          <code className="text-[10px] text-muted-foreground">{activeFile.path || activeFile.name}</code>
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{activeFile.language}</span>
          {isDirty && <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">unsaved</span>}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Wand2 className="h-3 w-3" /> AI autocomplete active
            </span>
            {isDirty && (
              <Button size="sm" onClick={handleSave} disabled={updateFileMutation.isPending} variant="ghost" className="h-6 text-xs px-2 gap-1">
                {updateFileMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </Button>
            )}
            {isDirty && (
              <Button size="sm" onClick={() => setShowDiff(!showDiff)} variant="ghost" className="h-6 text-xs px-2 gap-1">
                <GitCompare className="h-3 w-3" /> {showDiff ? 'Edit' : 'Diff'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {showDiff && isDirty ? (
          <DiffEditor height="100%" language={activeFile?.language ?? 'plaintext'} original={savedContent} modified={localContent}
            theme="ai-coder-dark" options={{ readOnly: false, minimap: { enabled: false }, fontSize: 13, lineHeight: 20 }}
            onMount={ed => { ed.getModifiedEditor().onDidChangeModelContent(() => handleContentChange(ed.getModifiedEditor().getValue())); }} />
        ) : (
          <Editor height="100%" language={activeFile?.language ?? 'plaintext'} value={localContent} onChange={handleContentChange}
            theme="ai-coder-dark"
            onMount={ed => { editorRef.current = ed; }}
            options={{
              minimap: { enabled: false }, fontSize: 13, lineHeight: 20, scrollBeyondLastLine: false,
              wordWrap: 'on', automaticLayout: true, tabSize: 2, insertSpaces: true,
              bracketPairColorization: { enabled: true },
              inlineSuggest: { enabled: true },
              suggest: { showWords: true, showSnippets: true },
            }} />
        )}
      </div>
    </div>
  );
}
