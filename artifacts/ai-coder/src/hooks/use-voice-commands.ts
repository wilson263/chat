/* ─────────────────────────────────────────────────────────────────────────
   Zorbix Voice Command Engine  •  v4
   60+ command types, zero mandatory external deps.
───────────────────────────────────────────────────────────────────────── */

export type CommandType =
  | 'open-app' | 'navigate-app' | 'go-back' | 'go-forward' | 'reload-page'
  | 'fullscreen' | 'exit-fullscreen' | 'zoom-in' | 'zoom-out' | 'zoom-reset'
  | 'print-page' | 'copy-url' | 'share-page' | 'find-on-page'
  | 'call' | 'send-message' | 'compose-email'
  | 'search-web' | 'search-youtube' | 'search-wikipedia' | 'search-imdb'
  | 'search-github' | 'open-news' | 'news-topic' | 'open-weather'
  | 'open-maps' | 'directions' | 'play-music'
  | 'translate' | 'open-stocks' | 'open-dictionary' | 'open-thesaurus'
  | 'world-time' | 'get-ip' | 'get-time' | 'get-date'
  | 'math' | 'unit-convert' | 'countdown-days' | 'currency-convert'
  | 'tip-calc' | 'age-calc' | 'bmi-calc' | 'percentage-of'
  | 'prime-check' | 'factorial' | 'palindrome' | 'fibonacci'
  | 'morse-code' | 'binary-convert' | 'hex-convert' | 'roman-numeral'
  | 'word-count' | 'char-count' | 'text-upper' | 'text-lower' | 'text-reverse'
  | 'encode-url' | 'decode-url'
  | 'set-timer' | 'set-reminder' | 'set-alarm' | 'pomodoro'
  | 'coin-flip' | 'dice-roll' | 'random-number' | 'generate-password'
  | 'rhyme-finder' | 'qr-code' | 'take-note' | 'show-notes' | 'clear-notes'
  | 'say-text'
  | 'dark-mode' | 'light-mode' | 'stop-speaking' | 'speak-faster'
  | 'speak-slower' | 'speak-normal' | 'battery' | 'new-chat'
  | 'copy-last' | 'read-last'
  | 'ai-question';

export interface ParsedCommand { type: CommandType; payload: Record<string, string>; raw: string; }
export interface ActiveTimer   { id: string; label: string; endsAt: number; totalMs: number; isReminder?: boolean; reminderText?: string; }
export interface CommandResult { response: string; action?: () => void | Promise<void>; timer?: ActiveTimer; }

// ── App URL map ────────────────────────────────────────────────────────────
const APP_MAP: Record<string, string> = {
  whatsapp:'https://web.whatsapp.com', youtube:'https://youtube.com',
  google:'https://google.com', gmail:'https://mail.google.com',
  maps:'https://maps.google.com', 'google maps':'https://maps.google.com',
  instagram:'https://instagram.com', twitter:'https://x.com', x:'https://x.com',
  facebook:'https://facebook.com', netflix:'https://netflix.com',
  spotify:'https://open.spotify.com', github:'https://github.com',
  linkedin:'https://linkedin.com', reddit:'https://reddit.com',
  amazon:'https://amazon.com', zoom:'https://zoom.us',
  telegram:'https://web.telegram.org', discord:'https://discord.com/channels/@me',
  pinterest:'https://pinterest.com', tiktok:'https://tiktok.com',
  twitch:'https://twitch.tv', drive:'https://drive.google.com',
  'google drive':'https://drive.google.com', docs:'https://docs.google.com',
  sheets:'https://sheets.google.com', meet:'https://meet.google.com',
  'google meet':'https://meet.google.com', calendar:'https://calendar.google.com',
  'google calendar':'https://calendar.google.com', paypal:'https://paypal.com',
  ebay:'https://ebay.com', espn:'https://espn.com',
  news:'https://news.google.com', 'google news':'https://news.google.com',
  weather:'https://weather.com', translate:'https://translate.google.com',
  'google translate':'https://translate.google.com', wikipedia:'https://wikipedia.org',
  yahoo:'https://yahoo.com', finance:'https://finance.yahoo.com',
  'yahoo finance':'https://finance.yahoo.com', imdb:'https://imdb.com',
  speedtest:'https://speedtest.net', 'speed test':'https://speedtest.net',
  duolingo:'https://duolingo.com', coursera:'https://coursera.org',
  notion:'https://notion.so', slack:'https://slack.com',
  trello:'https://trello.com', dropbox:'https://dropbox.com',
  figma:'https://figma.com', canva:'https://canva.com',
  medium:'https://medium.com', quora:'https://quora.com',
  stackoverflow:'https://stackoverflow.com', 'stack overflow':'https://stackoverflow.com',
  'hacker news':'https://news.ycombinator.com', hackernews:'https://news.ycombinator.com',
  'ycombinator':'https://news.ycombinator.com',
  producthunt:'https://producthunt.com', 'product hunt':'https://producthunt.com',
  threads:'https://threads.net', 'wolf ram':'https://wolframalpha.com',
  wolframalpha:'https://wolframalpha.com', wolfram:'https://wolframalpha.com',
  openai:'https://chat.openai.com', chatgpt:'https://chat.openai.com',
  gemini:'https://gemini.google.com', claude:'https://claude.ai',
  perplexity:'https://perplexity.ai', 'khan academy':'https://khanacademy.org',
  khanacademy:'https://khanacademy.org', udemy:'https://udemy.com',
  leetcode:'https://leetcode.com', 'leet code':'https://leetcode.com',
  codepen:'https://codepen.io', replit:'https://replit.com',
  vercel:'https://vercel.com', netlify:'https://netlify.com',
  'google scholar':'https://scholar.google.com', scholar:'https://scholar.google.com',
};

const APP_ROUTE_MAP: Record<string, string> = {
  chat:'/?newChat=true', home:'/', settings:'/settings',
  playground:'/playground', dashboard:'/projects', projects:'/projects',
  'code runner':'/code-runner', explore:'/explore', templates:'/templates',
  usage:'/usage', 'prompt generator':'/prompt-generator',
  analytics:'/analytics', about:'/about', contact:'/contact',
};

// ── City → IANA timezone ───────────────────────────────────────────────────
const CITY_TZ: Record<string, string> = {
  'new york':'America/New_York','los angeles':'America/Los_Angeles',
  'chicago':'America/Chicago','toronto':'America/Toronto','vancouver':'America/Vancouver',
  'london':'Europe/London','paris':'Europe/Paris','berlin':'Europe/Berlin',
  'rome':'Europe/Rome','madrid':'Europe/Madrid','amsterdam':'Europe/Amsterdam',
  'moscow':'Europe/Moscow','dubai':'Asia/Dubai','mumbai':'Asia/Kolkata',
  'delhi':'Asia/Kolkata','karachi':'Asia/Karachi','lahore':'Asia/Karachi',
  'dhaka':'Asia/Dhaka','kolkata':'Asia/Kolkata','singapore':'Asia/Singapore',
  'tokyo':'Asia/Tokyo','beijing':'Asia/Shanghai','shanghai':'Asia/Shanghai',
  'hong kong':'Asia/Hong_Kong','seoul':'Asia/Seoul','sydney':'Australia/Sydney',
  'melbourne':'Australia/Melbourne','auckland':'Pacific/Auckland',
  'nairobi':'Africa/Nairobi','cairo':'Africa/Cairo',
  'johannesburg':'Africa/Johannesburg','lagos':'Africa/Lagos','accra':'Africa/Accra',
  'sao paulo':'America/Sao_Paulo','buenos aires':'America/Argentina/Buenos_Aires',
  'mexico city':'America/Mexico_City','istanbul':'Europe/Istanbul',
  'riyadh':'Asia/Riyadh','tehran':'Asia/Tehran','bangkok':'Asia/Bangkok',
  'jakarta':'Asia/Jakarta','manila':'Asia/Manila','kuala lumpur':'Asia/Kuala_Lumpur',
  'athens':'Europe/Athens','warsaw':'Europe/Warsaw','stockholm':'Europe/Stockholm',
  'oslo':'Europe/Oslo','helsinki':'Europe/Helsinki','zurich':'Europe/Zurich',
  'lisbon':'Europe/Lisbon','prague':'Europe/Prague','budapest':'Europe/Budapest',
  'vienna':'Europe/Vienna','brussels':'Europe/Brussels','copenhagen':'Europe/Copenhagen',
};

// ── Notable dates ──────────────────────────────────────────────────────────
function getNotableDate(name: string): Date | null {
  const y = new Date().getFullYear(), n = name.toLowerCase().trim();
  const map: Record<string,[number,number]> = {
    'christmas':[11,25],'christmas day':[11,25],'new year':[0,1],
    "new year's day":[0,1],"new year's eve":[11,31],'halloween':[9,31],
    'valentine':[1,14],"valentine's day":[1,14],'independence day':[6,4],
    'thanksgiving':[10,28],'easter':[3,20],'diwali':[9,29],
    'hanukkah':[11,25],'st patrick':[2,17],"st patrick's day":[2,17],
    'labor day':[8,1],"mother's day":[4,12],"father's day":[5,16],
  };
  for (const [key,[month,day]] of Object.entries(map)) {
    if (n.includes(key)) {
      const d=new Date(y,month,day); if(d<new Date())d.setFullYear(y+1); return d;
    }
  }
  const dm=name.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/i);
  if(dm){const months:Record<string,number>={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};const m=months[dm[1].slice(0,3).toLowerCase()];const d=new Date(y,m,parseInt(dm[2]));if(d<new Date())d.setFullYear(y+1);return d;}
  return null;
}

// ── Alarm time parser ──────────────────────────────────────────────────────
function parseAlarmTime(text: string): Date | null {
  const t=text.toLowerCase().trim();let hour=-1,minute=0;
  const m12=t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if(m12){hour=parseInt(m12[1]);minute=m12[2]?parseInt(m12[2]):0;if(m12[3].toLowerCase()==='pm'&&hour!==12)hour+=12;if(m12[3].toLowerCase()==='am'&&hour===12)hour=0;}
  const m24=!m12&&t.match(/(\d{1,2}):(\d{2})/);
  if(m24){hour=parseInt(m24[1]);minute=parseInt(m24[2]);}
  if(hour<0||hour>23)return null;
  const alarm=new Date();alarm.setHours(hour,minute,0,0);
  if(alarm<=new Date())alarm.setDate(alarm.getDate()+1);
  return alarm;
}

// ── Math ───────────────────────────────────────────────────────────────────
function safeMath(expr: string): number | null {
  const s=expr.replace(/times|multiplied by/gi,'*').replace(/divided by|over/gi,'/')
    .replace(/\bplus\b/gi,'+').replace(/\bminus\b/gi,'-')
    .replace(/percent of/gi,'/100*').replace(/to the power of|power/gi,'**')
    .replace(/squared/gi,'**2').replace(/cubed/gi,'**3')
    .replace(/square root of|sqrt of|sqrt/gi,'Math.sqrt(').replace(/\bx\b/gi,'*')
    .replace(/[^0-9+\-*/().\s**Mathsqrtlogsincostan]/g,'');
  try{const r=Function(`"use strict";return(${s})`)();return typeof r==='number'&&isFinite(r)?r:null;}catch{return null;}
}

// ── Unit conversion ────────────────────────────────────────────────────────
function convertUnit(value: number, from: string, to: string): string | null {
  const f=from.toLowerCase(),t=to.toLowerCase();
  type Conv=Record<string,Record<string,(v:number)=>number>>;
  const C:Conv={
    km:{miles:v=>v*.621371,meters:v=>v*1000,feet:v=>v*3280.84,cm:v=>v*100000},
    miles:{km:v=>v*1.60934,meters:v=>v*1609.34,feet:v=>v*5280},
    meters:{feet:v=>v*3.28084,km:v=>v/1000,miles:v=>v/1609.34,inches:v=>v*39.3701,cm:v=>v*100},
    feet:{meters:v=>v/3.28084,inches:v=>v*12,miles:v=>v/5280,km:v=>v/3280.84,cm:v=>v*30.48},
    inches:{cm:v=>v*2.54,feet:v=>v/12,meters:v=>v/39.3701,mm:v=>v*25.4},
    cm:{inches:v=>v/2.54,meters:v=>v/100,feet:v=>v/30.48,mm:v=>v*10},
    mm:{cm:v=>v/10,inches:v=>v/25.4,meters:v=>v/1000},
    kg:{pounds:v=>v*2.20462,lbs:v=>v*2.20462,grams:v=>v*1000,oz:v=>v*35.274,ounces:v=>v*35.274},
    pounds:{kg:v=>v/2.20462,lbs:v=>v,grams:v=>v*453.592,oz:v=>v*16,ounces:v=>v*16},
    lbs:{kg:v=>v/2.20462,pounds:v=>v,grams:v=>v*453.592,oz:v=>v*16},
    grams:{kg:v=>v/1000,pounds:v=>v/453.592,oz:v=>v/28.3495,ounces:v=>v/28.3495,mg:v=>v*1000},
    oz:{grams:v=>v*28.3495,kg:v=>v/35.274,pounds:v=>v/16},
    ounces:{grams:v=>v*28.3495,kg:v=>v/35.274,pounds:v=>v/16},
    mg:{grams:v=>v/1000,kg:v=>v/1000000},
    celsius:{fahrenheit:v=>v*9/5+32,kelvin:v=>v+273.15},
    fahrenheit:{celsius:v=>(v-32)*5/9,kelvin:v=>(v-32)*5/9+273.15},
    kelvin:{celsius:v=>v-273.15,fahrenheit:v=>(v-273.15)*9/5+32},
    liters:{gallons:v=>v*.264172,'fl oz':v=>v*33.814,ml:v=>v*1000,cups:v=>v*4.22675,pints:v=>v*2.11338},
    gallons:{liters:v=>v/.264172,'fl oz':v=>v*128,cups:v=>v*16,pints:v=>v*8},
    ml:{liters:v=>v/1000,'fl oz':v=>v/29.5735,cups:v=>v/236.588,tsp:v=>v/4.92892,tbsp:v=>v/14.7868},
    cups:{ml:v=>v*236.588,liters:v=>v*.236588,'fl oz':v=>v*8,tbsp:v=>v*16,tsp:v=>v*48},
    mph:{'km/h':v=>v*1.60934,kph:v=>v*1.60934,knots:v=>v*.868976},
    'km/h':{mph:v=>v/1.60934,knots:v=>v*.539957},kph:{mph:v=>v/1.60934},
    knots:{mph:v=>v*1.15078,'km/h':v=>v*1.852},
    acres:{hectares:v=>v*.404686,'sq meters':v=>v*4046.86,'sq feet':v=>v*43560},
    hectares:{acres:v=>v*2.47105,'sq km':v=>v/100,'sq meters':v=>v*10000},
    bytes:{kb:v=>v/1024,mb:v=>v/1048576,gb:v=>v/1073741824},
    kb:{bytes:v=>v*1024,mb:v=>v/1024,gb:v=>v/1048576},
    mb:{kb:v=>v*1024,gb:v=>v/1024,bytes:v=>v*1048576},
    gb:{mb:v=>v*1024,kb:v=>v*1048576,tb:v=>v/1024},tb:{gb:v=>v*1024},
  };
  const fn=C[f]?.[t];if(!fn)return null;
  const result=fn(value);const rounded=parseFloat(result.toPrecision(6));
  return `${value} ${from} = ${rounded} ${to}`;
}

// ── Morse code ────────────────────────────────────────────────────────────
const MORSE: Record<string,string> = {
  a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',
  j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',
  s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
  '6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--',
  '?':'..--..','!':'-.-.--',' ':'/'
};
function toMorse(text: string): string {
  return text.toLowerCase().split('').map(c=>MORSE[c]||'').filter(Boolean).join(' ');
}

// ── Roman numerals ────────────────────────────────────────────────────────
function toRoman(num: number): string {
  if(num<=0||num>3999)return'Out of range (1-3999)';
  const vals=[1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r='';
  for(let i=0;i<vals.length;i++){while(num>=vals[i]){r+=syms[i];num-=vals[i];}}
  return r;
}
function fromRoman(s: string): number {
  const map:Record<string,number>={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let r=0;
  for(let i=0;i<s.length;i++){
    const c=map[s[i]],n=map[s[i+1]];
    if(n&&c<n){r+=n-c;i++;}else r+=c;
  }
  return r;
}

// ── Number theory ─────────────────────────────────────────────────────────
function isPrime(n: number): boolean {
  if(n<2)return false;if(n===2)return true;if(n%2===0)return false;
  for(let i=3;i<=Math.sqrt(n);i+=2)if(n%i===0)return false;
  return true;
}
function factorial(n: number): bigint {
  if(n<0)return BigInt(0);let r=BigInt(1);
  for(let i=2;i<=n;i++)r*=BigInt(i);return r;
}
function fibonacci(count: number): number[] {
  const r=[0,1];for(let i=2;i<count;i++)r.push(r[i-1]+r[i-2]);return r.slice(0,count);
}

// ── Password ──────────────────────────────────────────────────────────────
function genPassword(len=16): string {
  const c='ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  return Array.from({length:len},()=>c[Math.floor(Math.random()*c.length)]).join('');
}

// ── Notes (localStorage) ──────────────────────────────────────────────────
const NOTES_KEY='zorbix_notes';
function getNotes(): string[] {
  try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');}catch{return [];}
}
function addNote(note: string): void {
  const notes=getNotes();
  notes.unshift(`[${new Date().toLocaleDateString()}] ${note}`);
  localStorage.setItem(NOTES_KEY,JSON.stringify(notes.slice(0,50)));
}

// ── Approx currency rates vs USD ──────────────────────────────────────────
const CURRENCY_RATES: Record<string,number> = {
  usd:1,dollar:1,dollars:1,
  eur:0.92,euro:0.92,euros:0.92,
  gbp:0.79,pound:0.79,pounds:0.79,'british pound':0.79,
  jpy:149.5,yen:149.5,
  cad:1.36,'canadian dollar':1.36,
  aud:1.53,'australian dollar':1.53,
  chf:0.89,'swiss franc':0.89,
  cny:7.23,yuan:7.23,rmb:7.23,
  inr:83.5,'indian rupee':83.5,rupee:83.5,rupees:83.5,
  pkr:278,'pakistani rupee':278,
  bdt:110,'bangladeshi taka':110,taka:110,
  ngn:1550,'nigerian naira':1550,naira:1550,
  zar:18.5,'south african rand':18.5,rand:18.5,
  brl:4.97,'brazilian real':4.97,real:4.97,
  mxn:17.1,'mexican peso':17.1,peso:17.1,
  krw:1330,'korean won':1330,won:1330,
  sgd:1.34,'singapore dollar':1.34,
  hkd:7.82,'hong kong dollar':7.82,
  aed:3.67,dirham:3.67,
  sar:3.75,'saudi riyal':3.75,riyal:3.75,
  try:32.5,'turkish lira':32.5,lira:32.5,
  rub:92,'russian ruble':92,ruble:92,
  sek:10.4,'swedish krona':10.4,krona:10.4,
  nok:10.6,'norwegian krone':10.6,
  dkk:6.88,'danish krone':6.88,
  kwd:0.307,'kuwaiti dinar':0.307,
  qar:3.64,'qatari riyal':3.64,
  btc:0.0000234,'bitcoin':0.0000234,
  eth:0.000387,'ethereum':0.000387,
};

function convertCurrency(amount: number, from: string, to: string): string | null {
  const f=CURRENCY_RATES[from.toLowerCase()],t=CURRENCY_RATES[to.toLowerCase()];
  if(!f||!t)return null;
  const result=(amount/f)*t;
  const rounded=result>1?result.toFixed(2):result.toPrecision(4);
  return `${amount} ${from} = ${rounded} ${to} (approximate rate)`;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function n(text: string){return text.toLowerCase().replace(/['']/g,"'").trim();}
function parseTimeDuration(text: string): number | null {
  let ms=0;
  const hours=text.match(/(\d+)\s*(?:hour|hr|h)s?/i);
  const mins=text.match(/(\d+)\s*(?:minute|min|m(?!s))s?/i);
  const secs=text.match(/(\d+)\s*(?:second|sec|s)s?/i);
  if(hours)ms+=parseInt(hours[1])*3600000;
  if(mins)ms+=parseInt(mins[1])*60000;
  if(secs)ms+=parseInt(secs[1])*1000;
  if(ms===0){const bare=text.match(/^(\d+)$/);if(bare)ms=parseInt(bare[1])*60000;}
  return ms>0?ms:null;
}
function requestNotificationPermission(): Promise<boolean> {
  if(!('Notification' in window))return Promise.resolve(false);
  if(Notification.permission==='granted')return Promise.resolve(true);
  return Notification.requestPermission().then(p=>p==='granted');
}
function showNotification(title: string,body: string){
  if(Notification.permission==='granted')new Notification(title,{body,icon:'/favicon.ico'});
}

// ── TTS ────────────────────────────────────────────────────────────────────
const TTS_SPEED_KEY='zorbix_tts_speed';
export function getTtsSpeed():number{return parseFloat(localStorage.getItem(TTS_SPEED_KEY)||'1.05');}
function setTtsSpeed(r:number){localStorage.setItem(TTS_SPEED_KEY,String(r));}
export function speak(text:string,onEnd?:()=>void):void{
  if(!('speechSynthesis' in window)){onEnd?.();return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.rate=getTtsSpeed();u.pitch=1;u.volume=1;
  const pref=window.speechSynthesis.getVoices().find(v=>v.name.includes('Google')||v.name.includes('Samantha')||v.name.includes('Microsoft'));
  if(pref)u.voice=pref;
  u.onend=()=>onEnd?.();u.onerror=()=>onEnd?.();
  window.speechSynthesis.speak(u);
}
export function stopSpeaking():void{if('speechSynthesis' in window)window.speechSynthesis.cancel();}

// ═══════════════════════════════════════════════════════════════════════════
//  parseCommand
// ═══════════════════════════════════════════════════════════════════════════
export function parseCommand(raw: string): ParsedCommand {
  const t=n(raw);

  // ── Meta ──────────────────────────────────────────────────────────────
  if(/^(stop|quiet|silence|shut up|cancel|enough|pause|stop (talking|speaking))$/i.test(t)) return{type:'stop-speaking',payload:{},raw};
  if(/read (that|it|last|again)|repeat (that|last)|say that again/i.test(t)) return{type:'read-last',payload:{},raw};
  if(/copy (that|last|response|it)/i.test(t)) return{type:'copy-last',payload:{},raw};
  if(/new (chat|conversation)|start (a new|new) (chat|conversation)|clear (the )?chat|reset chat/i.test(t)) return{type:'new-chat',payload:{},raw};

  // ── Say arbitrary text ────────────────────────────────────────────────
  const sayMatch=t.match(/^say\s+(.+)/i)||t.match(/^speak\s+(.+)/i)||t.match(/^read out\s+(.+)/i);
  if(sayMatch&&sayMatch[1].length>1) return{type:'say-text',payload:{text:sayMatch[1].trim()},raw};

  // ── Time / Date / World time ──────────────────────────────────────────
  if(/what(?:'s| is) the time|current time|what time is it/i.test(t)) return{type:'get-time',payload:{},raw};
  if(/what(?:'s| is) the date|today(?:'s)? date|what(?:'s| is) today/i.test(t)) return{type:'get-date',payload:{},raw};

  const worldTimeM=t.match(/(?:what(?:'s| is) the time|current time|time) in ([a-z\s]{3,})/i)||t.match(/([a-z\s]+) time right now/i);
  if(worldTimeM){const city=worldTimeM[1].trim().toLowerCase();if(CITY_TZ[city])return{type:'world-time',payload:{city,tz:CITY_TZ[city]},raw};}

  // ── Battery / IP ──────────────────────────────────────────────────────
  if(/battery (level|status|percentage|life)|how much battery|check battery/i.test(t)) return{type:'battery',payload:{},raw};
  if(/(?:what(?:'s| is) my|check my|show my|my) ip(?: address)?|ip address/i.test(t)) return{type:'get-ip',payload:{},raw};

  // ── Dark / Light mode ─────────────────────────────────────────────────
  if(/dark mode|switch to dark|enable dark/i.test(t)) return{type:'dark-mode',payload:{},raw};
  if(/light mode|switch to light|enable light/i.test(t)) return{type:'light-mode',payload:{},raw};

  // ── TTS speed ─────────────────────────────────────────────────────────
  if(/speak (faster|speed up|quicker)|talk faster/i.test(t)) return{type:'speak-faster',payload:{},raw};
  if(/speak (slower|slow down)|talk slower/i.test(t)) return{type:'speak-slower',payload:{},raw};
  if(/speak (normal|normally|default speed)|reset speed/i.test(t)) return{type:'speak-normal',payload:{},raw};

  // ── Browser controls ──────────────────────────────────────────────────
  if(/^go back$|^back$|^previous page$/i.test(t)) return{type:'go-back',payload:{},raw};
  if(/^go forward$|^forward$|^next page$/i.test(t)) return{type:'go-forward',payload:{},raw};
  if(/reload page|refresh page|refresh this page/i.test(t)) return{type:'reload-page',payload:{},raw};
  if(/(?:enter |go |toggle )?full ?screen(?! exit)/i.test(t)&&!/exit/.test(t)) return{type:'fullscreen',payload:{},raw};
  if(/exit full ?screen|leave full ?screen/i.test(t)) return{type:'exit-fullscreen',payload:{},raw};
  if(/zoom in|make (it |page |text )?(bigger|larger)/i.test(t)) return{type:'zoom-in',payload:{},raw};
  if(/zoom out|make (it |page |text )?(smaller)/i.test(t)) return{type:'zoom-out',payload:{},raw};
  if(/zoom reset|reset zoom|normal (size|zoom)/i.test(t)) return{type:'zoom-reset',payload:{},raw};
  if(/print (page|this)|print it/i.test(t)) return{type:'print-page',payload:{},raw};
  if(/copy (url|link|page link|this link)/i.test(t)) return{type:'copy-url',payload:{},raw};
  if(/share (this page|this link|page)/i.test(t)) return{type:'share-page',payload:{},raw};
  const findM=t.match(/(?:find|search for) (.+?) on (?:this )?page/i);
  if(findM) return{type:'find-on-page',payload:{text:findM[1].trim()},raw};

  // ── Notes ─────────────────────────────────────────────────────────────
  const noteM=t.match(/(?:take a note|note down|remember|save a note|note)[:]\s*(.+)/i)
    ||t.match(/(?:take a note|note down|save)\s+(.+)/i);
  if(noteM) return{type:'take-note',payload:{note:noteM[1].trim()},raw};
  if(/show (?:my )?notes|read (?:my )?notes|list (?:my )?notes/i.test(t)) return{type:'show-notes',payload:{},raw};
  if(/clear (?:my )?notes|delete (?:my )?notes/i.test(t)) return{type:'clear-notes',payload:{},raw};

  // ── Coin / Dice / Random ──────────────────────────────────────────────
  if(/flip (a )?coin|heads or tails|coin flip/i.test(t)) return{type:'coin-flip',payload:{},raw};
  const diceM=t.match(/roll (?:(\d+) )?d(?:ice|ie(?:s)?)|roll (\d+) dice|roll a die|roll the die/i);
  if(diceM){const count=diceM[1]||diceM[2]||'1';const sides=t.match(/d(\d+)/i)?.[1]||'6';return{type:'dice-roll',payload:{count,sides},raw};}
  const randomM=t.match(/random number (?:between|from) (\d+) (?:and|to) (\d+)/i)||t.match(/(?:give me a|pick a|random) number/i);
  if(randomM){return{type:'random-number',payload:{min:randomM[1]||'1',max:randomM[2]||'100'},raw};}

  // ── Password ──────────────────────────────────────────────────────────
  if(/generate (a |strong |secure |random )?password|create (a |strong |secure )?password|make a password/i.test(t))
    return{type:'generate-password',payload:{},raw};

  // ── Pomodoro ──────────────────────────────────────────────────────────
  if(/(?:start )?pomodoro|focus (?:timer|session)|25 (?:minute|min) timer/i.test(t))
    return{type:'pomodoro',payload:{},raw};

  // ── Text transforms ───────────────────────────────────────────────────
  const upperM=t.match(/(?:uppercase|upper case|capitalize|all caps)\s+(.+)/i)||t.match(/make (.+?) uppercase/i);
  if(upperM) return{type:'text-upper',payload:{text:upperM[1].trim()},raw};
  const lowerM=t.match(/(?:lowercase|lower case)\s+(.+)/i)||t.match(/make (.+?) lowercase/i);
  if(lowerM) return{type:'text-lower',payload:{text:lowerM[1].trim()},raw};
  const reverseM=t.match(/reverse\s+(.+)/i);
  if(reverseM&&!reverseM[1].includes('number')) return{type:'text-reverse',payload:{text:reverseM[1].trim()},raw};

  // ── Word / Char count ─────────────────────────────────────────────────
  const wordCountM=t.match(/(?:how many words|word count)(?:\s+in|:)?\s+(.+)/i);
  if(wordCountM) return{type:'word-count',payload:{text:wordCountM[1].trim()},raw};
  const charCountM=t.match(/(?:how many characters|character count)(?:\s+in|:)?\s+(.+)/i);
  if(charCountM) return{type:'char-count',payload:{text:charCountM[1].trim()},raw};

  // ── Palindrome ────────────────────────────────────────────────────────
  const palM=t.match(/is (.+?) a palindrome/i)||t.match(/palindrome check (?:for )?(.+)/i);
  if(palM) return{type:'palindrome',payload:{text:palM[1].trim()},raw};

  // ── Morse code ────────────────────────────────────────────────────────
  const morseM=t.match(/(?:morse code for|translate (.+?) to morse|morse)\s+(.+)/i)
    ||t.match(/(.+?) in morse code/i);
  if(morseM) return{type:'morse-code',payload:{text:(morseM[2]||morseM[1]).trim()},raw};

  // ── Binary / Hex ──────────────────────────────────────────────────────
  const binM=t.match(/(?:convert )?(\d+) to binary/i)||t.match(/binary (?:of|for) (\d+)/i);
  if(binM) return{type:'binary-convert',payload:{num:binM[1]},raw};
  const hexM=t.match(/(?:convert )?(\d+) to hex(?:adecimal)?/i)||t.match(/hex (?:of|for) (\d+)/i);
  if(hexM) return{type:'hex-convert',payload:{num:hexM[1]},raw};

  // ── Roman numerals ────────────────────────────────────────────────────
  const romanM=t.match(/(?:convert )?(\d+) to roman/i)||t.match(/roman numeral(?:s)? (?:for|of) (\d+)/i);
  if(romanM) return{type:'roman-numeral',payload:{num:romanM[1],dir:'toRoman'},raw};
  const fromRomanM=t.match(/(?:convert )?([IVXLCDM]+) from roman/i)||t.match(/what is ([IVXLCDM]+) in roman/i);
  if(fromRomanM) return{type:'roman-numeral',payload:{num:fromRomanM[1],dir:'fromRoman'},raw};

  // ── Number theory ─────────────────────────────────────────────────────
  const primeM=t.match(/is (\d+) (?:a )?prime/i)||t.match(/prime (?:check )?(?:for )?(\d+)/i);
  if(primeM) return{type:'prime-check',payload:{num:primeM[1]},raw};
  const factM=t.match(/(?:what is )?(\d+) factorial/i)||t.match(/factorial (?:of )?(\d+)/i);
  if(factM) return{type:'factorial',payload:{num:factM[1]},raw};
  const fibM=t.match(/(?:first )?(\d+) fibonacci|fibonacci(?: sequence)? (\d+)/i);
  if(fibM) return{type:'fibonacci',payload:{count:fibM[1]||fibM[2]},raw};

  // ── Tip / BMI / Age ───────────────────────────────────────────────────
  const tipM=t.match(/(\d+)%? tip (?:on|for) \$?(\d+(?:\.\d+)?)/i)
    ||t.match(/what(?:'s| is) (?:a )?(\d+)%? tip (?:on|for) \$?(\d+(?:\.\d+)?)/i);
  if(tipM) return{type:'tip-calc',payload:{pct:tipM[1],amount:tipM[2]},raw};

  const bmiM=t.match(/(?:bmi|body mass index) (?:for )?(\d+(?:\.\d+)?)\s*(?:kg|kilograms?).*?(\d+(?:\.\d+)?)\s*(?:m|meters?|cm)/i);
  if(bmiM){const kg=parseFloat(bmiM[1]);let h=parseFloat(bmiM[2]);if(h>10)h/=100;return{type:'bmi-calc',payload:{kg:String(kg),height:String(h)},raw};}

  const ageM=t.match(/how old (?:is someone born|was someone born)? (?:in )?(\d{4})/i)
    ||t.match(/age (?:of someone )?born in (\d{4})/i);
  if(ageM) return{type:'age-calc',payload:{year:ageM[1]},raw};

  // ── Currency conversion ───────────────────────────────────────────────
  const currM=t.match(/(?:convert )?(\d+(?:\.\d+)?)\s+(\w[\w\s]*?)\s+(?:to|into)\s+(\w[\w\s]*?)(?:\?|$)/i);
  if(currM){
    const result=convertCurrency(parseFloat(currM[1]),currM[2].trim(),currM[3].trim());
    if(result) return{type:'currency-convert',payload:{result},raw};
  }

  // ── Encode / Decode ───────────────────────────────────────────────────
  const encM=t.match(/(?:url )?encode\s+(.+)/i);
  if(encM) return{type:'encode-url',payload:{text:encM[1].trim()},raw};
  const decM=t.match(/(?:url )?decode\s+(.+)/i);
  if(decM) return{type:'decode-url',payload:{text:decM[1].trim()},raw};

  // ── Rhyme finder ──────────────────────────────────────────────────────
  const rhymeM=t.match(/what (?:rhymes|words rhyme) with (\w+)/i)||t.match(/rhymes? (?:for|of|with) (\w+)/i);
  if(rhymeM) return{type:'rhyme-finder',payload:{word:rhymeM[1].trim()},raw};

  // ── QR code ───────────────────────────────────────────────────────────
  const qrM=t.match(/(?:generate|create|make) (?:a )?qr code (?:for )?(.+)/i);
  if(qrM) return{type:'qr-code',payload:{text:qrM[1].trim()},raw};
  if(/generate qr|qr code/i.test(t)) return{type:'qr-code',payload:{text:window.location.href},raw};

  // ── Countdown ─────────────────────────────────────────────────────────
  const countdownM=t.match(/how many days (?:until|till|to|before)\s+(.+)/i)
    ||t.match(/(?:days|time) (?:until|till|to|before)\s+(.+)/i)||t.match(/when is\s+(.+)/i);
  if(countdownM){const eventName=countdownM[1].replace(/[?.]$/,'').trim();const eventDate=getNotableDate(eventName);
    if(eventDate){const days=Math.ceil((eventDate.getTime()-Date.now())/86400000);return{type:'countdown-days',payload:{event:eventName,days:String(days),date:eventDate.toLocaleDateString()},raw};}}

  // ── Alarm ─────────────────────────────────────────────────────────────
  const alarmM=t.match(/(?:set (?:an )?alarm|wake me up?|alarm) (?:at|for)\s+(.+)/i)||t.match(/remind me at\s+(.+)/i);
  if(alarmM){const alarmDate=parseAlarmTime(alarmM[1]);if(alarmDate){const ms=alarmDate.getTime()-Date.now();const label=alarmDate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});return{type:'set-alarm',payload:{durationMs:String(ms),label,timeStr:alarmM[1]},raw};}}

  // ── Timer ─────────────────────────────────────────────────────────────
  const timerM=t.match(/(?:set (?:a )?)?timer (?:for )?(.+)/i)||t.match(/alarm (?:for|in) (.+)/i);
  if(timerM){const ms=parseTimeDuration(timerM[1]);if(ms)return{type:'set-timer',payload:{durationMs:String(ms),label:timerM[1]},raw};}

  // ── Reminder ─────────────────────────────────────────────────────────
  const remM=t.match(/remind me (?:in )?(.+?) (?:to|about|that) (.+)/i)||t.match(/remind me (?:in )?(.+)/i);
  if(remM){const ms=parseTimeDuration(remM[1]);const reminderText=remM[2]||'your reminder';if(ms)return{type:'set-reminder',payload:{durationMs:String(ms),reminderText,label:remM[1]},raw};}

  // ── Email ─────────────────────────────────────────────────────────────
  const emailM=t.match(/(?:send|compose|write) (?:an )?email (?:to )?(.+)/i)||t.match(/email (.+)/i);
  if(emailM&&emailM[1].includes('@')) return{type:'compose-email',payload:{to:emailM[1].trim()},raw};

  // ── Call / Message ────────────────────────────────────────────────────
  const callM=t.match(/(?:call|phone|dial|ring) (.+)/i);
  if(callM) return{type:'call',payload:{target:callM[1].trim()},raw};
  const msgM=t.match(/(?:send|text|message|whatsapp) (.+?) (?:saying|say|message|that) "?(.+)"?/i)
    ||t.match(/(?:send|text|whatsapp) (.+?) "(.+)"/i);
  if(msgM) return{type:'send-message',payload:{contact:msgM[1].trim(),message:msgM[2].trim()},raw};
  const simpM=t.match(/(?:message|whatsapp|text) (.+)/i);
  if(simpM) return{type:'send-message',payload:{contact:simpM[1].trim(),message:''},raw};

  // ── Translate / Thesaurus / Dictionary ───────────────────────────────
  const transM=t.match(/translate (.+?) (?:to|into) (\w+)/i)||t.match(/how do you say (.+?) in (\w+)/i);
  if(transM) return{type:'translate',payload:{text:transM[1].trim(),lang:transM[2].trim()},raw};
  const thesM=t.match(/(?:synonym|antonym|another word) (?:for|of) (\w+)/i);
  if(thesM) return{type:'open-thesaurus',payload:{word:thesM[1].trim()},raw};
  const dictM=t.match(/(?:define|what(?:'s| does| is the meaning of)?) (?:the word )?["']?(\w+)["']?(?: mean)?/i)
    ||t.match(/how (?:do you|to) spell (\w+)/i)||t.match(/spelling of (\w+)/i);
  if(dictM&&!/what is the time|what is today/.test(t)) return{type:'open-dictionary',payload:{word:dictM[1].trim()},raw};

  // ── Stocks ────────────────────────────────────────────────────────────
  const stockM=t.match(/(?:check )?(?:the )?(.+?) stock(?: price)?(?:\?|$)/i)||t.match(/stock(?: price)? of (.+)/i);
  if(stockM){const company=(stockM[1]||stockM[2]).trim();if(company.length>1&&!/open|show|get/.test(company))return{type:'open-stocks',payload:{company},raw};}

  // ── Wikipedia / IMDB / GitHub ─────────────────────────────────────────
  const wikiM=t.match(/(?:search wikipedia|wikipedia|wiki) (?:for )?(.+)/i)||t.match(/(?:tell me about|what is|who is) (.+?) on wikipedia/i);
  if(wikiM) return{type:'search-wikipedia',payload:{query:wikiM[1].trim()},raw};
  const imdbM=t.match(/(?:search|find|look up) (.+?) on imdb/i)||t.match(/imdb (.+)/i);
  if(imdbM) return{type:'search-imdb',payload:{query:imdbM[1].trim()},raw};
  const githubM=t.match(/(?:search|find) (.+?) on github/i)||t.match(/github search (.+)/i);
  if(githubM) return{type:'search-github',payload:{query:githubM[1].trim()},raw};

  // ── News ─────────────────────────────────────────────────────────────
  const newsTopM=t.match(/(?:show|get|open) (.+?) news/i)||t.match(/news (?:about|on) (.+)/i);
  if(newsTopM&&newsTopM[1].trim()!=='the') return{type:'news-topic',payload:{topic:newsTopM[1].trim()},raw};
  if(/(?:show|open|get|latest|read)? ?(?:me )? ?(?:the )?news|headlines|current events/i.test(t)) return{type:'open-news',payload:{},raw};

  // ── Weather / Maps ────────────────────────────────────────────────────
  if(/(?:what(?:'s| is) the weather|weather today|how(?:'s| is) the weather|temperature today|will it rain)/i.test(t)) return{type:'open-weather',payload:{},raw};
  const dirM=t.match(/(?:navigate|directions?|take me|drive) to (.+)/i)||t.match(/how (?:do i|to) get to (.+)/i);
  if(dirM) return{type:'directions',payload:{place:dirM[1].trim()},raw};
  if(/open maps|open google maps/i.test(t)) return{type:'open-maps',payload:{},raw};

  // ── In-app navigation ─────────────────────────────────────────────────
  const navM=t.match(/(?:go to|open|navigate to|take me to|switch to) (.+)/i);
  if(navM){const target=navM[1].trim().toLowerCase();if(APP_ROUTE_MAP[target])return{type:'navigate-app',payload:{route:APP_ROUTE_MAP[target],label:target},raw};const url=APP_MAP[target];if(url)return{type:'open-app',payload:{app:target,url},raw};}

  // ── YouTube / Spotify ─────────────────────────────────────────────────
  const ytM=t.match(/(?:search|find|play) (.+?) on youtube/i)||t.match(/youtube (.+)/i);
  if(ytM) return{type:'search-youtube',payload:{query:ytM[1].trim()},raw};
  const spotM=t.match(/(?:play|listen to) (.+?) on spotify/i)||t.match(/play (.+)/i);
  if(spotM) return{type:'play-music',payload:{query:spotM[1].trim()},raw};

  // ── Open app ─────────────────────────────────────────────────────────
  const openM=t.match(/(?:open|launch|start) (.+)/i);
  if(openM){const a=openM[1].trim().toLowerCase();if(APP_MAP[a])return{type:'open-app',payload:{app:a,url:APP_MAP[a]},raw};if(APP_ROUTE_MAP[a])return{type:'navigate-app',payload:{route:APP_ROUTE_MAP[a],label:a},raw};}

  // ── Generic search ────────────────────────────────────────────────────
  const srchM=t.match(/(?:search|google|look up|find) (.+)/i);
  if(srchM) return{type:'search-web',payload:{query:srchM[1].trim()},raw};

  return{type:'ai-question',payload:{question:raw.trim()},raw};
}

// ═══════════════════════════════════════════════════════════════════════════
//  executeCommand
// ═══════════════════════════════════════════════════════════════════════════
export function executeCommand(
  cmd: ParsedCommand,
  navigate: (path:string)=>void,
  onAiQuestion: (q:string)=>void,
  getLastResponse?: ()=>string,
  onSpeedChange?: (speed:number)=>void,
): CommandResult {

  switch(cmd.type){

    case 'stop-speaking': return{response:'',action:()=>stopSpeaking()};
    case 'read-last':{const l=getLastResponse?.()||'';if(!l)return{response:"There's no previous response to read."};return{response:l};}
    case 'copy-last':{const l=getLastResponse?.()||'';if(!l)return{response:'Nothing to copy yet.'};return{response:'Copied to clipboard.',action:()=>navigator.clipboard?.writeText(l).catch(()=>{})};}
    case 'new-chat': return{response:'Starting a new chat.',action:()=>navigate('/?newChat=true')};

    // ── Say arbitrary text ─────────────────────────────────────────────
    case 'say-text': return{response:cmd.payload.text};

    // ── Time ──────────────────────────────────────────────────────────
    case 'get-time':{const t=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});return{response:`It's ${t}.`};}
    case 'get-date':{const d=new Date().toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});return{response:`Today is ${d}.`};}
    case 'world-time':{const{city,tz}=cmd.payload;try{const t=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date());return{response:`It's ${t} in ${city.charAt(0).toUpperCase()+city.slice(1)}.`};}catch{return{response:`I couldn't find the time for ${city}.`};}}

    // ── Battery / IP ──────────────────────────────────────────────────
    case 'battery':{
      if(!(navigator as any).getBattery)return{response:"Battery info isn't available in this browser."};
      return{response:'Checking battery…',action:async()=>{const b=await(navigator as any).getBattery();const pct=Math.round(b.level*100);speak(`Your battery is at ${pct} percent${b.charging?', and it is charging':''}.`);}};
    }
    case 'get-ip': return{response:'Fetching your IP address…',action:async()=>{try{const r=await fetch('https://api.ipify.org?format=json');const{ip}=await r.json();speak(`Your IP address is ${ip}.`);}catch{speak("I couldn't fetch your IP address right now.");}}};

    // ── Dark / Light ──────────────────────────────────────────────────
    case 'dark-mode': return{response:'Switching to dark mode.',action:()=>{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark');window.dispatchEvent(new CustomEvent('zorbix-theme-change',{detail:'dark'}));}};
    case 'light-mode': return{response:'Switching to light mode.',action:()=>{document.documentElement.classList.remove('dark');localStorage.setItem('theme','light');window.dispatchEvent(new CustomEvent('zorbix-theme-change',{detail:'light'}));}};

    // ── TTS speed ─────────────────────────────────────────────────────
    case 'speak-faster':{const s=Math.min(2.0,getTtsSpeed()+0.2);setTtsSpeed(s);onSpeedChange?.(s);return{response:'Speaking faster now.'};}
    case 'speak-slower':{const s=Math.max(0.5,getTtsSpeed()-0.2);setTtsSpeed(s);onSpeedChange?.(s);return{response:'Speaking slower now.'};}
    case 'speak-normal': setTtsSpeed(1.05);onSpeedChange?.(1.05);return{response:'Back to normal speed.'};

    // ── Browser controls ──────────────────────────────────────────────
    case 'go-back':         return{response:'Going back.',action:()=>window.history.back()};
    case 'go-forward':      return{response:'Going forward.',action:()=>window.history.forward()};
    case 'reload-page':     return{response:'Reloading.',action:()=>window.location.reload()};
    case 'fullscreen':      return{response:'Entering fullscreen.',action:()=>document.documentElement.requestFullscreen?.().catch(()=>{})};
    case 'exit-fullscreen': return{response:'Exiting fullscreen.',action:()=>document.exitFullscreen?.().catch(()=>{})};
    case 'zoom-in':         return{response:'Zooming in.',action:()=>{const c=parseFloat((document.body.style.zoom as string)||'1');document.body.style.zoom=String(Math.min(3,c+0.1));}};
    case 'zoom-out':        return{response:'Zooming out.',action:()=>{const c=parseFloat((document.body.style.zoom as string)||'1');document.body.style.zoom=String(Math.max(0.3,c-0.1));}};
    case 'zoom-reset':      return{response:'Zoom reset.',action:()=>{document.body.style.zoom='1';}};
    case 'print-page':      return{response:'Opening print dialog.',action:()=>window.print()};
    case 'copy-url':        return{response:'Page URL copied.',action:()=>navigator.clipboard?.writeText(window.location.href).catch(()=>{})};
    case 'share-page':{const url=window.location.href;if((navigator as any).share)return{response:'Opening share dialog.',action:()=>(navigator as any).share({url}).catch(()=>{})};return{response:'URL copied to clipboard.',action:()=>navigator.clipboard?.writeText(url).catch(()=>{})};}
    case 'find-on-page':    return{response:`Searching for "${cmd.payload.text}".`,action:()=>{(window as any).find?.(cmd.payload.text,false,false,true);}};

    // ── Notes ─────────────────────────────────────────────────────────
    case 'take-note':{const note=cmd.payload.note;return{response:`Note saved: ${note}`,action:()=>{addNote(note);navigator.clipboard?.writeText(note).catch(()=>{});}};}
    case 'show-notes':{const notes=getNotes();if(!notes.length)return{response:'You have no saved notes.'};return{response:`You have ${notes.length} note${notes.length!==1?'s':''}: ${notes[0]}${notes.length>1?` and ${notes.length-1} more`:''}`,action:()=>navigator.clipboard?.writeText(notes.join('\n')).catch(()=>{})};}
    case 'clear-notes': return{response:'All notes cleared.',action:()=>localStorage.removeItem(NOTES_KEY)};

    // ── Math ──────────────────────────────────────────────────────────
    case 'math':{const r=parseFloat(cmd.payload.result);const nice=Number.isInteger(r)?String(r):r.toPrecision(6).replace(/\.?0+$/,'');return{response:`The answer is ${nice}.`};}
    case 'unit-convert': return{response:cmd.payload.result};
    case 'currency-convert': return{response:cmd.payload.result};

    // ── Tip / BMI / Age ───────────────────────────────────────────────
    case 'tip-calc':{const pct=parseFloat(cmd.payload.pct),amount=parseFloat(cmd.payload.amount);const tip=amount*pct/100;return{response:`A ${pct}% tip on $${amount} is $${tip.toFixed(2)}. Total: $${(amount+tip).toFixed(2)}.`};}
    case 'bmi-calc':{const kg=parseFloat(cmd.payload.kg),h=parseFloat(cmd.payload.height);const bmi=kg/(h*h);const cat=bmi<18.5?'underweight':bmi<25?'normal weight':bmi<30?'overweight':'obese';return{response:`Your BMI is ${bmi.toFixed(1)}, which is ${cat}.`};}
    case 'age-calc':{const year=parseInt(cmd.payload.year);const age=new Date().getFullYear()-year;return{response:`Someone born in ${year} is ${age} years old.`};}
    case 'percentage-of':{const pct=parseFloat(cmd.payload.pct),num=parseFloat(cmd.payload.num);return{response:`${pct}% of ${num} is ${(num*pct/100).toFixed(2)}.`};}

    // ── Number theory ─────────────────────────────────────────────────
    case 'prime-check':{const num=parseInt(cmd.payload.num);return{response:`${num} ${isPrime(num)?'is':'is not'} a prime number.`};}
    case 'factorial':{const n=parseInt(cmd.payload.num);if(n>20)return{response:`${n}! is a very large number. Ask me to calculate it.`};return{response:`${n}! = ${factorial(n)}.`};}
    case 'fibonacci':{const count=Math.min(20,parseInt(cmd.payload.count)||10);return{response:`First ${count} Fibonacci numbers: ${fibonacci(count).join(', ')}.`};}

    // ── Text transforms ───────────────────────────────────────────────
    case 'morse-code':{const morse=toMorse(cmd.payload.text);return{response:`Morse code: ${morse}`,action:()=>navigator.clipboard?.writeText(morse).catch(()=>{})};}
    case 'binary-convert':{const num=parseInt(cmd.payload.num);return{response:`${num} in binary is ${num.toString(2)}.`};}
    case 'hex-convert':{const num=parseInt(cmd.payload.num);return{response:`${num} in hexadecimal is 0x${num.toString(16).toUpperCase()}.`};}
    case 'roman-numeral':{if(cmd.payload.dir==='toRoman'){const n=parseInt(cmd.payload.num);return{response:`${n} in Roman numerals is ${toRoman(n)}.`};}else{const n=cmd.payload.num.toUpperCase();const val=fromRoman(n);return{response:`${n} in Roman numerals equals ${val}.`};}}
    case 'palindrome':{const text=cmd.payload.text.toLowerCase().replace(/[^a-z0-9]/g,'');const rev=text.split('').reverse().join('');return{response:`"${cmd.payload.text}" ${text===rev?'is':'is not'} a palindrome.`};}
    case 'word-count':{const words=cmd.payload.text.trim().split(/\s+/).filter(Boolean);return{response:`That has ${words.length} word${words.length!==1?'s':''}.`};}
    case 'char-count':{return{response:`That has ${cmd.payload.text.length} character${cmd.payload.text.length!==1?'s':''}.`};}
    case 'text-upper':{const u=cmd.payload.text.toUpperCase();return{response:u,action:()=>navigator.clipboard?.writeText(u).catch(()=>{})};}
    case 'text-lower':{const l=cmd.payload.text.toLowerCase();return{response:l,action:()=>navigator.clipboard?.writeText(l).catch(()=>{})};}
    case 'text-reverse':{const r=cmd.payload.text.split('').reverse().join('');return{response:`Reversed: ${r}`,action:()=>navigator.clipboard?.writeText(r).catch(()=>{})};}
    case 'encode-url':{const e=encodeURIComponent(cmd.payload.text);return{response:`Encoded: ${e}`,action:()=>navigator.clipboard?.writeText(e).catch(()=>{})};}
    case 'decode-url':{try{const d=decodeURIComponent(cmd.payload.text);return{response:`Decoded: ${d}`,action:()=>navigator.clipboard?.writeText(d).catch(()=>{})};}catch{return{response:"That doesn't look like a valid encoded URL."};}}

    // ── Coin / Dice / Random / Password ──────────────────────────────
    case 'coin-flip': return{response:Math.random()<.5?'Heads!':'Tails!'};
    case 'dice-roll':{const count=parseInt(cmd.payload.count)||1,sides=parseInt(cmd.payload.sides)||6;const rolls=Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);const total=rolls.reduce((a,b)=>a+b,0);return{response:count>1?`You rolled ${rolls.join(', ')}. Total: ${total}.`:`You rolled a ${rolls[0]}.`};}
    case 'random-number':{const min=parseInt(cmd.payload.min)||1,max=parseInt(cmd.payload.max)||100;return{response:`Your random number is ${Math.floor(Math.random()*(max-min+1))+min}.`};}
    case 'generate-password':{const pwd=genPassword(16);return{response:'Strong password generated and copied to clipboard.',action:()=>navigator.clipboard?.writeText(pwd).catch(()=>{})};}

    // ── Rhyme / QR ────────────────────────────────────────────────────
    case 'rhyme-finder':{const{word}=cmd.payload;return{response:`Finding words that rhyme with "${word}".`,action:()=>window.open(`https://www.rhymezone.com/r/rhyme.cgi?Word=${encodeURIComponent(word)}`,'_blank')};}
    case 'qr-code':{const{text}=cmd.payload;return{response:`Generating QR code for: ${text.slice(0,40)}${text.length>40?'...':''}`,action:()=>window.open(`https://qr.io/?url=${encodeURIComponent(text)}`,'_blank')};}

    // ── Pomodoro ──────────────────────────────────────────────────────
    case 'pomodoro':{const ms=25*60*1000;return{response:'Pomodoro started. Focus for 25 minutes!',timer:{id:Date.now().toString(),label:'🍅 Pomodoro',endsAt:Date.now()+ms,totalMs:ms,isReminder:true,reminderText:'Pomodoro complete! Take a 5-minute break.'},action:async()=>{await requestNotificationPermission();setTimeout(()=>{speak('Pomodoro complete! Take a 5-minute break.');showNotification('🍅 Pomodoro Done!','Time for a 5-minute break!');},ms);}};}

    // ── Timers ────────────────────────────────────────────────────────
    case 'set-timer':{const ms=parseInt(cmd.payload.durationMs),label=cmd.payload.label;const mins=Math.floor(ms/60000),secs=Math.floor((ms%60000)/1000);const readable=mins>0?`${mins} minute${mins!==1?'s':''}${secs>0?` and ${secs} second${secs!==1?'s':''}`:''}`:`${secs} second${secs!==1?'s':''}`;return{response:`Timer set for ${readable}.`,timer:{id:Date.now().toString(),label:`⏱ ${label}`,endsAt:Date.now()+ms,totalMs:ms}};}
    case 'set-reminder':{const ms=parseInt(cmd.payload.durationMs),reminderText=cmd.payload.reminderText,label=cmd.payload.label;const mins=Math.floor(ms/60000);const readable=mins>0?`${mins} minute${mins!==1?'s':''}`:` ${Math.floor(ms/1000)} seconds`;return{response:`I'll remind you to ${reminderText} in${readable}.`,action:async()=>{await requestNotificationPermission();setTimeout(()=>{speak(`Reminder: ${reminderText}`);showNotification('Zorbix Reminder',reminderText);},ms);},timer:{id:Date.now().toString(),label:`🔔 ${reminderText}`,endsAt:Date.now()+ms,totalMs:ms,isReminder:true,reminderText}};}
    case 'set-alarm':{const ms=parseInt(cmd.payload.durationMs),label=cmd.payload.label;return{response:`Alarm set for ${label}.`,action:async()=>{await requestNotificationPermission();setTimeout(()=>{speak(`Alarm! It is ${label}.`);showNotification('⏰ Zorbix Alarm',`It's ${label}!`);},ms);},timer:{id:Date.now().toString(),label:`⏰ ${label}`,endsAt:Date.now()+ms,totalMs:ms,isReminder:true,reminderText:`Alarm: ${label}`}};}

    // ── Countdown ─────────────────────────────────────────────────────
    case 'countdown-days':{const{event,days,date}=cmd.payload;const d=parseInt(days);if(d===0)return{response:`${event} is today!`};return{response:`There ${d===1?'is':'are'} ${d} day${d!==1?'s':''} until ${event} — ${date}.`};}

    // ── Communication ─────────────────────────────────────────────────
    case 'call':{const{target}=cmd.payload;const isNum=/[\d\s+\-()]{5,}/.test(target);return{response:`Calling ${target}…`,action:()=>window.open(isNum?`tel:${target.replace(/\s/g,'')}`:'https://web.whatsapp.com/','_blank')};}
    case 'send-message':{const{contact,message}=cmd.payload;const encoded=encodeURIComponent(message||''),isNum=/^[\d\s+\-]{5,}$/.test(contact);return{response:message?`Sending "${message}" to ${contact}.`:`Opening WhatsApp to message ${contact}.`,action:()=>window.open(isNum?`https://wa.me/${contact.replace(/\s/g,'')}?text=${encoded}`:'https://web.whatsapp.com/','_blank')};}
    case 'compose-email':{const{to}=cmd.payload;return{response:`Opening email to ${to}.`,action:()=>window.open(`mailto:${to}`,'_blank')};}

    // ── Lookup ────────────────────────────────────────────────────────
    case 'translate':{const{text,lang}=cmd.payload;return{response:`Translating "${text}" to ${lang}.`,action:()=>window.open(`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`,'_blank')};}
    case 'open-dictionary':{const{word}=cmd.payload;return{response:`Looking up "${word}".`,action:()=>window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`,'_blank')};}
    case 'open-thesaurus':{const{word}=cmd.payload;return{response:`Finding synonyms for "${word}".`,action:()=>window.open(`https://www.merriam-webster.com/thesaurus/${encodeURIComponent(word)}`,'_blank')};}
    case 'open-stocks':{const{company}=cmd.payload;return{response:`Checking ${company} stock.`,action:()=>window.open(`https://finance.yahoo.com/quote/${encodeURIComponent(company.toUpperCase())}`,'_blank')};}
    case 'search-wikipedia':{const{query}=cmd.payload;return{response:`Searching Wikipedia for "${query}".`,action:()=>window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,'_blank')};}
    case 'search-imdb':{const{query}=cmd.payload;return{response:`Searching IMDB for "${query}".`,action:()=>window.open(`https://www.imdb.com/find?q=${encodeURIComponent(query)}`,'_blank')};}
    case 'search-github':{const{query}=cmd.payload;return{response:`Searching GitHub for "${query}".`,action:()=>window.open(`https://github.com/search?q=${encodeURIComponent(query)}`,'_blank')};}
    case 'open-news':    return{response:'Opening Google News.',action:()=>window.open('https://news.google.com','_blank')};
    case 'news-topic':{const{topic}=cmd.payload;return{response:`Showing ${topic} news.`,action:()=>window.open(`https://news.google.com/search?q=${encodeURIComponent(topic)}`,'_blank')};}
    case 'open-weather': return{response:'Opening the weather forecast.',action:()=>window.open('https://weather.com','_blank')};
    case 'open-maps':    return{response:'Opening Google Maps.',action:()=>window.open('https://maps.google.com','_blank')};
    case 'directions':{const{place}=cmd.payload;return{response:`Getting directions to ${place}.`,action:()=>window.open(`https://www.google.com/maps/dir//${encodeURIComponent(place)}`,'_blank')};}
    case 'play-music':{const{query}=cmd.payload;return{response:`Playing "${query}" on Spotify.`,action:()=>window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`,'_blank')};}
    case 'open-app':{const{app,url}=cmd.payload;return{response:`Opening ${app.charAt(0).toUpperCase()+app.slice(1)}.`,action:()=>window.open(url,'_blank')};}
    case 'navigate-app':{const{route,label}=cmd.payload;return{response:`Going to ${label}.`,action:()=>navigate(route)};}
    case 'search-web':{const{query}=cmd.payload;return{response:`Searching for "${query}".`,action:()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`,'_blank')};}
    case 'search-youtube':{const{query}=cmd.payload;return{response:`Searching YouTube for "${query}".`,action:()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'_blank')};}

    case 'ai-question': return{response:'Let me check that for you.',action:()=>onAiQuestion(cmd.payload.question)};
  }
}
