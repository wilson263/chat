import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Download, Play, Monitor, X, Terminal, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { Button } from './ui/button';

interface MarkdownRendererProps {
  content: string;
  onPreview?: (html: string, css?: string, js?: string) => void;
}

export function extractThinking(raw: string): { thinking: string | null; mainContent: string } {
  const thinkingMatch = raw.match(/<(?:antml:)?thinking>([\s\S]*?)<\/(?:antml:)?thinking>/i);
  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim();
    const mainContent = raw.replace(/<(?:antml:)?thinking>[\s\S]*?<\/(?:antml:)?thinking>/gi, '').trim();
    return { thinking, mainContent };
  }
  return { thinking: null, mainContent: raw };
}

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const lines = content.split('\n').filter(Boolean);
  const preview = lines.slice(0, 2).join(' ').slice(0, 120);

  return (
    <div className="mb-3 rounded-lg border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-violet-500/10 transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span className="text-xs text-violet-300 font-medium">Thinking</span>
        <span className="flex-1 text-xs text-violet-400/60 truncate ml-1">{!expanded && preview}</span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-violet-500/10">
          <p className="text-xs text-violet-300/70 font-mono leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

function DiffBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-border/50 my-4 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider ml-1">diff</span>
        </div>
        <Button
          variant="ghost" size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="font-mono text-xs overflow-x-auto p-2">
        {lines.map((line, i) => {
          let bg = 'transparent';
          let color = '#d4d4d4';
          let prefix = '  ';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            bg = 'rgba(34,197,94,0.12)';
            color = '#86efac';
            prefix = '+ ';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            bg = 'rgba(239,68,68,0.12)';
            color = '#fca5a5';
            prefix = '- ';
          } else if (line.startsWith('@@')) {
            bg = 'rgba(99,102,241,0.12)';
            color = '#a5b4fc';
          } else if (line.startsWith('+++') || line.startsWith('---')) {
            color = '#9ca3af';
          }
          return (
            <div key={i} style={{ background: bg, color, padding: '1px 12px', whiteSpace: 'pre' }}>
              {line.startsWith('+') && !line.startsWith('+++') ? (
                <><span style={{ opacity: 0.5 }}>+</span>{line.slice(1)}</>
              ) : line.startsWith('-') && !line.startsWith('---') ? (
                <><span style={{ opacity: 0.5 }}>-</span>{line.slice(1)}</>
              ) : line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, onPreview }: MarkdownRendererProps) {
  const { thinking, mainContent } = React.useMemo(() => extractThinking(content), [content]);

  return (
    <div>
      {thinking && <ThinkingBlock content={thinking} />}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              if (language === 'diff') {
                return <DiffBlock code={codeString} />;
              }
              return <CodeBlock language={language} code={codeString} onPreview={onPreview} />;
            }
            return (
              <code className={`bg-muted/60 px-1 py-0.5 rounded text-xs font-mono ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }: any) {
            return <th className="border border-border/50 px-3 py-2 bg-muted/50 text-left font-semibold text-xs uppercase tracking-wider">{children}</th>;
          },
          td({ children }: any) {
            return <td className="border border-border/50 px-3 py-2 text-sm">{children}</td>;
          },
        }}
      >
        {mainContent}
      </ReactMarkdown>
    </div>
  );
}

function runJS(code: string): { output: string[]; error?: string } {
  const output: string[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  try {
    const sandbox = {
      console: {
        log: (...args: any[]) => output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        warn: (...args: any[]) => output.push('⚠ ' + args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => output.push('✖ ' + args.map(a => String(a)).join(' ')),
        info: (...args: any[]) => output.push('ℹ ' + args.map(a => String(a)).join(' ')),
      },
      Math, JSON, Date, Array, Object, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite,
      setTimeout: () => {}, clearTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
    };

    const fn = new Function(...Object.keys(sandbox), code);
    const result = fn(...Object.values(sandbox));
    if (result !== undefined) output.push('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
    return { output };
  } catch (e: any) {
    return { output, error: e.message };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

function CodeBlock({
  language,
  code,
  onPreview,
}: {
  language: string;
  code: string;
  onPreview?: (html: string, css?: string, js?: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [jsOutput, setJsOutput] = React.useState<{ output: string[]; error?: string } | null>(null);
  const [showOutput, setShowOutput] = React.useState(false);
  const [inlinePreview, setInlinePreview] = React.useState(false);

  const isHTML = language === 'html';
  const isJS = language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py', html: 'html',
      css: 'css', json: 'json', bash: 'sh', shell: 'sh', sql: 'sql',
      markdown: 'md', yaml: 'yml', rust: 'rs', go: 'go', java: 'java',
    };
    const ext = extMap[language] || language || 'txt';
    const filename = window.prompt('Save as filename:', `code.${ext}`) || `code.${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    if (isHTML) {
      if (onPreview) {
        onPreview(code);
      } else {
        setInlinePreview(v => !v);
      }
      return;
    }
    if (isJS) {
      const result = runJS(code);
      setJsOutput(result);
      setShowOutput(true);
    }
  };

  const handleOpenPreview = () => {
    if (onPreview) {
      onPreview(code);
    } else {
      setInlinePreview(v => !v);
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border/50 my-4 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider ml-1">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          {isHTML && (
            <Button
              variant="ghost" size="sm"
              className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
              onClick={handleOpenPreview}
              title="Open live preview"
            >
              <Monitor className="h-3 w-3" />
              {inlinePreview ? 'Close' : 'Preview'}
            </Button>
          )}
          {isJS && (
            <Button
              variant="ghost" size="sm"
              className="h-6 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1"
              onClick={handleRun}
              title="Run JavaScript"
            >
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-green-400"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.8rem' }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{ color: '#555', fontSize: '0.7rem', minWidth: '2rem' }}
      >
        {code}
      </SyntaxHighlighter>

      {inlinePreview && isHTML && (
        <div className="border-t border-border/40">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e]">
            <span className="text-xs text-blue-400 flex items-center gap-1.5"><Monitor className="h-3 w-3" />Live Preview</span>
            <button onClick={() => setInlinePreview(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
          <iframe
            srcDoc={code}
            className="w-full bg-white"
            style={{ height: '300px', border: 'none' }}
            sandbox="allow-scripts allow-same-origin"
            title="Live Preview"
          />
        </div>
      )}

      {showOutput && jsOutput && (
        <div className="border-t border-border/40">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d0d]">
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />Console Output
            </span>
            <button onClick={() => setShowOutput(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
          <div className="px-4 py-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto bg-[#0d0d0d]">
            {jsOutput.output.length === 0 && !jsOutput.error && (
              <span className="text-muted-foreground">No output</span>
            )}
            {jsOutput.output.map((line, i) => (
              <div key={i} className={`${line.startsWith('✖') ? 'text-red-400' : line.startsWith('⚠') ? 'text-yellow-400' : line.startsWith('→') ? 'text-blue-400' : 'text-green-300'}`}>
                {line}
              </div>
            ))}
            {jsOutput.error && (
              <div className="text-red-400 mt-1 border-t border-red-500/20 pt-1">✖ {jsOutput.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
