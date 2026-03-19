import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { register } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Code2, Check, Clock, Mail } from 'lucide-react';

const PERKS = [
  'Free access to 50+ AI models',
  'Full IDE workspace with Monaco editor',
  'Slash commands, vision input & more',
  'No credit card required',
];

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const result = await register(name, email, password);
      if ((result as any)?.pending) {
        setSubmittedEmail(email);
        setPending(true);
      } else {
        setLocation('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pending approval screen ──────────────────────────────────────────────────
  if (pending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ZorvixAI</span>
          </div>

          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-7 h-7 text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-3">Request submitted!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Your account request has been sent to the admin for review. Once approved, you'll receive a confirmation email at:
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-1 border border-border rounded-lg mb-8">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{submittedEmail}</span>
          </div>

          <div className="space-y-3 text-left mb-8 p-4 bg-surface-1 border border-border rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What happens next</p>
            <div className="space-y-2">
              {[
                'Admin receives your registration request',
                'Admin reviews and approves your account',
                'You get an email with a link to sign in',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-10 text-sm border-border"
            onClick={() => setLocation('/login')}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="mesh-orb-1 absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-accent/10 blur-3xl" />
          <div className="mesh-orb-2 absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/8 blur-3xl" />
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
            Start coding smarter<br />
            <span className="text-gradient-brand">for free, forever</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            Join thousands of developers who use ZorvixAI to write, debug, and ship code faster with AI.
          </p>
        </div>

        <div className="space-y-3">
          {PERKS.map((perk) => (
            <div key={perk} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{perk}</span>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border">
          <blockquote className="text-sm text-muted-foreground italic leading-relaxed">
            "ZorvixAI cut my debugging time in half. The inline code annotations alone are worth it."
          </blockquote>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">S</div>
            <span className="text-xs text-muted-foreground">Sarah K. — Senior Frontend Engineer</span>
          </div>
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Accounts are activated after admin approval</p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-destructive/8 border border-destructive/20 rounded-lg text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-10 bg-surface-1 border-border text-sm"
                required
                autoFocus
              />
            </div>

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
                  placeholder="Min. 6 characters"
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting request…</>
              ) : 'Request account'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              The first account created gets instant admin access.
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-sm border-border"
            onClick={() => setLocation('/login')}
          >
            Sign in instead
          </Button>
        </div>
      </div>
    </div>
  );
}
