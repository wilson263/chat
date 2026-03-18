import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Code2 } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="mesh-orb-1 absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
        <div className="mesh-orb-2 absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        <div className="dot-grid absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 text-center max-w-md animate-fade-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-1 border border-border mb-6">
          <Code2 className="w-7 h-7 text-muted-foreground" />
        </div>

        <div className="text-8xl font-black text-gradient-primary mb-2 tracking-tighter">404</div>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This page doesn't exist or may have been moved. Check the URL or head back home.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-2 border-border" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
          <Button className="gap-2 bg-primary shadow-lg shadow-primary/20" onClick={() => setLocation('/')}>
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
