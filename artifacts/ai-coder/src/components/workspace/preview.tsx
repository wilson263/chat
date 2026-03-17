import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { Monitor, Download, ExternalLink, Info, Play, Square, AlertCircle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

function buildPreviewDocument(files: Array<{ name: string; path: string; content: string; language: string }>): string {
  const htmlFile = files.find(f => f.name.toLowerCase() === 'index.html') || files.find(f => f.language === 'html');
  const cssFiles = files.filter(f => f.language === 'css' || f.name.endsWith('.css'));
  const jsFiles = files.filter(f => (f.language === 'javascript' || f.name.endsWith('.js')) && !f.name.endsWith('.min.js'));

  // Console capture injection
  const consoleCaptureScript = `
<script>
(function(){
  var origConsole = {log: console.log, warn: console.warn, error: console.error, info: console.info};
  function send(type, args) {
    try {
      parent.postMessage({ type: 'console', level: type, message: Array.from(args).map(String).join(' ') }, '*');
    } catch(e){}
  }
  console.log = function(){send('log', arguments);origConsole.log.apply(console,arguments);};
  console.warn = function(){send('warn', arguments);origConsole.warn.apply(console,arguments);};
  console.error = function(){send('error', arguments);origConsole.error.apply(console,arguments);};
  console.info = function(){send('info', arguments);origConsole.info.apply(console,arguments);};
  window.onerror = function(msg,src,line,col,err){send('error','Runtime error: '+msg+(line?' (line '+line+')':''));return false;};
  window.addEventListener('unhandledrejection',function(e){send('error','Unhandled promise rejection: '+(e.reason?.message||e.reason));});
})();
</script>`;

  if (htmlFile) {
    let html = htmlFile.content;
    const cssContent = cssFiles.filter(f => f.name !== htmlFile.name).map(f => `/* ${f.name} */\n${f.content}`).join('\n\n');
    const jsContent = jsFiles.filter(f => f.name !== htmlFile.name).map(f => `/* ${f.name} */\n${f.content}`).join('\n\n');
    if (cssContent && !html.includes('<style>')) {
      html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
    }
    // Inject console capture before user scripts
    html = html.replace('<head>', `<head>${consoleCaptureScript}`);
    if (jsContent && !html.includes('<script>')) {
      html = html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
    }
    return html;
  }

  const cssContent = cssFiles.map(f => f.content).join('\n');
  const jsContent = jsFiles.map(f => f.content).join('\n');

  if (cssContent || jsContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${consoleCaptureScript}
  <style>${cssContent}</style>
</head>
<body>
  <script>${jsContent}</script>
</body>
</html>`;
  }

  return '';
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
  const [isRunning, setIsRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewDoc = useMemo(() => buildPreviewDocument(openFiles), [openFiles]);

  const hasFramework = openFiles.some(f =>
    f.content.includes('import React') || f.content.includes('from "react"') ||
    f.content.includes("from 'react'") || f.content.includes('createApp') || f.content.includes('SvelteComponent')
  );

  // Listen for console messages from the sandboxed iframe
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        setConsoleEntries(prev => [...prev, { level: e.data.level, message: e.data.message, ts: Date.now() }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const runCode = useCallback(() => {
    setConsoleEntries([]);
    setIsRunning(true);
    setRunKey(k => k + 1);
    setTimeout(() => setIsRunning(false), 1000);
  }, []);

  const stopPreview = useCallback(() => {
    setIsRunning(false);
    setRunKey(k => k + 1);
  }, []);

  const openInNewTab = () => {
    if (!previewDoc) return;
    const blob = new Blob([previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const downloadHtml = () => {
    if (!previewDoc) return;
    const blob = new Blob([previewDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-editor-bg">
        <Monitor className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No files open to preview</p>
      </div>
    );
  }

  if (hasFramework) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-editor-bg px-8 text-center">
        <Info className="h-12 w-12 mb-4 text-primary/40" />
        <h3 className="font-semibold text-foreground mb-2">Framework Project</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This project uses React, Vue, or another framework that needs a build step to preview.<br />
          Download the project as a ZIP to run it locally.
        </p>
        <Button variant="outline" size="sm" onClick={downloadHtml} className="border-border/50">
          <Download className="h-4 w-4 mr-2" /> Download Files
        </Button>
      </div>
    );
  }

  if (!previewDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-editor-bg text-center px-8">
        <Monitor className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm text-muted-foreground">
          Preview is available for HTML, CSS, and JavaScript projects.<br />
          Add an <span className="text-primary font-mono">index.html</span> file to see a live preview.
        </p>
      </div>
    );
  }

  const errorCount = consoleEntries.filter(e => e.level === 'error').length;

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-panel-bg shrink-0">
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-green-400" />
          Sandboxed Preview
          {isRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </span>
        <div className="flex gap-1.5 items-center">
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
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openInNewTab}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={downloadHtml}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={runCode}
          >
            <Play className="h-3 w-3" /> Run
          </Button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 bg-white relative overflow-hidden" style={{ minHeight: 0 }}>
        <iframe
          key={runKey}
          ref={iframeRef}
          srcDoc={previewDoc}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          title="Sandboxed Preview"
        />
      </div>

      {/* Console panel */}
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
    </div>
  );
}
