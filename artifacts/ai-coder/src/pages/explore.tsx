import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Globe, Heart, GitFork, Eye, Search, Star, Sparkles,
  Code2, Play, Flame, Clock, TrendingUp, Filter, X, ExternalLink,
  Trophy, Zap, Terminal, Tag,
} from 'lucide-react';

interface PublicProject {
  id: string;
  title: string;
  description: string;
  author: string;
  avatar: string;
  language: string;
  tags: string[];
  likes: number;
  forks: number;
  views: number;
  createdAt: number;
  featured?: boolean;
  trending?: boolean;
}

const LANGUAGES = ['All', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'HTML/CSS'];
const CATEGORIES = ['All', 'Featured', 'Trending', 'New', 'Games', 'Tools', 'APIs', 'UI'];
const SORT_BY = ['Most Popular', 'Most Recent', 'Most Forked', 'Most Viewed'];

// Seeded community projects
const SEED_PROJECTS: PublicProject[] = [
  { id: 'p1', title: 'Snake Game Canvas', description: 'Classic snake game built with HTML5 Canvas — smooth animations, high score tracking, and increasing speed.', author: 'devmaster', avatar: '🐍', language: 'JavaScript', tags: ['game', 'canvas', 'html5'], likes: 284, forks: 91, views: 1820, createdAt: Date.now() - 1000000, featured: true, trending: true },
  { id: 'p2', title: 'FastAPI REST Starter', description: 'Production-ready FastAPI template with JWT auth, Pydantic models, SQLAlchemy, and auto-generated OpenAPI docs.', author: 'pydev', avatar: '⚡', language: 'Python', tags: ['api', 'fastapi', 'backend'], likes: 412, forks: 147, views: 3100, createdAt: Date.now() - 2000000, featured: true },
  { id: 'p3', title: 'Todo App with Local Storage', description: 'Clean, minimal todo app. Drag to reorder, categories, due dates, dark mode. Zero dependencies, pure Vanilla JS.', author: 'webcraft', avatar: '✅', language: 'JavaScript', tags: ['todo', 'productivity', 'vanilla'], likes: 198, forks: 73, views: 1240, createdAt: Date.now() - 3000000 },
  { id: 'p4', title: 'Glassmorphism Calculator', description: 'Beautiful calculator with frosted glass effect, keyboard support, history panel, and scientific mode.', author: 'ui_wizard', avatar: '🔮', language: 'HTML/CSS', tags: ['calculator', 'ui', 'glassmorphism'], likes: 341, forks: 120, views: 2760, createdAt: Date.now() - 500000, trending: true },
  { id: 'p5', title: 'Go HTTP Router', description: 'Lightweight HTTP router in Go — zero dependencies, middleware support, path params, and benchmarks.', author: 'gopher', avatar: '🐹', language: 'Go', tags: ['router', 'http', 'backend'], likes: 89, forks: 31, views: 620, createdAt: Date.now() - 8000000 },
  { id: 'p6', title: 'React Dashboard UI', description: 'Admin dashboard with charts (Recharts), data tables, dark/light mode, responsive sidebar and full TypeScript.', author: 'tsdev', avatar: '📊', language: 'TypeScript', tags: ['dashboard', 'react', 'charts'], likes: 527, forks: 189, views: 4200, createdAt: Date.now() - 1500000, featured: true, trending: true },
  { id: 'p7', title: 'Rust CLI Password Manager', description: 'Terminal-based password manager written in Rust. AES-256 encryption, clipboard copy, import/export.', author: 'rustacean', avatar: '🦀', language: 'Rust', tags: ['cli', 'security', 'crypto'], likes: 163, forks: 54, views: 980, createdAt: Date.now() - 6000000 },
  { id: 'p8', title: 'Weather Dashboard', description: 'Real-time weather app with 7-day forecast, hourly chart, wind/humidity details. Uses Open-Meteo free API.', author: 'clouddev', avatar: '🌤️', language: 'JavaScript', tags: ['weather', 'api', 'charts'], likes: 215, forks: 88, views: 1650, createdAt: Date.now() - 2500000 },
  { id: 'p9', title: 'Spring Boot CRUD API', description: 'REST API with Spring Boot 3, JPA, H2 database, validation, pagination, and Swagger UI.', author: 'javaguru', avatar: '☕', language: 'Java', tags: ['api', 'spring', 'crud'], likes: 134, forks: 47, views: 890, createdAt: Date.now() - 9000000 },
  { id: 'p10', title: 'Tetris in TypeScript', description: 'Full Tetris game with score system, levels, ghost piece, hold piece, and next preview panel.', author: 'gamedev', avatar: '🎮', language: 'TypeScript', tags: ['game', 'canvas', 'tetris'], likes: 302, forks: 109, views: 2100, createdAt: Date.now() - 700000, trending: true },
  { id: 'p11', title: 'C++ Sorting Visualizer', description: 'Visualize 8 sorting algorithms in real-time: bubble, merge, quick, heap, insertion, and more.', author: 'algo_master', avatar: '📈', language: 'C++', tags: ['algorithm', 'visualization', 'education'], likes: 78, forks: 23, views: 540, createdAt: Date.now() - 12000000 },
  { id: 'p12', title: 'Markdown Editor', description: 'Live markdown editor with preview split view, syntax highlighting, export to PDF/HTML, custom themes.', author: 'docwriter', avatar: '📝', language: 'JavaScript', tags: ['editor', 'markdown', 'tool'], likes: 189, forks: 67, views: 1340, createdAt: Date.now() - 4000000 },
  { id: 'p13', title: 'Python Data Analysis Kit', description: 'Jupyter-style Python data analysis tool with pandas, matplotlib visualization, and CSV upload.', author: 'datapython', avatar: '🐍', language: 'Python', tags: ['data', 'pandas', 'analysis'], likes: 256, forks: 94, views: 1890, createdAt: Date.now() - 3500000, featured: true },
  { id: 'p14', title: 'Music Player UI', description: 'Spotify-inspired music player UI with animated waveform, queue, equalizer bars, and playlist support.', author: 'audiodev', avatar: '🎵', language: 'HTML/CSS', tags: ['music', 'ui', 'animation'], likes: 398, forks: 142, views: 3400, createdAt: Date.now() - 900000, trending: true },
  { id: 'p15', title: 'Real-Time Chat App', description: 'WebSocket chat app with rooms, username display, typing indicators, emoji support, and message history.', author: 'socketdev', avatar: '💬', language: 'JavaScript', tags: ['chat', 'websocket', 'realtime'], likes: 321, forks: 118, views: 2580, createdAt: Date.now() - 1200000 },
  { id: 'p16', title: 'JWT Auth Service in Go', description: 'Complete auth service: registration, login, token refresh, logout, rate limiting, and Redis blacklist.', author: 'goauth', avatar: '🔐', language: 'Go', tags: ['auth', 'jwt', 'security'], likes: 147, forks: 58, views: 1020, createdAt: Date.now() - 5000000 },
];

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  const hrs = Math.floor(diff / 3_600_000);
  const mins = Math.floor(diff / 60_000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function ProjectCard({ project, onFork, onLike, liked }: {
  project: PublicProject;
  onFork: (p: PublicProject) => void;
  onLike: (id: string) => void;
  liked: boolean;
}) {
  const langColors: Record<string, string> = {
    'JavaScript': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'TypeScript': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Python': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Go': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Rust': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Java': 'bg-red-500/20 text-red-400 border-red-500/30',
    'C++': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'HTML/CSS': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{project.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold leading-tight">{project.title}</h3>
              {project.featured && <Badge className="text-[9px] h-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-1">⭐ Featured</Badge>}
              {project.trending && <Badge className="text-[9px] h-4 bg-rose-500/20 text-rose-400 border-rose-500/30 px-1">🔥 Trending</Badge>}
            </div>
            <p className="text-[10px] text-muted-foreground">by @{project.author}</p>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${langColors[project.language] || 'bg-muted text-muted-foreground border-border'}`}>{project.language}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>

      <div className="flex flex-wrap gap-1">
        {project.tags.map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border/40">#{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.views.toLocaleString()}</span>
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{project.forks}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(project.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLike(project.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${liked ? 'bg-rose-500/20 text-rose-400' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Heart className="w-3 h-3" fill={liked ? 'currentColor' : 'none'} />
            {(project.likes + (liked ? 1 : 0)).toLocaleString()}
          </button>
          <button
            onClick={() => onFork(project)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <GitFork className="w-3 h-3" />Fork
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<PublicProject[]>(SEED_PROJECTS);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('explore_liked') || '[]')); } catch { return new Set(); }
  });
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');

  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('explore_liked', JSON.stringify([...next]));
      return next;
    });
  };

  const forkProject = (p: PublicProject) => {
    toast({ title: `🍴 Forked "${p.title}"`, description: 'Check your Projects dashboard to open it.' });
  };

  let filtered = projects.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.includes(search.toLowerCase()))) return false;
    if (langFilter !== 'All' && p.language !== langFilter) return false;
    if (category === 'Featured' && !p.featured) return false;
    if (category === 'Trending' && !p.trending) return false;
    if (category === 'Games' && !p.tags.includes('game')) return false;
    if (category === 'Tools' && !p.tags.some(t => ['tool', 'editor', 'calculator'].includes(t))) return false;
    if (category === 'APIs' && !p.tags.some(t => ['api', 'backend', 'rest'].includes(t))) return false;
    if (category === 'UI' && !p.tags.some(t => ['ui', 'dashboard', 'glassmorphism'].includes(t))) return false;
    return true;
  });

  if (sortBy === 'Most Popular') filtered = filtered.sort((a, b) => b.likes - a.likes);
  else if (sortBy === 'Most Recent') filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortBy === 'Most Forked') filtered = filtered.sort((a, b) => b.forks - a.forks);
  else if (sortBy === 'Most Viewed') filtered = filtered.sort((a, b) => b.views - a.views);

  const stats = {
    total: projects.length,
    totalForks: projects.reduce((a, b) => a + b.forks, 0),
    totalLikes: projects.reduce((a, b) => a + b.likes, 0),
    totalViews: projects.reduce((a, b) => a + b.views, 0),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />Community Explore
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Discover, fork, and learn from community projects</p>
          </div>
          <Button onClick={() => setLocation('/projects')} className="gap-2 text-sm">
            <Sparkles className="w-4 h-4" />Share My Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Projects', value: stats.total, icon: Code2, color: 'text-primary' },
            { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-rose-400' },
            { label: 'Total Forks', value: stats.totalForks.toLocaleString(), icon: GitFork, color: 'text-blue-400' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, tags, descriptions…"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Category chips */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>{c}</button>
              ))}
            </div>

            <div className="ml-auto flex gap-2">
              {/* Language filter */}
              <select value={langFilter} onChange={e => setLangFilter(e.target.value)} className="bg-card border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-card border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                {SORT_BY.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            {search && <> matching "<span className="text-foreground">{search}</span>"</>}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">No projects found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onFork={forkProject} onLike={toggleLike} liked={likedIds.has(p.id)} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-card border border-border/50 rounded-2xl p-8">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Share Your Project</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">Built something cool? Publish it to the community so others can discover, learn from, and fork your work.</p>
          <Button onClick={() => setLocation('/projects')} className="gap-2">
            <Sparkles className="w-4 h-4" />Open My Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
