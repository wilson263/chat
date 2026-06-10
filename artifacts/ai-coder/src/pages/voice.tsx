import React, { useState, useCallback, useEffect, useRef } from 'react';
  import { Mic, MicOff, Volume2, ShieldCheck, ShieldAlert, Zap, Clock, Globe, Calculator, Music, Settings, ChevronRight } from 'lucide-react';
  import { useLocation } from 'wouter';
  import { PageLayout, PageHero } from '@/components/page-layout';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { useWakeWord } from '@/hooks/use-wake-word';
  import { parseCommand, executeCommand, speak, stopSpeaking } from '@/hooks/use-voice-commands';
  import { hasVoiceProfile } from '@/hooks/use-voice-profile';
  import { VoiceEnrollmentModal } from '@/components/voice-enrollment-modal';

  const COMMAND_CATEGORIES = [
    {
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-500',
      title: 'Time & Timers',
      commands: ['"What time is it?"', '"Set timer 10 minutes"', '"Remind me in 5 min to…"', '"Set alarm for 7 AM"'],
    },
    {
      icon: Globe,
      color: 'bg-green-500/10 text-green-500',
      title: 'Search & Navigate',
      commands: ['"Search YouTube for…"', '"Open WhatsApp"', '"Search Wikipedia for…"', '"Open GitHub"'],
    },
    {
      icon: Calculator,
      color: 'bg-orange-500/10 text-orange-500',
      title: 'Math & Convert',
      commands: ['"What is 25 times 4?"', '"Convert 5 km to miles"', '"100 dollars to euros"', '"Flip a coin"'],
    },
    {
      icon: Zap,
      color: 'bg-purple-500/10 text-purple-500',
      title: 'AI & Chat',
      commands: ['"Any question to ZorvixAI"', '"New chat"', '"Read last response"', '"Copy that"'],
    },
    {
      icon: Music,
      color: 'bg-pink-500/10 text-pink-500',
      title: 'System',
      commands: ['"Dark mode"', '"Light mode"', '"Speak faster"', '"Stop"'],
    },
  ];

  function PulseMic({ state, onClick }: { state: string; onClick: () => void }) {
    const isActive  = state === 'listening-for-command' || state === 'verifying';
    const isProcessing = state === 'processing';
    const isRejected = state === 'rejected';

    const ringColor = isRejected ? 'border-destructive/60' : 'border-primary/60';
    const bgColor   = isRejected ? 'bg-destructive/10' : isActive ? 'bg-primary/15' : 'bg-primary/10 hover:bg-primary/15';
    const iconColor = isRejected ? 'text-destructive' : 'text-primary';

    return (
      <div className="relative flex items-center justify-center">
        {isActive && (
          <>
            <div className={`absolute w-36 h-36 rounded-full border-2 ${ringColor} animate-ping opacity-20`} />
            <div className={`absolute w-28 h-28 rounded-full border ${ringColor} animate-pulse opacity-40`} />
          </>
        )}
        <button
          onClick={onClick}
          disabled={isProcessing}
          className={`relative w-24 h-24 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-xl ${bgColor} ${isActive ? 'border-primary/50' : 'border-border hover:border-primary/40'}`}
        >
          {isRejected
            ? <ShieldAlert className={`w-10 h-10 ${iconColor}`} />
            : isActive
              ? <Volume2 className={`w-10 h-10 ${iconColor} animate-pulse`} />
              : <Mic className={`w-10 h-10 ${iconColor}`} />
          }
        </button>
      </div>
    );
  }

  export default function VoicePage() {
    const [, setLocation] = useLocation();
    const [profileReady, setProfileReady] = useState(hasVoiceProfile());
    const [showEnrollment, setShowEnrollment] = useState(false);
    const [log, setLog] = useState<{ text: string; type: 'command' | 'response' | 'system'; time: string }[]>([]);
    const lastAiRef = useRef('');

    const addLog = useCallback((text: string, type: 'command' | 'response' | 'system') => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLog(prev => [{ text, type, time }, ...prev].slice(0, 50));
    }, []);

    const handleCommand = useCallback((raw: string) => {
      addLog(raw, 'command');
      const cmd = parseCommand(raw);
      const result = executeCommand(cmd, setLocation, (q) => {
        setLocation(`/?wakeCommand=${encodeURIComponent(q)}`);
      }, () => lastAiRef.current, () => {});

      if (result.response) {
        addLog(result.response, 'response');
        speak(result.response, () => resetToIdle());
      } else {
        setTimeout(() => resetToIdle(), 300);
      }
      if (result.action) setTimeout(result.action, 400);
    }, [setLocation, addLog]);

    const { state, supported, cancelCommand, resetToIdle, triggerListening } = useWakeWord(handleCommand, true);

    useEffect(() => {
      const handler = (e: Event) => {
        const text = (e as CustomEvent).detail;
        if (typeof text === 'string') lastAiRef.current = text;
      };
      window.addEventListener('zorbix-ai-response', handler);
      return () => window.removeEventListener('zorbix-ai-response', handler);
    }, []);

    useEffect(() => {
      if (state === 'listening-for-command') addLog('Listening for your command…', 'system');
      if (state === 'rejected') addLog('Voice not recognised — only your voice can wake Zorbix.', 'system');
    }, [state, addLog]);

    const statusLabel = {
      idle: 'Tap the mic or say "Hey Zorbix"',
      verifying: 'Verifying your voice…',
      'listening-for-command': 'Listening — say your command now',
      processing: 'Processing…',
      rejected: 'Voice not recognised',
    }[state] ?? '';

    const statusColor = state === 'rejected' ? 'text-destructive' : state === 'idle' ? 'text-muted-foreground' : 'text-primary';

    if (!supported) {
      return (
        <PageLayout crumbs={[{ label: 'Voice Assistant' }]} backHref="/">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
            <MicOff className="w-12 h-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Voice not supported</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Your browser doesn't support speech recognition. Try Chrome or Edge on desktop.</p>
            <Button onClick={() => setLocation('/')}>Back to Chat</Button>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout crumbs={[{ label: 'Voice Assistant' }]} backHref="/" withMeshBg>
        <PageHero
          icon={<Mic className="w-7 h-7 text-primary" />}
          title="Voice Assistant"
          description='Say "Hey Zorbix" anytime, or tap the mic to speak directly.'
          badge="Always Listening"
        />

        {/* ── Voice profile status ── */}
        <div className="flex justify-center mb-8">
          {profileReady ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Voice profile active — only your voice triggers Zorbix
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-sm font-medium">
              <ShieldAlert className="w-4 h-4" />
              No voice profile — anyone's voice can trigger the assistant
              <button onClick={() => setShowEnrollment(true)} className="underline underline-offset-2 hover:opacity-80 ml-1">
                Set up now
              </button>
            </div>
          )}
        </div>

        {/* ── Big mic button ── */}
        <div className="flex flex-col items-center gap-5 mb-12">
          <PulseMic state={state} onClick={() => {
            if (state === 'listening-for-command') { cancelCommand(); }
            else if (state === 'idle') { triggerListening(); }
          }} />
          <p className={`text-sm font-medium transition-colors ${statusColor}`}>{statusLabel}</p>
          {state === 'listening-for-command' && (
            <Button variant="outline" size="sm" onClick={cancelCommand}>Cancel</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ── Activity log ── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Activity</h3>
              {log.length > 0 && (
                <button onClick={() => setLog([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="p-4 space-y-2 min-h-[160px] max-h-[280px] overflow-y-auto">
              {log.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                  <Mic className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No activity yet — try saying a command</p>
                </div>
              ) : log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="text-muted-foreground/50 shrink-0 pt-0.5 font-mono">{entry.time}</span>
                  <span className={`font-medium shrink-0 ${entry.type === 'command' ? 'text-primary' : entry.type === 'response' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {entry.type === 'command' ? 'You' : entry.type === 'response' ? 'Zorbix' : '—'}
                  </span>
                  <span className="text-foreground/80 leading-relaxed">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Wake word info ── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Wake Word</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">Say any of these phrases to activate the assistant:</p>
              <div className="flex flex-wrap gap-2">
                {['Hey Zorbix', 'Hey Zorbicks', 'OK Zorbix', 'Okay Zorbix'].map(p => (
                  <Badge key={p} variant="secondary" className="text-xs font-mono">{p}</Badge>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <button
                  onClick={() => setShowEnrollment(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    {profileReady ? 'Re-enroll voice profile' : 'Set up voice profile'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setLocation('/settings')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="w-4 h-4 text-primary" />
                    Voice settings
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Commands grid ── */}
        <h2 className="text-lg font-semibold mb-4">What can you say?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMAND_CATEGORIES.map(cat => (
            <div key={cat.title} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                  <cat.icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">{cat.title}</h3>
              </div>
              <ul className="space-y-2">
                {cat.commands.map((cmd, i) => (
                  <li key={i} className="text-xs text-muted-foreground font-mono bg-muted/40 px-3 py-1.5 rounded-md">{cmd}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showEnrollment && (
          <VoiceEnrollmentModal
            onClose={() => setShowEnrollment(false)}
            onEnrolled={() => { setProfileReady(true); setShowEnrollment(false); }}
          />
        )}
      </PageLayout>
    );
  }
  