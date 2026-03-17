import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Puzzle, Search, Star, Download, ExternalLink, Sparkles, Code2, GitBranch, Terminal as TerminalIcon, Eye, Palette, Globe, Shield, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: React.ElementType;
  category: 'productivity' | 'ai' | 'git' | 'ui' | 'security';
  stars: number;
  installs: number;
  enabled: boolean;
  builtin?: boolean;
}

const BUILTIN_PLUGINS: Plugin[] = [
  { id: 'ai-autocomplete', name: 'AI Autocomplete', description: 'Inline AI code completions powered by Gemini. Press Tab to accept suggestions.', author: 'ZorvixAI', version: '2.0.0', icon: Sparkles, category: 'ai', stars: 4892, installs: 98321, enabled: true, builtin: true },
  { id: 'git-lens', name: 'GitLens', description: 'View git history, blame annotations, and compare commits directly in the editor.', author: 'ZorvixAI', version: '1.5.0', icon: GitBranch, category: 'git', stars: 3201, installs: 72100, enabled: true, builtin: true },
  { id: 'terminal-runner', name: 'Code Runner', description: 'Run code files directly in the built-in terminal. Supports 6 languages.', author: 'ZorvixAI', version: '1.2.0', icon: TerminalIcon, category: 'productivity', stars: 2891, installs: 61000, enabled: true, builtin: true },
  { id: 'live-preview', name: 'Live Preview', description: 'Instantly preview HTML/CSS/JS changes without refreshing.', author: 'ZorvixAI', version: '1.0.0', icon: Eye, category: 'ui', stars: 2100, installs: 44200, enabled: true, builtin: true },
  { id: 'theme-studio', name: 'Theme Studio', description: 'Create custom editor color themes with live preview.', author: 'ZorvixAI', version: '1.1.0', icon: Palette, category: 'ui', stars: 1840, installs: 38100, enabled: false, builtin: true },
];

const MARKETPLACE_PLUGINS: Plugin[] = [
  { id: 'prettier', name: 'Prettier Formatter', description: 'Format code automatically on save using Prettier.', author: 'Prettier Team', version: '3.2.0', icon: Code2, category: 'productivity', stars: 5200, installs: 120000, enabled: false },
  { id: 'eslint', name: 'ESLint', description: 'Real-time JavaScript/TypeScript linting with auto-fix support.', author: 'ESLint', version: '8.57.0', icon: Shield, category: 'security', stars: 4700, installs: 105000, enabled: false },
  { id: 'rest-client', name: 'REST Client', description: 'Send HTTP requests and view responses directly in the workspace.', author: 'Community', version: '0.25.1', icon: Globe, category: 'productivity', stars: 3100, installs: 67500, enabled: false },
  { id: 'ai-docs', name: 'AI Doc Generator', description: 'Generate JSDoc/docstring comments for your functions automatically.', author: 'ZorvixAI', version: '1.0.3', icon: Sparkles, category: 'ai', stars: 2890, installs: 58200, enabled: false },
  { id: 'code-metrics', name: 'Code Metrics', description: 'Analyze complexity, line counts, and code quality metrics.', author: 'Community', version: '2.1.0', icon: Zap, category: 'productivity', stars: 1920, installs: 34800, enabled: false },
  { id: 'color-picker', name: 'Color Picker', description: 'Inline color picker for CSS/SCSS files.', author: 'Community', version: '0.9.5', icon: Palette, category: 'ui', stars: 1650, installs: 28900, enabled: false },
];

const CATEGORIES = ['all', 'ai', 'productivity', 'git', 'ui', 'security'];

export function PluginsPanel() {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([...BUILTIN_PLUGINS, ...MARKETPLACE_PLUGINS]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState<'installed' | 'marketplace'>('installed');

  const togglePlugin = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    const plugin = plugins.find(p => p.id === id);
    if (plugin) toast({ title: `${plugin.name} ${plugin.enabled ? 'disabled' : 'enabled'}` });
  };

  const installPlugin = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, installs: p.installs + 1 } : p));
    toast({ title: 'Plugin installed! Refresh to activate.' });
  };

  const filtered = plugins.filter(p => {
    const matchTab = tab === 'installed' ? (p.builtin || p.enabled) : !p.builtin;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchTab && matchSearch && matchCat;
  });

  const catColors: Record<string, string> = { ai: 'bg-purple-500/10 text-purple-400', productivity: 'bg-blue-500/10 text-blue-400', git: 'bg-orange-500/10 text-orange-400', ui: 'bg-pink-500/10 text-pink-400', security: 'bg-green-500/10 text-green-400' };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <Puzzle className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Extensions</span>
        <Badge className="ml-auto text-[9px] h-4 px-1">{plugins.filter(p => p.enabled).length} active</Badge>
      </div>

      <div className="p-2 border-b border-border/30 space-y-2 shrink-0">
        <div className="flex gap-1">
          <button onClick={() => setTab('installed')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${tab === 'installed' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>Installed</button>
          <button onClick={() => setTab('marketplace')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${tab === 'marketplace' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/30'}`}>Marketplace</button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search extensions..." className="pl-7 h-7 text-xs" />
        </div>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`text-[10px] px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors ${category === c ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}>{c}</button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 pt-1">
        <div className="space-y-1 pb-4">
          {filtered.map(plugin => (
            <div key={plugin.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/20 border border-transparent hover:border-border/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <plugin.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{plugin.name}</span>
                  {plugin.builtin && <Badge variant="outline" className="text-[9px] h-3.5 px-1">built-in</Badge>}
                  <Badge className={`text-[9px] h-3.5 px-1 ${catColors[plugin.category] || ''}`}>{plugin.category}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{plugin.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />{plugin.stars.toLocaleString()}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{plugin.installs.toLocaleString()}</span>
                  <span className="text-[9px] text-muted-foreground">v{plugin.version}</span>
                </div>
              </div>
              {tab === 'installed' ? (
                <Switch checked={plugin.enabled} onCheckedChange={() => togglePlugin(plugin.id)} className="shrink-0 scale-75" />
              ) : (
                <Button size="sm" onClick={() => installPlugin(plugin.id)} className="h-6 text-[10px] px-2 shrink-0">Install</Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
