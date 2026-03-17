import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, FolderKanban, FileCode2, Users, BarChart3, Loader2, Calendar, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface UsageStats {
  user: { id: number; name: string; email: string; isAdmin: boolean; joinedAt: string };
  personal?: { conversations: number; messages: number; projects: number; recentActivity: Array<{ date: string; messages: number }> };
  totals: { conversations: number; messages: number; projects: number; files: number; users: number };
  recentActivity: Array<{ date: string; messages: number }>;
}

function StatCard({ icon: Icon, label, value, color, subLabel }: { icon: any; label: string; value: number; color: string; subLabel?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`p-3 rounded-xl ${color} shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {subLabel && <p className="text-xs text-primary mt-0.5">{subLabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-primary">{payload[0].value} messages</p>
      </div>
    );
  }
  return null;
};

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChart, setActiveChart] = useState<'global' | 'personal'>('personal');

  useEffect(() => {
    fetch('/api/usage/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const globalActivity = stats
    ? [...stats.recentActivity]
        .reverse()
        .slice(-14)
        .map(r => ({ date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), messages: r.messages }))
    : [];

  const personalActivity = stats?.personal
    ? [...stats.personal.recentActivity]
        .reverse()
        .slice(-14)
        .map(r => ({ date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), messages: r.messages }))
    : [];

  const chartData = activeChart === 'personal' ? personalActivity : globalActivity;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border/50 bg-card flex items-center px-4 gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Usage Dashboard</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center text-destructive py-12">{error}</div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-2">
              {(stats.user as any).avatarUrl ? (
                <img src={(stats.user as any).avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {stats.user.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold">{stats.user.name}</p>
                <p className="text-sm text-muted-foreground">{stats.user.email}</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(stats.user.joinedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Personal Stats */}
            {stats.personal && (
              <>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Your Activity</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={MessageSquare} label="Your Messages" value={stats.personal.messages} color="bg-blue-500" />
                  <StatCard icon={BarChart3} label="Your Conversations" value={stats.personal.conversations} color="bg-violet-500" />
                  <StatCard icon={FolderKanban} label="Your Projects" value={stats.personal.projects} color="bg-emerald-500" />
                </div>
              </>
            )}

            {/* Global Stats */}
            <div className="flex items-center gap-2 mt-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Platform Totals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={MessageSquare} label="Total Messages" value={stats.totals.messages} color="bg-blue-500" />
              <StatCard icon={BarChart3} label="Conversations" value={stats.totals.conversations} color="bg-violet-500" />
              <StatCard icon={FolderKanban} label="Projects" value={stats.totals.projects} color="bg-emerald-500" />
              <StatCard icon={FileCode2} label="Files" value={stats.totals.files} color="bg-orange-500" />
            </div>

            {stats.user.isAdmin && (
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="p-3 rounded-xl bg-rose-500">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totals.users.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Users (Admin View)</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Message Activity — Last 14 Days
                  </CardTitle>
                  <div className="flex gap-1">
                    {stats.personal && (
                      <Button
                        size="sm"
                        variant={activeChart === 'personal' ? 'default' : 'ghost'}
                        className="h-7 text-xs"
                        onClick={() => setActiveChart('personal')}
                      >
                        Mine
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={activeChart === 'global' ? 'default' : 'ghost'}
                      className="h-7 text-xs"
                      onClick={() => setActiveChart('global')}
                    >
                      Global
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorMessages)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
