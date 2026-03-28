import React, { useState, useRef } from 'react';
import { Mic, CheckCircle, XCircle, RefreshCw, Trash2, Shield } from 'lucide-react';
import { enrollVoice, clearVoiceProfile, hasVoiceProfile } from '@/hooks/use-voice-profile';

interface Props { onClose: () => void; onEnrolled: () => void; }
type Phase = 'intro' | 'recording' | 'success' | 'error';

export function VoiceEnrollmentModal({ onClose, onEnrolled }: Props) {
  const [phase, setPhase]       = useState<Phase>('intro');
  const [step, setStep]         = useState(0);
  const [total]                 = useState(3);
  const [level, setLevel]       = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadyHas, setAlreadyHas] = useState(hasVoiceProfile());
  const runRef = useRef(false);

  const start = async () => {
    if (runRef.current) return;
    runRef.current = true;
    setPhase('recording'); setStep(0); setLevel(0);
    try {
      await enrollVoice((s, _t, lvl) => { setStep(s); setLevel(lvl); });
      setPhase('success'); setAlreadyHas(true);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not record voice. Check microphone permissions.');
      setPhase('error');
    } finally { runRef.current = false; }
  };

  const reset = () => { clearVoiceProfile(); setAlreadyHas(false); setPhase('intro'); setStep(0); setLevel(0); };

  const S: React.CSSProperties = { position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 };
  const C: React.CSSProperties = { background:'hsl(var(--card))', border:'1px solid hsl(var(--border))', borderRadius:20, padding:'32px 28px', maxWidth:420, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.5)', animation:'zenmodal .3s ease' };
  const Btn = (style: React.CSSProperties, onClick: () => void, children: React.ReactNode) => (
    <button onClick={onClick} style={{ border:'none', cursor:'pointer', borderRadius:10, ...style }}>{children}</button>
  );

  return (
    <div style={S} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`@keyframes zenmodal{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes zenwave{0%,100%{height:8px}50%{height:26px}}`}</style>
      <div style={C}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:44,height:44,borderRadius:'50%',background:'hsl(var(--primary)/.15)',border:'1px solid hsl(var(--primary)/.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            {phase==='success'?<CheckCircle style={{width:20,height:20,color:'hsl(142 70% 50%)'}}/>:phase==='error'?<XCircle style={{width:20,height:20,color:'hsl(var(--destructive))'}}/>:<Mic style={{width:20,height:20,color:'hsl(var(--primary))'}}/>}
          </div>
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:'hsl(var(--foreground))',margin:0}}>Voice Setup — Hey Zorbix</h2>
            <p style={{fontSize:12,color:'hsl(var(--muted-foreground))',margin:0}}>Train Zorbix to recognise only your voice</p>
          </div>
        </div>

        {phase==='intro'&&(<>
          {alreadyHas&&(<div style={{background:'hsl(var(--primary)/.08)',border:'1px solid hsl(var(--primary)/.2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'hsl(var(--foreground))',marginBottom:16,display:'flex',alignItems:'center',gap:8}}><Shield style={{width:14,height:14,color:'hsl(var(--primary))',flexShrink:0}}/> Voice profile active — re-enroll to update.</div>)}
          <p style={{fontSize:13,color:'hsl(var(--muted-foreground))',marginBottom:16,lineHeight:1.65}}>Say <strong style={{color:'hsl(var(--foreground))'}}>&#8220;Hey Zorbix&#8221;</strong> <strong>3 times</strong>.<br/>Only your voice will wake Zorbix after this.</p>
          <ul style={{fontSize:12,color:'hsl(var(--muted-foreground))',marginBottom:22,paddingLeft:18,lineHeight:2.1}}>
            <li>Speak clearly at your normal volume</li><li>Use your natural tone each time</li><li>Allow microphone access when prompted</li>
          </ul>
          <div style={{display:'flex',gap:10}}>
            {Btn({flex:1,padding:'11px 0',background:'hsl(var(--primary))',color:'hsl(var(--primary-foreground))',fontSize:14,fontWeight:600},start,alreadyHas?'Re-enroll Voice':'Start Enrollment')}
            {alreadyHas&&Btn({padding:'11px 14px',background:'hsl(var(--destructive)/.1)',color:'hsl(var(--destructive))',border:'1px solid hsl(var(--destructive)/.3)',fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6},reset,<><Trash2 style={{width:13,height:13}}/> Reset</>)}
          </div>
          {Btn({marginTop:10,width:'100%',padding:'9px 0',background:'transparent',color:'hsl(var(--muted-foreground))',border:'1px solid hsl(var(--border))',fontSize:13},onClose,'Cancel')}
        </>)}

        {phase==='recording'&&(<div style={{textAlign:'center'}}>
          <p style={{fontSize:13,color:'hsl(var(--muted-foreground))',marginBottom:4}}>Sample <strong style={{color:'hsl(var(--foreground))'}}>{step}</strong> of {total}</p>
          <p style={{fontSize:22,fontWeight:700,color:'hsl(var(--foreground))',marginBottom:24}}>Say: <span style={{color:'hsl(var(--primary))'}}>&#8220;Hey Zorbix&#8221;</span></p>
          <div style={{display:'flex',gap:5,height:48,alignItems:'center',justifyContent:'center',marginBottom:24}}>
            {Array.from({length:9}).map((_,i)=>(<div key={i} style={{width:6,borderRadius:4,background:'hsl(var(--primary))',height:`${Math.max(8,level*.48*(0.5+Math.sin(i)*0.3))}px`,transition:'height .1s ease',animation:level>10?`zenwave ${.6+i*.09}s ease-in-out infinite`:'none',animationDelay:`${i*.07}s`}}/>))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:8}}>
            {Array.from({length:total}).map((_,i)=>(<div key={i} style={{width:10,height:10,borderRadius:'50%',background:i<step?'hsl(var(--primary))':'hsl(var(--muted))',transition:'background .3s'}}/>))}
          </div>
          <p style={{fontSize:12,color:'hsl(var(--muted-foreground))'}}>Recording… speak naturally</p>
        </div>)}

        {phase==='success'&&(<div style={{textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'hsl(142 70% 50%/.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><CheckCircle style={{width:32,height:32,color:'hsl(142 70% 50%)'}}/></div>
          <h3 style={{fontSize:18,fontWeight:700,color:'hsl(var(--foreground))',marginBottom:8}}>Voice Enrolled!</h3>
          <p style={{fontSize:13,color:'hsl(var(--muted-foreground))',marginBottom:24,lineHeight:1.65}}>Say <strong style={{color:'hsl(var(--foreground))'}}>&#8220;Hey Zorbix&#8221;</strong> on any page — only you can trigger it.</p>
          {Btn({width:'100%',padding:'12px 0',background:'hsl(var(--primary))',color:'hsl(var(--primary-foreground))',fontSize:14,fontWeight:600},()=>{onEnrolled();onClose();},'Done — Start Using Zorbix')}
        </div>)}

        {phase==='error'&&(<div style={{textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'hsl(var(--destructive)/.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><XCircle style={{width:32,height:32,color:'hsl(var(--destructive))'}}/></div>
          <h3 style={{fontSize:18,fontWeight:700,color:'hsl(var(--foreground))',marginBottom:8}}>Enrollment Failed</h3>
          <p style={{fontSize:13,color:'hsl(var(--muted-foreground))',marginBottom:24}}>{errorMsg}</p>
          <div style={{display:'flex',gap:10}}>
            {Btn({flex:1,padding:'11px 0',background:'hsl(var(--primary))',color:'hsl(var(--primary-foreground))',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8},()=>setPhase('intro'),<><RefreshCw style={{width:14,height:14}}/> Try Again</>)}
            {Btn({flex:1,padding:'11px 0',background:'transparent',color:'hsl(var(--muted-foreground))',border:'1px solid hsl(var(--border))',fontSize:13},onClose,'Cancel')}
          </div>
        </div>)}
      </div>
    </div>
  );
}
