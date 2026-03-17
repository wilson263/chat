import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Sparkles, Wand2, Copy, Check, RefreshCw, Download,
  Figma, Palette, Layout, Smartphone, Monitor, Layers,
  Lightbulb, Star, Zap, Eye, Code2, PenLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TOOLS = [
  { id: 'figma', label: 'Figma', icon: Figma, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'canva', label: 'Canva', icon: Palette, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { id: 'general', label: 'General UX/UI', icon: Layout, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'web', label: 'Web App', icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'prototype', label: 'Prototype', icon: Layers, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
];

const APP_TYPES = [
  'Social Media App', 'E-Commerce Platform', 'Task Manager', 'Dashboard/Analytics',
  'Food Delivery App', 'Fitness & Health App', 'Finance & Banking', 'Education Platform',
  'Travel & Booking', 'Chat & Messaging', 'Portfolio Website', 'SaaS Tool',
  'Medical App', 'Real Estate App', 'News & Blog', 'Music Streaming',
];

const STYLE_VIBES = [
  'Minimalist & Clean', 'Bold & Colorful', 'Dark Mode Premium', 'Glassmorphism',
  'Neumorphism', 'Corporate & Professional', 'Playful & Fun', 'Luxury & High-end',
  'Retro & Vintage', 'Material Design', 'Flat Design', 'Gradient Heavy',
];

const SCREEN_TYPES = [
  'Onboarding Flow', 'Dashboard Home', 'Login & Signup', 'Profile Page',
  'Settings Screen', 'Product Listing', 'Product Detail', 'Checkout Flow',
  'Feed / Timeline', 'Search Results', 'Navigation & Menu', 'Empty States',
  'Error Pages', 'Loading States', 'Modal & Popups', 'Data Tables',
];

function buildPrompt(opts: {
  tool: string;
  appName: string;
  appType: string;
  styleVibe: string;
  screens: string[];
  colorPalette: string;
  extraNotes: string;
  targetUsers: string;
}): string {
  const toolLabel = TOOLS.find(t => t.id === opts.tool)?.label || opts.tool;
  const screenList = opts.screens.length > 0 ? opts.screens.join(', ') : 'all key screens';

  let prompt = `Design a complete, production-ready ${toolLabel} UI/UX design for a ${opts.appType || 'modern app'} called "${opts.appName || 'MyApp'}".\n\n`;

  prompt += `**Design Style:** ${opts.styleVibe || 'Modern & Clean'}\n`;

  if (opts.targetUsers) {
    prompt += `**Target Users:** ${opts.targetUsers}\n`;
  }

  if (opts.colorPalette) {
    prompt += `**Color Palette:** ${opts.colorPalette}\n`;
  }

  prompt += `\n**Screens to Design:** ${screenList}\n\n`;

  prompt += `**Design Requirements:**\n`;
  prompt += `- Create a visually stunning, pixel-perfect design with exceptional attention to detail\n`;
  prompt += `- Use a consistent design system with reusable components (buttons, cards, inputs, typography scale)\n`;
  prompt += `- Apply proper spacing, padding, and visual hierarchy following the 8pt grid system\n`;
  prompt += `- Include micro-interactions and hover states for interactive elements\n`;
  prompt += `- Ensure accessibility with sufficient color contrast (WCAG AA minimum)\n`;
  prompt += `- Design for both light and dark mode variants\n`;
  prompt += `- Include responsive breakpoints for mobile (375px), tablet (768px), and desktop (1440px)\n`;

  if (opts.tool === 'figma') {
    prompt += `\n**Figma-Specific Requirements:**\n`;
    prompt += `- Organize layers with clear naming conventions and logical grouping\n`;
    prompt += `- Use Auto Layout for all flexible components\n`;
    prompt += `- Create a local Styles library for colors, typography, and effects\n`;
    prompt += `- Build reusable Components with variants (size, state, theme variants)\n`;
    prompt += `- Add interactive prototyping links between screens\n`;
    prompt += `- Include a Design Tokens page with all variables\n`;
  } else if (opts.tool === 'canva') {
    prompt += `\n**Canva-Specific Requirements:**\n`;
    prompt += `- Use Canva's brand kit for consistent colors and fonts\n`;
    prompt += `- Create a template structure that can be easily edited\n`;
    prompt += `- Include mockup frames for device presentations\n`;
    prompt += `- Add annotations and design notes for developers\n`;
    prompt += `- Export-ready assets in multiple formats (PNG, SVG, PDF)\n`;
  } else if (opts.tool === 'mobile') {
    prompt += `\n**Mobile Design Requirements:**\n`;
    prompt += `- Follow iOS Human Interface Guidelines and Material Design 3 principles\n`;
    prompt += `- Design for safe areas, notches, and gesture navigation\n`;
    prompt += `- Use native-feeling patterns (bottom sheets, tab bars, swipe gestures)\n`;
    prompt += `- Minimum touch target size of 44x44pt\n`;
    prompt += `- Consider one-handed usability with thumb-friendly zones\n`;
  }

  prompt += `\n**Visual Design Details:**\n`;
  prompt += `- Apply ${opts.styleVibe || 'modern'} aesthetic throughout all screens\n`;
  prompt += `- Use professional typography with a clear hierarchy (h1, h2, h3, body, caption)\n`;
  prompt += `- Add subtle shadows, depth, and texture to create visual interest\n`;
  prompt += `- Include realistic placeholder content (not just "Lorem ipsum")\n`;
  prompt += `- Add icons from a consistent icon library (Lucide, Heroicons, or similar)\n`;
  prompt += `- Include data visualizations or charts where appropriate\n`;

  if (opts.extraNotes) {
    prompt += `\n**Additional Notes:**\n${opts.extraNotes}\n`;
  }

  prompt += `\n**Deliverables:**\n`;
  prompt += `- Complete design files for all ${screenList} screens\n`;
  prompt += `- Component library with all UI elements\n`;
  prompt += `- Color palette, typography, and spacing documentation\n`;
  prompt += `- Developer handoff notes with specs and assets\n`;

  return prompt;
}

const EXAMPLE_PROMPTS = [
  {
    label: 'Figma - Food Delivery',
    config: { tool: 'figma', appName: 'FoodRush', appType: 'Food Delivery App', styleVibe: 'Bold & Colorful', screens: ['Dashboard Home', 'Product Listing', 'Checkout Flow'], colorPalette: '#FF6B35, #FFF3E0, #1A1A2E', targetUsers: 'Busy urban professionals aged 20-40', extraNotes: '' },
  },
  {
    label: 'Canva - SaaS Dashboard',
    config: { tool: 'canva', appName: 'AnalyticsPro', appType: 'Dashboard/Analytics', styleVibe: 'Dark Mode Premium', screens: ['Dashboard Home', 'Data Tables', 'Settings Screen'], colorPalette: '#6C63FF, #1E1E2E, #A78BFA', targetUsers: 'Business analysts and data teams', extraNotes: 'Include charts, KPI cards, and data visualization widgets' },
  },
  {
    label: 'Mobile - Fitness App',
    config: { tool: 'mobile', appName: 'FitPulse', appType: 'Fitness & Health App', styleVibe: 'Minimalist & Clean', screens: ['Onboarding Flow', 'Dashboard Home', 'Profile Page'], colorPalette: '#00C9A7, #F0FFF4, #1A202C', targetUsers: 'Health-conscious users aged 18-35', extraNotes: 'Focus on progress tracking and motivational design' },
  },
];

export default function PromptGeneratorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState('figma');
  const [appName, setAppName] = useState('');
  const [selectedAppType, setSelectedAppType] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [colorPalette, setColorPalette] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleScreen = (screen: string) => {
    setSelectedScreens(prev =>
      prev.includes(screen) ? prev.filter(s => s !== screen) : [...prev, screen]
    );
  };

  const handleGenerate = async () => {
    if (!selectedAppType || !selectedStyle) {
      toast({ title: 'Please select an app type and style vibe first', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    const prompt = buildPrompt({
      tool: selectedTool,
      appName,
      appType: selectedAppType,
      styleVibe: selectedStyle,
      screens: selectedScreens,
      colorPalette,
      targetUsers,
      extraNotes,
    });
    setGeneratedPrompt(prompt);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast({ title: 'Prompt copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedPrompt) return;
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-ux-prompt-${selectedTool}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Prompt downloaded!' });
  };

  const loadExample = (cfg: typeof EXAMPLE_PROMPTS[0]['config']) => {
    setSelectedTool(cfg.tool);
    setAppName(cfg.appName);
    setSelectedAppType(cfg.appType);
    setSelectedStyle(cfg.styleVibe);
    setSelectedScreens(cfg.screens);
    setColorPalette(cfg.colorPalette);
    setTargetUsers(cfg.targetUsers);
    setExtraNotes(cfg.extraNotes);
    setGeneratedPrompt('');
  };

  const handleReset = () => {
    setSelectedTool('figma');
    setAppName('');
    setSelectedAppType('');
    setSelectedStyle('');
    setSelectedScreens([]);
    setColorPalette('');
    setTargetUsers('');
    setExtraNotes('');
    setGeneratedPrompt('');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[400px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-pink-500/5 to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/projects')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Prompt Generator</span>
          </div>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm text-muted-foreground">UI/UX Design Prompts</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered UI/UX Prompt Generator
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 leading-tight">
            Generate Perfect{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">Design Prompts</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create detailed, professional UI/UX design prompts for Figma, Canva, and other design tools.
            Get pixel-perfect results every time.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Examples</h2>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map(ex => (
              <button
                key={ex.label}
                onClick={() => loadExample(ex.config)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Step 1 — Choose Your Design Tool
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TOOLS.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          selectedTool === tool.id
                            ? `${tool.bg} ${tool.border} ${tool.color} ring-1 ring-primary/30 scale-[1.02]`
                            : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedTool === tool.id ? tool.color : ''}`} />
                        <span className="text-xs font-medium">{tool.label}</span>
                        {selectedTool === tool.id && <div className={`w-1 h-1 rounded-full ${tool.color.replace('text-', 'bg-')}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  Step 2 — App Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">App Name</Label>
                    <Input
                      placeholder="e.g. FoodRush, AnalyticsPro, FitPulse..."
                      value={appName}
                      onChange={e => setAppName(e.target.value)}
                      className="bg-background/50 border-border/60 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">App Type *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {APP_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedAppType(type)}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                            selectedAppType === type
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Target Users</Label>
                    <Input
                      placeholder="e.g. Busy professionals aged 25-40..."
                      value={targetUsers}
                      onChange={e => setTargetUsers(e.target.value)}
                      className="bg-background/50 border-border/60 h-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Step 3 — Style Vibe *
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_VIBES.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                        selectedStyle === style
                          ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-sm'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" />
                  Step 4 — Screens to Design
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {SCREEN_TYPES.map(screen => (
                    <button
                      key={screen}
                      onClick={() => toggleScreen(screen)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                        selectedScreens.includes(screen)
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      {screen}
                    </button>
                  ))}
                </div>
                {selectedScreens.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">{selectedScreens.length} screen{selectedScreens.length > 1 ? 's' : ''} selected</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Step 5 — Extras (Optional)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Color Palette</Label>
                    <Input
                      placeholder="e.g. #6C63FF, #F8F9FA, #1E1E2E or 'Ocean blues and coral'"
                      value={colorPalette}
                      onChange={e => setColorPalette(e.target.value)}
                      className="bg-background/50 border-border/60 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Additional Notes</Label>
                    <textarea
                      placeholder="Any specific requirements, inspirations, or constraints..."
                      value={extraNotes}
                      onChange={e => setExtraNotes(e.target.value)}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors h-24"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/25 text-base font-medium"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating Prompt...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Generate Design Prompt</>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Generated Prompt
                </h3>
                {generatedPrompt && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="text-muted-foreground hover:text-foreground h-8 px-3">
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground h-8 px-3">
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</>}
                    </Button>
                  </div>
                )}
              </div>

              {!generatedPrompt ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Wand2 className="w-9 h-9 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Your prompt will appear here</h4>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Fill in the form on the left and click "Generate Design Prompt" to get a detailed, professional UI/UX prompt.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {['Figma-ready', 'Canva-optimized', 'Pixel-perfect', 'Developer handoff'].map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50 border border-border/30">{tag}</Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                      {TOOLS.find(t => t.id === selectedTool)?.label || selectedTool}
                    </Badge>
                    {selectedAppType && <Badge variant="secondary" className="text-xs">{selectedAppType}</Badge>}
                    {selectedStyle && <Badge variant="secondary" className="text-xs">{selectedStyle}</Badge>}
                  </div>
                  <div className="flex-1 bg-background/50 rounded-xl border border-border/40 p-4 overflow-y-auto">
                    <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed">
                      {generatedPrompt}
                    </pre>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleCopy} variant="outline" className="border-border/50 h-10">
                      {copied ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Prompt</>}
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="border-border/50 h-10">
                      <Download className="w-4 h-4 mr-2" /> Download .txt
                    </Button>
                  </div>
                  <Button
                    onClick={() => setLocation('/')}
                    className="w-full h-10 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
                  >
                    <Code2 className="w-4 h-4 mr-2" /> Use in AI Chat
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                How to use your prompt
              </h3>
              <div className="space-y-2">
                {[
                  { step: '01', text: 'Generate your custom design prompt above' },
                  { step: '02', text: 'Copy the prompt to clipboard' },
                  { step: '03', text: 'Paste into Figma AI, Canva AI, Midjourney, or any AI design tool' },
                  { step: '04', text: 'Or use "Use in AI Chat" to get design advice directly' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="text-xs font-mono text-primary/60 mt-0.5 shrink-0">{item.step}</span>
                    <span className="text-xs text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
