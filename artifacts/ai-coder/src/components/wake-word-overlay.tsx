import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { Mic, X, ShieldAlert, Clock, Sparkles, Volume2, Bell, Calculator, Globe } from 'lucide-react';
import { useWakeWord, WakeWordState } from '@/hooks/use-wake-word';
import { parseCommand, executeCommand, speak, stopSpeaking, getTtsSpeed, ActiveTimer } from '@/hooks/use-voice-commands';
import { hasVoiceProfile } from '@/hooks/use-voice-profile';
import { VoiceEnrollmentModal } from './voice-enrollment-modal';

/* ── Timer badge ─────────────────────────────────────────────────────────── */
function fmt(ms: number) {
  const s = Math.ceil(ms / 1000), m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `0:${r.toString().padStart(2, '0')}`;
}

function TimerBadge({ timer, onDone }: { timer: ActiveTimer; onDone: (id: string) => void }) {
  const [left, setLeft] = useState(timer.endsAt - Date.now());
  const firedRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      const rem = timer.endsAt - Date.now();
      setLeft(rem);
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        const msg = timer.isReminder
          ? `Reminder: ${timer.reminderText}`
          : `Time's up! ${timer.label.replace(/^[⏱🔔]\s*/, '')} is done.`;
        speak(msg);
        onDone(timer.id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [timer, onDone]);
  const pct = Math.max(0, Math.min(100, (left / timer.totalMs) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: 'hsl(var(--primary)/.06)', border: '1px solid hsl(var(--primary)/.2)', fontSize: 12, color: 'hsl(var(--foreground))' }}>
      {timer.isReminder ? <Bell style={{ width: 12, height: 12, color: 'hsl(var(--primary))', flexShrink: 0 }} /> : <Clock style={{ width: 12, height: 12, color: 'hsl(var(--primary))', flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, fontSize: 11 }}>{timer.label}</div>
        <div style={{ height: 3, background: 'hsl(var(--muted))', borderRadius: 2, marginTop: 3 }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'hsl(var(--primary))', width: `${pct}%`, transition: 'width .5s linear' }} />
        </div>
      </div>
      <span style={{ fontWeight: 700, color: 'hsl(var(--primary))', minWidth: 34, textAlign: 'right' }}>{fmt(Math.max(0, left))}</span>
    </div>
  );
}

function CmdIcon({ type, size = 20 }: { type: string; size?: number }) {
  const s = { width: size, height: size };
  if (type.includes('math') || type.includes('unit') || type.includes('coin') || type.includes('dice') || type.includes('random')) return <Calculator style={{ ...s, color: 'hsl(var(--primary))' }} />;
  if (type.includes('search') || type.includes('web') || type.includes('wiki') || type.includes('news') || type.includes('weather')) return <Globe style={{ ...s, color: 'hsl(var(--primary))' }} />;
  if (type.includes('timer') || type.includes('reminder')) return <Bell style={{ ...s, color: 'hsl(var(--primary))' }} />;
  if (type === 'ai-question') return <Sparkles style={{ ...s, color: 'hsl(var(--primary))' }} />;
  return <Globe style={{ ...s, color: 'hsl(var(--primary))' }} />;
}

function stateLabel(s: WakeWordState) {
  if (s === 'verifying') return 'Verifying your voice…';
  if (s === 'rejected') return 'Voice not recognised';
  if (s === 'listening-for-command') return 'Listening…';
  if (s === 'processing') return 'Got it!';
  return '';
}

const HINTS = [
  '"Open WhatsApp"', '"Call 0712…"', '"Set timer 10 min"', '"Remind me in 5 min to…"',
  '"What\'s the weather"', '"Show the news"', '"Search Wikipedia…"', '"Translate hello to Spanish"',
  '"What is 25 times 4"', '"Convert 5 km to miles"', '"Flip a coin"', '"Roll a dice"',
  '"Dark mode"', '"Speak faster"', '"New chat"', '"What\'s the time"', '"Any question…"', '"Stop"',
];

export function WakeWordOverlay() {
  const [, setLocation] = useLocation();
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [profileReady, setProfileReady] = useState(hasVoiceProfile());
  const [dismissed, setDismissed] = useState(false);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [lastAiText, setLastAiText] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [cmdType, setCmdType] = useState('');

  const removeTimer = useCallback((id: string) => setTimers(prev => prev.filter(t => t.id !== id)), []);

  // ── FIX: use a ref so handleCommand can call resetToIdle before it exists ──
  const resetToIdleRef = useRef<() => void>(() => {});
  const lastAiTextRef  = useRef('');
  lastAiTextRef.current = lastAiText;

  const onAiQuestion = useCallback((q: string) => {
    setLocation(`/?wakeCommand=${encodeURIComponent(q)}`);
  }, [setLocation]);

  // handleCommand does NOT list resetToIdle in deps — uses ref instead
  const handleCommand = useCallback((raw: string) => {
    const cmd = parseCommand(raw);
    setCmdType(cmd.type);

    if (cmd.type === 'stop-speaking') {
      stopSpeaking();
      setSpeaking(false);
      resetToIdleRef.current();
      return;
    }

    if (cmd.type === 'read-last') {
      const last = lastAiTextRef.current;
      if (!last) {
        speak("There's no previous response to read.", () => resetToIdleRef.current());
        return;
      }
      setSpeaking(true);
      speak(last, () => { setSpeaking(false); resetToIdleRef.current(); });
      return;
    }

    const result = executeCommand(
      cmd,
      setLocation,
      onAiQuestion,
      () => lastAiTextRef.current,
      () => {},
    );

    if (result.timer) setTimers(prev => [...prev, result.timer!]);
    if (result.action) setTimeout(result.action, 400);

    if (result.response) {
      setLastResponse(result.response);
      setSpeaking(true);
      speak(result.response, () => { setSpeaking(false); resetToIdleRef.current(); });
    } else {
      // No spoken response — still restart listening
      setTimeout(() => resetToIdleRef.current(), 300);
    }
  }, [setLocation, onAiQuestion]);

  const { state, supported, cancelCommand, resetToIdle } = useWakeWord(handleCommand, profileReady);

  // Keep ref in sync every render — this is the key fix
  resetToIdleRef.current = resetToIdle;

  // Listen for AI responses so "read last" works
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent).detail;
      if (typeof text === 'string') setLastAiText(text);
    };
    window.addEventListener('zorbix-ai-response', handler);
    return () => window.removeEventListener('zorbix-ai-response', handler);
  }, []);

  if (!supported) return null;

  const active = state !== 'idle';
  const rejected = state === 'rejected';
  const borderColor = rejected
    ? 'hsl(var(--destructive)/.5)'
    : speaking
      ? 'hsl(142 70% 50%/.5)'
      : 'hsl(var(--primary)/.4)';

  return (<>
    <style>{`
      @keyframes zbslide { from{opacity:0;transform:translateY(18px) scale(.93)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes zbring  { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.35);opacity:0} }
      @keyframes zbwave  { 0%,100%{height:6px} 50%{height:26px} }
    `}</style>

    {/* ── Setup banner ── */}
    {!profileReady && !dismissed && (
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9990, background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary)/.4)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.35)', maxWidth: 300, animation: 'zbslide .3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'hsl(var(--primary)/.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic style={{ width: 16, height: 16, color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Set up your voice</div>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Required for "Hey Zorbix" to work</div>
          </div>
          <button onClick={() => setDismissed(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowEnrollment(true)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Set Up Now</button>
          <button onClick={() => { setProfileReady(true); setDismissed(true); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', fontSize: 12, cursor: 'pointer' }}>Skip</button>
        </div>
      </div>
    )}

    {/* ── Idle mic indicator — always visible so user knows it's listening ── */}
    {!active && (profileReady || dismissed) && (
      <div
        title="Hey Zorbix is listening"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9988, width: 38, height: 38, borderRadius: '50%', background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary)/.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.2)', cursor: 'default' }}
      >
        <Mic style={{ width: 16, height: 16, color: 'hsl(var(--primary)/.6)' }} />
      </div>
    )}

    {/* ── Timers strip ── */}
    {timers.length > 0 && !active && (
      <div style={{ position: 'fixed', bottom: 68, right: 16, zIndex: 9989, display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 260 }}>
        {timers.map(t => <TimerBadge key={t.id} timer={t} onDone={removeTimer} />)}
      </div>
    )}

    {/* ── Active overlay ── */}
    {active && (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'hsl(var(--card))', border: `1px solid ${borderColor}`, borderRadius: 22, padding: '16px 18px', boxShadow: '0 14px 56px rgba(0,0,0,.5)', minWidth: 250, maxWidth: 320, animation: 'zbslide .25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Icon */}
          <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: rejected ? 'hsl(var(--destructive)/.15)' : speaking ? 'hsl(142 70% 50%/.15)' : 'hsl(var(--primary)/.15)' }} />
            {state === 'listening-for-command' && <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '2px solid hsl(var(--primary)/.45)', animation: 'zbring 1.2s ease-out infinite' }} />}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rejected ? <ShieldAlert style={{ width: 20, height: 20, color: 'hsl(var(--destructive))' }} />
                : speaking ? <Volume2 style={{ width: 20, height: 20, color: 'hsl(142 70% 50%)' }} />
                : state === 'processing' ? <CmdIcon type={cmdType} />
                : <Mic style={{ width: 20, height: 20, color: 'hsl(var(--primary))' }} />}
            </div>
          </div>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{stateLabel(state)}</div>
            {speaking && lastResponse
              ? <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastResponse}</div>
              : state === 'rejected'
                ? <div style={{ fontSize: 11, color: 'hsl(var(--destructive)/.8)' }}>Only your voice can wake Zorbix</div>
                : state === 'listening-for-command'
                  ? <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Say a command now</div>
                  : null}
          </div>
          {state === 'listening-for-command' && (
            <button onClick={cancelCommand} style={{ padding: 5, borderRadius: '50%', border: 'none', background: 'hsl(var(--muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'hsl(var(--muted-foreground))' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Wave bars */}
        {(state === 'listening-for-command' || speaking) && (
          <div style={{ display: 'flex', gap: 4, height: 28, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} style={{ width: 4, borderRadius: 2, background: speaking ? 'hsl(142 70% 50%)' : 'hsl(var(--primary))', animation: `zbwave ${.4 + i * .06}s ease-in-out infinite`, animationDelay: `${i * .05}s` }} />
            ))}
          </div>
        )}

        {/* Timers inside overlay */}
        {timers.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {timers.map(t => <TimerBadge key={t.id} timer={t} onDone={removeTimer} />)}
          </div>
        )}

        {/* Hints */}
        {state === 'listening-for-command' && (<>
          <button onClick={() => setShowHints(h => !h)} style={{ marginTop: 10, width: '100%', padding: '5px 0', borderRadius: 8, background: 'hsl(var(--muted)/.5)', border: 'none', fontSize: 11, color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>
            {showHints ? 'Hide commands ↑' : 'What can I say? ↓'}
          </button>
          {showHints && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {HINTS.map((h, i) => <span key={i} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'hsl(var(--primary)/.08)', border: '1px solid hsl(var(--primary)/.2)', color: 'hsl(var(--foreground))' }}>{h}</span>)}
            </div>
          )}
        </>)}
      </div>
    )}

    {showEnrollment && (
      <VoiceEnrollmentModal
        onClose={() => setShowEnrollment(false)}
        onEnrolled={() => { setProfileReady(true); setDismissed(true); }}
      />
    )}
  </>);
}
