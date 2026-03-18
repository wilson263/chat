import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Sparkles, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Crumb {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  children: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  withMeshBg?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | 'full';
  backHref?: string;
}

export function PageLayout({
  children,
  crumbs = [],
  actions,
  withMeshBg = false,
  maxWidth = '5xl',
  backHref,
}: PageLayoutProps) {
  const [, setLocation] = useLocation();

  const widthMap = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-xl',
    '2xl':'max-w-2xl',
    '5xl':'max-w-5xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {withMeshBg && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="mesh-orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
          <div className="mesh-orb-2 absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>
      )}

      <header className="sticky top-0 z-20 h-12 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="h-full px-4 flex items-center gap-2">
          {backHref && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation(backHref)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>
          )}

          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
              <Code2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-foreground font-semibold text-xs">ZorvixAI</span>
          </button>

          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <span className="text-border select-none">/</span>
              {crumb.href ? (
                <button
                  onClick={() => setLocation(crumb.href!)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-xs text-foreground font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}

          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      <main>
        <div className={`mx-auto px-4 py-10 ${widthMap[maxWidth]}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

interface PageHeroProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  centered?: boolean;
}

export function PageHero({
  icon,
  iconBg = 'bg-primary/10 border-primary/20',
  title,
  description,
  badge,
  badgeColor = 'bg-primary/15 text-primary border-primary/20',
  centered = true,
}: PageHeroProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      {icon && (
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-5 ${iconBg}`}>
          {icon}
        </div>
      )}
      {badge && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
            {badge}
          </span>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export function StatCard({ icon: Icon, value, label, color = 'text-primary' }: {
  icon: React.ElementType;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, description, color, badge, badgeColor }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors group">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            {badge && badgeColor && (
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ icon: Icon, iconBg, title, description, badge, badgeColor }: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {badge && badgeColor && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
