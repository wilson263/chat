import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Database, Play, RefreshCw, Loader2, Table2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DbPanel() {
  const { toast } = useToast();
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{ rows: any[]; total: number; columns: any[]; page: number; totalPages: number } | null>(null);
  const [customQuery, setCustomQuery] = useState('SELECT * FROM projects LIMIT 10');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [tab, setTab] = useState<'browser' | 'query'>('browser');

  useEffect(() => {
    fetch('/api/dbviewer/tables').then(r => r.ok ? r.json() : []).then(setTables).catch(() => {});
  }, []);

  const loadTable = async (name: string, page = 1) => {
    setActiveTable(name);
    setLoading(true);
    try {
      const [rowRes, schemaRes] = await Promise.all([
        fetch(`/api/dbviewer/tables/${name}/rows?page=${page}&limit=50`),
        fetch(`/api/dbviewer/tables/${name}/schema`),
      ]);
      if (rowRes.ok && schemaRes.ok) {
        const rowData = await rowRes.json();
        const schema = await schemaRes.json();
        setTableData({ ...rowData, columns: schema });
      }
    } finally { setLoading(false); }
  };

  const runQuery = async () => {
    setQueryLoading(true);
    try {
      const res = await fetch('/api/dbviewer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error, variant: 'destructive' }); return; }
      setQueryResult(data.rows);
      toast({ title: `${data.rowCount} rows returned` });
    } catch (err: any) { toast({ title: err.message, variant: 'destructive' }); }
    finally { setQueryLoading(false); }
  };

  const displayData = tab === 'query' ? queryResult : tableData?.rows;
  const columns = tab === 'query'
    ? (queryResult?.[0] ? Object.keys(queryResult[0]) : [])
    : tableData?.columns.map((c: any) => c.column_name) || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Database Viewer</span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-36 border-r border-border/30 flex flex-col shrink-0">
          <div className="flex gap-1 p-2 border-b border-border/30">
            <button onClick={() => setTab('browser')} className={`flex-1 text-[10px] py-1 rounded ${tab === 'browser' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>Browser</button>
            <button onClick={() => setTab('query')} className={`flex-1 text-[10px] py-1 rounded ${tab === 'query' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>Query</button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {tables.map(t => (
                <button key={t} onClick={() => { setTab('browser'); loadTable(t); }}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left text-xs transition-colors ${activeTable === t && tab === 'browser' ? 'bg-primary/15 text-primary' : 'hover:bg-muted/30 text-foreground'}`}>
                  <Table2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t}</span>
                </button>
              ))}
              {tables.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-3">No tables</p>}
            </div>
          </ScrollArea>
        </div>
        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'query' && (
            <div className="p-2 border-b border-border/30 shrink-0">
              <Textarea value={customQuery} onChange={e => setCustomQuery(e.target.value)}
                className="text-xs font-mono h-20 resize-none bg-muted/30" placeholder="SELECT * FROM projects LIMIT 10" />
              <Button size="sm" onClick={runQuery} disabled={queryLoading} className="mt-2 h-7 text-xs">
                {queryLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1 fill-current" />}
                Run Query
              </Button>
            </div>
          )}
          {tab === 'browser' && activeTable && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30 shrink-0 bg-muted/20">
              <span className="text-xs text-muted-foreground">{activeTable}</span>
              {tableData && <Badge variant="outline" className="text-[9px] h-4">{tableData.total} rows</Badge>}
              <Button variant="ghost" size="sm" onClick={() => loadTable(activeTable)} className="ml-auto h-5 w-5 p-0">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
          )}
          {loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : displayData && displayData.length > 0 ? (
            <ScrollArea className="flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 sticky top-0">
                      {columns.map(col => <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border/30 whitespace-nowrap">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20 border-b border-border/10">
                        {columns.map(col => (
                          <td key={col} className="px-3 py-1.5 max-w-[200px] truncate text-[11px]">
                            {row[col] === null ? <span className="text-muted-foreground/50 italic">null</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableData && tableData.totalPages > 1 && (
                <div className="flex items-center gap-2 p-2">
                  {Array.from({ length: tableData.totalPages }, (_, i) => (
                    <button key={i} onClick={() => loadTable(activeTable!, i + 1)}
                      className={`h-6 w-6 text-[10px] rounded ${tableData.page === i + 1 ? 'bg-primary text-white' : 'hover:bg-muted/50'}`}>{i + 1}</button>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Database className="h-8 w-8 opacity-30" />
              <p className="text-xs">{activeTable ? 'No data in this table' : 'Select a table to browse'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
