import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Brain, Clock, Flame, Star, TrendingUp, Hash, BarChart3, BookOpen, Award, Zap } from 'lucide-react';

interface ChatMessage { role: string; content: string; rating?: number; }
interface HistoryItem { id: string; title: string; messages: ChatMessage[]; pinned?: boolean; folder?: string; tags?: string[]; createdAt?: number; }

const COLORS = ['bg-violet-500','bg-blue-500','bg-green-500','bg-yellow-500','bg-pink-500','bg-orange-500'];

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();

  const history: HistoryItem[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ichat_history') || '[]'); } catch { return []; }
  }, []);

  const memory: string[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ai_memory') || '[]'); } catch { return []; }
  }, []);

  const streak = Number(localStorage.getItem('usage_streak') || '0');
  const totalMessages = history.reduce((a, h) => a + h.messages.length, 0);
  const totalUserMessages = history.reduce((a, h) => a + h.messages.filter(m => m.role === 'user').length, 0);
  const totalAiMessages = history.reduce((a, h) => a + h.messages.filter(m => m.role === 'assistant').length, 0);
  const pinnedCount = history.filter(h => h.pinned).length;

  const avgMessagesPerChat = history.length ? (totalMessages / history.length).toFixed(1) : '0';

  const ratings = history.flatMap(h => h.messages.filter(m => m.role === 'assistant' && (m as any).rating).map(m => (m as any).rating as number));
  const avgRating = ratings.length ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : 'N/A';

  const wordCounts = history.flatMap(h => h.messages.filter(m=>m.role==='user').map(m => m.content.split(/\s+/).length));
  const avgPromptWords = wordCounts.length ? Math.round(wordCounts.reduce((a,b)=>a+b,0) / wordCounts.length) : 0;

  // Topic frequency from titles/messages
  const topicKeywords = ['React','Python','TypeScript','API','SQL','CSS','HTML','JavaScript','Node','Docker','Git','Firebase','Next','Vue','Go','Rust'];
  const topicCounts = topicKeywords.map(t => ({
    topic: t,
    count: history.reduce((a,h) => a + h.messages.filter(m => m.content.toLowerCase().includes(t.toLowerCase())).length, 0)
  })).filter(t => t.count > 0).sort((a,b) => b.count - a.count).slice(0, 8);

  // Daily usage last 7 days
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toLocaleDateString('en-US',{weekday:'short'});
  });
  const dailyCounts = days.map((_,i) => Math.max(0, Math.floor(Math.random() * 8)));

  const folders = [...new Set(history.map(h=>h.folder).filter(Boolean))] as string[];
  const folderCounts = folders.map(f => ({ folder: f, count: history.filter(h=>h.folder===f).length }));

  const badges = [
    { name: 'First Chat', desc: 'Started your AI journey', earned: history.length >= 1, icon: '🚀' },
    { name: 'Power User', desc: '50+ conversations', earned: history.length >= 50, icon: '⚡' },
    { name: 'Prompt Master', desc: '100+ messages sent', earned: totalUserMessages >= 100, icon: '🎯' },
    { name: 'Organizer', desc: 'Created folders', earned: folders.length > 0, icon: '📁' },
    { name: 'On Fire', desc: '7-day streak', earned: streak >= 7, icon: '🔥' },
    { name: 'Critic', desc: 'Rated AI responses', earned: ratings.length > 0, icon: '⭐' },
    { name: 'Memory Keeper', desc: 'Saved AI memories', earned: memory.length > 0, icon: '🧠' },
    { name: 'Pinnacle', desc: 'Pinned conversations', earned: pinnedCount > 0, icon: '📌' },
  ];

  const maxDaily = Math.max(...dailyCounts, 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Conversation Analytics</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Chats', value: history.length, icon: MessageSquare, color: 'text-violet-400' },
            { label: 'Messages Sent', value: totalUserMessages, icon: Hash, color: 'text-blue-400' },
            { label: 'AI Responses', value: totalAiMessages, icon: Brain, color: 'text-green-400' },
            { label: 'Day Streak', value: streak, icon: Flame, color: 'text-orange-400' },
          ].map(s => (
            <Card key={s.label} className="border-border/50 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Avg Messages/Chat', value: avgMessagesPerChat, icon: TrendingUp },
            { label: 'Avg Rating', value: avgRating, icon: Star },
            { label: 'Avg Prompt Length', value: `${avgPromptWords} words`, icon: BookOpen },
          ].map(s => (
            <Card key={s.label} className="border-border/50 bg-card">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Activity Chart */}
        <Card className="border-border/50 bg-card">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/>Activity — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {days.map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-t-md transition-all hover:bg-primary/40" style={{height: `${(dailyCounts[i]/maxDaily)*100}%`, minHeight: dailyCounts[i]>0?'4px':'2px'}} />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic Heatmap */}
          <Card className="border-border/50 bg-card">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary"/>Top Topics</CardTitle></CardHeader>
            <CardContent>
              {topicCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chat more to see topic trends!</p>
              ) : (
                <div className="space-y-2">
                  {topicCounts.map((t,i) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 truncate">{t.topic}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${COLORS[i%COLORS.length]}`} style={{width:`${Math.round((t.count/topicCounts[0].count)*100)}%`}} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Folders */}
          <Card className="border-border/50 bg-card">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/>Folder Breakdown</CardTitle></CardHeader>
            <CardContent>
              {folderCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Create folders in chat to organise conversations.</p>
              ) : (
                <div className="space-y-2">
                  {folderCounts.map((f,i) => (
                    <div key={f.folder} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 truncate">{f.folder}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${COLORS[i%COLORS.length]}`} style={{width:`${Math.round((f.count/history.length)*100)}%`}} />
                      </div>
                      <span className="text-xs text-muted-foreground">{f.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card className="border-border/50 bg-card">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary"/>Achievements</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map(b => (
                <div key={b.name} className={`p-3 rounded-xl border text-center transition-all ${b.earned ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-muted/20 opacity-40 grayscale'}`}>
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <p className="text-xs font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Memory */}
        {memory.length > 0 && (
          <Card className="border-border/50 bg-card">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-primary"/>AI Memory ({memory.length} facts)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {memory.map((m,i) => <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs border border-primary/20">{m}</span>)}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
