import React from 'react';
import { Sparkles, ChevronDown, Zap, Brain, Star, Wand2, Search, X, Check, Bot } from 'lucide-react';

export interface ModelInfo {
  id: string;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  provider: string;
  category: 'large' | 'medium' | 'small';
  strengths: string[];
}

export const AUTO_MODEL_ID = 'auto';

export const OPENROUTER_MODELS: ModelInfo[] = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B', badge: 'Best', badgeColor: 'bg-purple-500/20 text-purple-300', description: "Meta's most capable open model, 128K context", provider: 'Meta', category: 'large', strengths: ['General', 'Chat', 'Code'] },
  { id: 'qwen/qwen3-coder-480b-a35b:free', label: 'Qwen3 Coder 480B', badge: 'Coder #1', badgeColor: 'bg-emerald-500/20 text-emerald-300', description: 'MoE code generation model, 262K context — best for building apps', provider: 'Qwen', category: 'large', strengths: ['Code', 'Apps', 'Full-stack'] },
  { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B', badge: 'OpenAI', badgeColor: 'bg-green-500/20 text-green-300', description: 'Open-weight MoE from OpenAI, 131K context', provider: 'OpenAI', category: 'large', strengths: ['General', 'Code', 'Reasoning'] },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1', badge: 'Reasoning', badgeColor: 'bg-blue-500/20 text-blue-300', description: 'Advanced reasoning / chain-of-thought — best for logic & math', provider: 'DeepSeek', category: 'large', strengths: ['Reasoning', 'Math', 'Analysis'] },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', label: 'Nemotron Super 49B', badge: 'NVIDIA', badgeColor: 'bg-green-600/20 text-green-300', description: "NVIDIA's reasoning-optimised 49B model", provider: 'NVIDIA', category: 'large', strengths: ['Reasoning', 'Code', 'STEM'] },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B', badge: 'Huge', badgeColor: 'bg-orange-500/20 text-orange-300', description: 'Fine-tuned 405B — advanced reasoning and instruction', provider: 'NousResearch', category: 'large', strengths: ['Reasoning', 'General', 'Long-context'] },
  { id: 'deepseek/deepseek-v3-base:free', label: 'DeepSeek V3', badge: '', badgeColor: '', description: 'Powerful general-purpose DeepSeek V3 model', provider: 'DeepSeek', category: 'large', strengths: ['General', 'Code', 'Chat'] },
  { id: 'minimax/minimax-m2.5-1.5t:free', label: 'MiniMax M2.5', badge: 'MoE', badgeColor: 'bg-yellow-500/20 text-yellow-300', description: 'SOTA 1.5T MoE model for productivity', provider: 'MiniMax', category: 'large', strengths: ['General', 'Productivity'] },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1', badge: 'Mistral', badgeColor: 'bg-orange-500/20 text-orange-300', description: 'Upgraded Mistral Small, 128K context', provider: 'Mistral', category: 'medium', strengths: ['Chat', 'Code', 'Fast'] },
  { id: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B', badge: 'Vision', badgeColor: 'bg-blue-400/20 text-blue-300', description: 'Multimodal vision-language model, 33K context', provider: 'Google', category: 'medium', strengths: ['Vision', 'General', 'Multilingual'] },
  { id: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B', badge: 'OpenAI', badgeColor: 'bg-green-500/20 text-green-300', description: 'Open-weight 20B model from OpenAI', provider: 'OpenAI', category: 'medium', strengths: ['General', 'Fast'] },
  { id: 'google/gemma-3-12b-it:free', label: 'Gemma 3 12B', badge: 'Vision', badgeColor: 'bg-blue-400/20 text-blue-300', description: 'Multimodal Gemma 3 mid-size, 33K context', provider: 'Google', category: 'medium', strengths: ['Vision', 'General'] },
  { id: 'nvidia/llama-3.3-nemotron-nano-8b-v1:free', label: 'Nemotron Nano 8B', badge: 'NVIDIA', badgeColor: 'bg-green-600/20 text-green-300', description: 'Compact NVIDIA model, 128K context', provider: 'NVIDIA', category: 'small', strengths: ['Fast', 'Code'] },
  { id: 'qwen/qwen3-4b:free', label: 'Qwen3 4B', badge: 'Fast', badgeColor: 'bg-teal-500/20 text-teal-300', description: '4B dense model, 41K context', provider: 'Qwen', category: 'small', strengths: ['Fast', 'Code', 'Compact'] },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B', badge: 'Fast', badgeColor: 'bg-teal-500/20 text-teal-300', description: 'Multilingual 3B model, 131K context', provider: 'Meta', category: 'small', strengths: ['Fast', 'Multilingual'] },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B', badge: '', badgeColor: '', description: 'Reliable 8B model, 131K context', provider: 'Meta', category: 'small', strengths: ['Fast', 'General'] },
  { id: 'google/gemma-3-4b-it:free', label: 'Gemma 3 4B', badge: 'Vision', badgeColor: 'bg-blue-400/20 text-blue-300', description: 'Compact multimodal Gemma 3, 33K context', provider: 'Google', category: 'small', strengths: ['Vision', 'Fast'] },
  { id: 'google/gemma-3n-e4b-it:free', label: 'Gemma 3n 4B', badge: 'Mobile', badgeColor: 'bg-indigo-500/20 text-indigo-300', description: 'Optimised for mobile & low-resource devices', provider: 'Google', category: 'small', strengths: ['Mobile', 'Fast'] },
  { id: 'google/gemma-3n-e2b-it:free', label: 'Gemma 3n 2B', badge: 'Mobile', badgeColor: 'bg-indigo-500/20 text-indigo-300', description: 'Ultra-compact multimodal from Google DeepMind', provider: 'Google', category: 'small', strengths: ['Mobile', 'Tiny'] },
  { id: 'arcee-ai/arcee-blitz:free', label: 'Arcee Blitz', badge: '', badgeColor: '', description: 'Fast and efficient instruction model', provider: 'Arcee', category: 'small', strengths: ['Fast'] },
  { id: 'stepfun/step-3.5-flash:free', label: 'Step 3.5 Flash', badge: 'Flash', badgeColor: 'bg-yellow-400/20 text-yellow-300', description: 'Ultra-fast flash model from Stepfun', provider: 'Stepfun', category: 'small', strengths: ['Speed', 'Flash'] },
  { id: 'liquid/lfm2.5-1.2b:free', label: 'LFM2.5 1.2B', badge: 'Tiny', badgeColor: 'bg-gray-500/20 text-gray-400', description: 'Compact high-performance instruction model', provider: 'Liquid', category: 'small', strengths: ['Tiny', 'Fast'] },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B', badge: '', badgeColor: '', description: 'Lightweight and fast from Google', provider: 'Google', category: 'small', strengths: ['Fast', 'General'] },
];

export const MODELS = OPENROUTER_MODELS;

export function getModelProvider(modelId: string): string {
  if (modelId === AUTO_MODEL_ID) return 'Auto';
  return OPENROUTER_MODELS.find(m => m.id === modelId)?.provider ?? 'OpenRouter';
}

export function getModelLabel(modelId: string): string {
  if (modelId === AUTO_MODEL_ID) return 'Auto';
  return OPENROUTER_MODELS.find(m => m.id === modelId)?.label ?? modelId;
}

const CATEGORY_ORDER: ModelInfo['category'][] = ['large', 'medium', 'small'];
const CATEGORY_LABELS: Record<ModelInfo['category'], string> = {
  large: '🧠 Large Models  (70B+)',
  medium: '⭐ Medium Models  (20–49B)',
  small: '⚡ Small & Fast  (<20B)',
};
const CATEGORY_COLORS: Record<ModelInfo['category'], string> = {
  large: 'text-purple-400',
  medium: 'text-blue-400',
  small: 'text-emerald-400',
};

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const isAuto = value === AUTO_MODEL_ID || !OPENROUTER_MODELS.find(m => m.id === value);
  const selected = OPENROUTER_MODELS.find(m => m.id === value);

  React.useEffect(() => {
    if (!open) { setSearch(''); return; }
    setTimeout(() => searchRef.current?.focus(), 50);
    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const query = search.toLowerCase();
  const filtered = query
    ? OPENROUTER_MODELS.filter(m =>
        m.label.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.strengths.some(s => s.toLowerCase().includes(query))
      )
    : OPENROUTER_MODELS;

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    models: filtered.filter(m => m.category === cat),
  }));

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
          isAuto
            ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
            : 'bg-white/5 border-border/50 text-foreground hover:bg-white/10 hover:border-border'
        }`}
      >
        {isAuto
          ? <Wand2 className="w-3.5 h-3.5 text-primary animate-pulse" />
          : <Bot className="w-3.5 h-3.5 text-muted-foreground" />
        }
        <span className="max-w-[140px] truncate">
          {isAuto ? '✦ Auto (Smart)' : selected?.label ?? 'Select model'}
        </span>
        {selected && !isAuto && selected.badge && (
          <span className={`hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selected.badgeColor}`}>
            {selected.badge}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 w-[360px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[500px]">

          {/* Header */}
          <div className="px-4 py-3 border-b border-border/60 bg-muted/30 shrink-0">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Choose AI Model
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">All free via OpenRouter</span>
            </p>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search models…"
                className="w-full bg-background border border-border/60 rounded-lg pl-7 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1">

            {/* Auto / Smart mode option */}
            {!query && (
              <button
                type="button"
                onClick={() => handleSelect(AUTO_MODEL_ID)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border/40 hover:bg-white/5 transition-colors text-left ${isAuto ? 'bg-primary/10' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isAuto ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Wand2 className={`w-4 h-4 ${isAuto ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isAuto ? 'text-primary' : 'text-foreground'}`}>
                      ✦ Auto — Smart Routing
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Recommended</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Automatically picks the best model for each message — coding specialist for app builds, reasoning model for analysis, fast model for chat.
                  </p>
                </div>
                {isAuto && <Check className="w-4 h-4 text-primary mt-1.5 shrink-0" />}
              </button>
            )}

            {/* Grouped models */}
            {grouped.map(({ cat, models }) => {
              if (!models.length) return null;
              return (
                <div key={cat}>
                  {!query && (
                    <div className={`px-4 py-2 bg-muted/10 border-y border-border/30 ${CATEGORY_COLORS[cat]}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider">{CATEGORY_LABELS[cat]}</p>
                    </div>
                  )}
                  {models.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelect(m.id)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${value === m.id ? 'bg-primary/10' : ''}`}
                    >
                      {/* Provider avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${value === m.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {m.provider.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold leading-tight ${value === m.id ? 'text-primary' : 'text-foreground'}`}>{m.label}</span>
                          {m.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${m.badgeColor || 'bg-muted text-muted-foreground'}`}>{m.badge}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{m.description}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {m.strengths.map(s => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/70 font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                      {value === m.id && <Check className="w-3.5 h-3.5 text-primary mt-1 shrink-0" />}
                    </button>
                  ))}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No models match "<span className="text-foreground">{search}</span>"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/50 bg-primary/5 shrink-0">
            <p className="text-[10px] text-primary/70 text-center">
              <strong>Auto mode</strong> uses smart routing — picks the best model per message automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact inline model pill — used in the input toolbar */
export function ModelPill({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const isAuto = value === AUTO_MODEL_ID || !OPENROUTER_MODELS.find(m => m.id === value);
  const selected = OPENROUTER_MODELS.find(m => m.id === value);
  const label = isAuto ? 'Auto' : (selected?.label ?? 'Model');

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={`Current model: ${label} — click to change`}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
          isAuto
            ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
            : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40'
        }`}
      >
        {isAuto ? <Wand2 className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        <span className="max-w-[90px] truncate">{label}</span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-border/60 bg-muted/30 sticky top-0 z-10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Switch Model</p>
          </div>

          {/* Auto option */}
          <button
            type="button"
            onClick={() => { onChange(AUTO_MODEL_ID); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-border/40 ${isAuto ? 'bg-primary/10' : ''}`}
          >
            <Wand2 className={`w-4 h-4 shrink-0 ${isAuto ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${isAuto ? 'text-primary' : 'text-foreground'}`}>✦ Auto (Smart Routing)</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-bold">Best</span>
              </div>
              <p className="text-[10px] text-muted-foreground">AI picks best model per message</p>
            </div>
            {isAuto && <Check className="w-3 h-3 text-primary shrink-0" />}
          </button>

          {/* Quick model list */}
          {OPENROUTER_MODELS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left ${value === m.id ? 'bg-primary/10' : ''}`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${value === m.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {m.provider.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium truncate ${value === m.id ? 'text-primary' : 'text-foreground'}`}>{m.label}</span>
                  {m.badge && <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold shrink-0 ${m.badgeColor}`}>{m.badge}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground/70 truncate">{m.strengths.join(' · ')}</p>
              </div>
              {value === m.id && <Check className="w-3 h-3 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
