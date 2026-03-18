import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Search, Code2, Globe, Cpu, Gamepad2, Terminal,
  LayoutDashboard, Zap, Database, MessageSquare, Edit3,
  BarChart3, Music, Camera, Cloud, Star,
  FolderOpen, Check, Sparkles, Play, Loader2, LayoutTemplate, Wand2, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCreateProject, useCreateFile } from '@workspace/api-client-react';
import { useWorkspaceStore } from '@/store/workspace';

const CATEGORIES = ['All', 'Web', 'React', 'Games', 'APIs', 'Tools', 'Data', 'Full-Stack'];

const AI_SUGGESTIONS = [
  'A personal finance tracker with charts',
  'A Pomodoro timer with tasks list',
  'A recipe finder web app',
  'A real-time chat interface',
  'A kanban board with drag & drop',
  'A markdown blog with syntax highlighting',
];

const TEMPLATES = [
  {
    id: 'hello-world', name: 'Hello World', category: 'Web', difficulty: 'Beginner', stars: 1240,
    icon: Globe, color: 'bg-blue-500/10 text-blue-400',
    desc: 'Classic starting point with a beautiful gradient landing page.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Hello World</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="container">\n    <h1>Hello, World! 👋</h1>\n    <p>Welcome to your first web page.</p>\n    <button onclick="greet()">Click Me!</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }\n.container { text-align: center; color: white; }\nh1 { font-size: 3rem; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0,0,0,.3); }\np { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.85; }\nbutton { padding: 12px 32px; background: white; color: #764ba2; border: none; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform .2s, box-shadow .2s; }\nbutton:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.2); }` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `function greet() {\n  const messages = ['Hello! 👋', 'How are you? 😊', 'Keep coding! 💻', 'You got this! 🚀'];\n  const msg = messages[Math.floor(Math.random() * messages.length)];\n  document.querySelector('h1').textContent = msg;\n}` },
    ],
  },
  {
    id: 'todo-app', name: 'Todo App', category: 'Web', difficulty: 'Beginner', stars: 3420,
    icon: Check, color: 'bg-green-500/10 text-green-400',
    desc: 'Feature-rich todo app with local storage, filtering, and smooth animations.',
    tags: ['HTML', 'CSS', 'JavaScript', 'LocalStorage'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Todo App</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="app">\n    <h1>✅ My Todos</h1>\n    <div class="input-row">\n      <input type="text" id="todoInput" placeholder="Add a new task..." />\n      <button onclick="addTodo()">Add</button>\n    </div>\n    <div class="filters">\n      <button class="filter active" onclick="filter('all')">All</button>\n      <button class="filter" onclick="filter('active')">Active</button>\n      <button class="filter" onclick="filter('done')">Done</button>\n    </div>\n    <ul id="todoList"></ul>\n    <p id="count" class="count"></p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n.app { width: 100%; max-width: 480px; padding: 2rem; background: #1e1e2e; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }\nh1 { font-size: 1.8rem; margin-bottom: 1.5rem; color: #a78bfa; }\n.input-row { display: flex; gap: 8px; margin-bottom: 1rem; }\ninput { flex: 1; padding: 10px 14px; background: #2d2d44; border: 1px solid #3d3d5c; border-radius: 8px; color: #e2e8f0; font-size: 0.95rem; outline: none; }\ninput:focus { border-color: #a78bfa; }\nbutton { padding: 10px 20px; background: #a78bfa; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: opacity .2s; }\nbutton:hover { opacity: 0.85; }\n.filters { display: flex; gap: 6px; margin-bottom: 1rem; }\n.filter { background: #2d2d44; color: #94a3b8; font-size: 0.8rem; padding: 6px 14px; }\n.filter.active { background: #a78bfa20; color: #a78bfa; border: 1px solid #a78bfa50; }\nul { list-style: none; space-y: 8px; }\nli { display: flex; align-items: center; gap: 10px; padding: 12px; background: #2d2d44; border-radius: 8px; margin-bottom: 6px; transition: opacity .2s; }\nli.done { opacity: 0.5; text-decoration: line-through; }\nli span { flex: 1; cursor: pointer; }\n.del { background: #ef444420; color: #ef4444; padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }\n.count { font-size: 0.8rem; color: #64748b; margin-top: 1rem; text-align: center; }` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `let todos = JSON.parse(localStorage.getItem('todos') || '[]');\nlet currentFilter = 'all';\nfunction save() { localStorage.setItem('todos', JSON.stringify(todos)); }\nfunction addTodo() {\n  const input = document.getElementById('todoInput');\n  if (!input.value.trim()) return;\n  todos.push({ id: Date.now(), text: input.value.trim(), done: false });\n  input.value = ''; save(); render();\n}\nfunction toggleTodo(id) { todos = todos.map(t => t.id === id ? {...t, done: !t.done} : t); save(); render(); }\nfunction deleteTodo(id) { todos = todos.filter(t => t.id !== id); save(); render(); }\nfunction filter(f) { currentFilter = f; document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === f)); render(); }\nfunction render() {\n  const list = document.getElementById('todoList');\n  const filtered = todos.filter(t => currentFilter === 'all' ? true : currentFilter === 'done' ? t.done : !t.done);\n  list.innerHTML = filtered.map(t => '<li class="' + (t.done ? 'done' : '') + '"><span onclick="toggleTodo(' + t.id + ')">' + (t.done ? '✓ ' : '○ ') + t.text + '</span><button class="del" onclick="deleteTodo(' + t.id + ')">×</button></li>').join('');\n  const active = todos.filter(t => !t.done).length;\n  document.getElementById('count').textContent = active + ' task' + (active !== 1 ? 's' : '') + ' remaining';\n}\nrender();\ndocument.getElementById('todoInput').addEventListener('keydown', e => e.key === 'Enter' && addTodo());` },
    ],
  },
  {
    id: 'snake-game', name: 'Snake Game', category: 'Games', difficulty: 'Intermediate', stars: 2810,
    icon: Gamepad2, color: 'bg-emerald-500/10 text-emerald-400',
    desc: 'Classic snake game with canvas rendering, score tracking, and increasing speed.',
    tags: ['Canvas', 'JavaScript', 'Game'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Snake Game</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="game-container">\n    <h1>🐍 Snake</h1>\n    <div class="score-row"><span>Score: <b id="score">0</b></span><span>Best: <b id="best">0</b></span></div>\n    <canvas id="canvas" width="400" height="400"></canvas>\n    <p id="msg" class="msg">Press Space to start</p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `body { background: #0f0f1a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }\n.game-container { text-align: center; }\nh1 { font-size: 2rem; margin-bottom: 0.5rem; color: #4ade80; }\n.score-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #94a3b8; width: 400px; }\nb { color: #4ade80; }\ncanvas { border: 2px solid #1e3a2e; border-radius: 8px; display: block; }\n.msg { margin-top: 1rem; color: #64748b; font-size: 0.85rem; }` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `const canvas = document.getElementById('canvas');\nconst ctx = canvas.getContext('2d');\nconst CELL = 20, COLS = 20, ROWS = 20;\nlet snake, dir, food, score, best = 0, running = false, loop;\nfunction init() {\n  snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir = {x:1,y:0};\n  food = randomFood(); score = 0; updateScore();\n}\nfunction randomFood() {\n  let f;\n  do { f = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)}; }\n  while (snake.some(s => s.x===f.x && s.y===f.y));\n  return f;\n}\nfunction updateScore() { document.getElementById('score').textContent = score; }\nfunction gameLoop() {\n  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};\n  if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.some(s=>s.x===head.x&&s.y===head.y)) { gameOver(); return; }\n  snake.unshift(head);\n  if (head.x===food.x&&head.y===food.y) { score++; updateScore(); if(score>best){best=score;document.getElementById('best').textContent=best;} food=randomFood(); }\n  else snake.pop();\n  draw();\n}\nfunction draw() {\n  ctx.fillStyle='#0f0f1a'; ctx.fillRect(0,0,canvas.width,canvas.height);\n  ctx.fillStyle='#f43f5e'; ctx.fillRect(food.x*CELL+1,food.y*CELL+1,CELL-2,CELL-2);\n  snake.forEach((s,i) => { ctx.fillStyle = i===0?'#4ade80':'#22c55e'; ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2); });\n}\nfunction gameOver() {\n  clearInterval(loop); running=false;\n  ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);\n  ctx.fillStyle='white'; ctx.font='28px sans-serif'; ctx.textAlign='center';\n  ctx.fillText('Game Over!', canvas.width/2, canvas.height/2-20);\n  ctx.font='16px sans-serif'; ctx.fillStyle='#94a3b8';\n  ctx.fillText('Score: '+score, canvas.width/2, canvas.height/2+15);\n  document.getElementById('msg').textContent='Press Space to restart';\n}\ndocument.addEventListener('keydown', e => {\n  if(e.code==='Space') { if(!running){init();running=true;loop=setInterval(gameLoop,150);document.getElementById('msg').textContent='';} }\n  if(e.key==='ArrowUp'&&dir.y===0) dir={x:0,y:-1};\n  if(e.key==='ArrowDown'&&dir.y===0) dir={x:0,y:1};\n  if(e.key==='ArrowLeft'&&dir.x===0) dir={x:-1,y:0};\n  if(e.key==='ArrowRight'&&dir.x===0) dir={x:1,y:0};\n});\ninit(); draw();` },
    ],
  },
  {
    id: 'calculator', name: 'Calculator', category: 'Tools', difficulty: 'Beginner', stars: 1890,
    icon: Cpu, color: 'bg-violet-500/10 text-violet-400',
    desc: 'Modern calculator with glassmorphism UI, keyboard support, and history.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Calculator</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="calc">\n    <div class="display">\n      <div id="expr" class="expr"></div>\n      <div id="result" class="result">0</div>\n    </div>\n    <div class="buttons">\n      <button class="btn span2 func" onclick="clearAll()">AC</button>\n      <button class="btn func" onclick="backspace()">⌫</button>\n      <button class="btn op" onclick="append('/')">÷</button>\n      <button class="btn" onclick="append('7')">7</button><button class="btn" onclick="append('8')">8</button><button class="btn" onclick="append('9')">9</button>\n      <button class="btn op" onclick="append('*')">×</button>\n      <button class="btn" onclick="append('4')">4</button><button class="btn" onclick="append('5')">5</button><button class="btn" onclick="append('6')">6</button>\n      <button class="btn op" onclick="append('-')">−</button>\n      <button class="btn" onclick="append('1')">1</button><button class="btn" onclick="append('2')">2</button><button class="btn" onclick="append('3')">3</button>\n      <button class="btn op" onclick="append('+')">+</button>\n      <button class="btn span2" onclick="append('0')">0</button>\n      <button class="btn" onclick="append('.')">.</button>\n      <button class="btn eq" onclick="calculate()">=</button>\n    </div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `* { margin:0; padding:0; box-sizing:border-box; }\nbody { min-height:100vh; background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460); display:flex; align-items:center; justify-content:center; font-family:sans-serif; }\n.calc { background:rgba(255,255,255,.08); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.15); border-radius:24px; padding:24px; width:280px; box-shadow:0 25px 50px rgba(0,0,0,.5); }\n.display { background:rgba(0,0,0,.3); border-radius:12px; padding:16px; margin-bottom:16px; text-align:right; }\n.expr { font-size:0.85rem; color:rgba(255,255,255,.4); min-height:20px; margin-bottom:4px; }\n.result { font-size:2.5rem; color:white; font-weight:300; overflow:hidden; text-overflow:ellipsis; }\n.buttons { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }\n.btn { background:rgba(255,255,255,.1); border:none; border-radius:12px; color:white; font-size:1.1rem; padding:16px; cursor:pointer; transition:background .15s,transform .1s; }\n.btn:hover { background:rgba(255,255,255,.18); }\n.btn:active { transform:scale(.95); }\n.span2 { grid-column:span 2; }\n.op { background:rgba(167,139,250,.2); color:#a78bfa; }\n.func { background:rgba(100,116,139,.2); color:#94a3b8; }\n.eq { background:#a78bfa; }` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `let expr = '';\nfunction append(v) { expr += v; document.getElementById('expr').textContent = expr; try { document.getElementById('result').textContent = eval(expr.replace(/×/g,'*').replace(/÷/g,'/')); } catch {} }\nfunction clearAll() { expr=''; document.getElementById('expr').textContent=''; document.getElementById('result').textContent='0'; }\nfunction backspace() { expr=expr.slice(0,-1); document.getElementById('expr').textContent=expr; }\nfunction calculate() { try { const r=eval(expr.replace(/×/g,'*').replace(/÷/g,'/')); document.getElementById('expr').textContent=expr+'='; document.getElementById('result').textContent=r; expr=String(r); } catch { document.getElementById('result').textContent='Error'; expr=''; } }\ndocument.addEventListener('keydown',e=>{ if('0123456789.+-*/'.includes(e.key))append(e.key); if(e.key==='Enter')calculate(); if(e.key==='Backspace')backspace(); if(e.key==='Escape')clearAll(); });` },
    ],
  },
  {
    id: 'weather-dashboard', name: 'Weather Dashboard', category: 'Data', difficulty: 'Intermediate', stars: 2140,
    icon: Cloud, color: 'bg-sky-500/10 text-sky-400',
    desc: 'Animated weather dashboard with fake data, beautiful cards, and dark UI.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Animations'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Weather</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="app">\n    <header>\n      <h1>🌤 Weather</h1>\n      <select id="city" onchange="loadCity(this.value)">\n        <option value="london">London</option><option value="tokyo">Tokyo</option><option value="nyc">New York</option><option value="dubai">Dubai</option>\n      </select>\n    </header>\n    <div class="main-card">\n      <div class="temp-big" id="temp">--°</div>\n      <div class="condition" id="cond">--</div>\n      <div class="stats" id="stats"></div>\n    </div>\n    <div class="forecast" id="forecast"></div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `*{margin:0;padding:0;box-sizing:border-box} body{font-family:sans-serif;background:#0b1120;color:white;min-height:100vh;padding:20px} .app{max-width:480px;margin:0 auto} header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px} h1{font-size:1.5rem;color:#60a5fa} select{background:#1e2d40;color:white;border:1px solid #334155;padding:6px 12px;border-radius:8px;outline:none} .main-card{background:linear-gradient(135deg,#1e3a5f,#0f2942);border-radius:20px;padding:32px;text-align:center;margin-bottom:16px;box-shadow:0 10px 40px rgba(0,0,0,.4)} .temp-big{font-size:5rem;font-weight:200;line-height:1} .condition{font-size:1.2rem;color:#94a3b8;margin:8px 0 24px} .stats{display:flex;justify-content:space-around;background:rgba(0,0,0,.2);border-radius:12px;padding:12px} .stat{text-align:center} .stat-val{font-size:1.1rem;font-weight:600;color:#60a5fa} .stat-label{font-size:0.7rem;color:#64748b;margin-top:2px} .forecast{display:grid;grid-template-columns:repeat(5,1fr);gap:10px} .day{background:#1e2d40;border-radius:12px;padding:12px;text-align:center} .day-name{font-size:0.75rem;color:#64748b;margin-bottom:8px} .day-icon{font-size:1.5rem;margin-bottom:6px} .day-temp{font-size:0.9rem;font-weight:600}` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `const CITIES={london:{name:'London',temp:14,cond:'Partly Cloudy ⛅',humidity:72,wind:18,uv:3,forecast:[{d:'Mon',i:'🌧',t:12},{d:'Tue',i:'⛅',t:15},{d:'Wed',i:'☀️',t:18},{d:'Thu',i:'🌦',t:13},{d:'Fri',i:'⛅',t:16}]},tokyo:{name:'Tokyo',temp:22,cond:'Sunny ☀️',humidity:55,wind:10,uv:6,forecast:[{d:'Mon',i:'☀️',t:24},{d:'Tue',i:'☀️',t:23},{d:'Wed',i:'⛅',t:20},{d:'Thu',i:'🌦',t:18},{d:'Fri',i:'☀️',t:22}]},nyc:{name:'New York',temp:8,cond:'Snowing ❄️',humidity:80,wind:25,uv:1,forecast:[{d:'Mon',i:'❄️',t:5},{d:'Tue',i:'🌨',t:7},{d:'Wed',i:'⛅',t:10},{d:'Thu',i:'☀️',t:13},{d:'Fri',i:'⛅',t:11}]},dubai:{name:'Dubai',temp:35,cond:'Clear & Hot ☀️',humidity:30,wind:12,uv:10,forecast:[{d:'Mon',i:'☀️',t:37},{d:'Tue',i:'☀️',t:36},{d:'Wed',i:'☀️',t:34},{d:'Thu',i:'⛅',t:33},{d:'Fri',i:'☀️',t:35}]}};\nfunction loadCity(id){const c=CITIES[id];document.getElementById('temp').textContent=c.temp+'°C';document.getElementById('cond').textContent=c.cond;document.getElementById('stats').innerHTML='<div class="stat"><div class="stat-val">'+c.humidity+'%</div><div class="stat-label">Humidity</div></div><div class="stat"><div class="stat-val">'+c.wind+' km/h</div><div class="stat-label">Wind</div></div><div class="stat"><div class="stat-val">UV '+c.uv+'</div><div class="stat-label">UV Index</div></div>';document.getElementById('forecast').innerHTML=c.forecast.map(f=>'<div class="day"><div class="day-name">'+f.d+'</div><div class="day-icon">'+f.i+'</div><div class="day-temp">'+f.t+'°</div></div>').join('');}\nloadCity('london');` },
    ],
  },
  {
    id: 'rest-api', name: 'REST API', category: 'APIs', difficulty: 'Intermediate', stars: 3560,
    icon: Database, color: 'bg-orange-500/10 text-orange-400',
    desc: 'Node.js Express REST API with CRUD operations, validation, and in-memory storage.',
    tags: ['Node.js', 'Express', 'REST', 'API'],
    files: [
      { name: 'server.js', path: 'server.js', language: 'javascript', content: `const express = require('express');\nconst app = express();\napp.use(express.json());\n\nlet items = [\n  { id: 1, name: 'Item One', description: 'First item', price: 9.99 },\n  { id: 2, name: 'Item Two', description: 'Second item', price: 19.99 },\n];\nlet nextId = 3;\n\napp.get('/items', (req, res) => res.json({ data: items, count: items.length }));\n\napp.get('/items/:id', (req, res) => {\n  const item = items.find(i => i.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ error: 'Not found' });\n  res.json(item);\n});\n\napp.post('/items', (req, res) => {\n  const { name, description, price } = req.body;\n  if (!name) return res.status(400).json({ error: 'name is required' });\n  const item = { id: nextId++, name, description: description || '', price: Number(price) || 0 };\n  items.push(item);\n  res.status(201).json(item);\n});\n\napp.put('/items/:id', (req, res) => {\n  const idx = items.findIndex(i => i.id === Number(req.params.id));\n  if (idx === -1) return res.status(404).json({ error: 'Not found' });\n  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };\n  res.json(items[idx]);\n});\n\napp.delete('/items/:id', (req, res) => {\n  const idx = items.findIndex(i => i.id === Number(req.params.id));\n  if (idx === -1) return res.status(404).json({ error: 'Not found' });\n  items.splice(idx, 1);\n  res.json({ message: 'Deleted' });\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log('API running on port ' + PORT));` },
      { name: 'package.json', path: 'package.json', language: 'json', content: `{\n  "name": "rest-api",\n  "version": "1.0.0",\n  "main": "server.js",\n  "scripts": { "start": "node server.js", "dev": "nodemon server.js" },\n  "dependencies": { "express": "^4.18.2" },\n  "devDependencies": { "nodemon": "^3.0.1" }\n}` },
      { name: 'README.md', path: 'README.md', language: 'markdown', content: `# REST API\n\nA simple Express.js REST API with CRUD operations.\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\n## Endpoints\n\n- \`GET /items\` — list all items\n- \`GET /items/:id\` — get one item\n- \`POST /items\` — create item (body: {name, description, price})\n- \`PUT /items/:id\` — update item\n- \`DELETE /items/:id\` — delete item` },
    ],
  },
  {
    id: 'markdown-editor', name: 'Markdown Editor', category: 'Tools', difficulty: 'Intermediate', stars: 2280,
    icon: Edit3, color: 'bg-yellow-500/10 text-yellow-400',
    desc: 'Live markdown editor with real-time preview, syntax highlighting, and export.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Markdown'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Markdown Editor</title><link rel="stylesheet" href="styles.css"><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script></head>\n<body>\n  <div class="app">\n    <header>\n      <span class="logo">📝 Markdown Editor</span>\n      <button onclick="exportHtml()">Export HTML</button>\n    </header>\n    <div class="editor-area">\n      <div class="pane">\n        <div class="pane-title">Markdown</div>\n        <textarea id="editor" oninput="render()" placeholder="# Hello World\n\nWrite your **markdown** here..."></textarea>\n      </div>\n      <div class="pane">\n        <div class="pane-title">Preview</div>\n        <div id="preview" class="preview"></div>\n      </div>\n    </div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `*{margin:0;padding:0;box-sizing:border-box} html,body,.app{height:100%} body{font-family:sans-serif;background:#0f111a;color:#e2e8f0} header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #1e293b;background:#0f111a} .logo{font-size:1rem;font-weight:600} header button{padding:6px 16px;background:#6366f1;border:none;border-radius:8px;color:white;cursor:pointer;font-size:0.85rem} .editor-area{display:grid;grid-template-columns:1fr 1fr;height:calc(100vh - 49px)} .pane{display:flex;flex-direction:column;border-right:1px solid #1e293b} .pane-title{padding:8px 16px;font-size:0.75rem;font-weight:600;text-transform:uppercase;color:#64748b;border-bottom:1px solid #1e293b;background:#0b0d14} textarea{flex:1;background:#0f111a;border:none;color:#e2e8f0;font-family:monospace;font-size:0.9rem;padding:16px;resize:none;outline:none;line-height:1.7} .preview{flex:1;padding:20px;overflow-y:auto;line-height:1.7;font-size:0.95rem} .preview h1,.preview h2,.preview h3{color:#a5b4fc;margin:1rem 0 0.5rem} .preview p{margin-bottom:0.75rem} .preview code{background:#1e293b;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em} .preview pre{background:#1e293b;padding:16px;border-radius:8px;overflow-x:auto;margin-bottom:1rem} .preview blockquote{border-left:3px solid #6366f1;padding-left:16px;color:#94a3b8;margin-bottom:0.75rem}` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `const DEFAULT = '# Welcome to Markdown Editor\\n\\nWrite your content on the left, see the **live preview** on the right.\\n\\n## Features\\n\\n- Real-time preview\\n- GitHub Flavored Markdown\\n- Export to HTML\\n\\n> **Tip:** Use the Export button to save your document as HTML.';\ndocument.getElementById('editor').value = DEFAULT;\nfunction render() { document.getElementById('preview').innerHTML = marked.parse(document.getElementById('editor').value); }\nfunction exportHtml() {\n  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7}code{background:#f1f5f9;padding:2px 6px;border-radius:4px}pre{background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto}blockquote{border-left:3px solid #6366f1;padding-left:16px;color:#64748b}</style></head><body>' + document.getElementById('preview').innerHTML + '</body></html>';\n  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], {type:'text/html'})); a.download = 'document.html'; a.click();\n}\nrender();` },
    ],
  },
  {
    id: 'chat-ui', name: 'Chat UI', category: 'Web', difficulty: 'Intermediate', stars: 1970,
    icon: MessageSquare, color: 'bg-pink-500/10 text-pink-400',
    desc: 'Beautiful chat interface with bubbles, timestamps, typing indicator, and dark mode.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    files: [
      { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html>\n<head><title>Chat UI</title><link rel="stylesheet" href="styles.css"></head>\n<body>\n  <div class="chat-app">\n    <header class="chat-header">\n      <div class="avatar">AI</div>\n      <div><div class="name">ZorvixAI</div><div class="status">● Online</div></div>\n    </header>\n    <div class="messages" id="messages"></div>\n    <div id="typing" class="typing hidden"><span></span><span></span><span></span></div>\n    <div class="input-row">\n      <input id="msg" type="text" placeholder="Type a message..." onkeydown="e=>e.key==='Enter'&&send()" />\n      <button onclick="send()">Send</button>\n    </div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
      { name: 'styles.css', path: 'styles.css', language: 'css', content: `*{margin:0;padding:0;box-sizing:border-box} body{background:#0f0f1a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif} .chat-app{width:380px;height:600px;background:#1e1e2e;border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)} .chat-header{display:flex;align-items:center;gap:12px;padding:16px;background:#16162a;border-bottom:1px solid #2d2d44} .avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#6366f1);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:white} .name{font-size:0.9rem;font-weight:600} .status{font-size:0.7rem;color:#4ade80} .messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px} .bubble{max-width:75%;padding:10px 14px;border-radius:16px;font-size:0.875rem;line-height:1.5} .bubble.user{background:#6366f1;color:white;align-self:flex-end;border-bottom-right-radius:4px} .bubble.bot{background:#2d2d44;color:#e2e8f0;align-self:flex-start;border-bottom-left-radius:4px} .time{font-size:0.65rem;opacity:0.5;margin-top:4px;text-align:right} .typing{display:flex;gap:4px;padding:12px 14px;background:#2d2d44;border-radius:16px;border-bottom-left-radius:4px;width:fit-content;margin:0 16px 8px} .typing span{width:6px;height:6px;background:#94a3b8;border-radius:50%;animation:bounce 1.2s infinite} .typing span:nth-child(2){animation-delay:.2s} .typing span:nth-child(3){animation-delay:.4s} .hidden{display:none!important} @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}} .input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #2d2d44} .input-row input{flex:1;background:#2d2d44;border:1px solid #3d3d5c;border-radius:12px;color:#e2e8f0;padding:10px 14px;font-size:0.875rem;outline:none} .input-row input:focus{border-color:#6366f1} .input-row button{background:#6366f1;border:none;border-radius:12px;color:white;padding:10px 18px;cursor:pointer;font-size:0.875rem;font-weight:600}` },
      { name: 'script.js', path: 'script.js', language: 'javascript', content: `const REPLIES = ['That is interesting! Tell me more.','I understand. How can I help you further?','Great question! Let me think about that.','Absolutely! That makes a lot of sense.','I see what you mean. Here is what I think...','Thanks for sharing that with me!'];\nconst msgs = document.getElementById('messages');\nconst typing = document.getElementById('typing');\naddMessage('Hello! I am ZorvixAI. How can I help you today?', 'bot');\nfunction addMessage(text, who) {\n  const div = document.createElement('div');\n  div.className = 'bubble ' + who;\n  const now = new Date();\n  div.innerHTML = '<div>' + text + '</div><div class="time">' + now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + '</div>';\n  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;\n}\nfunction send() {\n  const input = document.getElementById('msg');\n  if (!input.value.trim()) return;\n  addMessage(input.value.trim(), 'user');\n  input.value = '';\n  msgs.appendChild(typing); typing.classList.remove('hidden'); msgs.scrollTop = msgs.scrollHeight;\n  setTimeout(() => {\n    typing.classList.add('hidden');\n    addMessage(REPLIES[Math.floor(Math.random() * REPLIES.length)], 'bot');\n  }, 1200 + Math.random() * 800);\n}\ndocument.getElementById('msg').addEventListener('keydown', e => e.key === 'Enter' && send());` },
    ],
  },
];

type GenerateStep = {
  step: 'thinking' | 'writing' | 'file' | 'done' | 'error';
  message: string;
  file?: { path: string; name: string; content: string; language: string };
  project?: { projectName: string; files: Array<{ path: string; name: string; content: string; language: string }> };
};

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const createProjectMutation = useCreateProject();
  const createFileMutation = useCreateFile();
  const { setActiveProject } = useWorkspaceStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateLog, setGenerateLog] = useState<string[]>([]);
  const [generateError, setGenerateError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const filtered = TEMPLATES.filter(t =>
    (category === 'All' || t.category === category) &&
    (search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
  );

  const openInPlayground = (template: typeof TEMPLATES[0]) => {
    sessionStorage.setItem('playground_template', JSON.stringify({
      projectName: template.id,
      files: template.files,
    }));
    setLocation('/playground');
  };

  const useInProject = async (template: typeof TEMPLATES[0]) => {
    if (!user) { toast({ title: 'Please log in to create a project', variant: 'destructive' }); return; }
    setLoading(template.id);
    try {
      const proj = await createProjectMutation.mutateAsync({
        data: { name: template.name, description: template.desc, language: template.files[0]?.language ?? 'html' }
      });
      for (const file of template.files) {
        await createFileMutation.mutateAsync({ projectId: proj.id, data: { name: file.name, path: file.path, content: file.content, language: file.language } });
      }
      setActiveProject(proj.id);
      toast({ title: `Project "${template.name}" created!` });
      setLocation(`/workspace/${proj.id}`);
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const copyTag = async (template: typeof TEMPLATES[0]) => {
    await navigator.clipboard.writeText(template.tags.join(', '));
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerateLog([]);
    setGenerateError('');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Server error (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let generatedProject: GenerateStep['project'] | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d: GenerateStep = JSON.parse(line.slice(6));
            if (d.message) setGenerateLog(prev => [...prev, d.message]);
            if (d.step === 'done' && d.project) {
              generatedProject = d.project;
            }
            if (d.step === 'error') {
              setGenerateError(d.message);
            }
          } catch {}
        }
      }

      if (generatedProject) {
        sessionStorage.setItem('playground_template', JSON.stringify(generatedProject));
        setLocation('/playground');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setGenerateError(err.message ?? 'Generation failed');
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const cancelGenerate = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setGenerateLog([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />Templates
              </h1>
              <p className="text-xs text-muted-foreground">{TEMPLATES.length} starter projects, ready to use</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9 h-9 w-56 text-sm" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${category === c ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* AI Template Generator */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-bold">AI Template Generator</h2>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">New</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Describe what you want to build and AI will generate a complete project for you.</p>

            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiGenerate(); } }}
                    placeholder="e.g. A personal finance tracker with charts and categories..."
                    className="min-h-[72px] text-sm resize-none pr-4 bg-background/60 border-border/60 focus:border-primary/50"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleAiGenerate}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="h-full px-5 gap-2 bg-primary hover:bg-primary/90"
                  >
                    {isGenerating
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Sparkles className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{isGenerating ? 'Building...' : 'Generate'}</span>
                  </Button>
                  {isGenerating && (
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={cancelGenerate}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick suggestion chips */}
              {!isGenerating && generateLog.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {AI_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setAiPrompt(s)}
                      className="text-xs px-3 py-1 rounded-full bg-muted/40 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Generation progress log */}
              {(isGenerating || generateLog.length > 0) && generateLog.length > 0 && (
                <div className="bg-background/60 border border-border/50 rounded-lg p-3 space-y-1">
                  {generateLog.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {i === generateLog.length - 1 && isGenerating
                        ? <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                        : <Check className="w-3 h-3 text-green-500 shrink-0" />}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {generateError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {generateError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Starter Templates</h2>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No templates found for "{search}"</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(t => (
                <div key={t.id} className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <div className={`h-2 w-full ${t.color.split(' ')[0]}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.color}`}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        {t.stars.toLocaleString()}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.desc}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {t.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {t.difficulty}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openInPlayground(t)}>
                          <Play className="w-3 h-3" />Preview
                        </Button>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => useInProject(t)} disabled={loading === t.id}>
                          {loading === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderOpen className="w-3 h-3" />}
                          Use
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
