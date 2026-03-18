import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Download, Play, Monitor, X, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

interface MarkdownRendererProps {
  content: string;
  onPreview?: (html: string, css?: string, js?: string) => void;
}

export function MarkdownRenderer({ content, onPreview }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');

          if (!inline && match) {
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
      {content}
    </ReactMarkdown>
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
  const isCSS = language === 'css';
  const isRunnable = isJS || isHTML;

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
      {/* Header bar */}
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
              variant="ghost"
              size="sm"
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
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1"
              onClick={handleRun}
              title="Run JavaScript"
            >
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-green-400"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Syntax highlighted code */}
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

      {/* Inline HTML preview */}
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

      {/* JS console output */}
      {showOutput && jsOutput && (
        <div className="border-t border-border/40">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d0d]">
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />Console Output
            </span>
            <div className="flex gap-1">
              <button onClick={() => setShowOutput(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
            </div>
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
              <div className="text-red-400 mt-1 border-t border-red-500/20 pt-1">
                ✖ {jsOutput.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
