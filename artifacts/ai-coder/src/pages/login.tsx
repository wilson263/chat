import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { login } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Code2, Zap, Shield, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, label: 'Multi-model AI Chat', desc: '50+ free models' },
  { icon: Code2,    label: 'Full IDE Workspace',  desc: 'Monaco editor, terminal, Git' },
  { icon: Zap,      label: 'Slash Commands',       desc: '/fix, /explain, /test & more' },
  { icon: Shield,   label: 'Secure & Private',     desc: 'Your data stays yours' },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setLocation('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="mesh-orb-1 absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary/10 blur-3xl" />
          <div className="mesh-orb-2 absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/8 blur-3xl" />
          <div className="dot-grid absolute inset-0 opacity-30" />
        </div>

        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ZorvixAI</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Build faster with<br />
            <span className="text-gradient-brand">AI at your side</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            The AI-powered coding platform with 50+ models, a full IDE workspace, and tools that actually understand your code.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-1 border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium leading-none mb-0.5">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="flex -space-x-2">
            {['A','B','C','D'].map((l,i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background flex items-center justify-center text-[10px] font-bold text-white">
                {l}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Trusted by <span className="text-foreground font-medium">thousands</span> of developers
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">ZorvixAI</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-destructive/8 border border-destructive/20 rounded-lg text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10 bg-surface-1 border-border text-sm"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-10 bg-surface-1 border-border text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-primary text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
              ) : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">No account yet?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-sm border-border"
            onClick={() => setLocation('/signup')}
          >
            Create a free account
          </Button>
        </div>
      </div>
    </div>
  );
}
