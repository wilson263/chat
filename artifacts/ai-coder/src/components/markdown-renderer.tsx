import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Download, Play, Monitor, X, Terminal, ChevronDown, ChevronUp, Brain, Hash, ExternalLink } from 'lucide-react';
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
  const wordCount = content.split(/\s+/).length;

  return (
    <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-violet-500/10 transition-colors"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-violet-300 font-medium">Thinking</span>
          <span className="text-xs text-violet-500/60 font-mono ml-1">{wordCount} words</span>
        </div>
        <span className="flex-1 text-xs text-violet-400/50 truncate">{!expanded && preview}</span>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-violet-500/50">{expanded ? 'collapse' : 'expand'}</span>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-violet-400/60" />
            : <ChevronDown className="w-3.5 h-3.5 text-violet-400/60" />
          }
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-violet-500/10">
          <p className="text-xs text-violet-300/60 font-mono leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

function DiffBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split('\n');
  const addedLines = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removedLines = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 my-4" style={{ background: '#141414' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40" style={{ background: '#1c1c1c' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">diff</span>
          <div className="flex items-center gap-2 ml-2">
            {addedLines > 0 && <span className="text-xs text-green-400 font-mono">+{addedLines}</span>}
            {removedLines > 0 && <span className="text-xs text-red-400 font-mono">-{removedLines}</span>}
          </div>
        </div>
        <Button
          variant="ghost" size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title="Copy diff"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, i) => {
          let bg = 'transparent';
          let color = '#d4d4d4';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            bg = 'rgba(34,197,94,0.1)';
            color = '#86efac';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            bg = 'rgba(239,68,68,0.1)';
            color = '#fca5a5';
          } else if (line.startsWith('@@')) {
            bg = 'rgba(99,102,241,0.1)';
            color = '#a5b4fc';
          } else if (line.startsWith('+++') || line.startsWith('---')) {
            color = '#9ca3af';
          }
          return (
            <div key={i} style={{ background: bg, color, padding: '1px 16px 1px 12px', whiteSpace: 'pre' }}>
              <span style={{ opacity: 0.4, userSelect: 'none', marginRight: 12, display: 'inline-block', width: 20, textAlign: 'right', fontSize: 10 }}>{i + 1}</span>
              {line.startsWith('+') && !line.startsWith('+++') ? (
                <><span style={{ color: '#4ade80', opacity: 0.7 }}>+</span>{line.slice(1)}</>
              ) : line.startsWith('-') && !line.startsWith('---') ? (
                <><span style={{ color: '#f87171', opacity: 0.7 }}>-</span>{line.slice(1)}</>
              ) : line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function runJS(code: string): { output: string[]; error?: string } {
  const output: string[] = [];
  try {
    const sandbox = {
      console: {
        log: (...args: any[]) => output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        warn: (...args: any[]) => output.push('⚠ ' + args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => output.push('✖ ' + args.map(a => String(a)).join(' ')),
        info: (...args: any[]) => output.push('ℹ ' + args.map(a => String(a)).join(' ')),
        table: (...args: any[]) => output.push(JSON.stringify(args[0], null, 2)),
      },
      Math, JSON, Date, Array, Object, String, Number, Boolean,
      parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
      setTimeout: () => {}, clearTimeout: () => {}, setInterval: () => {}, clearInterval: () => {},
      Promise: class FakePromise { then() { return this; } catch() { return this; } },
    };

    const fn = new Function(...Object.keys(sandbox), code);
    const result = fn(...Object.values(sandbox));
    if (result !== undefined) output.push('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
    return { output };
  } catch (e: any) {
    return { output, error: e.message };
  }
}

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
  html: '#e34f26', css: '#1572b6', json: '#292929',
  bash: '#89e051', shell: '#89e051', sql: '#336791',
  rust: '#ce422b', go: '#00add8', java: '#5382a1',
  cpp: '#00599c', c: '#555555', ruby: '#cc342d',
  php: '#4f5d95', swift: '#fa7343', kotlin: '#7f52ff',
  yaml: '#cb171e', markdown: '#083fa1', jsx: '#61dafb', tsx: '#3178c6',
};

function LanguageDot({ lang }: { lang: string }) {
  const color = LANGUAGE_COLORS[lang.toLowerCase()] ?? '#6b7280';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
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
  const lineCount = code.split('\n').length;

  const isHTML = language === 'html';
  const isJS = ['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(language.toLowerCase());
  const showLineNumbers = lineCount > 4;

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
      cpp: 'cpp', c: 'c', ruby: 'rb', php: 'php', swift: 'swift',
      kotlin: 'kt', jsx: 'jsx', tsx: 'tsx',
    };
    const ext = extMap[language.toLowerCase()] ?? language ?? 'txt';
    const filename = `code.${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = () => {
    if (isHTML) {
      if (onPreview) { onPreview(code); } else { setInlinePreview(v => !v); }
      return;
    }
    if (isJS) {
      const result = runJS(code);
      setJsOutput(result);
      setShowOutput(true);
    }
  };

  const handleOpenPreview = () => {
    if (onPreview) { onPreview(code); } else { setInlinePreview(v => !v); }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border/40 my-4 shadow-lg" style={{ background: '#111118' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30" style={{ background: '#17171f' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageDot lang={language} />
            <span className="text-xs font-mono text-muted-foreground/70 tracking-wide">{language}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/30 font-mono">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-0.5">
          {isHTML && (
            <Button
              variant="ghost" size="sm"
              className="h-6 px-2 text-xs text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
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
              className="h-6 px-2 text-xs text-green-400/80 hover:text-green-300 hover:bg-green-500/10 gap-1"
              onClick={handleRun}
              title="Run code"
            >
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground/50 hover:text-green-400 transition-colors"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground/50 hover:text-foreground transition-colors"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-green-400" />
              : <Copy className="h-3.5 w-3.5" />
            }
          </Button>
        </div>
      </div>

      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8rem',
          lineHeight: '1.6',
        }}
        showLineNumbers={showLineNumbers}
        lineNumberStyle={{
          color: '#3a3a50',
          fontSize: '0.7rem',
          minWidth: '2.5rem',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
        wrapLines
        lineProps={() => ({
          style: { display: 'block', cursor: 'default' },
        })}
      >
        {code}
      </SyntaxHighlighter>

      {inlinePreview && isHTML && (
        <div className="border-t border-border/30">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#0f0f1a' }}>
            <span className="text-xs text-blue-400/70 flex items-center gap-1.5">
              <Monitor className="h-3 w-3" />
              Live Preview
            </span>
            <button
              onClick={() => setInlinePreview(false)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <iframe
            srcDoc={code}
            className="w-full bg-white"
            style={{ height: '320px', border: 'none' }}
            sandbox="allow-scripts allow-same-origin"
            title="Live Preview"
          />
        </div>
      )}

      {showOutput && jsOutput && (
        <div className="border-t border-border/30">
          <div className="flex items-center justify-between px-4 py-1.5" style={{ background: '#0a0a10' }}>
            <span className="text-xs text-green-400/70 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              Console Output
              {jsOutput.error && <span className="text-red-400 ml-2">• error</span>}
            </span>
            <button
              onClick={() => setShowOutput(false)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto" style={{ background: '#0a0a10' }}>
            {jsOutput.output.length === 0 && !jsOutput.error && (
              <span className="text-muted-foreground/40 italic">No output</span>
            )}
            {jsOutput.output.map((line, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  line.startsWith('✖') ? 'text-red-400' :
                  line.startsWith('⚠') ? 'text-yellow-400' :
                  line.startsWith('→') ? 'text-blue-400' :
                  line.startsWith('ℹ') ? 'text-cyan-400' :
                  'text-green-300'
                }`}
              >
                {line}
              </div>
            ))}
            {jsOutput.error && (
              <div className="text-red-400 mt-2 pt-2 border-t border-red-500/20">
                <span className="text-red-500 font-medium">Error: </span>{jsOutput.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarkdownRenderer({ content, onPreview }: MarkdownRendererProps) {
  const { thinking, mainContent } = React.useMemo(() => extractThinking(content), [content]);

  return (
    <div className="min-w-0">
      {thinking && <ThinkingBlock content={thinking} />}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2 prose-pre:p-0 prose-pre:my-0 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2"
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

            if (!inline && !match && codeString.includes('\n')) {
              return (
                <div className="relative rounded-lg overflow-hidden border border-border/30 my-3" style={{ background: '#111118' }}>
                  <pre className="overflow-x-auto p-4 text-xs font-mono text-foreground/80 leading-relaxed">
                    <code>{codeString}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium border ${className || ''}`}
                style={{
                  background: 'hsl(var(--primary) / 0.08)',
                  color: 'hsl(var(--primary) / 0.9)',
                  borderColor: 'hsl(var(--primary) / 0.12)',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-border/40">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }: any) {
            return <thead style={{ background: 'hsl(var(--surface-2))' }}>{children}</thead>;
          },
          th({ children }: any) {
            return (
              <th className="border-b border-border/40 px-4 py-2.5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                {children}
              </th>
            );
          },
          td({ children }: any) {
            return (
              <td className="border-b border-border/20 px-4 py-2.5 text-sm last:border-b-0">
                {children}
              </td>
            );
          },
          tr({ children }: any) {
            return (
              <tr className="hover:bg-surface-1/50 transition-colors">{children}</tr>
            );
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-muted-foreground italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }: any) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors inline-flex items-center gap-0.5"
              >
                {children}
                {isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-50 inline" />}
              </a>
            );
          },
          h1({ children }: any) {
            return <h1 className="text-xl font-bold mt-6 mb-3 text-foreground tracking-tight">{children}</h1>;
          },
          h2({ children }: any) {
            return <h2 className="text-lg font-semibold mt-5 mb-2.5 text-foreground tracking-tight">{children}</h2>;
          },
          h3({ children }: any) {
            return <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
          },
          ul({ children }: any) {
            return <ul className="space-y-1 my-2 list-none pl-0">{children}</ul>;
          },
          li({ children, ordered }: any) {
            return (
              <li className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <span>{children}</span>
              </li>
            );
          },
          strong({ children }: any) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          hr() {
            return <hr className="border-t border-border/40 my-5" />;
          },
        }}
      >
        {mainContent}
      </ReactMarkdown>
    </div>
  );
}
