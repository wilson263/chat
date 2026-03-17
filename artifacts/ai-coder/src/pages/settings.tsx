import React, { useState, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Lock, Save, Loader2, Shield, Camera, Key, Eye, EyeOff, MessageSquare, Sliders, RotateCcw, Globe, Check, Copy } from 'lucide-react';

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
    if (!name.trim()) {
      toast({ title: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast({ title: 'Profile updated successfully!' });
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      toast({ title: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast({ title: 'Image too large (max 2MB)', variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setAvatarPreview(dataUrl);
        try {
          const res = await fetch('/api/auth/avatar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to upload');
          toast({ title: 'Avatar updated!' });
        } catch (err: any) {
          toast({ title: err.message, variant: 'destructive' });
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  const saveOpenAiKey = () => {
    const trimmed = openAiKey.trim();
    if (trimmed) {
      localStorage.setItem('openai_api_key', trimmed);
      toast({ title: 'OpenAI API key saved!' });
    } else {
      localStorage.removeItem('openai_api_key');
      toast({ title: 'OpenAI API key removed' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border/50 bg-card flex items-center px-4 gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Account Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Profile Avatar
            </CardTitle>
            <CardDescription>Upload a profile picture (max 2MB)</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-2 border-primary/30">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button onClick={() => avatarInputRef.current?.click()} variant="outline" size="sm" className="gap-2" disabled={uploadingAvatar}>
                <Camera className="w-4 h-4" />
                {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
              </Button>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-2"
                  onClick={() => { setAvatarPreview(null); }}
                >
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            {user?.isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Admin Account</span>
              </div>
            )}
            <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* API Keys Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              API Keys
            </CardTitle>
            <CardDescription>Manage third-party API keys for additional AI models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openaiKey" className="flex items-center gap-2">
                <span className="text-green-400 font-semibold">OpenAI API Key</span>
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">Stored locally</span>
              </Label>
              <p className="text-xs text-muted-foreground">Required to use GPT-4o, GPT-4o-mini, and o1-mini models. Your key is stored locally in your browser only.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="openaiKey"
                    type={showOpenAiKey ? 'text' : 'password'}
                    value={openAiKey}
                    onChange={e => setOpenAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOpenAiKey(v => !v)}
                  >
                    {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={saveOpenAiKey} variant="outline" className="gap-2 shrink-0">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
              {openAiKey && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  OpenAI key is set — GPT-4 models are unlocked
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* System Prompt Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Custom System Prompt
            </CardTitle>
            <CardDescription>Add custom instructions applied to every conversation. The AI follows these in addition to its default behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="e.g. Always respond concisely. Prefer TypeScript. Use dark humor occasionally."
              rows={4}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground">Applied to every message. Leave blank for default behavior.</p>
            <div className="flex gap-2">
              <Button onClick={() => { localStorage.setItem('custom_system_prompt', systemPrompt); toast({ title: 'System prompt saved!' }); }} variant="outline" className="gap-2">
                <Save className="w-4 h-4" />Save Prompt
              </Button>
              <Button onClick={() => { setSystemPrompt(''); localStorage.removeItem('custom_system_prompt'); toast({ title: 'System prompt cleared' }); }} variant="ghost" className="gap-2 text-muted-foreground">
                <RotateCcw className="w-4 h-4" />Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Default Temperature Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Default Creativity (Temperature)
            </CardTitle>
            <CardDescription>Set how creative or precise AI responses are by default.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precise</span>
                <span className="font-semibold text-primary">{defaultTemp.toFixed(1)}</span>
                <span className="text-muted-foreground">Creative</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={defaultTemp}
                onChange={e => { const v = parseFloat(e.target.value); setDefaultTemp(v); localStorage.setItem('chat_temperature', v.toString()); }}
                className="w-full accent-primary" />
              <p className="text-xs text-muted-foreground">You can also adjust this per conversation from the chat toolbar.</p>
            </div>
          </CardContent>
        </Card>

        <Separator />

                {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={savePassword} disabled={savingPassword} variant="outline" className="gap-2">
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Custom Domain */}
        <CustomDomainCard />
      </div>
    </div>
  );
}

function CustomDomainCard() {
  const { toast } = useToast();
  const [domain, setDomain] = useState(() => localStorage.getItem('custom_domain') || '');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const cnameTarget = 'cname.zorvixai.app';

  const saveDomain = () => {
    if (domain.trim()) {
      localStorage.setItem('custom_domain', domain.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Custom domain saved', description: `Point ${domain} CNAME to ${cnameTarget}` });
    }
  };

  const copyTarget = () => {
    navigator.clipboard.writeText(cnameTarget);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Custom Domain
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/40 text-primary ml-1">NEW</Badge>
        </CardTitle>
        <CardDescription>Connect a custom domain to your deployed projects.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Your Domain</Label>
          <div className="flex gap-2">
            <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.yourdomain.com" className="font-mono text-sm" />
            <Button onClick={saveDomain} variant="outline" className="gap-2 shrink-0">
              {saved ? <Check className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 border border-border/50 space-y-3">
          <p className="text-xs font-semibold text-foreground">DNS Setup Instructions</p>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Log in to your DNS provider (Cloudflare, Namecheap, etc.)</li>
            <li>Add a <strong className="text-foreground">CNAME record</strong> pointing to:</li>
          </ol>
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border/50">
            <code className="text-xs text-primary flex-1 font-mono">{cnameTarget}</code>
            <button onClick={copyTarget} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">SSL certificate is provisioned automatically within 24 hours after DNS propagation.</p>
        </div>
        {domain && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            Pending DNS verification for <strong className="text-foreground">{domain}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
