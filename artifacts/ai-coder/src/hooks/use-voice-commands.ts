/* ─────────────────────────────────────────────────────────────────────────
   Zorbix Voice Command Engine  •  v3
   All 50+ command types, zero external dependencies (except optional IP
   fetch which falls back gracefully).
───────────────────────────────────────────────────────────────────────── */

export type CommandType =
  // ── apps & navigation ─────────────────────────────────────────────────
  | 'open-app' | 'navigate-app' | 'go-back' | 'go-forward' | 'reload-page'
  | 'fullscreen' | 'exit-fullscreen' | 'zoom-in' | 'zoom-out' | 'zoom-reset'
  | 'print-page' | 'copy-url' | 'share-page' | 'find-on-page'
  // ── communication ─────────────────────────────────────────────────────
  | 'call' | 'send-message' | 'compose-email'
  // ── search & web ──────────────────────────────────────────────────────
  | 'search-web' | 'search-youtube' | 'search-wikipedia' | 'search-imdb'
  | 'search-github' | 'open-news' | 'news-topic' | 'open-weather'
  | 'open-maps' | 'directions' | 'play-music'
  // ── info & lookup ─────────────────────────────────────────────────────
  | 'translate' | 'open-stocks' | 'open-dictionary' | 'open-thesaurus'
  | 'world-time' | 'get-ip' | 'get-time' | 'get-date'
  // ── math & conversion ─────────────────────────────────────────────────
  | 'math' | 'unit-convert' | 'countdown-days' | 'percentage'
  // ── timers & reminders ────────────────────────────────────────────────
  | 'set-timer' | 'set-reminder' | 'set-alarm'
  // ── fun & random ──────────────────────────────────────────────────────
  | 'coin-flip' | 'dice-roll' | 'random-number' | 'generate-password'
  // ── system & TTS ──────────────────────────────────────────────────────
  | 'dark-mode' | 'light-mode' | 'stop-speaking' | 'speak-faster'
  | 'speak-slower' | 'speak-normal' | 'battery' | 'new-chat'
  | 'copy-last' | 'read-last'
  // ── AI fallback ───────────────────────────────────────────────────────
  | 'ai-question';

export interface ParsedCommand { type: CommandType; payload: Record<string, string>; raw: string; }
export interface ActiveTimer   { id: string; label: string; endsAt: number; totalMs: number; isReminder?: boolean; reminderText?: string; }
export interface CommandResult { response: string; action?: () => void; timer?: ActiveTimer; }

// ── App maps ───────────────────────────────────────────────────────────────
const APP_MAP: Record<string, string> = {
  whatsapp: 'https://web.whatsapp.com', youtube: 'https://youtube.com',
  google: 'https://google.com', gmail: 'https://mail.google.com',
  maps: 'https://maps.google.com', 'google maps': 'https://maps.google.com',
  instagram: 'https://instagram.com', twitter: 'https://x.com', x: 'https://x.com',
  facebook: 'https://facebook.com', netflix: 'https://netflix.com',
  spotify: 'https://open.spotify.com', github: 'https://github.com',
  linkedin: 'https://linkedin.com', reddit: 'https://reddit.com',
  amazon: 'https://amazon.com', zoom: 'https://zoom.us',
  telegram: 'https://web.telegram.org', discord: 'https://discord.com/channels/@me',
  pinterest: 'https://pinterest.com', tiktok: 'https://tiktok.com',
  twitch: 'https://twitch.tv', drive: 'https://drive.google.com',
  'google drive': 'https://drive.google.com', docs: 'https://docs.google.com',
  sheets: 'https://sheets.google.com', meet: 'https://meet.google.com',
  'google meet': 'https://meet.google.com', calendar: 'https://calendar.google.com',
  'google calendar': 'https://calendar.google.com', paypal: 'https://paypal.com',
  ebay: 'https://ebay.com', espn: 'https://espn.com',
  news: 'https://news.google.com', 'google news': 'https://news.google.com',
  weather: 'https://weather.com', translate: 'https://translate.google.com',
  'google translate': 'https://translate.google.com', wikipedia: 'https://wikipedia.org',
  yahoo: 'https://yahoo.com', finance: 'https://finance.yahoo.com',
  'yahoo finance': 'https://finance.yahoo.com', imdb: 'https://imdb.com',
  speedtest: 'https://speedtest.net', 'speed test': 'https://speedtest.net',
  duolingo: 'https://duolingo.com', coursera: 'https://coursera.org',
  notion: 'https://notion.so', slack: 'https://slack.com',
  trello: 'https://trello.com', dropbox: 'https://dropbox.com',
  figma: 'https://figma.com', canva: 'https://canva.com',
  medium: 'https://medium.com', quora: 'https://quora.com',
  stackoverflow: 'https://stackoverflow.com', 'stack overflow': 'https://stackoverflow.com',
  producthunt: 'https://producthunt.com', 'product hunt': 'https://producthunt.com',
  threads: 'https://threads.net',
};

const APP_ROUTE_MAP: Record<string, string> = {
  chat: '/?newChat=true', home: '/', settings: '/settings',
  playground: '/playground', dashboard: '/projects', projects: '/projects',
  'code runner': '/code-runner', explore: '/explore', templates: '/templates',
  usage: '/usage', 'prompt generator': '/prompt-generator',
  analytics: '/analytics', about: '/about', contact: '/contact',
};

// ── City → IANA timezone ───────────────────────────────────────────────────
const CITY_TZ: Record<string, string> = {
  'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago', 'toronto': 'America/Toronto',
  'london': 'Europe/London', 'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin', 'rome': 'Europe/Rome',
  'madrid': 'Europe/Madrid', 'amsterdam': 'Europe/Amsterdam',
  'moscow': 'Europe/Moscow', 'dubai': 'Asia/Dubai',
  'mumbai': 'Asia/Kolkata', 'delhi': 'Asia/Kolkata',
  'karachi': 'Asia/Karachi', 'lahore': 'Asia/Karachi',
  'dhaka': 'Asia/Dhaka', 'kolkata': 'Asia/Kolkata',
  'singapore': 'Asia/Singapore', 'tokyo': 'Asia/Tokyo',
  'beijing': 'Asia/Shanghai', 'shanghai': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong', 'seoul': 'Asia/Seoul',
  'sydney': 'Australia/Sydney', 'melbourne': 'Australia/Melbourne',
  'auckland': 'Pacific/Auckland', 'nairobi': 'Africa/Nairobi',
  'cairo': 'Africa/Cairo', 'johannesburg': 'Africa/Johannesburg',
  'lagos': 'Africa/Lagos', 'accra': 'Africa/Accra',
  'sao paulo': 'America/Sao_Paulo', 'buenos aires': 'America/Argentina/Buenos_Aires',
  'mexico city': 'America/Mexico_City', 'istanbul': 'Europe/Istanbul',
  'riyadh': 'Asia/Riyadh', 'tehran': 'Asia/Tehran',
  'bangkok': 'Asia/Bangkok', 'jakarta': 'Asia/Jakarta',
  'manila': 'Asia/Manila', 'kuala lumpur': 'Asia/Kuala_Lumpur',
};

// ── Notable dates for countdown ────────────────────────────────────────────
function getNotableDate(name: string): Date | null {
  const y  = new Date().getFullYear();
  const n  = name.toLowerCase().trim();
  const map: Record<string, [number, number]> = {
    'christmas':       [11, 25], 'christmas day':     [11, 25],
    'new year':        [0,  1],  "new year's day":    [0,  1],
    "new year's eve":  [11, 31], 'halloween':         [9,  31],
    'valentine':       [1,  14], "valentine's day":   [1,  14],
    'independence day':[6,  4],  'thanksgiving':      [10, 28],
    'easter':          [3,  20], 'eid':               [3,  10],
    'diwali':          [9,  29], 'hanukkah':          [11, 25],
    'st patrick':      [2,  17], "st patrick's day":  [2,  17],
    'labor day':       [8,  1],  'memorial day':      [4,  27],
    'mother\'s day':   [4,  12], 'father\'s day':     [5,  16],
  };
  for (const [key, [month, day]] of Object.entries(map)) {
    if (n.includes(key)) {
      const d = new Date(y, month, day);
      if (d < new Date()) d.setFullYear(y + 1);
      return d;
    }
  }
  // Try to parse a date like "December 25" or "March 15"
  const dm = name.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/i);
  if (dm) {
    const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const m = months[dm[1].slice(0, 3).toLowerCase()];
    const d = new Date(y, m, parseInt(dm[2]));
    if (d < new Date()) d.setFullYear(y + 1);
    return d;
  }
  return null;
}

// ── Parse "7am / 3:30pm / 15:00" → Date ───────────────────────────────────
function parseAlarmTime(text: string): Date | null {
  const t = text.toLowerCase().trim();
  let hour = -1, minute = 0;

  const m12 = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m12) {
    hour = parseInt(m12[1]);
    minute = m12[2] ? parseInt(m12[2]) : 0;
    if (m12[3].toLowerCase() === 'pm' && hour !== 12) hour += 12;
    if (m12[3].toLowerCase() === 'am' && hour === 12) hour = 0;
  }
  const m24 = !m12 && t.match(/(\d{1,2}):(\d{2})/);
  if (m24) { hour = parseInt(m24[1]); minute = parseInt(m24[2]); }

  if (hour < 0 || hour > 23) return null;
  const alarm = new Date();
  alarm.setHours(hour, minute, 0, 0);
  if (alarm <= new Date()) alarm.setDate(alarm.getDate() + 1);
  return alarm;
}

// ── Safe math evaluator ────────────────────────────────────────────────────
function safeMath(expr: string): number | null {
  const s = expr
    .replace(/times|multiplied by/gi, '*').replace(/divided by|over/gi, '/')
    .replace(/\bplus\b/gi, '+').replace(/\bminus\b/gi, '-')
    .replace(/percent of/gi, '/100*').replace(/to the power of|power/gi, '**')
    .replace(/squared/gi, '**2').replace(/cubed/gi, '**3')
    .replace(/square root of|sqrt/gi, 'Math.sqrt(').replace(/\bx\b/gi, '*')
    .replace(/[^0-9+\-*/().\sMath.sqrtlogsincostan**]/g, '');
  try { const r = Function(`"use strict";return(${s})`)(); return typeof r==='number'&&isFinite(r)?r:null; } catch { return null; }
}

// ── Unit conversion table ─────────────────────────────────────────────────
function convertUnit(value: number, from: string, to: string): string | null {
  const f=from.toLowerCase(), t=to.toLowerCase();
  type Conv = Record<string,Record<string,(v:number)=>number>>;
  const C: Conv = {
    km:      { miles:v=>v*.621371, meters:v=>v*1000, feet:v=>v*3280.84, cm:v=>v*100000 },
    miles:   { km:v=>v*1.60934, meters:v=>v*1609.34, feet:v=>v*5280 },
    meters:  { feet:v=>v*3.28084, km:v=>v/1000, miles:v=>v/1609.34, inches:v=>v*39.3701, cm:v=>v*100 },
    feet:    { meters:v=>v/3.28084, inches:v=>v*12, miles:v=>v/5280, km:v=>v/3280.84, cm:v=>v*30.48 },
    inches:  { cm:v=>v*2.54, feet:v=>v/12, meters:v=>v/39.3701, mm:v=>v*25.4 },
    cm:      { inches:v=>v/2.54, meters:v=>v/100, feet:v=>v/30.48, mm:v=>v*10 },
    mm:      { cm:v=>v/10, inches:v=>v/25.4, meters:v=>v/1000 },
    kg:      { pounds:v=>v*2.20462, lbs:v=>v*2.20462, grams:v=>v*1000, oz:v=>v*35.274, ounces:v=>v*35.274, 'metric tons':v=>v/1000 },
    pounds:  { kg:v=>v/2.20462, lbs:v=>v, grams:v=>v*453.592, oz:v=>v*16, ounces:v=>v*16 },
    lbs:     { kg:v=>v/2.20462, pounds:v=>v, grams:v=>v*453.592, oz:v=>v*16 },
    grams:   { kg:v=>v/1000, pounds:v=>v/453.592, oz:v=>v/28.3495, ounces:v=>v/28.3495, mg:v=>v*1000 },
    oz:      { grams:v=>v*28.3495, kg:v=>v/35.274, pounds:v=>v/16 },
    ounces:  { grams:v=>v*28.3495, kg:v=>v/35.274, pounds:v=>v/16 },
    mg:      { grams:v=>v/1000, kg:v=>v/1000000 },
    celsius: { fahrenheit:v=>v*9/5+32, kelvin:v=>v+273.15 },
    fahrenheit: { celsius:v=>(v-32)*5/9, kelvin:v=>(v-32)*5/9+273.15 },
    kelvin:  { celsius:v=>v-273.15, fahrenheit:v=>(v-273.15)*9/5+32 },
    liters:  { gallons:v=>v*.264172, 'fl oz':v=>v*33.814, ml:v=>v*1000, cups:v=>v*4.22675, pints:v=>v*2.11338 },
    gallons: { liters:v=>v/.264172, 'fl oz':v=>v*128, cups:v=>v*16, pints:v=>v*8 },
    ml:      { liters:v=>v/1000, 'fl oz':v=>v/29.5735, cups:v=>v/236.588, 'tsp':v=>v/4.92892, 'tbsp':v=>v/14.7868 },
    cups:    { ml:v=>v*236.588, liters:v=>v*.236588, 'fl oz':v=>v*8, 'tbsp':v=>v*16, 'tsp':v=>v*48 },
    mph:     { 'km/h':v=>v*1.60934, kph:v=>v*1.60934, 'ms':v=>v*.44704, knots:v=>v*.868976 },
    'km/h':  { mph:v=>v/1.60934, 'ms':v=>v/3.6, knots:v=>v*.539957 },
    kph:     { mph:v=>v/1.60934, 'ms':v=>v/3.6 },
    knots:   { mph:v=>v*1.15078, 'km/h':v=>v*1.852 },
    acres:   { hectares:v=>v/.404686, 'sq meters':v=>v*4046.86, 'sq feet':v=>v*43560 },
    hectares:{ acres:v=>v*2.47105, 'sq km':v=>v/100, 'sq meters':v=>v*10000 },
    bytes:   { kb:v=>v/1024, mb:v=>v/1048576, gb:v=>v/1073741824 },
    kb:      { bytes:v=>v*1024, mb:v=>v/1024, gb:v=>v/1048576 },
    mb:      { kb:v=>v*1024, gb:v=>v/1024, bytes:v=>v*1048576 },
    gb:      { mb:v=>v*1024, kb:v=>v*1048576, tb:v=>v/1024 },
    tb:      { gb:v=>v*1024 },
  };
  const fn=C[f]?.[t]; if(!fn) return null;
  const result=fn(value); const rounded=parseFloat(result.toPrecision(6));
  return `${value} ${from} = ${rounded} ${to}`;
}

// ── Password generator ────────────────────────────────────────────────────
function genPassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────────
function n(text: string) { return text.toLowerCase().replace(/['']/g, "'").trim(); }

function parseTimeDuration(text: string): number | null {
  let ms = 0;
  const hours = text.match(/(\d+)\s*(?:hour|hr|h)s?/i);
  const mins  = text.match(/(\d+)\s*(?:minute|min|m(?!s))s?/i);
  const secs  = text.match(/(\d+)\s*(?:second|sec|s)s?/i);
  if (hours) ms += parseInt(hours[1]) * 3600000;
  if (mins)  ms += parseInt(mins[1])  * 60000;
  if (secs)  ms += parseInt(secs[1])  * 1000;
  if (ms === 0) { const bare = text.match(/^(\d+)$/); if (bare) ms = parseInt(bare[1]) * 60000; }
  return ms > 0 ? ms : null;
}

function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  return Notification.requestPermission().then(p => p === 'granted');
}
function showNotification(title: string, body: string) {
  if (Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
}

// ── TTS ────────────────────────────────────────────────────────────────────
const TTS_SPEED_KEY = 'zorbix_tts_speed';
export function getTtsSpeed(): number { return parseFloat(localStorage.getItem(TTS_SPEED_KEY) || '1.05'); }
function setTtsSpeed(r: number) { localStorage.setItem(TTS_SPEED_KEY, String(r)); }

export function speak(text: string, onEnd?: () => void): void {
  if (!('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = getTtsSpeed(); u.pitch = 1; u.volume = 1;
  const pref = window.speechSynthesis.getVoices().find(v =>
    v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Microsoft')
  );
  if (pref) u.voice = pref;
  u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}
export function stopSpeaking(): void { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }

// ═══════════════════════════════════════════════════════════════════════════
//  parseCommand
// ═══════════════════════════════════════════════════════════════════════════
export function parseCommand(raw: string): ParsedCommand {
  const t = n(raw);

  // ── Stop / read / copy ────────────────────────────────────────────────
  if (/^(stop|quiet|silence|shut up|cancel|enough|pause|stop (talking|speaking))$/i.test(t))
    return { type: 'stop-speaking', payload: {}, raw };
  if (/read (that|it|last|again)|repeat (that|last)|say that again/i.test(t))
    return { type: 'read-last', payload: {}, raw };
  if (/copy (that|last|response|it)/i.test(t))
    return { type: 'copy-last', payload: {}, raw };

  // ── New chat ──────────────────────────────────────────────────────────
  if (/new (chat|conversation)|start (a new|new) (chat|conversation)|clear (the )?chat|reset chat/i.test(t))
    return { type: 'new-chat', payload: {}, raw };

  // ── Time / Date ───────────────────────────────────────────────────────
  if (/what(?:'s| is) the time|current time|what time is it/i.test(t))
    return { type: 'get-time', payload: {}, raw };
  if (/what(?:'s| is) the date|today(?:'s)? date|what(?:'s| is) today/i.test(t))
    return { type: 'get-date', payload: {}, raw };

  // ── World time ────────────────────────────────────────────────────────
  const worldTimeMatch = t.match(/(?:what(?:'s| is) the time|current time|time) in ([a-z\s]+)/i)
    || t.match(/([a-z\s]+) time right now/i);
  if (worldTimeMatch) {
    const city = worldTimeMatch[1].trim().toLowerCase();
    if (CITY_TZ[city]) return { type: 'world-time', payload: { city, tz: CITY_TZ[city] }, raw };
  }

  // ── Battery ───────────────────────────────────────────────────────────
  if (/battery (level|status|percentage|life)|how much battery|check battery/i.test(t))
    return { type: 'battery', payload: {}, raw };

  // ── IP address ────────────────────────────────────────────────────────
  if (/(?:what(?:'s| is) my|check my|show my|my) ip(?: address)?|ip address/i.test(t))
    return { type: 'get-ip', payload: {}, raw };

  // ── Dark / Light mode ─────────────────────────────────────────────────
  if (/dark mode|switch to dark|enable dark|turn (on|off) dark/i.test(t))
    return { type: 'dark-mode', payload: {}, raw };
  if (/light mode|switch to light|enable light|turn (on|off) light/i.test(t))
    return { type: 'light-mode', payload: {}, raw };

  // ── TTS speed ─────────────────────────────────────────────────────────
  if (/speak (faster|speed up|quicker)|talk faster/i.test(t))   return { type: 'speak-faster', payload: {}, raw };
  if (/speak (slower|slow down)|talk slower/i.test(t))           return { type: 'speak-slower', payload: {}, raw };
  if (/speak (normal|normally|default speed)|reset speed/i.test(t)) return { type: 'speak-normal', payload: {}, raw };

  // ── Browser controls ──────────────────────────────────────────────────
  if (/^go back$|^back$|^previous page$/i.test(t))   return { type: 'go-back', payload: {}, raw };
  if (/^go forward$|^forward$|^next page$/i.test(t)) return { type: 'go-forward', payload: {}, raw };
  if (/reload page|refresh page|refresh this page/i.test(t)) return { type: 'reload-page', payload: {}, raw };
  if (/(?:enter |go |toggle )?full ?screen(?! exit)/i.test(t) && !/exit/.test(t)) return { type: 'fullscreen', payload: {}, raw };
  if (/exit full ?screen|leave full ?screen/i.test(t)) return { type: 'exit-fullscreen', payload: {}, raw };
  if (/zoom in|make (it |page |text )?(bigger|larger)/i.test(t)) return { type: 'zoom-in', payload: {}, raw };
  if (/zoom out|make (it |page |text )?(smaller)/i.test(t))      return { type: 'zoom-out', payload: {}, raw };
  if (/zoom reset|reset zoom|normal (size|zoom)/i.test(t))       return { type: 'zoom-reset', payload: {}, raw };
  if (/print (page|this)|print it/i.test(t))                     return { type: 'print-page', payload: {}, raw };
  if (/copy (url|link|page link|this link)/i.test(t))            return { type: 'copy-url', payload: {}, raw };
  if (/share (this page|this link|page)/i.test(t))               return { type: 'share-page', payload: {}, raw };

  const findMatch = t.match(/(?:find|search for) (.+?) on (?:this )?page/i)
    || t.match(/ctrl ?\+ ?f (.+)/i);
  if (findMatch) return { type: 'find-on-page', payload: { text: findMatch[1].trim() }, raw };

  // ── Coin / Dice / Random ──────────────────────────────────────────────
  if (/flip (a )?coin|heads or tails|coin flip/i.test(t))
    return { type: 'coin-flip', payload: {}, raw };

  const diceMatch = t.match(/roll (?:(\d+) )?d(?:ice|ie(?:s)?)|roll (\d+) dice|roll a die|roll the die/i);
  if (diceMatch) {
    const count = diceMatch[1] || diceMatch[2] || '1';
    const sides = t.match(/d(\d+)/i)?.[1] || '6';
    return { type: 'dice-roll', payload: { count, sides }, raw };
  }

  const randomMatch = t.match(/random number (?:between|from) (\d+) (?:and|to) (\d+)/i)
    || t.match(/(?:give me a|pick a|random) number/i);
  if (randomMatch) {
    const min = randomMatch[1] || '1', max = randomMatch[2] || '100';
    return { type: 'random-number', payload: { min, max }, raw };
  }

  // ── Password generator ────────────────────────────────────────────────
  if (/generate (a |strong |secure |random )?password|create (a |strong |secure )?password|make a password/i.test(t))
    return { type: 'generate-password', payload: {}, raw };

  // ── Math ──────────────────────────────────────────────────────────────
  const mathKeywords = /times|divided by|plus|minus|percent of|to the power|squared|cubed|over|sqrt|square root/i;
  const mathMatch = t.match(/(?:what(?:'s| is)|calculate|compute)\s+([\d()\s.]+(?:[+\-*/]|times|divided by|plus|minus|x)[\d()\s.]+)/i)
    || (mathKeywords.test(t) && t.match(/(.+)/));
  if (mathMatch) {
    const result = safeMath(mathMatch[1]);
    if (result !== null) return { type: 'math', payload: { expr: mathMatch[1], result: String(result) }, raw };
  }

  // ── Unit conversion ───────────────────────────────────────────────────
  const unitMatch = t.match(/convert\s+([\d.]+)\s+([\w\s/]+?)\s+(?:to|into)\s+([\w\s/]+)/i)
    || t.match(/([\d.]+)\s+([\w]+)\s+(?:to|in|into)\s+([\w\s/]+)/i);
  if (unitMatch) {
    const val = parseFloat(unitMatch[1]);
    const from = unitMatch[2].trim().toLowerCase();
    const to   = unitMatch[3].trim().toLowerCase().replace(/[?.]$/, '');
    const converted = convertUnit(val, from, to);
    if (converted) return { type: 'unit-convert', payload: { result: converted }, raw };
  }

  // ── Countdown days ────────────────────────────────────────────────────
  const countdownMatch = t.match(/how many days (?:until|till|to|before)\s+(.+)/i)
    || t.match(/(?:days|time) (?:until|till|to|before)\s+(.+)/i)
    || t.match(/when is\s+(.+)/i);
  if (countdownMatch) {
    const eventName = countdownMatch[1].replace(/[?.]$/, '').trim();
    const eventDate = getNotableDate(eventName);
    if (eventDate) {
      const days = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
      return { type: 'countdown-days', payload: { event: eventName, days: String(days), date: eventDate.toLocaleDateString() }, raw };
    }
  }

  // ── Alarm at specific time ────────────────────────────────────────────
  const alarmMatch = t.match(/(?:set (?:an )?alarm|wake me up?|alarm) (?:at|for)\s+(.+)/i)
    || t.match(/remind me at\s+(.+)/i);
  if (alarmMatch) {
    const alarmDate = parseAlarmTime(alarmMatch[1]);
    if (alarmDate) {
      const ms = alarmDate.getTime() - Date.now();
      const label = alarmDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { type: 'set-alarm', payload: { durationMs: String(ms), label, timeStr: alarmMatch[1] }, raw };
    }
  }

  // ── Timer ─────────────────────────────────────────────────────────────
  const timerMatch = t.match(/(?:set (?:a )?)?timer (?:for )?(.+)/i)
    || t.match(/alarm (?:for|in) (.+)/i);
  if (timerMatch) {
    const ms = parseTimeDuration(timerMatch[1]);
    if (ms) return { type: 'set-timer', payload: { durationMs: String(ms), label: timerMatch[1] }, raw };
  }

  // ── Reminder ─────────────────────────────────────────────────────────
  const reminderMatch = t.match(/remind me (?:in )?(.+?) (?:to|about|that) (.+)/i)
    || t.match(/remind me (?:in )?(.+)/i);
  if (reminderMatch) {
    const ms = parseTimeDuration(reminderMatch[1]);
    const reminderText = reminderMatch[2] || 'your reminder';
    if (ms) return { type: 'set-reminder', payload: { durationMs: String(ms), reminderText, label: reminderMatch[1] }, raw };
  }

  // ── Compose email ─────────────────────────────────────────────────────
  const emailMatch = t.match(/(?:send|compose|write) (?:an )?email (?:to )?(.+)/i)
    || t.match(/email (.+)/i);
  if (emailMatch && emailMatch[1].includes('@'))
    return { type: 'compose-email', payload: { to: emailMatch[1].trim() }, raw };

  // ── Call ──────────────────────────────────────────────────────────────
  const callMatch = t.match(/(?:call|phone|dial|ring) (.+)/i);
  if (callMatch) return { type: 'call', payload: { target: callMatch[1].trim() }, raw };

  // ── Send message ──────────────────────────────────────────────────────
  const msgMatch = t.match(/(?:send|text|message|whatsapp) (.+?) (?:saying|say|message|that) "?(.+)"?/i)
    || t.match(/(?:send|text|whatsapp) (.+?) "(.+)"/i);
  if (msgMatch) return { type: 'send-message', payload: { contact: msgMatch[1].trim(), message: msgMatch[2].trim() }, raw };
  const simpleMsgMatch = t.match(/(?:message|whatsapp|text) (.+)/i);
  if (simpleMsgMatch) return { type: 'send-message', payload: { contact: simpleMsgMatch[1].trim(), message: '' }, raw };

  // ── Translate ─────────────────────────────────────────────────────────
  const translateMatch = t.match(/translate (.+?) (?:to|into) (\w+)/i)
    || t.match(/how do you say (.+?) in (\w+)/i);
  if (translateMatch) return { type: 'translate', payload: { text: translateMatch[1].trim(), lang: translateMatch[2].trim() }, raw };

  // ── Thesaurus / Synonym / Antonym ────────────────────────────────────
  const thesMatch = t.match(/(?:synonym|antonym|another word) (?:for|of) (\w+)/i);
  if (thesMatch) return { type: 'open-thesaurus', payload: { word: thesMatch[1].trim() }, raw };

  // ── Dictionary ────────────────────────────────────────────────────────
  const dictMatch = t.match(/(?:define|what(?:'s| does| is the meaning of)?) (?:the word )?["']?(\w+)["']?(?: mean)?/i)
    || t.match(/how (?:do you|to) spell (\w+)/i)
    || t.match(/spelling of (\w+)/i);
  if (dictMatch && !/what is the time|what is today/.test(t))
    return { type: 'open-dictionary', payload: { word: dictMatch[1].trim() }, raw };

  // ── Stocks ────────────────────────────────────────────────────────────
  const stockMatch = t.match(/(?:check )?(?:the )?(.+?) stock(?: price)?(?:\?|$)/i)
    || t.match(/stock(?: price)? of (.+)/i);
  if (stockMatch) {
    const company = (stockMatch[1] || stockMatch[2]).trim();
    if (company.length > 1 && !/open|show|get/.test(company))
      return { type: 'open-stocks', payload: { company }, raw };
  }

  // ── Wikipedia ─────────────────────────────────────────────────────────
  const wikiMatch = t.match(/(?:search wikipedia|wikipedia|wiki) (?:for )?(.+)/i)
    || t.match(/(?:tell me about|what is|who is) (.+?) on wikipedia/i);
  if (wikiMatch) return { type: 'search-wikipedia', payload: { query: wikiMatch[1].trim() }, raw };

  // ── IMDB ──────────────────────────────────────────────────────────────
  const imdbMatch = t.match(/(?:search|find|look up) (.+?) on imdb/i)
    || t.match(/imdb (.+)/i);
  if (imdbMatch) return { type: 'search-imdb', payload: { query: imdbMatch[1].trim() }, raw };

  // ── GitHub search ─────────────────────────────────────────────────────
  const githubMatch = t.match(/(?:search|find) (.+?) on github/i)
    || t.match(/github search (.+)/i);
  if (githubMatch) return { type: 'search-github', payload: { query: githubMatch[1].trim() }, raw };

  // ── News by topic ─────────────────────────────────────────────────────
  const newsTopicMatch = t.match(/(?:show|get|open) (.+?) news/i)
    || t.match(/news (?:about|on) (.+)/i);
  if (newsTopicMatch && newsTopicMatch[1].trim() !== 'the')
    return { type: 'news-topic', payload: { topic: newsTopicMatch[1].trim() }, raw };
  if (/(?:show|open|get|latest|read)? ?(?:me )? ?(?:the )?news|headlines|current events/i.test(t))
    return { type: 'open-news', payload: {}, raw };

  // ── Weather ───────────────────────────────────────────────────────────
  if (/(?:what(?:'s| is) the weather|weather today|how(?:'s| is) the weather|temperature today|will it rain)/i.test(t))
    return { type: 'open-weather', payload: {}, raw };

  // ── Directions ────────────────────────────────────────────────────────
  const dirMatch = t.match(/(?:navigate|directions?|take me|drive) to (.+)/i)
    || t.match(/how (?:do i|to) get to (.+)/i);
  if (dirMatch) return { type: 'directions', payload: { place: dirMatch[1].trim() }, raw };

  if (/open maps|open google maps/i.test(t)) return { type: 'open-maps', payload: {}, raw };

  // ── In-app navigation ─────────────────────────────────────────────────
  const navMatch = t.match(/(?:go to|open|navigate to|take me to|switch to) (.+)/i);
  if (navMatch) {
    const target = navMatch[1].trim().toLowerCase();
    if (APP_ROUTE_MAP[target]) return { type: 'navigate-app', payload: { route: APP_ROUTE_MAP[target], label: target }, raw };
    const url = APP_MAP[target];
    if (url) return { type: 'open-app', payload: { app: target, url }, raw };
  }

  // ── YouTube / Spotify / music ─────────────────────────────────────────
  const ytMatch = t.match(/(?:search|find|play) (.+?) on youtube/i) || t.match(/youtube (.+)/i);
  if (ytMatch) return { type: 'search-youtube', payload: { query: ytMatch[1].trim() }, raw };

  const spotifyMatch = t.match(/(?:play|listen to) (.+?) on spotify/i) || t.match(/play (.+)/i);
  if (spotifyMatch) return { type: 'play-music', payload: { query: spotifyMatch[1].trim() }, raw };

  // ── Open app ─────────────────────────────────────────────────────────
  const openMatch = t.match(/(?:open|launch|start) (.+)/i);
  if (openMatch) {
    const appName = openMatch[1].trim().toLowerCase();
    if (APP_MAP[appName])       return { type: 'open-app',    payload: { app: appName, url: APP_MAP[appName] }, raw };
    if (APP_ROUTE_MAP[appName]) return { type: 'navigate-app', payload: { route: APP_ROUTE_MAP[appName], label: appName }, raw };
  }

  // ── Generic web search ────────────────────────────────────────────────
  const searchMatch = t.match(/(?:search|google|look up|find) (.+)/i);
  if (searchMatch) return { type: 'search-web', payload: { query: searchMatch[1].trim() }, raw };

  // ── AI fallback ───────────────────────────────────────────────────────
  return { type: 'ai-question', payload: { question: raw.trim() }, raw };
}

// ═══════════════════════════════════════════════════════════════════════════
//  executeCommand
// ═══════════════════════════════════════════════════════════════════════════
export function executeCommand(
  cmd: ParsedCommand,
  navigate: (path: string) => void,
  onAiQuestion: (q: string) => void,
  getLastResponse?: () => string,
  onSpeedChange?: (speed: number) => void,
): CommandResult {

  switch (cmd.type) {

    // ── TTS / system ──────────────────────────────────────────────────────
    case 'stop-speaking': return { response: '', action: () => stopSpeaking() };

    case 'read-last': {
      const last = getLastResponse?.() || '';
      if (!last) return { response: "There's no previous response to read." };
      return { response: last };
    }
    case 'copy-last': {
      const last = getLastResponse?.() || '';
      if (!last) return { response: 'Nothing to copy yet.' };
      return { response: 'Copied to clipboard.', action: () => navigator.clipboard?.writeText(last).catch(() => {}) };
    }
    case 'new-chat': return { response: 'Starting a new chat.', action: () => navigate('/?newChat=true') };

    // ── Time / Date ───────────────────────────────────────────────────────
    case 'get-time': {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { response: `It's ${t}.` };
    }
    case 'get-date': {
      const d = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return { response: `Today is ${d}.` };
    }
    case 'world-time': {
      const { city, tz } = cmd.payload;
      try {
        const t = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date());
        return { response: `It's ${t} in ${city.charAt(0).toUpperCase() + city.slice(1)}.` };
      } catch { return { response: `I couldn't find the time for ${city}.` }; }
    }

    // ── Battery ───────────────────────────────────────────────────────────
    case 'battery': {
      if (!(navigator as any).getBattery) return { response: "Battery info isn't available in this browser." };
      return {
        response: 'Checking battery…',
        action: async () => {
          const b = await (navigator as any).getBattery();
          const pct = Math.round(b.level * 100);
          speak(`Your battery is at ${pct} percent${b.charging ? ', and it is charging' : ''}.`);
        },
      };
    }

    // ── IP address ────────────────────────────────────────────────────────
    case 'get-ip': {
      return {
        response: 'Fetching your IP address…',
        action: async () => {
          try {
            const res = await fetch('https://api.ipify.org?format=json');
            const { ip } = await res.json();
            speak(`Your IP address is ${ip.split('').join(' ')}.`);
          } catch { speak("I couldn't fetch your IP address right now."); }
        },
      };
    }

    // ── Dark / Light mode ─────────────────────────────────────────────────
    case 'dark-mode': return { response: 'Switching to dark mode.', action: () => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); window.dispatchEvent(new CustomEvent('zorbix-theme-change', { detail: 'dark' })); } };
    case 'light-mode': return { response: 'Switching to light mode.', action: () => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.dispatchEvent(new CustomEvent('zorbix-theme-change', { detail: 'light' })); } };

    // ── TTS speed ─────────────────────────────────────────────────────────
    case 'speak-faster': { const s = Math.min(2.0, getTtsSpeed() + 0.2); setTtsSpeed(s); onSpeedChange?.(s); return { response: 'Speaking faster now.' }; }
    case 'speak-slower': { const s = Math.max(0.5, getTtsSpeed() - 0.2); setTtsSpeed(s); onSpeedChange?.(s); return { response: 'Speaking slower now.' }; }
    case 'speak-normal':   setTtsSpeed(1.05); onSpeedChange?.(1.05); return { response: 'Back to normal speed.' };

    // ── Browser controls ──────────────────────────────────────────────────
    case 'go-back':           return { response: 'Going back.', action: () => window.history.back() };
    case 'go-forward':        return { response: 'Going forward.', action: () => window.history.forward() };
    case 'reload-page':       return { response: 'Reloading the page.', action: () => window.location.reload() };
    case 'fullscreen':        return { response: 'Entering fullscreen.', action: () => document.documentElement.requestFullscreen?.().catch(() => {}) };
    case 'exit-fullscreen':   return { response: 'Exiting fullscreen.', action: () => document.exitFullscreen?.().catch(() => {}) };
    case 'zoom-in':           return { response: 'Zooming in.', action: () => { const c = parseFloat((document.body.style.zoom as string) || '1'); document.body.style.zoom = String(Math.min(3, c + 0.1)); } };
    case 'zoom-out':          return { response: 'Zooming out.', action: () => { const c = parseFloat((document.body.style.zoom as string) || '1'); document.body.style.zoom = String(Math.max(0.3, c - 0.1)); } };
    case 'zoom-reset':        return { response: 'Zoom reset.', action: () => { document.body.style.zoom = '1'; } };
    case 'print-page':        return { response: 'Opening print dialog.', action: () => window.print() };
    case 'copy-url':          return { response: 'Page URL copied.', action: () => navigator.clipboard?.writeText(window.location.href).catch(() => {}) };
    case 'share-page': {
      const url = window.location.href;
      if ((navigator as any).share) {
        return { response: 'Opening share dialog.', action: () => (navigator as any).share({ url }).catch(() => {}) };
      }
      return { response: 'Sharing — URL copied to clipboard.', action: () => navigator.clipboard?.writeText(url).catch(() => {}) };
    }
    case 'find-on-page':      return { response: `Searching for "${cmd.payload.text}" on this page.`, action: () => { (window as any).find?.(cmd.payload.text, false, false, true); } };

    // ── Math ──────────────────────────────────────────────────────────────
    case 'math': {
      const result = parseFloat(cmd.payload.result);
      const nice = Number.isInteger(result) ? String(result) : result.toPrecision(6).replace(/\.?0+$/, '');
      return { response: `The answer is ${nice}.` };
    }
    case 'unit-convert': return { response: cmd.payload.result };

    // ── Countdown ─────────────────────────────────────────────────────────
    case 'countdown-days': {
      const { event, days, date } = cmd.payload;
      const d = parseInt(days);
      if (d === 0) return { response: `${event} is today!` };
      return { response: `There ${d === 1 ? 'is' : 'are'} ${d} day${d !== 1 ? 's' : ''} until ${event} — ${date}.` };
    }

    // ── Coin / Dice / Random ──────────────────────────────────────────────
    case 'coin-flip': return { response: Math.random() < 0.5 ? 'Heads!' : 'Tails!' };
    case 'dice-roll': {
      const count = parseInt(cmd.payload.count) || 1, sides = parseInt(cmd.payload.sides) || 6;
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      return { response: count > 1 ? `You rolled ${rolls.join(', ')}. Total: ${total}.` : `You rolled a ${rolls[0]}.` };
    }
    case 'random-number': {
      const min = parseInt(cmd.payload.min) || 1, max = parseInt(cmd.payload.max) || 100;
      return { response: `Your random number is ${Math.floor(Math.random() * (max - min + 1)) + min}.` };
    }

    // ── Password generator ────────────────────────────────────────────────
    case 'generate-password': {
      const pwd = genPassword(16);
      return {
        response: `Password generated and copied to clipboard.`,
        action: () => navigator.clipboard?.writeText(pwd).catch(() => {}),
      };
    }

    // ── Timers ────────────────────────────────────────────────────────────
    case 'set-timer': {
      const ms = parseInt(cmd.payload.durationMs), label = cmd.payload.label;
      const mins = Math.floor(ms / 60000), secs = Math.floor((ms % 60000) / 1000);
      const readable = mins > 0
        ? `${mins} minute${mins !== 1 ? 's' : ''}${secs > 0 ? ` and ${secs} second${secs !== 1 ? 's' : ''}` : ''}`
        : `${secs} second${secs !== 1 ? 's' : ''}`;
      return {
        response: `Timer set for ${readable}.`,
        timer: { id: Date.now().toString(), label: `⏱ ${label}`, endsAt: Date.now() + ms, totalMs: ms },
      };
    }
    case 'set-reminder': {
      const ms = parseInt(cmd.payload.durationMs), reminderText = cmd.payload.reminderText, label = cmd.payload.label;
      const mins = Math.floor(ms / 60000);
      const readable = mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''}` : `${Math.floor(ms / 1000)} seconds`;
      return {
        response: `I'll remind you to ${reminderText} in ${readable}.`,
        action: async () => {
          await requestNotificationPermission();
          setTimeout(() => { speak(`Reminder: ${reminderText}`); showNotification('Zorbix Reminder', reminderText); }, ms);
        },
        timer: { id: Date.now().toString(), label: `🔔 ${reminderText}`, endsAt: Date.now() + ms, totalMs: ms, isReminder: true, reminderText },
      };
    }
    case 'set-alarm': {
      const ms = parseInt(cmd.payload.durationMs), label = cmd.payload.label;
      return {
        response: `Alarm set for ${label}.`,
        action: async () => {
          await requestNotificationPermission();
          setTimeout(() => { speak(`Alarm! It is ${label}.`); showNotification('⏰ Zorbix Alarm', `It's ${label}!`); }, ms);
        },
        timer: { id: Date.now().toString(), label: `⏰ ${label}`, endsAt: Date.now() + ms, totalMs: ms, isReminder: true, reminderText: `Alarm: ${label}` },
      };
    }

    // ── Communication ─────────────────────────────────────────────────────
    case 'call': {
      const { target } = cmd.payload;
      const isNum = /[\d\s+\-()]{5,}/.test(target);
      return { response: `Calling ${target}…`, action: () => window.open(isNum ? `tel:${target.replace(/\s/g, '')}` : 'https://web.whatsapp.com/', '_blank') };
    }
    case 'send-message': {
      const { contact, message } = cmd.payload;
      const encoded = encodeURIComponent(message || ''), isNum = /^[\d\s+\-]{5,}$/.test(contact);
      return {
        response: message ? `Sending "${message}" to ${contact}.` : `Opening WhatsApp to message ${contact}.`,
        action: () => window.open(isNum ? `https://wa.me/${contact.replace(/\s/g, '')}?text=${encoded}` : 'https://web.whatsapp.com/', '_blank'),
      };
    }
    case 'compose-email': {
      const { to } = cmd.payload;
      return { response: `Opening email to ${to}.`, action: () => window.open(`mailto:${to}`, '_blank') };
    }

    // ── Lookup & info ─────────────────────────────────────────────────────
    case 'translate': {
      const { text, lang } = cmd.payload;
      return { response: `Translating "${text}" to ${lang}.`, action: () => window.open(`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`, '_blank') };
    }
    case 'open-dictionary': {
      const { word } = cmd.payload;
      return { response: `Looking up "${word}".`, action: () => window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`, '_blank') };
    }
    case 'open-thesaurus': {
      const { word } = cmd.payload;
      return { response: `Finding synonyms for "${word}".`, action: () => window.open(`https://www.merriam-webster.com/thesaurus/${encodeURIComponent(word)}`, '_blank') };
    }
    case 'open-stocks': {
      const { company } = cmd.payload;
      return { response: `Checking ${company} stock.`, action: () => window.open(`https://finance.yahoo.com/quote/${encodeURIComponent(company.toUpperCase())}`, '_blank') };
    }
    case 'search-wikipedia': {
      const { query } = cmd.payload;
      return { response: `Searching Wikipedia for "${query}".`, action: () => window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, '_blank') };
    }
    case 'search-imdb': {
      const { query } = cmd.payload;
      return { response: `Searching IMDB for "${query}".`, action: () => window.open(`https://www.imdb.com/find?q=${encodeURIComponent(query)}`, '_blank') };
    }
    case 'search-github': {
      const { query } = cmd.payload;
      return { response: `Searching GitHub for "${query}".`, action: () => window.open(`https://github.com/search?q=${encodeURIComponent(query)}`, '_blank') };
    }
    case 'open-news':  return { response: 'Opening Google News.', action: () => window.open('https://news.google.com', '_blank') };
    case 'news-topic': {
      const { topic } = cmd.payload;
      return { response: `Showing ${topic} news.`, action: () => window.open(`https://news.google.com/search?q=${encodeURIComponent(topic)}`, '_blank') };
    }
    case 'open-weather': return { response: 'Opening the weather forecast.', action: () => window.open('https://weather.com', '_blank') };
    case 'open-maps':    return { response: 'Opening Google Maps.', action: () => window.open('https://maps.google.com', '_blank') };
    case 'directions': {
      const { place } = cmd.payload;
      return { response: `Getting directions to ${place}.`, action: () => window.open(`https://www.google.com/maps/dir//${encodeURIComponent(place)}`, '_blank') };
    }
    case 'play-music': {
      const { query } = cmd.payload;
      return { response: `Playing "${query}" on Spotify.`, action: () => window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank') };
    }
    case 'open-app': {
      const { app, url } = cmd.payload;
      return { response: `Opening ${app.charAt(0).toUpperCase() + app.slice(1)}.`, action: () => window.open(url, '_blank') };
    }
    case 'navigate-app': {
      const { route, label } = cmd.payload;
      return { response: `Going to ${label}.`, action: () => navigate(route) };
    }
    case 'search-web': {
      const { query } = cmd.payload;
      return { response: `Searching for "${query}".`, action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank') };
    }
    case 'search-youtube': {
      const { query } = cmd.payload;
      return { response: `Searching YouTube for "${query}".`, action: () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank') };
    }

    // ── AI fallback ───────────────────────────────────────────────────────
    case 'ai-question':
      return { response: 'Let me check that for you.', action: () => onAiQuestion(cmd.payload.question) };
  }
}
