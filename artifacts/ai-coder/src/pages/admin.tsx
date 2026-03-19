import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft, Users, MessageSquare, FolderKanban, FileCode2,
  BarChart3, Search, Shield, Trash2, Loader2, RefreshCw,
  CheckCircle, XCircle, Calendar, Activity, Clock, UserCheck, UserX,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  status: string;
  createdAt: string;
  messageCount?: number;
  projectCount?: number;
}

interface PendingUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface AdminStats {
  totals: {
    users: number;
    conversations: number;
    messages: number;
    projects: number;
    files: number;
  };
  recentActivity: Array<{ date: string; messages: number }>;
  users: AdminUser[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [promoting, setPromoting] = useState<number | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/registration-requests', { credentials: 'include' }),
      ]);
      const data = await statsRes.json();
      if (!statsRes.ok) throw new Error(data.error || 'Failed to fetch admin stats');
      setStats(data);

      if (pendingRes.ok) {
        const pending = await pendingRes.json();
        setPendingUsers(pending);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) {
      setLocation('/');
      return;
    }
    fetchStats();
  }, [user]);

  const approveUser = async (userId: number) => {
    setProcessingRequest(userId);
    try {
      const res = await fetch(`/api/admin/registration-requests/${userId}/approve`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve user');
      await fetchStats();
    } catch {
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectUser = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this registration request? This will delete the account.')) return;
    setProcessingRequest(userId);
    try {
      const res = await fetch(`/api/admin/registration-requests/${userId}/reject`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reject user');
      await fetchStats();
    } catch {
    } finally {
      setProcessingRequest(null);
    }
  };

  const toggleAdmin = async (userId: number, makeAdmin: boolean) => {
    setPromoting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: makeAdmin }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchStats();
    } catch {
    } finally {
      setPromoting(null);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This is irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchStats();
    } catch {}
  };

  const filteredUsers = stats?.users.filter(u =>
    (u.status === 'approved' || !u.status) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">You need admin privileges to view this page.</p>
          <Link href="/"><Button className="mt-4">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border/50 bg-card flex items-center px-4 gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Admin Dashboard
        </h1>
        {pendingUsers.length > 0 && (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-xs">
            {pendingUsers.length} pending
          </Badge>
        )}
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && <div className="text-center text-destructive py-12">{error}</div>}

        {/* ── Registration Requests ── */}
        {!loading && (
          <Card className={pendingUsers.length > 0 ? 'border-amber-500/30 bg-amber-500/3' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-amber-400" />
                Registration Requests
                {pendingUsers.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-xs ml-1">
                    {pendingUsers.length} pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
                  <UserCheck className="w-5 h-5 opacity-40" />
                  <span className="text-sm">No pending registration requests</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{u.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-400 border-amber-500/30">Pending</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          Requested {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                          disabled={processingRequest === u.id}
                          onClick={() => approveUser(u.id)}
                        >
                          {processingRequest === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserCheck className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          disabled={processingRequest === u.id}
                          onClick={() => rejectUser(u.id)}
                        >
                          {processingRequest === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserX className="w-3.5 h-3.5" />}
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon={Users} label="Total Users" value={stats.totals.users} color="bg-blue-500" />
              <StatCard icon={MessageSquare} label="Messages" value={stats.totals.messages} color="bg-violet-500" />
              <StatCard icon={Activity} label="Conversations" value={stats.totals.conversations} color="bg-cyan-500" />
              <StatCard icon={FolderKanban} label="Projects" value={stats.totals.projects} color="bg-emerald-500" />
              <StatCard icon={FileCode2} label="Files" value={stats.totals.files} color="bg-orange-500" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" /> Message Activity (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...stats.recentActivity].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-primary" /> User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{u.name}</span>
                            {u.isAdmin && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Admin</Badge>}
                            {u.id === user.id && <Badge className="text-[10px] h-4 px-1.5">You</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {u.id !== user.id && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={promoting === u.id}
                              onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                            >
                              {promoting === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.isAdmin ? <XCircle className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                              {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteUser(u.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
