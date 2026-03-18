import React from 'react';
import { Sparkles, ChevronDown, Zap, Brain, Code, Star } from 'lucide-react';

export interface ModelInfo {
  id: string;
  label: string;
  badge: string;
  description: string;
  provider: string;
  category: 'large' | 'medium' | 'small';
}

export const OPENROUTER_MODELS: ModelInfo[] = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B', badge: 'Best', description: 'Meta\'s most capable open model, 128K context', provider: 'Meta', category: 'large' },
  { id: 'qwen/qwen3-coder-480b-a35b:free', label: 'Qwen3 Coder 480B', badge: 'Code', description: 'MoE code generation model, 262K context', provider: 'Qwen', category: 'large' },
  { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B', badge: 'OpenAI', description: 'Open-weight MoE from OpenAI, 131K context', provider: 'OpenAI', category: 'large' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', label: 'Nemotron Super 49B', badge: 'NVIDIA', description: 'NVIDIA\'s reasoning-optimised model', provider: 'NVIDIA', category: 'large' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1 24B', badge: 'Mistral', description: 'Upgraded Mistral Small, 128K context', provider: 'Mistral', category: 'medium' },
  { id: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B', badge: 'Google', description: 'Multimodal vision-language, 33K context', provider: 'Google', category: 'medium' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B', badge: 'Nous', description: 'Fine-tuned 405B for advanced reasoning', provider: 'NousResearch', category: 'large' },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1', badge: 'Reason', description: 'Advanced reasoning / chain-of-thought model', provider: 'DeepSeek', category: 'large' },
  { id: 'deepseek/deepseek-v3-base:free', label: 'DeepSeek V3', badge: '', description: 'Powerful general-purpose DeepSeek model', provider: 'DeepSeek', category: 'large' },
  { id: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B', badge: 'OpenAI', description: 'Open-weight 21B model from OpenAI', provider: 'OpenAI', category: 'medium' },
  { id: 'qwen/qwen3-4b:free', label: 'Qwen3 4B', badge: 'Fast', description: '4B dense model, 41K context', provider: 'Qwen', category: 'small' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B', badge: 'Fast', description: 'Multilingual 3B model, 131K context', provider: 'Meta', category: 'small' },
  { id: 'google/gemma-3-12b-it:free', label: 'Gemma 3 12B', badge: 'Google', description: 'Multimodal Gemma 3 mid-size, 33K context', provider: 'Google', category: 'medium' },
  { id: 'google/gemma-3-4b-it:free', label: 'Gemma 3 4B', badge: 'Google', description: 'Compact multimodal Gemma 3, 33K context', provider: 'Google', category: 'small' },
  { id: 'google/gemma-3n-e4b-it:free', label: 'Gemma 3n 4B', badge: 'Mobile', description: 'Optimised for mobile & low-resource devices', provider: 'Google', category: 'small' },
  { id: 'google/gemma-3n-e2b-it:free', label: 'Gemma 3n 2B', badge: 'Mobile', description: 'Multimodal instruction-tuned by Google DeepMind', provider: 'Google', category: 'small' },
  { id: 'nvidia/llama-3.3-nemotron-nano-8b-v1:free', label: 'Nemotron Nano 8B', badge: 'NVIDIA', description: 'Compact NVIDIA model, 128K context', provider: 'NVIDIA', category: 'small' },
  { id: 'arcee-ai/arcee-blitz:free', label: 'Arcee Blitz', badge: '', description: 'Fast and efficient instruction model', provider: 'Arcee', category: 'small' },
  { id: 'stepfun/step-3.5-flash:free', label: 'Step 3.5 Flash', badge: 'Fast', description: 'Ultra-fast flash model from Stepfun', provider: 'Stepfun', category: 'small' },
  { id: 'minimax/minimax-m2.5-1.5t:free', label: 'MiniMax M2.5', badge: '', description: 'SOTA large language model for productivity', provider: 'MiniMax', category: 'large' },
  { id: 'liquid/lfm2.5-1.2b:free', label: 'LFM2.5 1.2B', badge: 'Tiny', description: 'Compact high-performance instruction model', provider: 'Liquid', category: 'small' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B', badge: '', description: 'Reliable 8B model, 131K context', provider: 'Meta', category: 'small' },
  { id: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B', badge: '', description: 'Lightweight and fast from Google', provider: 'Google', category: 'small' },
];

export const MODELS = OPENROUTER_MODELS;

const CATEGORY_ORDER: ModelInfo['category'][] = ['large', 'medium', 'small'];
const CATEGORY_LABELS: Record<ModelInfo['category'], string> = {
  large: 'Large Models (70B+)',
  medium: 'Medium Models (20–49B)',
  small: 'Small & Fast (<20B)',
};
const CATEGORY_COLORS: Record<ModelInfo['category'], string> = {
  large: 'text-purple-400',
  medium: 'text-blue-400',
  small: 'text-emerald-400',
};
const CATEGORY_ICONS: Record<ModelInfo['category'], React.ComponentType<any>> = {
  large: Brain,
  medium: Star,
  small: Zap,
};

export function getModelProvider(modelId: string): string {
  return OPENROUTER_MODELS.find(m => m.id === modelId)?.provider ?? 'OpenRouter';
}

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selected = OPENROUTER_MODELS.find(m => m.id === value) ?? OPENROUTER_MODELS[0];

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-model-selector]')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    models: OPENROUTER_MODELS.filter(m => m.category === cat),
  }));

  return (
    <div className="relative" data-model-selector="">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-border/50 text-muted-foreground hover:text-foreground transition-all"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span>{selected.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden max-h-[420px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-border bg-muted/30 sticky top-0 z-10">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" /> OpenRouter — Free Models
            </p>
          </div>

          {grouped.map(({ cat, models }) => {
            if (!models.length) return null;
            const Icon = CATEGORY_ICONS[cat];
            return (
              <div key={cat}>
                <div className="px-3 py-1.5 bg-muted/20 border-b border-border/50">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${CATEGORY_COLORS[cat]}`}>
                    <Icon className="w-3 h-3" /> {CATEGORY_LABELS[cat]}
                  </p>
                </div>
                {models.map(model => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => { onChange(model.id); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left ${value === model.id ? 'bg-primary/10' : ''}`}
                  >
                    <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${value === model.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${value === model.id ? 'text-primary' : 'text-foreground'}`}>{model.label}</span>
                        {model.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">{model.badge}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 ml-auto">{model.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{model.description}</p>
                    </div>
                    {value === model.id && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </button>
                ))}
              </div>
            );
          })}

          <div className="px-3 py-2 border-t border-border bg-primary/5">
            <p className="text-[10px] text-primary/80">
              All models are <strong>100% free</strong> via OpenRouter — no API key needed from you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
