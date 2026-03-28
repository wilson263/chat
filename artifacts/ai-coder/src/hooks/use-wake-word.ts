import { useEffect, useRef, useCallback, useState } from 'react';
import { verifyVoice, hasVoiceProfile } from './use-voice-profile';

export type WakeWordState =
  | 'idle' | 'verifying' | 'rejected' | 'listening-for-command' | 'processing';

const WAKE_PHRASES = [
  'hey zorbix','hey zorb ix','hey zorb','a zorbix',
  'hey zorbicks','hey zorbit','hey zorbid','zorbix',
];

function containsWakePhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return WAKE_PHRASES.some(phrase => lower.includes(phrase));
}

export function useWakeWord(onCommand: (text: string) => void, enabled = true) {
  const [state, setState] = useState<WakeWordState>('idle');
  const [supported, setSupported] = useState(false);
  const bgRecRef = useRef<any>(null);
  const cmdRecRef = useRef<any>(null);
  const wakeLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const SR: any = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  const stopBg = useCallback(() => {
    if (bgRecRef.current) { try { bgRecRef.current.abort(); } catch {} bgRecRef.current = null; }
  }, []);

  const stopCmd = useCallback(() => {
    if (cmdRecRef.current) { try { cmdRecRef.current.abort(); } catch {} cmdRecRef.current = null; }
  }, []);

  const startCmd = useCallback(() => {
    if (!SR || !mountedRef.current) return;
    stopCmd();
    const rec = new SR();
    cmdRecRef.current = rec;
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim() ?? '';
      if (transcript && mountedRef.current) { setState('processing'); onCommand(transcript); }
    };
    rec.onerror = () => { if (mountedRef.current) { setState('idle'); wakeLockedRef.current = false; startBg(); } };
    rec.onend   = () => { if (mountedRef.current) { setState('idle'); wakeLockedRef.current = false; startBg(); } };
    rec.start();
    setState('listening-for-command');
  }, [SR, onCommand, stopCmd]);

  function startBg() {
    if (!SR || !mountedRef.current || !enabledRef.current) return;
    stopBg(); wakeLockedRef.current = false;
    const rec = new SR();
    bgRecRef.current = rec;
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      if (wakeLockedRef.current) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0]?.transcript ?? '';
        if (containsWakePhrase(t)) { wakeLockedRef.current = true; handleWake(); break; }
      }
    };
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') return;
      if (!wakeLockedRef.current && mountedRef.current)
        setTimeout(() => { if (mountedRef.current && !wakeLockedRef.current) startBg(); }, 2000);
    };
    rec.onend = () => {
      if (!wakeLockedRef.current && mountedRef.current && enabledRef.current)
        setTimeout(() => { if (mountedRef.current && !wakeLockedRef.current) startBg(); }, 500);
    };
    try { rec.start(); } catch {}
  }

  async function handleWake() {
    if (!mountedRef.current) return;
    stopBg(); setState('verifying');
    if (hasVoiceProfile()) {
      const { matched } = await verifyVoice(1800);
      if (!mountedRef.current) return;
      if (!matched) {
        setState('rejected');
        setTimeout(() => { if (mountedRef.current) { setState('idle'); wakeLockedRef.current = false; startBg(); } }, 1800);
        return;
      }
    }
    if (mountedRef.current) setTimeout(() => { if (mountedRef.current) startCmd(); }, 200);
  }

  const cancelCommand = useCallback(() => {
    stopCmd(); wakeLockedRef.current = false; setState('idle');
    setTimeout(() => { if (mountedRef.current) startBg(); }, 500);
  }, [stopCmd]);

  const resetToIdle = useCallback(() => {
    setState('idle'); wakeLockedRef.current = false;
    setTimeout(() => { if (mountedRef.current) startBg(); }, 300);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!SR) { setSupported(false); return; }
    setSupported(true);
    if (enabled) startBg();
    return () => { mountedRef.current = false; stopBg(); stopCmd(); };
  }, [enabled]);

  return { state, supported, cancelCommand, resetToIdle };
}
