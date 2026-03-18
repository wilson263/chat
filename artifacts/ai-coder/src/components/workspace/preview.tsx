import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { Monitor, Download, ExternalLink, Play, Terminal, Code2, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LANG_INFO: Record<string, { label: string; canPreview: boolean; isServerSide: boolean; icon: string }> = {
  html: { label: 'HTML', canPreview: true, isServerSide: false, icon: '🌐' },
  css: { label: 'CSS', canPreview: true, isServerSide: false, icon: '🎨' },
  javascript: { label: 'JavaScript', canPreview: true, isServerSide: false, icon: '🟨' },
  typescript: { label: 'TypeScript', canPreview: true, isServerSide: false, icon: '🔷' },
  python: { label: 'Python', canPreview: true, isServerSide: true, icon: '🐍' },
  java: { label: 'Java', canPreview: false, isServerSide: true, icon: '☕' },
  c: { label: 'C', canPreview: false, isServerSide: true, icon: '🔵' },
  cpp: { label: 'C++', canPreview: false, isServerSide: true, icon: '⚙️' },
  csharp: { label: 'C#', canPreview: false, isServerSide: true, icon: '🟣' },
  go: { label: 'Go', canPreview: false, isServerSide: true, icon: '🐹' },
  rust: { label: 'Rust', canPreview: false, isServerSide: true, icon: '🦀' },
  php: { label: 'PHP', canPreview: true, isServerSide: true, icon: '🐘' },
  ruby: { label: 'Ruby', canPreview: false, isServerSide: true, icon: '💎' },
  swift: { label: 'Swift', canPreview: false, isServerSide: true, icon: '🍎' },
  kotlin: { label: 'Kotlin', canPreview: false, isServerSide: true, icon: '🟠' },
  r: { label: 'R', canPreview: false, isServerSide: true, icon: '📊' },
  matlab: { label: 'MATLAB', canPreview: false, isServerSide: true, icon: '🔢' },
  sql: { label: 'SQL', canPreview: true, isServerSide: false, icon: '🗄️' },
  bash: { label: 'Bash/Shell', canPreview: false, isServerSide: true, icon: '💻' },
  powershell: { label: 'PowerShell', canPreview: false, isServerSide: true, icon: '🖥️' },
  dart: { label: 'Dart/Flutter', canPreview: false, isServerSide: true, icon: '🎯' },
  lua: { label: 'Lua', canPreview: true, isServerSide: false, icon: '🌙' },
  perl: { label: 'Perl', canPreview: false, isServerSide: true, icon: '🐪' },
  scala: { label: 'Scala', canPreview: false, isServerSide: true, icon: '⭐' },
  haskell: { label: 'Haskell', canPreview: false, isServerSide: true, icon: 'λ' },
  elixir: { label: 'Elixir', canPreview: false, isServerSide: true, icon: '💧' },
  julia: { label: 'Julia', canPreview: false, isServerSide: true, icon: '🔴' },
  solidity: { label: 'Solidity', canPreview: false, isServerSide: true, icon: '🪙' },
  graphql: { label: 'GraphQL', canPreview: true, isServerSide: false, icon: '📡' },
  yaml: { label: 'YAML', canPreview: true, isServerSide: false, icon: '📄' },
  json: { label: 'JSON', canPreview: true, isServerSide: false, icon: '📋' },
  xml: { label: 'XML', canPreview: true, isServerSide: false, icon: '📰' },
  markdown: { label: 'Markdown', canPreview: true, isServerSide: false, icon: '📝' },
  terraform: { label: 'Terraform', canPreview: false, isServerSide: true, icon: '🏗️' },
  dockerfile: { label: 'Dockerfile', canPreview: false, isServerSide: true, icon: '🐳' },
};

function detectPrimaryLanguage(files: Array<{ language: string; content: string }>): string {
  if (files.some(f => f.language === 'html')) return 'html';
  if (files.some(f => f.language === 'javascript' || f.language === 'typescript')) return 'javascript';
  if (files.some(f => f.language === 'python')) return 'python';
  if (files.some(f => f.language === 'markdown')) return 'markdown';
  if (files.some(f => f.language === 'json')) return 'json';
  if (files.some(f => f.language === 'yaml')) return 'yaml';
  if (files.some(f => f.language === 'sql')) return 'sql';
  return files[0]?.language ?? 'plaintext';
}

const consoleCaptureScript = `
<script>
(function(){
  var origConsole = {log: console.log, warn: console.warn, error: console.error, info: console.info};
  function send(type, args) {
    try { parent.postMessage({ type: 'console', level: type, message: Array.from(args).map(function(a){ try{return typeof a==='object'?JSON.stringify(a,null,2):String(a)}catch(e){return String(a)} }).join(' ') }, '*'); } catch(e){}
  }
  console.log = function(){send('log', arguments);origConsole.log.apply(console,arguments);};
  console.warn = function(){send('warn', arguments);origConsole.warn.apply(console,arguments);};
  console.error = function(){send('error', arguments);origConsole.error.apply(console,arguments);};
  console.info = function(){send('info', arguments);origConsole.info.apply(console,arguments);};
  window.onerror = function(msg,src,line,col,err){send('error','Runtime error: '+msg+(line?' (line '+line+')':''));return false;};
  window.addEventListener('unhandledrejection',function(e){send('error','Unhandled promise rejection: '+(e.reason?.message||e.reason));});
})();
</script>`;

function buildMarkdownPreview(content: string): string {
  const escaped = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.*)/gm, '<h3>$1</h3>').replace(/^## (.*)/gm, '<h2>$1</h2>').replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^\- (.*)/gm, '<li>$1</li>').replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Markdown Preview</title><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:40px auto;padding:0 24px;background:#0f172a;color:#e2e8f0;line-height:1.7}
    h1,h2,h3{color:#f1f5f9;border-bottom:1px solid #334155;padding-bottom:8px;margin-top:32px}
    h1{font-size:2em} h2{font-size:1.5em} h3{font-size:1.25em}
    code{background:#1e293b;color:#7dd3fc;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em}
    pre{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;overflow-x:auto}
    pre code{background:none;color:#a3e635;padding:0}
    li{margin:4px 0} strong{color:#f1f5f9} em{color:#c4b5fd}
    p{margin:12px 0}
  </style></head><body><p>${escaped}</p></body></html>`;
}

function buildJsonPreview(content: string): string {
  let formatted = content;
  try { formatted = JSON.stringify(JSON.parse(content), null, 2); } catch {}
  const escaped = formatted.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"([^"]+)":/g, '<span class="key">"$1":</span>')
    .replace(/: "([^"]*)"/g, ': <span class="str">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="bool">$1</span>')
    .replace(/: (null)/g, ': <span class="null">$1</span>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>JSON Viewer</title><style>
    body{margin:0;background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px}
    pre{padding:20px;margin:0;white-space:pre-wrap;word-break:break-all;line-height:1.6}
    .key{color:#7dd3fc} .str{color:#86efac} .num{color:#fbbf24} .bool{color:#f87171} .null{color:#94a3b8}
  </style></head><body><pre>${escaped}</pre></body></html>`;
}

function buildSqlPreview(content: string): string {
  const highlighted = content
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|AUTO_INCREMENT|DEFAULT|AND|OR|IN|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|AS|IF|EXISTS|CONSTRAINT|SERIAL|INTEGER|VARCHAR|TEXT|BOOLEAN|TIMESTAMP|DECIMAL|BIGINT|SMALLINT|JSONB|UUID)\b/g,
      '<span class="kw">$1</span>')
    .replace(/'([^']*)'/g, '<span class="str">\'$1\'</span>')
    .replace(/--[^\n]*/g, '<span class="comment">$&</span>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SQL Preview</title><style>
    body{margin:0;background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px}
    pre{padding:20px;margin:0;white-space:pre-wrap;line-height:1.6}
    .kw{color:#818cf8;font-weight:700} .str{color:#86efac} .comment{color:#64748b;font-style:italic}
  </style></head><body><pre>${highlighted}</pre></body></html>`;
}

function buildYamlPreview(content: string): string {
  const highlighted = content
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^(\s*)([\w\-]+):/gm, '$1<span class="key">$2</span>:')
    .replace(/: (.+)/g, ': <span class="val">$1</span>')
    .replace(/#[^\n]*/g, '<span class="comment">$&</span>');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YAML Preview</title><style>
    body{margin:0;background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px}
    pre{padding:20px;margin:0;white-space:pre-wrap;line-height:1.6}
    .key{color:#7dd3fc} .val{color:#86efac} .comment{color:#64748b;font-style:italic}
  </style></head><body><pre>${highlighted}</pre></body></html>`;
}

function buildCodePreview(content: string, language: string, langInfo: { label: string; icon: string; isServerSide: boolean }): string {
  const escaped = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const serverNote = langInfo.isServerSide
    ? `<div class="note">⚡ ${langInfo.label} runs server-side. Use AI to ask questions about this code or copy it to run locally.</div>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${langInfo.label} Code</title><style>
    body{margin:0;background:#0f172a;color:#e2e8f0;font-family:monospace;font-size:13px}
    .header{background:#1e293b;border-bottom:1px solid #334155;padding:10px 20px;display:flex;align-items:center;gap:10px;font-family:system-ui}
    .badge{background:#334155;color:#94a3b8;padding:3px 10px;border-radius:12px;font-size:12px}
    .note{background:#1e3a5f;border:1px solid #2563eb;border-radius:6px;padding:10px 14px;margin:16px 20px;color:#93c5fd;font-family:system-ui;font-size:13px}
    pre{padding:20px;margin:0;white-space:pre-wrap;line-height:1.7;overflow-x:auto}
  </style></head><body>
    <div class="header">${langInfo.icon} <span class="badge">${langInfo.label}</span></div>
    ${serverNote}
    <pre>${escaped}</pre>
  </body></html>`;
}

function isEsModuleContent(js: string): boolean {
  return /^\s*(import\s|export\s(default\s|const\s|function\s|class\s|\{))/m.test(js);
}

function buildJsInteractivePreview(files: Array<{ name: string; path: string; content: string; language: string }>): string {
  const htmlFile = files.find(f => f.language === 'html' || f.name.endsWith('.html'));
  const cssFiles = files.filter(f => f.language === 'css' || f.name.endsWith('.css'));
  const jsFiles = files.filter(f =>
    (f.language === 'javascript' || f.language === 'typescript' || f.name.endsWith('.js') || f.name.endsWith('.ts')) &&
    !f.name.endsWith('.min.js') && !f.name.endsWith('.d.ts')
  );

  const cssContent = cssFiles.map(f => f.content).join('\n\n');
  const jsContent = jsFiles.map(f => `/* === ${f.name} === */\n${f.content}`).join('\n\n');

  // Use type="module" when JS uses ES module import/export syntax
  const useModule = isEsModuleContent(jsContent);
  const openTag = useModule ? '<script type="module">' : '<script>';

  if (htmlFile) {
    let html = htmlFile.content;
    if (cssContent) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
      } else {
        html = `<style>${cssContent}</style>\n` + html;
      }
    }
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${consoleCaptureScript}`);
    } else {
      html = consoleCaptureScript + html;
    }
    if (jsContent && !html.includes('<script')) {
      html = html.replace('</body>', `${openTag}\n${jsContent}\n</script>\n</body>`);
    } else if (jsContent && useModule) {
      // Upgrade any plain <script> tags to modules so import/export works
      html = html.replace(/<script(?!\s+type=)/g, '<script type="module"');
    }
    return html;
  }

  if (jsContent || cssContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${consoleCaptureScript}
  <style>
    body { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="root"></div>
  ${openTag}
${jsContent}
  </script>
</body>
</html>`;
  }

  return '';
}

function buildTypescriptPreview(files: Array<{ name: string; path: string; content: string; language: string }>): string {
  const tsFiles = files.filter(f => f.language === 'typescript' || f.name.endsWith('.ts') || f.name.endsWith('.tsx'));
  const tsContent = tsFiles.map(f => f.content).join('\n\n');

  const strippedJs = tsContent
    .replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|object)\b/g, '')
    .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(?=[,)\s=;])/g, '')
    .replace(/<[A-Z][A-Za-z<>,\s\[\]|&?]*>/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/export\s+type\s+[^;]+;/g, '')
    .replace(/private\s+|public\s+|protected\s+|readonly\s+/g, '')
    .replace(/as\s+\w+/g, '');

  return buildJsInteractivePreview([
    ...files.filter(f => f.language === 'html' || f.language === 'css'),
    { name: 'main.js', path: 'main.js', content: strippedJs, language: 'javascript' }
  ]);
}

interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  ts: number;
}

export function LivePreview() {
  const { openFiles } = useWorkspaceStore();
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [runKey, setRunKey] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleEntries(prev => [...prev, {
          level: e.data.level as ConsoleEntry['level'],
          message: e.data.message,
          ts: Date.now()
        }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const primaryLanguage = useMemo(() => detectPrimaryLanguage(openFiles), [openFiles]);
  const langInfo = LANG_INFO[primaryLanguage] ?? { label: primaryLanguage, canPreview: false, isServerSide: true, icon: '📄' };

  const previewDoc = useMemo(() => {
    if (openFiles.length === 0) return '';

    if (primaryLanguage === 'markdown') {
      const file = openFiles.find(f => f.language === 'markdown') ?? openFiles[0];
      return buildMarkdownPreview(file.content);
    }

    if (primaryLanguage === 'json') {
      const file = openFiles.find(f => f.language === 'json') ?? openFiles[0];
      return buildJsonPreview(file.content);
    }

    if (primaryLanguage === 'sql') {
      const file = openFiles.find(f => f.language === 'sql') ?? openFiles[0];
      return buildSqlPreview(file.content);
    }

    if (primaryLanguage === 'yaml') {
      const file = openFiles.find(f => f.language === 'yaml') ?? openFiles[0];
      return buildYamlPreview(file.content);
    }

    if (primaryLanguage === 'typescript') {
      const hasHtml = openFiles.some(f => f.language === 'html');
      const hasReact = openFiles.some(f => f.content.includes('import React') || f.content.includes("from 'react'") || f.content.includes('from "react"'));
      if (!hasHtml && !hasReact) {
        return buildTypescriptPreview(openFiles);
      }
    }

    if (primaryLanguage === 'html' || primaryLanguage === 'javascript' || primaryLanguage === 'css') {
      const hasReact = openFiles.some(f =>
        f.content.includes('import React') || f.content.includes("from 'react'") ||
        f.content.includes('from "react"') || f.content.includes('createApp') || f.content.includes('SvelteComponent')
      );
      if (hasReact) return '';
      return buildJsInteractivePreview(openFiles);
    }

    const info = LANG_INFO[primaryLanguage];
    if (info) {
      const file = openFiles.find(f => f.language === primaryLanguage) ?? openFiles[0];
      return buildCodePreview(file.content, primaryLanguage, info);
    }

    const file = openFiles[0];
    return buildCodePreview(file.content, primaryLanguage, { label: primaryLanguage, icon: '📄', isServerSide: true });
  }, [openFiles, primaryLanguage]);

  const hasReact = useMemo(() => openFiles.some(f =>
    f.content.includes('import React') || f.content.includes("from 'react'") ||
    f.content.includes('from "react"') || f.content.includes('createApp') || f.content.includes('SvelteComponent')
  ), [openFiles]);

  const runCode = useCallback(() => {
    setConsoleEntries([]);
    setIsRunning(true);
    setRunKey(k => k + 1);
    setTimeout(() => setIsRunning(false), 1200);
  }, []);

  const openInNewTab = useCallback(() => {
    if (!previewDoc) return;
    const blob = new Blob([previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [previewDoc]);

  const downloadFile = useCallback(() => {
    if (openFiles.length === 0) return;
    const file = openFiles[0];
    const blob = new Blob([previewDoc || file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = previewDoc ? 'preview.html' : file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [openFiles, previewDoc]);

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-editor-bg">
        <Monitor className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No files open to preview</p>
        <p className="text-xs mt-1 opacity-60">Open any file to see a live preview</p>
      </div>
    );
  }

  if (hasReact) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-editor-bg px-8 text-center">
        <Code2 className="h-12 w-12 mb-4 text-primary/40" />
        <h3 className="font-semibold text-foreground mb-2">React / Framework Project</h3>
        <p className="text-sm text-muted-foreground mb-2">
          This project uses React, Vue, or another framework that requires a build step.<br />
          Use the <span className="text-primary font-mono">Terminal</span> tab to run it locally.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={downloadFile} className="border-border/50">
            <Download className="h-4 w-4 mr-2" /> Download Files
          </Button>
        </div>
      </div>
    );
  }

  const errorCount = consoleEntries.filter(e => e.level === 'error').length;

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-panel-bg shrink-0">
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-green-400" />
          <span className="text-primary font-medium">{langInfo.icon} {langInfo.label}</span>
          {isRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          {langInfo.isServerSide && !langInfo.canPreview && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">Server-side</span>
          )}
        </span>
        <div className="flex gap-1.5 items-center">
          {(primaryLanguage === 'html' || primaryLanguage === 'javascript' || primaryLanguage === 'css' || primaryLanguage === 'typescript') && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 text-xs gap-1.5 ${consoleOpen ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setConsoleOpen(o => !o)}
            >
              <Terminal className="h-3.5 w-3.5" />
              Console
              {errorCount > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1">{errorCount}</span>}
            </Button>
          )}
          {previewDoc && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openInNewTab}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={downloadFile}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
          {previewDoc && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={runCode}
            >
              <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} /> Run
            </Button>
          )}
        </div>
      </div>

      {previewDoc ? (
        <>
          <div className="flex-1 bg-white relative overflow-hidden" style={{ minHeight: 0 }}>
            <iframe
              key={runKey}
              ref={iframeRef}
              srcDoc={previewDoc}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
              title={`${langInfo.label} Preview`}
            />
          </div>

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
                  <span className="text-muted-foreground italic">No output yet. Click Run to execute.</span>
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
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-editor-bg px-8 text-center">
          <Info className="h-10 w-10 mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground mb-1">{langInfo.icon} {langInfo.label} — Code View</p>
          <p className="text-xs text-muted-foreground mb-4">
            {langInfo.isServerSide
              ? `${langInfo.label} runs on the server. Use the AI panel to analyze this code or copy it to run in your local environment.`
              : 'This file type displays in the editor. No visual preview available.'}
          </p>
          <Button variant="outline" size="sm" onClick={downloadFile} className="border-border/50">
            <Download className="h-4 w-4 mr-2" /> Download File
          </Button>
        </div>
      )}
    </div>
  );
}
