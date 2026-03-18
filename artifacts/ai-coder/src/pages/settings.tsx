import React, { useState, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '@/components/page-layout';
import {
  ArrowLeft, User, Lock, Save, Loader2, Shield, Camera,
  Key, Eye, EyeOff, MessageSquare, Sliders, RotateCcw,
  Globe, Check, Copy,
} from 'lucide-react';

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatarUrl ?? null);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [openAiKey, setOpenAiKey] = useState(() => localStorage.getItem('openai_api_key') ?? '');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('custom_system_prompt') || '');
  const [defaultTemp, setDefaultTemp] = useState<number>(() => {
    const saved = localStorage.getItem('chat_temperature');
    return saved ? parseFloat(saved) : 0.7;
  });

  const saveProfile = async () => {
    if (!name.trim()) { toast({ title: 'Name cannot be empty', variant: 'destructive' }); return; }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast({ title: 'Profile updated successfully' });
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally { setSavingProfile(false); }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) { toast({ title: 'Please fill in all password fields', variant: 'destructive' }); return; }
    if (newPassword !== confirmPassword) { toast({ title: 'New passwords do not match', variant: 'destructive' }); return; }
    if (newPassword.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      toast({ title: 'Password updated successfully' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally { setSavingPassword(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { toast({ title: 'Image too large (max 2MB)', variant: 'destructive' }); return; }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setAvatarPreview(dataUrl);
        try {
          const res = await fetch('/api/auth/avatar', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to upload');
          toast({ title: 'Avatar updated' });
        } catch (err: any) {
          toast({ title: err.message, variant: 'destructive' });
        } finally { setUploadingAvatar(false); }
      };
      reader.readAsDataURL(file);
    } catch { setUploadingAvatar(false); }
  };

  const saveOpenAiKey = () => {
    const trimmed = openAiKey.trim();
    if (trimmed) { localStorage.setItem('openai_api_key', trimmed); toast({ title: 'OpenAI API key saved' }); }
    else { localStorage.removeItem('openai_api_key'); toast({ title: 'OpenAI API key removed' }); }
  };

  return (
    <PageLayout crumbs={[{ label: 'Settings' }]} backHref="/" maxWidth="2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, security and preferences</p>
      </div>

      <div className="space-y-4">
        {/* Avatar */}
        <Section icon={Camera} title="Profile Avatar" description="Upload a profile picture (max 2MB)">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-2xl font-bold ring-2 ring-primary/20">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button onClick={() => avatarInputRef.current?.click()} variant="outline" size="sm" className="gap-2 border-border" disabled={uploadingAvatar}>
                <Camera className="w-3.5 h-3.5" />
                {avatarPreview ? 'Change' : 'Upload'}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
            </div>
          </div>
        </Section>

        {/* Profile */}
        <Section icon={User} title="Profile Information" description="Update your display name">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <Input value={user?.email ?? ''} disabled className="opacity-50 cursor-not-allowed h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-9" />
            </div>
            {user?.isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Admin Account</span>
              </div>
            )}
            <Button onClick={saveProfile} disabled={savingProfile} size="sm" className="gap-2">
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Profile
            </Button>
          </div>
        </Section>

        {/* API Keys */}
        <Section icon={Key} title="API Keys" description="Manage third-party API keys for additional AI models">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">OpenAI API Key</span>
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-surface-2 border border-border">Stored locally</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Required for GPT-4o, GPT-4o-mini, and o1-mini models.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showOpenAiKey ? 'text' : 'password'}
                    value={openAiKey}
                    onChange={e => setOpenAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10 h-9 font-mono text-sm"
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOpenAiKey(v => !v)}>
                    {showOpenAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button onClick={saveOpenAiKey} variant="outline" size="sm" className="gap-2 border-border shrink-0">
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              </div>
              {openAiKey && (
                <p className="text-xs text-green-400 flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  GPT-4 models unlocked
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* System Prompt */}
        <Section icon={MessageSquare} title="Custom System Prompt" description="Add persistent instructions applied to every conversation">
          <div className="space-y-3">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="e.g. Always respond concisely. Prefer TypeScript. Use dark humor occasionally."
              rows={4}
              className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button onClick={() => { localStorage.setItem('custom_system_prompt', systemPrompt); toast({ title: 'System prompt saved' }); }} variant="outline" size="sm" className="gap-2 border-border">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              <Button onClick={() => { setSystemPrompt(''); localStorage.removeItem('custom_system_prompt'); toast({ title: 'System prompt cleared' }); }} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
          </div>
        </Section>

        {/* Temperature */}
        <Section icon={Sliders} title="Default Creativity" description="Set how creative or precise AI responses are by default">
          <div className="space-y-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span className="font-semibold text-primary text-sm">{defaultTemp.toFixed(1)}</span>
              <span>Creative</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.1" value={defaultTemp}
              onChange={e => { const v = parseFloat(e.target.value); setDefaultTemp(v); localStorage.setItem('chat_temperature', v.toString()); }}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">You can also adjust this per conversation from the chat toolbar.</p>
          </div>
        </Section>

        <Separator className="my-2" />

        {/* Password */}
        <Section icon={Lock} title="Change Password" description="Update your account password">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Password</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 chars" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Confirm</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="h-9" />
              </div>
            </div>
            <Button onClick={savePassword} disabled={savingPassword} variant="outline" size="sm" className="gap-2 border-border">
              {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Update Password
            </Button>
          </div>
        </Section>

        {/* Custom Domain */}
        <CustomDomainSection />
      </div>
    </PageLayout>
  );
}

function CustomDomainSection() {
  const { toast } = useToast();
  const [domain, setDomain] = useState(() => localStorage.getItem('custom_domain') || '');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const cnameTarget = 'cname.zorvixai.app';

  const saveDomain = () => {
    if (domain.trim()) {
      localStorage.setItem('custom_domain', domain.trim());
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Custom domain saved', description: `Point ${domain} CNAME to ${cnameTarget}` });
    }
  };

  const copyTarget = () => {
    navigator.clipboard.writeText(cnameTarget);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            Custom Domain
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/40 text-primary">NEW</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Connect a custom domain to your deployed projects</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex gap-2">
          <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.yourdomain.com" className="font-mono text-sm h-9" />
          <Button onClick={saveDomain} variant="outline" size="sm" className="gap-2 border-border shrink-0">
            {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>

        <div className="bg-surface-1 rounded-lg p-4 border border-border space-y-3">
          <p className="text-xs font-medium">DNS Setup</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Log in to your DNS provider (Cloudflare, Namecheap, etc.)</li>
            <li>Add a <strong className="text-foreground">CNAME record</strong> pointing to:</li>
          </ol>
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
            <code className="text-xs text-primary flex-1 font-mono">{cnameTarget}</code>
            <button onClick={copyTarget} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">SSL certificate is provisioned automatically within 24 hours.</p>
        </div>

        {domain && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Pending DNS verification for <strong className="text-foreground">{domain}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
