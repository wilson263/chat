import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

function bellTone(ctx: AudioContext, baseFreq: number, startTime: number, peakVol: number, decay: number) {
  // Realistic bell via sine partials with natural harmonic ratios
  const ratios = [1, 2.756, 5.404, 8.933, 13.34];
  const vols   = [1.0,  0.5,   0.25,  0.12,  0.06];
  ratios.forEach((r, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq * r;
    osc.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(peakVol * vols[i], startTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + decay * (1 - i * 0.12));
    osc.start(startTime);
    osc.stop(startTime + decay + 0.05);
  });
}

function playIntroSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // --- Warm pad: soft Cmaj9 swell (C2, G2, E3, B3, D4) ---
    const padFreqs = [65.41, 98.00, 164.81, 246.94, 293.66];
    padFreqs.forEach((freq, i) => {
      const osc    = ctx.createOscillator();
      const gain   = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.055 - i * 0.007, now + 1.8);
      gain.gain.linearRampToValueAtTime(0.03, now + 3.8);
      gain.gain.linearRampToValueAtTime(0, now + 4.9);
      osc.start(now);
      osc.stop(now + 5.0);
    });

    // --- Ascending chime melody (C5 → D5 → E5 → G5 → A5 → C6) ---
    const melody = [
      { freq: 523.25, t: 0.45 },
      { freq: 587.33, t: 0.72 },
      { freq: 659.25, t: 0.98 },
      { freq: 783.99, t: 1.26 },
      { freq: 880.00, t: 1.55 },
      { freq: 1046.5, t: 1.85 },
    ];
    melody.forEach(({ freq, t }) => {
      bellTone(ctx, freq, now + t, 0.10, 1.0);
    });

    // --- Rich bell strike when ZORVIX logo appears ---
    bellTone(ctx, 523.25, now + 1.0, 0.18, 2.0);

    // --- Gentle second bell at tagline ---
    bellTone(ctx, 659.25, now + 1.9, 0.10, 1.5);

    // --- Soft resolution chord swell (Cmaj: C4, E4, G4) ---
    const resolveFreqs = [261.63, 329.63, 392.00, 523.25];
    resolveFreqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now + 2.0);
      gain.gain.linearRampToValueAtTime(0.045 - i * 0.007, now + 2.4);
      gain.gain.linearRampToValueAtTime(0, now + 4.5);
      osc.start(now + 2.0);
      osc.stop(now + 4.6);
    });

    // --- Gentle airy shimmer at exit ---
    const bufSize = Math.floor(ctx.sampleRate * 1.2);
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) nd[i] = Math.random() * 2 - 1;
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = noiseBuf;
    const shimFilter = ctx.createBiquadFilter();
    shimFilter.type = 'highpass';
    shimFilter.frequency.setValueAtTime(4000, now + 3.8);
    shimFilter.frequency.exponentialRampToValueAtTime(9000, now + 4.7);
    const shimGain = ctx.createGain();
    shimmer.connect(shimFilter);
    shimFilter.connect(shimGain);
    shimGain.connect(ctx.destination);
    shimGain.gain.setValueAtTime(0, now + 3.8);
    shimGain.gain.linearRampToValueAtTime(0.06, now + 4.1);
    shimGain.gain.linearRampToValueAtTime(0, now + 4.7);
    shimmer.start(now + 3.8);
    shimmer.stop(now + 4.8);

    return ctx;
  } catch {
    return null;
  }
}

export function ZorvixIntro({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const animRef = useRef<number>(0);

  const [bgVisible, setBgVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [tagVisible, setTagVisible] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // Choreographed reveal
    const t0 = setTimeout(() => setBgVisible(true), 100);
    const t1 = setTimeout(() => { audioRef.current = playIntroSound(); }, 400);
    const t2 = setTimeout(() => setLogoVisible(true), 1000);
    const t3 = setTimeout(() => setTagVisible(true), 1700);
    const t4 = setTimeout(() => setBarVisible(true), 2100);
    const t5 = setTimeout(() => setExiting(true), 4000);
    const t6 = setTimeout(() => setFlash(true), 4300);
    const t7 = setTimeout(() => onComplete(), 4700);

    return () => {
      [t0, t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
      cancelAnimationFrame(animRef.current);
      audioRef.current?.close();
    };
  }, [onComplete]);

  // Canvas particle network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#a78bfa', '#818cf8', '#22d3ee', '#7dd3fc', '#c4b5fd'];
    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.12;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 40%, #0d0520 0%, #060412 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* White flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'white',
          opacity: flash ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: bgVisible ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}
      />

      {/* Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          opacity: bgVisible ? 1 : 0,
          transition: 'opacity 2s ease',
        }}
      />

      {/* Horizontal scan line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0) 10%, rgba(167,139,250,0.9) 30%, rgba(34,211,238,1) 50%, rgba(167,139,250,0.9) 70%, rgba(34,211,238,0) 90%, transparent 100%)',
          pointerEvents: 'none',
          animation: 'zorvix-scan 3.5s cubic-bezier(0.4,0,0.6,1) infinite',
          opacity: bgVisible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      />

      {/* Pulse rings */}
      {[0, 0.5, 1.0].map((delay, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${320 + i * 80}px`,
            height: `${320 + i * 80}px`,
            borderRadius: '50%',
            border: `1px solid rgba(167,139,250,${0.18 - i * 0.04})`,
            pointerEvents: 'none',
            animation: `zorvix-ring 2.8s ease-out ${delay}s infinite`,
            opacity: bgVisible ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        />
      ))}

      {/* Corner decorations */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => {
        const isTop = pos.startsWith('top');
        const isLeft = pos.endsWith('left');
        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: '24px',
              [isLeft ? 'left' : 'right']: '24px',
              width: '40px',
              height: '40px',
              borderTop: isTop ? '1px solid rgba(167,139,250,0.4)' : 'none',
              borderBottom: !isTop ? '1px solid rgba(167,139,250,0.4)' : 'none',
              borderLeft: isLeft ? '1px solid rgba(167,139,250,0.4)' : 'none',
              borderRight: !isLeft ? '1px solid rgba(167,139,250,0.4)' : 'none',
              opacity: bgVisible ? 1 : 0,
              transition: 'opacity 1.5s ease',
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 24px' }}>

        {/* Top label */}
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.5em',
            color: '#22d3ee',
            textTransform: 'uppercase',
            marginBottom: '20px',
            opacity: logoVisible ? 0.85 : 0,
            transform: logoVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.9s ease, transform 0.9s ease',
            fontFamily: "'Fira Code', monospace",
          }}
        >
          ◈ Artificial Intelligence ◈
        </div>

        {/* ZORVIX logo */}
        <div
          style={{
            fontSize: 'clamp(58px, 14vw, 108px)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            lineHeight: 1,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            background:
              'linear-gradient(135deg, #ffffff 0%, #c4b5fd 25%, #a78bfa 50%, #22d3ee 75%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
            transition: 'opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1)',
            animation: logoVisible ? 'zorvix-glow 2.5s ease-in-out infinite' : 'none',
            position: 'relative',
          }}
        >
          ZORVIX
        </div>

        {/* Horizontal rule */}
        <div
          style={{
            height: '1px',
            margin: '18px auto',
            maxWidth: '320px',
            background:
              'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), rgba(34,211,238,0.6), transparent)',
            opacity: tagVisible ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.45em',
            color: 'rgba(196,181,253,0.75)',
            textTransform: 'uppercase',
            fontFamily: "'Fira Code', monospace",
            opacity: tagVisible ? 1 : 0,
            transform: tagVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.9s ease, transform 0.9s ease',
          }}
        >
          AI Coding Platform
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: '52px',
            width: '220px',
            marginLeft: 'auto',
            marginRight: 'auto',
            opacity: barVisible ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <div
            style={{
              height: '2px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #22d3ee)',
                boxShadow: '0 0 12px rgba(167,139,250,0.9)',
                borderRadius: '2px',
                animation: barVisible ? 'zorvix-bar 3.0s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
                width: '0%',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: 'rgba(167,139,250,0.4)',
              fontFamily: "'Fira Code', monospace",
            }}
          >
            <span>LOADING</span>
            <span>ZORVIX v2.0</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes zorvix-scan {
          0%   { top: -1px; }
          100% { top: calc(100% + 1px); }
        }
        @keyframes zorvix-ring {
          0%   { transform: scale(0.7);  opacity: 0.9; }
          100% { transform: scale(1.55); opacity: 0;   }
        }
        @keyframes zorvix-glow {
          0%, 100% {
            filter: drop-shadow(0 0 18px rgba(167,139,250,0.55))
                    drop-shadow(0 0 40px rgba(34,211,238,0.22));
          }
          50% {
            filter: drop-shadow(0 0 35px rgba(167,139,250,0.95))
                    drop-shadow(0 0 70px rgba(34,211,238,0.5));
          }
        }
        @keyframes zorvix-bar {
          0%   { width: 0%; }
          15%  { width: 12%; }
          40%  { width: 45%; }
          70%  { width: 78%; }
          90%  { width: 94%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
