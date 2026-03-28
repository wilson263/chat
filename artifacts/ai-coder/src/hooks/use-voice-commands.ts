export type CommandType =
  | 'open-app' | 'call' | 'send-message' | 'set-timer' | 'set-reminder'
  | 'search-web' | 'search-youtube' | 'search-wikipedia' | 'open-news'
  | 'open-weather' | 'open-maps' | 'directions' | 'play-music' | 'translate'
  | 'open-stocks' | 'open-dictionary' | 'navigate-app'
  | 'get-time' | 'get-date' | 'math' | 'unit-convert' | 'dark-mode'
  | 'light-mode' | 'stop-speaking' | 'speak-faster' | 'speak-slower'
  | 'speak-normal' | 'coin-flip' | 'dice-roll' | 'random-number'
  | 'battery' | 'new-chat' | 'copy-last' | 'read-last' | 'ai-question';

export interface ParsedCommand { type: CommandType; payload: Record<string, string>; raw: string; }
export interface ActiveTimer { id: string; label: string; endsAt: number; totalMs: number; isReminder?: boolean; reminderText?: string; }

const APP_MAP: Record<string, string> = {
  whatsapp:'https://web.whatsapp.com', youtube:'https://youtube.com', google:'https://google.com',
  gmail:'https://mail.google.com', maps:'https://maps.google.com','google maps':'https://maps.google.com',
  instagram:'https://instagram.com', twitter:'https://x.com', x:'https://x.com',
  facebook:'https://facebook.com', netflix:'https://netflix.com', spotify:'https://open.spotify.com',
  github:'https://github.com', linkedin:'https://linkedin.com', reddit:'https://reddit.com',
  amazon:'https://amazon.com', zoom:'https://zoom.us', telegram:'https://web.telegram.org',
  discord:'https://discord.com/channels/@me', pinterest:'https://pinterest.com', tiktok:'https://tiktok.com',
  twitch:'https://twitch.tv', drive:'https://drive.google.com','google drive':'https://drive.google.com',
  docs:'https://docs.google.com', sheets:'https://sheets.google.com', meet:'https://meet.google.com',
  'google meet':'https://meet.google.com', calendar:'https://calendar.google.com',
  'google calendar':'https://calendar.google.com', paypal:'https://paypal.com', ebay:'https://ebay.com',
  espn:'https://espn.com', news:'https://news.google.com','google news':'https://news.google.com',
  weather:'https://weather.com', translate:'https://translate.google.com',
  'google translate':'https://translate.google.com', wikipedia:'https://wikipedia.org',
  yahoo:'https://yahoo.com', finance:'https://finance.yahoo.com','yahoo finance':'https://finance.yahoo.com',
};

const APP_ROUTE_MAP: Record<string, string> = {
  chat:'/?newChat=true', home:'/', settings:'/settings', playground:'/playground',
  dashboard:'/projects', projects:'/projects','code runner':'/code-runner',
  explore:'/explore', templates:'/templates', usage:'/usage',
  'prompt generator':'/prompt-generator', analytics:'/analytics',
  about:'/about', contact:'/contact',
};

function n(text: string) { return text.toLowerCase().replace(/['']/g,"'").trim(); }

function parseTime(text: string): number | null {
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

function safeMath(expr: string): number | null {
  const s = expr.replace(/times|multiplied by|x/gi,'*').replace(/divided by|over/gi,'/').replace(/plus/gi,'+').replace(/minus/gi,'-').replace(/percent of/gi,'/100*').replace(/to the power of|power/gi,'**').replace(/squared/gi,'**2').replace(/cubed/gi,'**3').replace(/[^0-9+\-*/().\s**]/g,'');
  try { const r = Function(`"use strict";return(${s})`)(); return typeof r==='number'&&isFinite(r)?r:null; } catch { return null; }
}

function convertUnit(value: number, from: string, to: string): string | null {
  const f=from.toLowerCase(), t=to.toLowerCase();
  const C: Record<string,Record<string,(v:number)=>number>> = {
    km:{miles:v=>v*.621371,meters:v=>v*1000,feet:v=>v*3280.84},
    miles:{km:v=>v*1.60934,meters:v=>v*1609.34,feet:v=>v*5280},
    meters:{feet:v=>v*3.28084,km:v=>v/1000,miles:v=>v/1609.34,inches:v=>v*39.3701},
    feet:{meters:v=>v/3.28084,inches:v=>v*12,miles:v=>v/5280,km:v=>v/3280.84},
    inches:{cm:v=>v*2.54,feet:v=>v/12,meters:v=>v/39.3701},
    cm:{inches:v=>v/2.54,meters:v=>v/100,feet:v=>v/30.48},
    kg:{pounds:v=>v*2.20462,lbs:v=>v*2.20462,grams:v=>v*1000,oz:v=>v*35.274,ounces:v=>v*35.274},
    pounds:{kg:v=>v/2.20462,lbs:v=>v,grams:v=>v*453.592,oz:v=>v*16},
    lbs:{kg:v=>v/2.20462,pounds:v=>v,grams:v=>v*453.592},
    grams:{kg:v=>v/1000,pounds:v=>v/453.592,oz:v=>v/28.3495,ounces:v=>v/28.3495},
    celsius:{fahrenheit:v=>v*9/5+32,kelvin:v=>v+273.15},
    fahrenheit:{celsius:v=>(v-32)*5/9,kelvin:v=>(v-32)*5/9+273.15},
    kelvin:{celsius:v=>v-273.15,fahrenheit:v=>(v-273.15)*9/5+32},
    liters:{gallons:v=>v*.264172,'fl oz':v=>v*33.814,ml:v=>v*1000,cups:v=>v*4.22675},
    gallons:{liters:v=>v/.264172,'fl oz':v=>v*128,cups:v=>v*16},
    ml:{liters:v=>v/1000,'fl oz':v=>v/29.5735,cups:v=>v/236.588},
    mph:{'km/h':v=>v*1.60934,kph:v=>v*1.60934},
    'km/h':{mph:v=>v/1.60934},'kph':{mph:v=>v/1.60934},
    hectares:{acres:v=>v*2.47105,'sq km':v=>v/100},
    acres:{hectares:v=>v/2.47105},
  };
  const fn=C[f]?.[t]; if(!fn) return null;
  const result=fn(value), rounded=Math.round(result*10000)/10000;
  return `${value} ${from} = ${rounded} ${to}`;
}

export function parseCommand(raw: string): ParsedCommand {
  const t = n(raw);

  if(/^(stop|quiet|silence|shut up|cancel|enough|pause|stop (talking|speaking))$/i.test(t)) return{type:'stop-speaking',payload:{},raw};
  if(/read (that|it|last|again)|repeat (that|last)|say that again/i.test(t)) return{type:'read-last',payload:{},raw};
  if(/copy (that|last|response|it)/i.test(t)) return{type:'copy-last',payload:{},raw};
  if(/new (chat|conversation)|start (a new|new) (chat|conversation)|clear (the )?chat|reset chat/i.test(t)) return{type:'new-chat',payload:{},raw};
  if(/what(?:'s| is) the time|current time|what time is it/i.test(t)) return{type:'get-time',payload:{},raw};
  if(/what(?:'s| is) the date|today(?:'s)? date|what(?:'s| is) today/i.test(t)) return{type:'get-date',payload:{},raw};
  if(/battery (level|status|percentage|life)|how much battery|check battery/i.test(t)) return{type:'battery',payload:{},raw};
  if(/dark mode|switch to dark|enable dark|turn (on|off) dark/i.test(t)) return{type:'dark-mode',payload:{},raw};
  if(/light mode|switch to light|enable light|turn (on|off) light/i.test(t)) return{type:'light-mode',payload:{},raw};
  if(/speak (faster|speed up|quicker)|talk faster/i.test(t)) return{type:'speak-faster',payload:{},raw};
  if(/speak (slower|slow down)|talk slower/i.test(t)) return{type:'speak-slower',payload:{},raw};
  if(/speak (normal|normally|default speed)|reset speed/i.test(t)) return{type:'speak-normal',payload:{},raw};
  if(/flip (a )?coin|heads or tails|coin flip/i.test(t)) return{type:'coin-flip',payload:{},raw};

  const diceMatch=t.match(/roll (?:(\d+) )?d(?:ice|ie)|roll (\d+) dice|roll a die/i);
  if(diceMatch){const count=diceMatch[1]||diceMatch[2]||'1',sides=t.match(/d(\d+)/i)?.[1]||'6';return{type:'dice-roll',payload:{count,sides},raw};}

  const randomMatch=t.match(/random number (?:between|from) (\d+) (?:and|to) (\d+)/i)||t.match(/(?:give me a |pick a )?random number/i);
  if(randomMatch){const min=randomMatch[1]||'1',max=randomMatch[2]||'100';return{type:'random-number',payload:{min,max},raw};}

  const mathMatch=t.match(/(?:what(?:'s| is)\s+)?(?:calculate|compute|eval(?:uate)?)?\s*([\d\s+\-*/().%]+(?:times|divided by|plus|minus|percent of|to the power|squared|cubed|over|x)[\d\s+\-*/().%]+)/i)||t.match(/(?:calculate|what(?:'s| is))\s+([\d][^?]*)/i);
  if(mathMatch){const result=safeMath(mathMatch[1]);if(result!==null)return{type:'math',payload:{expr:mathMatch[1],result:String(result)},raw};}

  const unitMatch=t.match(/convert\s+([\d.]+)\s+(\w[\w\s/]*?)\s+(?:to|into)\s+([\w\s/]+)/i)||t.match(/([\d.]+)\s+(\w+)\s+(?:to|in|into)\s+([\w\s]+)/i);
  if(unitMatch){const val=parseFloat(unitMatch[1]),from=unitMatch[2].trim().toLowerCase(),to=unitMatch[3].trim().toLowerCase().replace(/\?$/,'');const converted=convertUnit(val,from,to);if(converted)return{type:'unit-convert',payload:{result:converted,from,to,value:String(val)},raw};}

  const timerMatch=t.match(/(?:set\s+(?:a\s+)?)?timer\s+(?:for\s+)?(.+)/i)||t.match(/alarm\s+(?:for|in)\s+(.+)/i);
  if(timerMatch){const ms=parseTime(timerMatch[1]);if(ms)return{type:'set-timer',payload:{durationMs:String(ms),label:timerMatch[1]},raw};}

  const reminderMatch=t.match(/remind me\s+(?:in\s+)?(.+?)\s+(?:to|about|that)\s+(.+)/i)||t.match(/remind me\s+(?:in\s+)(.+)/i);
  if(reminderMatch){const ms=parseTime(reminderMatch[1]),reminderText=reminderMatch[2]||'your reminder';if(ms)return{type:'set-reminder',payload:{durationMs:String(ms),reminderText,label:reminderMatch[1]},raw};}

  const callMatch=t.match(/(?:call|phone|dial|ring)\s+(.+)/i);
  if(callMatch)return{type:'call',payload:{target:callMatch[1].trim()},raw};

  const msgMatch=t.match(/(?:send|text|message|whatsapp)\s+(.+?)\s+(?:saying|say|message|that)\s+"?(.+)"?/i)||t.match(/(?:send|text|whatsapp)\s+(.+?)\s+"(.+)"/i);
  if(msgMatch)return{type:'send-message',payload:{contact:msgMatch[1].trim(),message:msgMatch[2].trim()},raw};
  const simpleMsgMatch=t.match(/(?:message|whatsapp|text)\s+(.+)/i);
  if(simpleMsgMatch)return{type:'send-message',payload:{contact:simpleMsgMatch[1].trim(),message:''},raw};

  const translateMatch=t.match(/translate\s+(.+?)\s+(?:to|into)\s+(\w+)/i)||t.match(/how do you say\s+(.+?)\s+in\s+(\w+)/i);
  if(translateMatch)return{type:'translate',payload:{text:translateMatch[1].trim(),lang:translateMatch[2].trim()},raw};

  const dictMatch=t.match(/(?:define|what(?:'s| does| is the meaning of)?)\s+(?:the word\s+)?["']?(\w+)["']?(?:\s+mean)?/i);
  if(dictMatch&&!/what is the time|what is today/.test(t))return{type:'open-dictionary',payload:{word:dictMatch[1].trim()},raw};

  const stockMatch=t.match(/(?:check\s+)?(?:the\s+)?(.+?)\s+stock(?:\s+price)?|stock(?:\s+price)?\s+of\s+(.+)/i);
  if(stockMatch)return{type:'open-stocks',payload:{company:(stockMatch[1]||stockMatch[2]).trim()},raw};

  const wikiMatch=t.match(/(?:search wikipedia|wikipedia|wiki)\s+(?:for\s+)?(.+)/i)||t.match(/(?:tell me about|what is|who is)\s+(.+?)\s+on wikipedia/i);
  if(wikiMatch)return{type:'search-wikipedia',payload:{query:wikiMatch[1].trim()},raw};

  if(/(?:show|open|get|latest|read)?\s*(?:me\s+)?(?:the\s+)?news|headlines|current events/i.test(t))return{type:'open-news',payload:{},raw};
  if(/(?:what(?:'s| is) the weather|weather today|how(?:'s| is) the weather|temperature today|will it rain)/i.test(t))return{type:'open-weather',payload:{},raw};

  const dirMatch=t.match(/(?:navigate|directions?|take me|drive)\s+to\s+(.+)/i)||t.match(/how (?:do i|to) get to\s+(.+)/i);
  if(dirMatch)return{type:'directions',payload:{place:dirMatch[1].trim()},raw};

  if(/open maps|open google maps/i.test(t))return{type:'open-maps',payload:{},raw};

  const navMatch=t.match(/(?:go to|open|navigate to|take me to|switch to)\s+(.+)/i);
  if(navMatch){const target=navMatch[1].trim().toLowerCase();if(APP_ROUTE_MAP[target])return{type:'navigate-app',payload:{route:APP_ROUTE_MAP[target],label:target},raw};const url=APP_MAP[target];if(url)return{type:'open-app',payload:{app:target,url},raw};}

  const ytSearch=t.match(/(?:search|find|play)\s+(.+?)\s+on\s+youtube/i)||t.match(/youtube\s+(.+)/i);
  if(ytSearch)return{type:'search-youtube',payload:{query:ytSearch[1].trim()},raw};

  const spotifyMatch=t.match(/(?:play|listen to)\s+(.+?)\s+on\s+spotify/i)||t.match(/play\s+(.+)/i);
  if(spotifyMatch)return{type:'play-music',payload:{query:spotifyMatch[1].trim()},raw};

  const openMatch=t.match(/(?:open|launch|start)\s+(.+)/i);
  if(openMatch){const appName=openMatch[1].trim().toLowerCase();const url=APP_MAP[appName];if(url)return{type:'open-app',payload:{app:appName,url},raw};if(APP_ROUTE_MAP[appName])return{type:'navigate-app',payload:{route:APP_ROUTE_MAP[appName],label:appName},raw};}

  const searchMatch=t.match(/(?:search|google|look up|find)\s+(.+)/i);
  if(searchMatch)return{type:'search-web',payload:{query:searchMatch[1].trim()},raw};

  return{type:'ai-question',payload:{question:raw.trim()},raw};
}

const TTS_SPEED_KEY='zorbix_tts_speed';
export function getTtsSpeed():number{return parseFloat(localStorage.getItem(TTS_SPEED_KEY)||'1.05');}
function setTtsSpeed(rate:number){localStorage.setItem(TTS_SPEED_KEY,String(rate));}

export function speak(text:string,onEnd?:()=>void):void{
  if(!('speechSynthesis' in window)){onEnd?.();return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.rate=getTtsSpeed();u.pitch=1;u.volume=1;
  const voices=window.speechSynthesis.getVoices();
  const pref=voices.find(v=>v.name.includes('Google')||v.name.includes('Samantha')||v.name.includes('Microsoft'))||voices[0];
  if(pref)u.voice=pref;
  u.onend=()=>onEnd?.();u.onerror=()=>onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking():void{if('speechSynthesis' in window)window.speechSynthesis.cancel();}

function requestNotificationPermission():Promise<boolean>{
  if(!('Notification' in window))return Promise.resolve(false);
  if(Notification.permission==='granted')return Promise.resolve(true);
  return Notification.requestPermission().then(p=>p==='granted');
}
function showNotification(title:string,body:string){
  if(Notification.permission==='granted')new Notification(title,{body,icon:'/favicon.ico'});
}

export interface CommandResult{response:string;action?:()=>void;timer?:ActiveTimer;}

export function executeCommand(
  cmd:ParsedCommand,navigate:(path:string)=>void,onAiQuestion:(q:string)=>void,
  getLastResponse?:()=>string,onSpeedChange?:(speed:number)=>void,
):CommandResult{
  switch(cmd.type){
    case 'stop-speaking': return{response:'',action:()=>stopSpeaking()};
    case 'read-last':{const last=getLastResponse?.()||'';if(!last)return{response:"There's no previous response to read."};return{response:last};}
    case 'copy-last':{const last=getLastResponse?.()||'';if(!last)return{response:"Nothing to copy yet."};return{response:'Copied to clipboard.',action:()=>navigator.clipboard?.writeText(last).catch(()=>{})};}
    case 'new-chat': return{response:'Starting a new chat.',action:()=>navigate('/?newChat=true')};
    case 'get-time':{const t=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});return{response:`It's ${t}.`};}
    case 'get-date':{const d=new Date().toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});return{response:`Today is ${d}.`};}
    case 'battery':{
      if(!(navigator as any).getBattery)return{response:"Battery information isn't available in this browser."};
      return{response:'Checking battery…',action:async()=>{const b=await(navigator as any).getBattery();const pct=Math.round(b.level*100);speak(`Your battery is at ${pct} percent${b.charging?', and it is charging':''}.`);}};
    }
    case 'dark-mode': return{response:'Switching to dark mode.',action:()=>{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark');window.dispatchEvent(new CustomEvent('zorbix-theme-change',{detail:'dark'}));}};
    case 'light-mode': return{response:'Switching to light mode.',action:()=>{document.documentElement.classList.remove('dark');localStorage.setItem('theme','light');window.dispatchEvent(new CustomEvent('zorbix-theme-change',{detail:'light'}));}};
    case 'speak-faster':{const s=Math.min(2.0,getTtsSpeed()+0.2);setTtsSpeed(s);onSpeedChange?.(s);return{response:'Speaking faster now.'};}
    case 'speak-slower':{const s=Math.max(0.5,getTtsSpeed()-0.2);setTtsSpeed(s);onSpeedChange?.(s);return{response:'Speaking slower now.'};}
    case 'speak-normal': setTtsSpeed(1.05);onSpeedChange?.(1.05);return{response:'Back to normal speed.'};
    case 'math':{const result=parseFloat(cmd.payload.result);const nice=Number.isInteger(result)?String(result):result.toFixed(4).replace(/\.?0+$/,'');return{response:`The answer is ${nice}.`};}
    case 'unit-convert': return{response:cmd.payload.result};
    case 'coin-flip': return{response:Math.random()<.5?'Heads!':'Tails!'};
    case 'dice-roll':{const count=parseInt(cmd.payload.count)||1,sides=parseInt(cmd.payload.sides)||6;const rolls=Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);const total=rolls.reduce((a,b)=>a+b,0);return{response:count>1?`You rolled ${rolls.join(', ')}. Total: ${total}.`:`You rolled a ${rolls[0]}.`};}
    case 'random-number':{const min=parseInt(cmd.payload.min)||1,max=parseInt(cmd.payload.max)||100;return{response:`Your random number is ${Math.floor(Math.random()*(max-min+1))+min}.`};}
    case 'set-timer':{
      const ms=parseInt(cmd.payload.durationMs),label=cmd.payload.label;
      const mins=Math.floor(ms/60000),secs=Math.floor((ms%60000)/1000);
      const readable=mins>0?`${mins} minute${mins!==1?'s':''}${secs>0?` and ${secs} second${secs!==1?'s':''}`:''}`:` ${secs} second${secs!==1?'s':''}`;
      return{response:`Timer set for${readable}.`,timer:{id:Date.now().toString(),label:`⏱ ${label}`,endsAt:Date.now()+ms,totalMs:ms}};
    }
    case 'set-reminder':{
      const ms=parseInt(cmd.payload.durationMs),reminderText=cmd.payload.reminderText,label=cmd.payload.label;
      const mins=Math.floor(ms/60000);const readable=mins>0?`${mins} minute${mins!==1?'s':''}`:` ${Math.floor(ms/1000)} seconds`;
      return{response:`I'll remind you to ${reminderText} in${readable}.`,action:async()=>{await requestNotificationPermission();setTimeout(()=>{speak(`Reminder: ${reminderText}`);showNotification('Zorbix Reminder',reminderText);},ms);},timer:{id:Date.now().toString(),label:`🔔 ${reminderText}`,endsAt:Date.now()+ms,totalMs:ms,isReminder:true,reminderText}};
    }
    case 'call':{const target=cmd.payload.target,isNum=/[\d\s+\-()]{5,}/.test(target);return{response:`Calling ${target}…`,action:()=>window.open(isNum?`tel:${target.replace(/\s/g,'')}`:'https://web.whatsapp.com/','_blank')};}
    case 'send-message':{const{contact,message}=cmd.payload,encoded=encodeURIComponent(message||''),isNum=/^[\d\s+\-]{5,}$/.test(contact);return{response:message?`Sending "${message}" to ${contact}.`:`Opening WhatsApp to message ${contact}.`,action:()=>window.open(isNum?`https://wa.me/${contact.replace(/\s/g,'')}?text=${encoded}`:'https://web.whatsapp.com/','_blank')};}
    case 'translate':{const{text,lang}=cmd.payload;return{response:`Opening Google Translate for "${text}" in ${lang}.`,action:()=>window.open(`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`,'_blank')};}
    case 'open-dictionary':{const word=cmd.payload.word;return{response:`Looking up "${word}".`,action:()=>window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`,'_blank')};}
    case 'open-stocks':{const company=cmd.payload.company;return{response:`Checking ${company} stock price.`,action:()=>window.open(`https://finance.yahoo.com/quote/${encodeURIComponent(company.toUpperCase())}`,'_blank')};}
    case 'search-wikipedia':{const query=cmd.payload.query;return{response:`Searching Wikipedia for "${query}".`,action:()=>window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,'_blank')};}
    case 'open-news': return{response:'Opening Google News.',action:()=>window.open('https://news.google.com','_blank')};
    case 'open-weather': return{response:'Opening the weather forecast.',action:()=>window.open('https://weather.com','_blank')};
    case 'open-maps': return{response:'Opening Google Maps.',action:()=>window.open('https://maps.google.com','_blank')};
    case 'directions':{const place=cmd.payload.place;return{response:`Getting directions to ${place}.`,action:()=>window.open(`https://www.google.com/maps/dir//${encodeURIComponent(place)}`,'_blank')};}
    case 'open-app':{const{app,url}=cmd.payload;return{response:`Opening ${app.charAt(0).toUpperCase()+app.slice(1)}.`,action:()=>window.open(url,'_blank')};}
    case 'navigate-app':{const{route,label}=cmd.payload;return{response:`Going to ${label}.`,action:()=>navigate(route)};}
    case 'search-web':{const q=cmd.payload.query;return{response:`Searching Google for "${q}".`,action:()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`,'_blank')};}
    case 'search-youtube':{const q=cmd.payload.query;return{response:`Searching YouTube for "${q}".`,action:()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,'_blank')};}
    case 'play-music':{const q=cmd.payload.query;return{response:`Playing "${q}" on Spotify.`,action:()=>window.open(`https://open.spotify.com/search/${encodeURIComponent(q)}`,'_blank')};}
    case 'ai-question': return{response:'Let me check that for you.',action:()=>onAiQuestion(cmd.payload.question)};
  }
}
