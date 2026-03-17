import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, FolderKanban, Settings, BarChart3, Code2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_KEY = 'zorvix_onboarding_done';

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to ZorvixAI!',
    description: 'Your AI-powered coding assistant and workspace. Let\'s take a quick tour of everything you can do.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Chat with powerful AI models to write code, brainstorm ideas, debug issues, or get explanations. Attach images and files for richer context.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Code2,
    title: 'AI Coding Workspace',
    description: 'Open a project to access the full IDE. Write, edit, and preview code with AI assistance built right into your editor.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: FolderKanban,
    title: 'Projects Dashboard',
    description: 'Create projects, import from GitHub, organize your work, and collaborate with others. All your code in one place.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Zap,
    title: 'Keyboard Shortcuts',
    description: 'Work faster with shortcuts! Press ? anytime to see all available shortcuts. Ctrl+K for new chat, Ctrl+B to toggle sidebar, and more.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Settings,
    title: 'Personalize Your Experience',
    description: 'Update your profile, upload an avatar, add your OpenAI API key for GPT-4 access, and customize your workspace in Settings.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: BarChart3,
    title: 'Track Your Usage',
    description: 'Monitor your activity, view message history charts, and track project stats in the Usage Dashboard.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
];

interface OnboardingTourProps {
  onDone?: () => void;
}

export function OnboardingTour({ onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setVisible(false);
    onDone?.();
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else dismiss();
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={dismiss}
          />
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative p-6">
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`w-14 h-14 rounded-2xl ${current.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${current.color}`} />
                </div>

                <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {step > 0 && (
                      <Button variant="outline" size="sm" onClick={prev} className="h-8">
                        <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                    )}
                    <Button size="sm" onClick={next} className="h-8">
                      {step === steps.length - 1 ? "Get Started!" : <>Next <ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(TOUR_KEY);
}
