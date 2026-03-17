import React from 'react';
import { Sparkles, ChevronDown, Brain, Zap, Lock } from 'lucide-react';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', badge: 'Latest', description: 'Fastest, most capable', provider: 'groq' },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', badge: '', description: 'Powerful & efficient', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', badge: 'Fast', description: 'Ultra-fast responses', provider: 'groq' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', badge: 'Code', description: 'Code specialist, long context', provider: 'groq' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B', badge: '', description: 'Lightweight & fast', provider: 'groq' },
];

export const OPENAI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', badge: 'OpenAI', description: 'Most capable GPT-4 model', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', badge: 'OpenAI', description: 'Fast & affordable GPT-4', provider: 'openai' },
  { id: 'o1-mini', label: 'o1-mini', badge: 'OpenAI', description: 'Advanced reasoning model', provider: 'openai' },
];

export const MODELS = [...GROQ_MODELS, ...OPENAI_MODELS];

export function getModelProvider(modelId: string): 'groq' | 'openai' {
  return OPENAI_MODELS.some(m => m.id === modelId) ? 'openai' : 'groq';
}

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selected = MODELS.find(m => m.id === value) ?? MODELS[0];
  const hasOpenAiKey = !!localStorage.getItem('openai_api_key');

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-model-selector]')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const handleSelect = (modelId: string, provider: string) => {
    if (provider === 'openai' && !hasOpenAiKey) {
      alert('To use OpenAI models, add your OpenAI API key in Settings → API Keys.');
      setOpen(false);
      return;
    }
    onChange(modelId);
    setOpen(false);
  };

  return (
    <div className="relative" data-model-selector="">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-border/50 text-muted-foreground hover:text-foreground transition-all"
      >
        {selected.provider === 'openai'
          ? <Brain className="w-3 h-3 text-green-400" />
          : <Zap className="w-3 h-3 text-orange-400" />
        }
        <span>{selected.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Groq Section */}
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-orange-400" /> Groq AI
            </p>
          </div>
          {GROQ_MODELS.map(model => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id, model.provider)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left ${value === model.id ? 'bg-orange-500/10' : ''}`}
            >
              <Zap className={`w-4 h-4 mt-0.5 shrink-0 ${value === model.id ? 'text-orange-400' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${value === model.id ? 'text-orange-400' : 'text-foreground'}`}>{model.label}</span>
                  {model.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">{model.badge}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
              </div>
              {value === model.id && <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />}
            </button>
          ))}

          {/* OpenAI Section */}
          <div className="px-3 py-2 border-t border-b border-border bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3 h-3 text-green-400" /> OpenAI {!hasOpenAiKey && <span className="text-[9px] text-yellow-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> API key required</span>}
            </p>
          </div>
          {OPENAI_MODELS.map(model => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id, model.provider)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left ${!hasOpenAiKey ? 'opacity-60' : ''} ${value === model.id ? 'bg-green-500/10' : ''}`}
            >
              <Brain className={`w-4 h-4 mt-0.5 shrink-0 ${value === model.id ? 'text-green-400' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${value === model.id ? 'text-green-400' : 'text-foreground'}`}>{model.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">{model.badge}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
              </div>
              {value === model.id && <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />}
            </button>
          ))}

          {!hasOpenAiKey && (
            <div className="px-3 py-2 border-t border-border bg-yellow-500/5">
              <p className="text-[10px] text-yellow-400/80">
                Add your OpenAI API key in <strong>Settings → API Keys</strong> to unlock GPT-4 models.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
