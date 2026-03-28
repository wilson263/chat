import { useEffect, useRef, useCallback, useState } from 'react';
import { verifyVoice, hasVoiceProfile } from './use-voice-profile';

export type WakeWordState =
  | 'idle' | 'verifying' | 'rejected' | 'listening-for-command' | 'processing';

const WAKE_PHRASES = [
  'hey zorbix', 'hey zorb ix', 'hey zorb', 'a zorbix',
  'hey zorbicks', 'hey zorbit', 'hey zorbid', 'zorbix',
  'hey zorb ix', 'hey zerb ix', 'hey sorbix', 'orbix',
];

function containsWakePhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return WAKE_PHRASES.some(phrase => lower.includes(phrase));
}

export function useWakeWord(onCommand: (text: string) => void, enabled = true) {
  const [state, setState] = useState<WakeWordState>('idle');
  const [supported, setSupported] = useState(false);

  const bgRecRef      = useRef<any>(null);
  const cmdRecRef     = useRef<any>(null);
  const wakeLockedRef = useRef(false);
  const mountedRef    = useRef(true);
  const enabledRef    = useRef(enabled);
  const bgTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommandRef  = useRef(onCommand);

  enabledRef.current  = enabled;
  onCommandRef.current = onCommand;

  const SR: any = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  // ── helpers ──────────────────────────────────────────────────────────────
  const clearBgTimer = () => {
    if (bgTimerRef.current) { clearTimeout(bgTimerRef.current); bgTimerRef.current = null; }
  };

  const stopRec = (ref: React.MutableRefObject<any>) => {
    if (ref.current) {
      try { ref.current.onresult = null; ref.current.onerror = null; ref.current.onend = null; ref.current.abort(); }
      catch {}
      ref.current = null;
    }
  };

  const scheduleBg = useCallback((delayMs = 600) => {
    clearBgTimer();
    bgTimerRef.current = setTimeout(() => {
      if (mountedRef.current && enabledRef.current && !wakeLockedRef.current) startBg();
    }, delayMs);
  }, []);

  // ── background (wake-word) recognition ───────────────────────────────────
  function startBg() {
    if (!SR || !mountedRef.current || !enabledRef.current || wakeLockedRef.current) return;
    stopRec(bgRecRef);

    const rec = new SR();
    bgRecRef.current = rec;
    rec.lang          = 'en-US';
    rec.continuous    = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      if (wakeLockedRef.current || !mountedRef.current) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0]?.transcript ?? '';
        if (containsWakePhrase(transcript)) {
          wakeLockedRef.current = true;
          handleWake();
          return;
        }
      }
    };

    rec.onerror = (e: any) => {
      if (!mountedRef.current) return;
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') return;
      if (!wakeLockedRef.current) scheduleBg(2000);
    };

    rec.onend = () => {
      if (!mountedRef.current || wakeLockedRef.current || !enabledRef.current) return;
      scheduleBg(400);
    };

    try { rec.start(); } catch { scheduleBg(2000); }
  }

  // ── command recognition ───────────────────────────────────────────────────
  function startCmd() {
    if (!SR || !mountedRef.current) return;
    stopRec(cmdRecRef);

    const rec = new SR();
    cmdRecRef.current = rec;
    rec.lang          = 'en-US';
    rec.continuous    = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    let got = false;

    rec.onresult = (e: any) => {
      if (got || !mountedRef.current) return;
      got = true;
      const transcript = e.results[0]?.[0]?.transcript?.trim() ?? '';
      if (transcript) {
        setState('processing');
        onCommandRef.current(transcript);
      } else {
        wakeLockedRef.current = false;
        setState('idle');
        scheduleBg();
      }
    };

    rec.onerror = () => {
      if (!mountedRef.current) return;
      wakeLockedRef.current = false;
      setState('idle');
      scheduleBg();
    };

    rec.onend = () => {
      if (!mountedRef.current) return;
      if (!got) {
        // timed out with no speech
        wakeLockedRef.current = false;
        setState('idle');
        scheduleBg();
      }
    };

    rec.start();
    setState('listening-for-command');
  }

  // ── wake handler ──────────────────────────────────────────────────────────
  async function handleWake() {
    if (!mountedRef.current) return;
    stopRec(bgRecRef);
    setState('verifying');

    if (hasVoiceProfile()) {
      const { matched } = await verifyVoice(1800);
      if (!mountedRef.current) return;
      if (!matched) {
        setState('rejected');
        setTimeout(() => {
          if (!mountedRef.current) return;
          wakeLockedRef.current = false;
          setState('idle');
          scheduleBg();
        }, 1800);
        return;
      }
    }

    if (mountedRef.current) setTimeout(() => { if (mountedRef.current) startCmd(); }, 150);
  }

  // ── public controls ───────────────────────────────────────────────────────
  const cancelCommand = useCallback(() => {
    stopRec(cmdRecRef);
    wakeLockedRef.current = false;
    setState('idle');
    scheduleBg();
  }, [scheduleBg]);

  const resetToIdle = useCallback(() => {
    stopRec(cmdRecRef);
    wakeLockedRef.current = false;
    setState('idle');
    scheduleBg();
  }, [scheduleBg]);

  // ── lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!SR) { setSupported(false); return; }
    setSupported(true);
    if (enabled) startBg();
    return () => {
      mountedRef.current = false;
      clearBgTimer();
      stopRec(bgRecRef);
      stopRec(cmdRecRef);
    };
  }, [enabled]);

  return { state, supported, cancelCommand, resetToIdle };
}
