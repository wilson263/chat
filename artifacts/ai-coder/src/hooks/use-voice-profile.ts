const PROFILE_KEY = 'zorbix_voice_profile';
const FFT_SIZE = 2048;
const NUM_BANDS = 16;
const SIMILARITY_THRESHOLD = 0.80;

export interface VoiceProfile {
  features: number[];
  enrolledAt: number;
  enrollmentCount: number;
}

function extractFeatures(analyser: AnalyserNode): number[] {
  const bufferLength = analyser.frequencyBinCount;
  const data = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(data);
  const bandSize = Math.floor(bufferLength / NUM_BANDS);
  const bands: number[] = [];
  let totalEnergy = 0;
  for (let b = 0; b < NUM_BANDS; b++) {
    let sum = 0;
    for (let i = b * bandSize; i < (b + 1) * bandSize; i++) sum += data[i];
    const avg = sum / bandSize;
    bands.push(avg);
    totalEnergy += avg;
  }
  const normalized = totalEnergy > 0 ? bands.map(v => v / totalEnergy) : bands.map(() => 0);
  let numerator = 0, denominator = 0;
  for (let i = 0; i < bufferLength; i++) { numerator += i * data[i]; denominator += data[i]; }
  const centroid = denominator > 0 ? (numerator / denominator) / bufferLength : 0;
  return [...normalized, centroid];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

function averageFeatures(all: number[][]): number[] {
  if (all.length === 0) return [];
  const len = all[0].length;
  const avg = new Array(len).fill(0);
  for (const f of all) for (let i = 0; i < len; i++) avg[i] += f[i];
  return avg.map(v => v / all.length);
}

export function getVoiceProfile(): VoiceProfile | null {
  try { const raw = localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveVoiceProfile(profile: VoiceProfile): void { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
export function clearVoiceProfile(): void { localStorage.removeItem(PROFILE_KEY); }
export function hasVoiceProfile(): boolean { return getVoiceProfile() !== null; }

export async function recordVoiceSample(durationMs = 2500, onLevel?: (level: number) => void): Promise<number[]> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return new Promise((resolve, reject) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    source.connect(analyser);
    const samples: number[][] = [];
    let animFrame: number, stopped = false;
    const collect = () => {
      if (stopped) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const energy = data.reduce((s, v) => s + v, 0) / data.length;
      if (onLevel) onLevel(Math.min(100, energy * 2));
      if (energy > 5) samples.push(extractFeatures(analyser));
      animFrame = requestAnimationFrame(collect);
    };
    animFrame = requestAnimationFrame(collect);
    setTimeout(() => {
      stopped = true; cancelAnimationFrame(animFrame);
      stream.getTracks().forEach(t => t.stop()); audioCtx.close();
      if (samples.length === 0) reject(new Error('No voice detected. Please speak clearly.'));
      else resolve(averageFeatures(samples));
    }, durationMs);
  });
}

export async function enrollVoice(onProgress: (step: number, total: number, level: number) => void, count = 3): Promise<VoiceProfile> {
  const allSamples: number[][] = [];
  for (let i = 0; i < count; i++) {
    await new Promise(r => setTimeout(r, 800));
    const features = await recordVoiceSample(2500, (level) => onProgress(i + 1, count, level));
    allSamples.push(features);
    await new Promise(r => setTimeout(r, 500));
  }
  const profile: VoiceProfile = { features: averageFeatures(allSamples), enrolledAt: Date.now(), enrollmentCount: count };
  saveVoiceProfile(profile);
  return profile;
}

export async function verifyVoice(durationMs = 1800): Promise<{ matched: boolean; score: number }> {
  const profile = getVoiceProfile();
  if (!profile) return { matched: true, score: 1 };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return new Promise((resolve) => {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      const samples: number[][] = [];
      let animFrame: number, stopped = false;
      const collect = () => {
        if (stopped) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const energy = data.reduce((s, v) => s + v, 0) / data.length;
        if (energy > 5) samples.push(extractFeatures(analyser));
        animFrame = requestAnimationFrame(collect);
      };
      animFrame = requestAnimationFrame(collect);
      setTimeout(() => {
        stopped = true; cancelAnimationFrame(animFrame);
        stream.getTracks().forEach(t => t.stop()); audioCtx.close();
        if (samples.length === 0) { resolve({ matched: false, score: 0 }); return; }
        const score = cosineSimilarity(averageFeatures(samples), profile.features);
        resolve({ matched: score >= SIMILARITY_THRESHOLD, score });
      }, durationMs);
    });
  } catch { return { matched: false, score: 0 }; }
}
