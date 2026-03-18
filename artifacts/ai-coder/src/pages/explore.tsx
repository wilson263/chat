import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Globe, Heart, GitFork, Eye, Search, Star, Sparkles,
  Code2, Play, Flame, Clock, TrendingUp, Filter, X, ExternalLink,
  Trophy, Zap, Terminal, Tag, ChevronRight, FileCode2, User2,
  Copy, Check, BookOpen, Layers,
} from 'lucide-react';

interface PublicProject {
  id: string;
  title: string;
  description: string;
  author: string;
  avatar: string;
  language: string;
  tags: string[];
  likes: number;
  forks: number;
  views: number;
  createdAt: number;
  featured?: boolean;
  trending?: boolean;
  codePreview?: string;
  files?: { name: string; content: string }[];
}

const LANGUAGES = ['All', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'HTML/CSS'];
const CATEGORIES = ['All', 'Featured', 'Trending', 'New', 'Games', 'Tools', 'APIs', 'UI'];
const SORT_BY = ['Most Popular', 'Most Recent', 'Most Forked', 'Most Viewed'];

const SEED_PROJECTS: PublicProject[] = [
  {
    id: 'p1', title: 'Snake Game Canvas', description: 'Classic snake game built with HTML5 Canvas — smooth animations, high score tracking, and increasing speed.', author: 'devmaster', avatar: '🐍', language: 'JavaScript', tags: ['game', 'canvas', 'html5'], likes: 284, forks: 91, views: 1820, createdAt: Date.now() - 1000000, featured: true, trending: true,
    files: [
      { name: 'index.html', content: `<!DOCTYPE html>\n<html>\n<head><title>Snake Game</title></head>\n<body>\n  <canvas id="game" width="400" height="400"></canvas>\n  <script src="snake.js"></script>\n</body>\n</html>` },
      { name: 'snake.js', content: `const canvas = document.getElementById('game');\nconst ctx = canvas.getContext('2d');\nconst SIZE = 20;\nlet snake = [{x:200,y:200}];\nlet dir = {x:SIZE,y:0};\nlet food = {x:100,y:100};\nlet score = 0;\n\nfunction draw() {\n  ctx.fillStyle = '#111';\n  ctx.fillRect(0,0,400,400);\n  ctx.fillStyle = '#4ade80';\n  snake.forEach(s => ctx.fillRect(s.x,s.y,SIZE-2,SIZE-2));\n  ctx.fillStyle = '#f43f5e';\n  ctx.fillRect(food.x,food.y,SIZE-2,SIZE-2);\n}\n\nfunction update() {\n  const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};\n  if(head.x===food.x && head.y===food.y) {\n    score++; placeFood();\n  } else snake.pop();\n  snake.unshift(head);\n}\n\nfunction placeFood() {\n  food = {x:Math.floor(Math.random()*20)*SIZE, y:Math.floor(Math.random()*20)*SIZE};\n}\n\ndocument.addEventListener('keydown', e => {\n  if(e.key==='ArrowUp') dir={x:0,y:-SIZE};\n  if(e.key==='ArrowDown') dir={x:0,y:SIZE};\n  if(e.key==='ArrowLeft') dir={x:-SIZE,y:0};\n  if(e.key==='ArrowRight') dir={x:SIZE,y:0};\n});\n\nsetInterval(()=>{ update(); draw(); }, 100);` },
    ]
  },
  {
    id: 'p2', title: 'FastAPI REST Starter', description: 'Production-ready FastAPI template with JWT auth, Pydantic models, SQLAlchemy, and auto-generated OpenAPI docs.', author: 'pydev', avatar: '⚡', language: 'Python', tags: ['api', 'fastapi', 'backend'], likes: 412, forks: 147, views: 3100, createdAt: Date.now() - 2000000, featured: true,
    files: [
      { name: 'main.py', content: `from fastapi import FastAPI, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer\nfrom pydantic import BaseModel\nfrom typing import Optional\n\napp = FastAPI(title="My API", version="1.0.0")\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\nclass User(BaseModel):\n    username: str\n    email: Optional[str] = None\n\nclass Item(BaseModel):\n    name: str\n    description: Optional[str] = None\n    price: float\n\n@app.get("/")\ndef root():\n    return {"message": "Hello World"}\n\n@app.get("/users/me")\nasync def read_users_me(token: str = Depends(oauth2_scheme)):\n    return {"user": "current_user", "token": token}\n\n@app.post("/items/")\nasync def create_item(item: Item):\n    return item` },
      { name: 'requirements.txt', content: `fastapi==0.104.1\nuvicorn==0.24.0\npydantic==2.4.2\nsqlalchemy==2.0.23\npython-jose==3.3.0\npasslib==1.7.4` },
    ]
  },
  {
    id: 'p3', title: 'Todo App with Local Storage', description: 'Clean, minimal todo app. Drag to reorder, categories, due dates, dark mode. Zero dependencies, pure Vanilla JS.', author: 'webcraft', avatar: '✅', language: 'JavaScript', tags: ['todo', 'productivity', 'vanilla'], likes: 198, forks: 73, views: 1240, createdAt: Date.now() - 3000000,
    files: [
      { name: 'app.js', content: `const todos = JSON.parse(localStorage.getItem('todos') || '[]');\n\nfunction saveTodos() {\n  localStorage.setItem('todos', JSON.stringify(todos));\n}\n\nfunction addTodo(text) {\n  todos.push({ id: Date.now(), text, done: false, createdAt: new Date().toISOString() });\n  saveTodos();\n  render();\n}\n\nfunction toggleTodo(id) {\n  const todo = todos.find(t => t.id === id);\n  if (todo) { todo.done = !todo.done; saveTodos(); render(); }\n}\n\nfunction deleteTodo(id) {\n  const idx = todos.findIndex(t => t.id === id);\n  if (idx > -1) { todos.splice(idx, 1); saveTodos(); render(); }\n}\n\nfunction render() {\n  const list = document.getElementById('todo-list');\n  list.innerHTML = todos.map(t => \`\n    <li class="\${t.done ? 'done' : ''}">\n      <input type="checkbox" \${t.done ? 'checked' : ''} onchange="toggleTodo(\${t.id})">\n      <span>\${t.text}</span>\n      <button onclick="deleteTodo(\${t.id})">×</button>\n    </li>\`).join('');\n}\n\nrender();` },
      { name: 'style.css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui; max-width: 500px; margin: 2rem auto; padding: 1rem; }\nli { display: flex; align-items: center; gap: 8px; padding: 8px; border-bottom: 1px solid #eee; }\nli.done span { text-decoration: line-through; opacity: 0.5; }\nbutton { margin-left: auto; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; }` },
    ]
  },
  {
    id: 'p4', title: 'Glassmorphism Calculator', description: 'Beautiful calculator with frosted glass effect, keyboard support, history panel, and scientific mode.', author: 'ui_wizard', avatar: '🔮', language: 'HTML/CSS', tags: ['calculator', 'ui', 'glassmorphism'], likes: 341, forks: 120, views: 2760, createdAt: Date.now() - 500000, trending: true,
    files: [
      { name: 'style.css', content: `.calculator {\n  background: rgba(255,255,255,0.1);\n  backdrop-filter: blur(20px);\n  border: 1px solid rgba(255,255,255,0.2);\n  border-radius: 20px;\n  padding: 24px;\n  box-shadow: 0 25px 50px rgba(0,0,0,0.3);\n  width: 320px;\n}\n\n.display {\n  background: rgba(0,0,0,0.3);\n  border-radius: 12px;\n  padding: 16px;\n  text-align: right;\n  font-size: 2rem;\n  color: white;\n  margin-bottom: 16px;\n  min-height: 70px;\n}\n\n.btn {\n  background: rgba(255,255,255,0.15);\n  border: none;\n  border-radius: 12px;\n  color: white;\n  font-size: 1.2rem;\n  padding: 16px;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n.btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }\n.btn.operator { background: rgba(99,102,241,0.4); }\n.btn.equals { background: rgba(99,102,241,0.8); }` },
      { name: 'calculator.js', content: `let current = '0', prev = '', op = '';\n\nfunction press(val) {\n  if (val === 'C') { current='0'; prev=''; op=''; }\n  else if (val === '=') {\n    if (!op || !prev) return;\n    const a=parseFloat(prev), b=parseFloat(current);\n    if(op==='+') current=String(a+b);\n    else if(op==='-') current=String(a-b);\n    else if(op==='×') current=String(a*b);\n    else if(op==='÷') current=String(a/b);\n    op=''; prev='';\n  } else if(['+','-','×','÷'].includes(val)) {\n    op=val; prev=current; current='0';\n  } else {\n    current = current==='0' ? val : current+val;\n  }\n  document.getElementById('display').textContent = current;\n}` },
    ]
  },
  {
    id: 'p5', title: 'Go HTTP Router', description: 'Lightweight HTTP router in Go — zero dependencies, middleware support, path params, and benchmarks.', author: 'gopher', avatar: '🐹', language: 'Go', tags: ['router', 'http', 'backend'], likes: 89, forks: 31, views: 620, createdAt: Date.now() - 8000000,
    files: [
      { name: 'router.go', content: `package router\n\nimport (\n\t"net/http"\n\t"strings"\n)\n\ntype Handler func(w http.ResponseWriter, r *http.Request, params map[string]string)\n\ntype Router struct {\n\troutes map[string]map[string]Handler\n}\n\nfunc New() *Router {\n\treturn &Router{routes: make(map[string]map[string]Handler)}\n}\n\nfunc (r *Router) GET(path string, h Handler) { r.add("GET", path, h) }\nfunc (r *Router) POST(path string, h Handler) { r.add("POST", path, h) }\n\nfunc (r *Router) add(method, path string, h Handler) {\n\tif r.routes[method] == nil {\n\t\tr.routes[method] = make(map[string]Handler)\n\t}\n\tr.routes[method][path] = h\n}\n\nfunc (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {\n\thandlers := r.routes[req.Method]\n\tparams := make(map[string]string)\n\tfor pattern, h := range handlers {\n\t\tif match(pattern, req.URL.Path, params) {\n\t\t\th(w, req, params)\n\t\t\treturn\n\t\t}\n\t}\n\thttp.NotFound(w, req)\n}\n\nfunc match(pattern, path string, params map[string]string) bool {\n\tpp := strings.Split(pattern, "/")\n\tpaths := strings.Split(path, "/")\n\tif len(pp) != len(paths) { return false }\n\tfor i, p := range pp {\n\t\tif strings.HasPrefix(p, ":") { params[p[1:]] = paths[i] } else if p != paths[i] { return false }\n\t}\n\treturn true\n}` },
    ]
  },
  {
    id: 'p6', title: 'React Dashboard UI', description: 'Admin dashboard with charts (Recharts), data tables, dark/light mode, responsive sidebar and full TypeScript.', author: 'tsdev', avatar: '📊', language: 'TypeScript', tags: ['dashboard', 'react', 'charts'], likes: 527, forks: 189, views: 4200, createdAt: Date.now() - 1500000, featured: true, trending: true,
    files: [
      { name: 'Dashboard.tsx', content: `import React from 'react';\nimport { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';\n\nconst data = [\n  { month: 'Jan', revenue: 4000 },\n  { month: 'Feb', revenue: 6200 },\n  { month: 'Mar', revenue: 5800 },\n  { month: 'Apr', revenue: 7100 },\n  { month: 'May', revenue: 8400 },\n  { month: 'Jun', revenue: 9200 },\n];\n\nexport default function Dashboard() {\n  return (\n    <div className="dashboard">\n      <aside className="sidebar">\n        <nav>\n          <a href="/dashboard">Dashboard</a>\n          <a href="/users">Users</a>\n          <a href="/analytics">Analytics</a>\n          <a href="/settings">Settings</a>\n        </nav>\n      </aside>\n      <main>\n        <h1>Revenue Overview</h1>\n        <ResponsiveContainer width="100%" height={300}>\n          <BarChart data={data}>\n            <XAxis dataKey="month" />\n            <YAxis />\n            <Tooltip />\n            <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} />\n          </BarChart>\n        </ResponsiveContainer>\n      </main>\n    </div>\n  );\n}` },
      { name: 'package.json', content: `{\n  "name": "react-dashboard",\n  "dependencies": {\n    "react": "^18.2.0",\n    "recharts": "^2.10.0",\n    "typescript": "^5.2.0"\n  }\n}` },
    ]
  },
  {
    id: 'p7', title: 'Rust CLI Password Manager', description: 'Terminal-based password manager written in Rust. AES-256 encryption, clipboard copy, import/export.', author: 'rustacean', avatar: '🦀', language: 'Rust', tags: ['cli', 'security', 'crypto'], likes: 163, forks: 54, views: 980, createdAt: Date.now() - 6000000,
    files: [
      { name: 'main.rs', content: `use std::collections::HashMap;\nuse std::fs;\n\n#[derive(Debug, serde::Serialize, serde::Deserialize)]\nstruct Entry {\n    username: String,\n    password: String,\n    url: Option<String>,\n}\n\nstruct Vault {\n    entries: HashMap<String, Entry>,\n    path: String,\n}\n\nimpl Vault {\n    fn new(path: &str) -> Self {\n        let entries = fs::read_to_string(path)\n            .ok()\n            .and_then(|s| serde_json::from_str(&s).ok())\n            .unwrap_or_default();\n        Vault { entries, path: path.to_string() }\n    }\n\n    fn add(&mut self, name: &str, username: &str, password: &str) {\n        self.entries.insert(name.to_string(), Entry {\n            username: username.to_string(),\n            password: password.to_string(),\n            url: None,\n        });\n        self.save();\n    }\n\n    fn save(&self) {\n        let json = serde_json::to_string_pretty(&self.entries).unwrap();\n        fs::write(&self.path, json).expect("Failed to save vault");\n    }\n}` },
    ]
  },
  {
    id: 'p8', title: 'Weather Dashboard', description: 'Real-time weather app with 7-day forecast, hourly chart, wind/humidity details. Uses Open-Meteo free API.', author: 'clouddev', avatar: '🌤️', language: 'JavaScript', tags: ['weather', 'api', 'charts'], likes: 215, forks: 88, views: 1650, createdAt: Date.now() - 2500000,
    files: [
      { name: 'weather.js', content: `async function getWeather(lat, lon) {\n  const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current_weather=true&hourly=temperature_2m,precipitation,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto\`;\n  const res = await fetch(url);\n  return res.json();\n}\n\nasync function getLocation(city) {\n  const res = await fetch(\`https://geocoding-api.open-meteo.com/v1/search?name=\${city}&count=1\`);\n  const data = await res.json();\n  return data.results?.[0];\n}\n\nasync function loadWeather() {\n  const city = document.getElementById('city').value || 'London';\n  const loc = await getLocation(city);\n  if (!loc) return alert('City not found');\n  const weather = await getWeather(loc.latitude, loc.longitude);\n  displayCurrent(weather.current_weather, loc.name);\n  displayForecast(weather.daily);\n}\n\nfunction displayCurrent(w, city) {\n  document.getElementById('city-name').textContent = city;\n  document.getElementById('temp').textContent = \`\${w.temperature}°C\`;\n  document.getElementById('wind').textContent = \`\${w.windspeed} km/h\`;\n}` },
    ]
  },
  {
    id: 'p9', title: 'Spring Boot CRUD API', description: 'REST API with Spring Boot 3, JPA, H2 database, validation, pagination, and Swagger UI.', author: 'javaguru', avatar: '☕', language: 'Java', tags: ['api', 'spring', 'crud'], likes: 134, forks: 47, views: 890, createdAt: Date.now() - 9000000,
    files: [
      { name: 'UserController.java', content: `@RestController\n@RequestMapping("/api/users")\n@RequiredArgsConstructor\npublic class UserController {\n\n    private final UserService userService;\n\n    @GetMapping\n    public Page<UserDTO> getAll(Pageable pageable) {\n        return userService.findAll(pageable);\n    }\n\n    @GetMapping("/{id}")\n    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {\n        return userService.findById(id)\n            .map(ResponseEntity::ok)\n            .orElse(ResponseEntity.notFound().build());\n    }\n\n    @PostMapping\n    @ResponseStatus(HttpStatus.CREATED)\n    public UserDTO create(@Valid @RequestBody CreateUserRequest req) {\n        return userService.create(req);\n    }\n\n    @PutMapping("/{id}")\n    public UserDTO update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {\n        return userService.update(id, req);\n    }\n\n    @DeleteMapping("/{id}")\n    @ResponseStatus(HttpStatus.NO_CONTENT)\n    public void delete(@PathVariable Long id) {\n        userService.delete(id);\n    }\n}` },
    ]
  },
  {
    id: 'p10', title: 'Tetris in TypeScript', description: 'Full Tetris game with score system, levels, ghost piece, hold piece, and next preview panel.', author: 'gamedev', avatar: '🎮', language: 'TypeScript', tags: ['game', 'canvas', 'tetris'], likes: 302, forks: 109, views: 2100, createdAt: Date.now() - 700000, trending: true,
    files: [
      { name: 'tetris.ts', content: `type Piece = number[][];\n\nconst PIECES: Piece[] = [\n  [[1,1,1,1]],           // I\n  [[1,1],[1,1]],         // O\n  [[0,1,1],[1,1,0]],     // S\n  [[1,1,0],[0,1,1]],     // Z\n  [[1,0,0],[1,1,1]],     // J\n  [[0,0,1],[1,1,1]],     // L\n  [[0,1,0],[1,1,1]],     // T\n];\n\nconst COLORS = ['#00f0f0','#f0f000','#00f000','#f00000','#0000f0','#f0a000','#a000f0'];\n\nclass Tetris {\n  private board: number[][] = Array(20).fill(null).map(() => Array(10).fill(0));\n  private score = 0;\n  private level = 1;\n  private currentPiece: Piece = [];\n  private currentColor = '';\n  private pos = { x: 0, y: 0 };\n\n  spawnPiece() {\n    const i = Math.floor(Math.random() * PIECES.length);\n    this.currentPiece = PIECES[i];\n    this.currentColor = COLORS[i];\n    this.pos = { x: Math.floor((10 - this.currentPiece[0].length) / 2), y: 0 };\n  }\n\n  moveDown(): boolean {\n    this.pos.y++;\n    if (this.collides()) { this.pos.y--; this.lock(); return false; }\n    return true;\n  }\n\n  private collides(): boolean {\n    return this.currentPiece.some((row, dy) =>\n      row.some((val, dx) => val && (\n        this.pos.y + dy >= 20 ||\n        this.pos.x + dx < 0 ||\n        this.pos.x + dx >= 10 ||\n        this.board[this.pos.y + dy][this.pos.x + dx]\n      ))\n    );\n  }\n\n  private lock() {\n    this.currentPiece.forEach((row, dy) =>\n      row.forEach((val, dx) => {\n        if (val) this.board[this.pos.y + dy][this.pos.x + dx] = 1;\n      })\n    );\n    this.clearLines();\n    this.spawnPiece();\n  }\n\n  private clearLines() {\n    const full = this.board.filter(row => row.every(c => c));\n    this.score += full.length * 100 * this.level;\n    this.board = [\n      ...Array(full.length).fill(null).map(() => Array(10).fill(0)),\n      ...this.board.filter(row => !row.every(c => c)),\n    ];\n  }\n}` },
    ]
  },
  {
    id: 'p11', title: 'C++ Sorting Visualizer', description: 'Visualize 8 sorting algorithms in real-time: bubble, merge, quick, heap, insertion, and more.', author: 'algo_master', avatar: '📈', language: 'C++', tags: ['algorithm', 'visualization', 'education'], likes: 78, forks: 23, views: 540, createdAt: Date.now() - 12000000,
    files: [
      { name: 'sorter.cpp', content: `#include <vector>\n#include <functional>\n#include <thread>\n#include <chrono>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr, function<void(int,int)> onSwap) {\n    int n = arr.size();\n    for(int i=0;i<n-1;i++) {\n        for(int j=0;j<n-i-1;j++) {\n            if(arr[j]>arr[j+1]) {\n                swap(arr[j],arr[j+1]);\n                onSwap(j, j+1);\n                this_thread::sleep_for(chrono::milliseconds(50));\n            }\n        }\n    }\n}\n\nvoid quickSort(vector<int>& arr, int lo, int hi, function<void(int,int)> onSwap) {\n    if(lo>=hi) return;\n    int pivot=arr[hi], i=lo-1;\n    for(int j=lo;j<hi;j++) {\n        if(arr[j]<=pivot) {\n            swap(arr[++i],arr[j]);\n            onSwap(i,j);\n        }\n    }\n    swap(arr[++i],arr[hi]);\n    onSwap(i,hi);\n    quickSort(arr,lo,i-1,onSwap);\n    quickSort(arr,i+1,hi,onSwap);\n}` },
    ]
  },
  {
    id: 'p12', title: 'Markdown Editor', description: 'Live markdown editor with preview split view, syntax highlighting, export to PDF/HTML, custom themes.', author: 'docwriter', avatar: '📝', language: 'JavaScript', tags: ['editor', 'markdown', 'tool'], likes: 189, forks: 67, views: 1340, createdAt: Date.now() - 4000000,
    files: [
      { name: 'editor.js', content: `import { marked } from 'marked';\nimport hljs from 'highlight.js';\n\nmarked.setOptions({\n  highlight: (code, lang) => {\n    if (lang && hljs.getLanguage(lang)) {\n      return hljs.highlight(code, { language: lang }).value;\n    }\n    return hljs.highlightAuto(code).value;\n  },\n  breaks: true,\n  gfm: true,\n});\n\nconst editor = document.getElementById('editor');\nconst preview = document.getElementById('preview');\n\neditor.addEventListener('input', () => {\n  preview.innerHTML = marked.parse(editor.value);\n  localStorage.setItem('md_content', editor.value);\n});\n\n// Load saved content\neditor.value = localStorage.getItem('md_content') || '# Hello World\\n\\nStart typing your markdown here...';\neditor.dispatchEvent(new Event('input'));\n\n// Export to HTML\ndocument.getElementById('export-html').onclick = () => {\n  const blob = new Blob([\`<!DOCTYPE html><html><body>\${preview.innerHTML}</body></html>\`], {type:'text/html'});\n  const a = document.createElement('a');\n  a.href = URL.createObjectURL(blob);\n  a.download = 'document.html';\n  a.click();\n};` },
    ]
  },
  {
    id: 'p13', title: 'Python Data Analysis Kit', description: 'Jupyter-style Python data analysis tool with pandas, matplotlib visualization, and CSV upload.', author: 'datapython', avatar: '🐍', language: 'Python', tags: ['data', 'pandas', 'analysis'], likes: 256, forks: 94, views: 1890, createdAt: Date.now() - 3500000, featured: true,
    files: [
      { name: 'analysis.py', content: `import pandas as pd\nimport matplotlib.pyplot as plt\nimport matplotlib\nmatplotlib.use('Agg')\nfrom io import BytesIO\nimport base64\n\ndef analyze_csv(filepath: str) -> dict:\n    df = pd.read_csv(filepath)\n    summary = {\n        'shape': df.shape,\n        'columns': list(df.columns),\n        'dtypes': df.dtypes.astype(str).to_dict(),\n        'nulls': df.isnull().sum().to_dict(),\n        'describe': df.describe().to_dict(),\n    }\n    return summary\n\ndef plot_histogram(df: pd.DataFrame, column: str) -> str:\n    fig, ax = plt.subplots(figsize=(8,5))\n    df[column].hist(ax=ax, bins=20, color='#6366f1', edgecolor='white')\n    ax.set_title(f'Distribution of {column}')\n    ax.set_xlabel(column)\n    buf = BytesIO()\n    fig.savefig(buf, format='png', bbox_inches='tight')\n    buf.seek(0)\n    return base64.b64encode(buf.read()).decode()\n\ndef correlation_matrix(df: pd.DataFrame) -> str:\n    numeric_df = df.select_dtypes(include='number')\n    corr = numeric_df.corr()\n    fig, ax = plt.subplots(figsize=(10,8))\n    im = ax.imshow(corr, cmap='coolwarm', vmin=-1, vmax=1)\n    ax.set_xticks(range(len(corr.columns)))\n    ax.set_yticks(range(len(corr.columns)))\n    ax.set_xticklabels(corr.columns, rotation=45)\n    ax.set_yticklabels(corr.columns)\n    plt.colorbar(im, ax=ax)\n    buf = BytesIO()\n    fig.savefig(buf, format='png', bbox_inches='tight')\n    buf.seek(0)\n    return base64.b64encode(buf.read()).decode()` },
    ]
  },
  {
    id: 'p14', title: 'Music Player UI', description: 'Spotify-inspired music player UI with animated waveform, queue, equalizer bars, and playlist support.', author: 'audiodev', avatar: '🎵', language: 'HTML/CSS', tags: ['music', 'ui', 'animation'], likes: 398, forks: 142, views: 3400, createdAt: Date.now() - 900000, trending: true,
    files: [
      { name: 'player.css', content: `.player {\n  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n  border-radius: 24px;\n  padding: 32px;\n  width: 360px;\n  color: white;\n  font-family: system-ui;\n  box-shadow: 0 40px 80px rgba(0,0,0,0.5);\n}\n\n.album-art {\n  width: 280px;\n  height: 280px;\n  border-radius: 16px;\n  margin: 0 auto 24px;\n  background: linear-gradient(45deg, #667eea, #764ba2);\n  animation: spin 20s linear infinite;\n}\n\n@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n\n.waveform {\n  display: flex;\n  align-items: center;\n  gap: 3px;\n  height: 40px;\n  justify-content: center;\n  margin: 16px 0;\n}\n\n.bar {\n  width: 3px;\n  background: #667eea;\n  border-radius: 2px;\n  animation: wave 1s ease-in-out infinite;\n}\n\n@keyframes wave {\n  0%, 100% { height: 4px; }\n  50% { height: 100%; }\n}\n\n.controls { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 24px; }\n.play-btn { width: 56px; height: 56px; background: #667eea; border-radius: 50%; border: none; cursor: pointer; color: white; font-size: 1.5rem; }` },
    ]
  },
  {
    id: 'p15', title: 'Real-Time Chat App', description: 'WebSocket chat app with rooms, username display, typing indicators, emoji support, and message history.', author: 'socketdev', avatar: '💬', language: 'JavaScript', tags: ['chat', 'websocket', 'realtime'], likes: 321, forks: 118, views: 2580, createdAt: Date.now() - 1200000,
    files: [
      { name: 'server.js', content: `const WebSocket = require('ws');\nconst http = require('http');\n\nconst server = http.createServer();\nconst wss = new WebSocket.Server({ server });\n\nconst rooms = new Map();\n\nwss.on('connection', (ws) => {\n  let username = 'Anonymous';\n  let room = 'general';\n\n  ws.on('message', (data) => {\n    const msg = JSON.parse(data);\n\n    if (msg.type === 'join') {\n      username = msg.username;\n      room = msg.room || 'general';\n      if (!rooms.has(room)) rooms.set(room, new Set());\n      rooms.get(room).add(ws);\n      broadcast(room, { type: 'system', text: \`\${username} joined \${room}\` });\n    }\n\n    if (msg.type === 'message') {\n      broadcast(room, { type: 'message', username, text: msg.text, ts: Date.now() });\n    }\n\n    if (msg.type === 'typing') {\n      broadcast(room, { type: 'typing', username }, ws);\n    }\n  });\n\n  ws.on('close', () => {\n    rooms.get(room)?.delete(ws);\n    broadcast(room, { type: 'system', text: \`\${username} left\` });\n  });\n\n  function broadcast(r, data, exclude) {\n    const payload = JSON.stringify(data);\n    rooms.get(r)?.forEach(c => { if (c !== exclude && c.readyState === WebSocket.OPEN) c.send(payload); });\n  }\n});\n\nserver.listen(3000, () => console.log('Chat server on :3000'));` },
    ]
  },
  {
    id: 'p16', title: 'JWT Auth Service in Go', description: 'Complete auth service: registration, login, token refresh, logout, rate limiting, and Redis blacklist.', author: 'goauth', avatar: '🔐', language: 'Go', tags: ['auth', 'jwt', 'security'], likes: 147, forks: 58, views: 1020, createdAt: Date.now() - 5000000,
    files: [
      { name: 'auth.go', content: `package auth\n\nimport (\n\t"time"\n\t"github.com/golang-jwt/jwt/v5"\n)\n\ntype Claims struct {\n\tUserID   int64  \`json:"user_id"\`\n\tUsername string \`json:"username"\`\n\tjwt.RegisteredClaims\n}\n\nfunc GenerateToken(userID int64, username, secret string) (string, string, error) {\n\taccess := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{\n\t\tUserID: userID, Username: username,\n\t\tRegisteredClaims: jwt.RegisteredClaims{\n\t\t\tExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),\n\t\t\tIssuedAt:  jwt.NewNumericDate(time.Now()),\n\t\t},\n\t})\n\taccessToken, err := access.SignedString([]byte(secret))\n\tif err != nil { return "", "", err }\n\n\trefresh := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{\n\t\tUserID: userID, Username: username,\n\t\tRegisteredClaims: jwt.RegisteredClaims{\n\t\t\tExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),\n\t\t},\n\t})\n\trefreshToken, err := refresh.SignedString([]byte(secret))\n\treturn accessToken, refreshToken, err\n}` },
    ]
  },
];

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  const hrs = Math.floor(diff / 3_600_000);
  const mins = Math.floor(diff / 60_000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function ProjectDetailModal({ project, liked, onLike, onFork, onClose }: {
  project: PublicProject;
  liked: boolean;
  onLike: (id: string) => void;
  onFork: (p: PublicProject) => void;
  onClose: () => void;
}) {
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const langColors: Record<string, string> = {
    'JavaScript': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'TypeScript': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Python': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Go': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Rust': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Java': 'bg-red-500/20 text-red-400 border-red-500/30',
    'C++': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'HTML/CSS': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  const files = project.files || [];
  const currentFile = files[activeFile];

  const copyCode = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Code copied to clipboard!' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border/50">
          <span className="text-3xl">{project.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">{project.title}</h2>
              {project.featured && <Badge className="text-[9px] h-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⭐ Featured</Badge>}
              {project.trending && <Badge className="text-[9px] h-4 bg-rose-500/20 text-rose-400 border-rose-500/30">🔥 Trending</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">by @{project.author} · {timeAgo(project.createdAt)}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{project.description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats + Tags */}
        <div className="px-5 py-3 border-b border-border/30 flex items-center gap-4 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${langColors[project.language] || 'bg-muted text-muted-foreground border-border'}`}>{project.language}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" />{project.views.toLocaleString()}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><GitFork className="w-3 h-3" />{project.forks}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Heart className="w-3 h-3" />{(project.likes + (liked ? 1 : 0)).toLocaleString()}</span>
          <div className="flex flex-wrap gap-1 ml-auto">
            {project.tags.map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border/40">#{t}</span>
            ))}
          </div>
        </div>

        {/* File Tabs + Code */}
        {files.length > 0 && (
          <>
            <div className="flex items-center gap-0 px-5 pt-3 border-b border-border/30 overflow-x-auto">
              {files.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setActiveFile(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t border-b-2 transition-colors whitespace-nowrap ${i === activeFile ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  <FileCode2 className="w-3 h-3" />
                  {f.name}
                </button>
              ))}
              <button onClick={copyCode} className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/40 rounded-b-none">
              <pre className="p-4 text-xs font-mono text-green-300 leading-relaxed overflow-auto whitespace-pre">
                {currentFile?.content}
              </pre>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-border/50">
          <button
            onClick={() => onLike(project.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors ${liked ? 'bg-rose-500/20 text-rose-400' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
            {liked ? 'Liked' : 'Like'}
          </button>
          <button
            onClick={() => onFork(project)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />Fork Project
          </button>
          <button
            onClick={() => { copyCode(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />Copy Code
          </button>
          <button onClick={onClose} className="ml-auto text-xs text-muted-foreground hover:text-foreground px-3 py-2">Close</button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen, onFork, onLike, liked }: {
  project: PublicProject;
  onOpen: (p: PublicProject) => void;
  onFork: (p: PublicProject) => void;
  onLike: (id: string) => void;
  liked: boolean;
}) {
  const langColors: Record<string, string> = {
    'JavaScript': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'TypeScript': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Python': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Go': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Rust': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Java': 'bg-red-500/20 text-red-400 border-red-500/30',
    'C++': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'HTML/CSS': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  return (
    <div
      className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col gap-3 cursor-pointer group"
      onClick={() => onOpen(project)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{project.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{project.title}</h3>
              {project.featured && <Badge className="text-[9px] h-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-1">⭐ Featured</Badge>}
              {project.trending && <Badge className="text-[9px] h-4 bg-rose-500/20 text-rose-400 border-rose-500/30 px-1">🔥 Trending</Badge>}
            </div>
            <p className="text-[10px] text-muted-foreground">by @{project.author}</p>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${langColors[project.language] || 'bg-muted text-muted-foreground border-border'}`}>{project.language}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>

      <div className="flex flex-wrap gap-1">
        {project.tags.map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border/40">#{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.views.toLocaleString()}</span>
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{project.forks}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(project.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onLike(project.id); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${liked ? 'bg-rose-500/20 text-rose-400' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Heart className="w-3 h-3" fill={liked ? 'currentColor' : 'none'} />
            {(project.likes + (liked ? 1 : 0)).toLocaleString()}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onFork(project); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <GitFork className="w-3 h-3" />Fork
          </button>
          <button
            onClick={e => { e.stopPropagation(); onOpen(project); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projects] = useState<PublicProject[]>(SEED_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('explore_liked') || '[]')); } catch { return new Set(); }
  });
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');

  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('explore_liked', JSON.stringify([...next]));
      return next;
    });
  };

  const forkProject = (p: PublicProject) => {
    toast({ title: `🍴 Forked "${p.title}"`, description: 'Check your Projects dashboard to open it.' });
  };

  const openProject = (p: PublicProject) => {
    setSelectedProject(p);
  };

  let filtered = projects.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.includes(search.toLowerCase()))) return false;
    if (langFilter !== 'All' && p.language !== langFilter) return false;
    if (category === 'Featured' && !p.featured) return false;
    if (category === 'Trending' && !p.trending) return false;
    if (category === 'Games' && !p.tags.includes('game')) return false;
    if (category === 'Tools' && !p.tags.some(t => ['tool', 'editor', 'calculator'].includes(t))) return false;
    if (category === 'APIs' && !p.tags.some(t => ['api', 'backend', 'rest'].includes(t))) return false;
    if (category === 'UI' && !p.tags.some(t => ['ui', 'dashboard', 'glassmorphism'].includes(t))) return false;
    return true;
  });

  if (sortBy === 'Most Popular') filtered = filtered.sort((a, b) => b.likes - a.likes);
  else if (sortBy === 'Most Recent') filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortBy === 'Most Forked') filtered = filtered.sort((a, b) => b.forks - a.forks);
  else if (sortBy === 'Most Viewed') filtered = filtered.sort((a, b) => b.views - a.views);

  const stats = {
    total: projects.length,
    totalForks: projects.reduce((a, b) => a + b.forks, 0),
    totalLikes: projects.reduce((a, b) => a + b.likes, 0),
    totalViews: projects.reduce((a, b) => a + b.views, 0),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          liked={likedIds.has(selectedProject.id)}
          onLike={toggleLike}
          onFork={forkProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />Community Explore
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Discover, fork, and learn from community projects</p>
          </div>
          <Button onClick={() => setLocation('/projects')} className="gap-2 text-sm">
            <Sparkles className="w-4 h-4" />Share My Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Projects', value: stats.total, icon: Code2, color: 'text-primary' },
            { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-rose-400' },
            { label: 'Total Forks', value: stats.totalForks.toLocaleString(), icon: GitFork, color: 'text-blue-400' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, tags, descriptions…"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>{c}</button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <select value={langFilter} onChange={e => setLangFilter(e.target.value)} className="bg-card border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-card border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                {SORT_BY.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            {search && <> matching "<span className="text-foreground">{search}</span>"</>}
          </p>
          <p className="text-xs text-muted-foreground">Click any card to view code</p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">No projects found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={openProject} onFork={forkProject} onLike={toggleLike} liked={likedIds.has(p.id)} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-card border border-border/50 rounded-2xl p-8">
          <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Share Your Project</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">Built something cool? Publish it to the community so others can discover, learn from, and fork your work.</p>
          <Button onClick={() => setLocation('/projects')} className="gap-2">
            <Sparkles className="w-4 h-4" />Open My Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
