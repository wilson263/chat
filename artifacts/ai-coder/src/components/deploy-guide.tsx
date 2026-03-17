import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Database, Globe, Key, Terminal, Rocket } from 'lucide-react';

interface DeployGuideProps {
  open: boolean;
  onClose: () => void;
}

const Step = ({ num, icon: Icon, title, children }: { num: number; icon: any; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">{num}</div>
      <div className="w-px flex-1 bg-border/50 mt-2"></div>
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  </div>
);

const Code = ({ children }: { children: string }) => (
  <code className="bg-muted/60 border border-border/50 rounded px-2 py-0.5 font-mono text-xs text-foreground/90">{children}</code>
);

export function DeployGuide({ open, onClose }: DeployGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy to Render — Complete Guide
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Build Settings Box */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Build Settings
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Runtime:</p>
                <Code>Node</Code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Build Command:</p>
                <div className="bg-background/80 border border-border rounded-lg p-3 font-mono text-xs text-green-400 break-all">
                  npm install -g pnpm && pnpm install --no-frozen-lockfile && NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/ai-coder run build && pnpm --filter @workspace/api-server run build && cp -r artifacts/ai-coder/dist/public artifacts/api-server/dist/public
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Start Command:</p>
                <div className="bg-background/80 border border-border rounded-lg p-3 font-mono text-xs text-blue-400">
                  node artifacts/api-server/dist/index.cjs
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Health Check Path:</p>
                <Code>/api/healthz</Code>
              </div>
            </div>
          </div>

          {/* Environment Variables Box */}
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 mb-6">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-yellow-400" /> Environment Variables
            </h3>
            <div className="space-y-2">
              {[
                { key: "NODE_ENV", value: "production", auto: true },
                { key: "DATABASE_URL", value: "From Render DB (auto-linked)", auto: true },
                { key: "AI_INTEGRATIONS_OPENAI_BASE_URL", value: "https://api.openai.com/v1", auto: false },
                { key: "AI_INTEGRATIONS_OPENAI_API_KEY", value: "sk-... (from platform.openai.com)", auto: false },
              ].map(({ key, value, auto }) => (
                <div key={key} className="flex items-start gap-3 bg-background/50 border border-border/40 rounded-lg px-3 py-2">
                  <code className="font-mono text-xs text-primary font-semibold min-w-fit">{key}</code>
                  <span className="text-xs text-muted-foreground flex-1">=  {value}</span>
                  <Badge variant={auto ? "secondary" : "outline"} className="text-[10px] shrink-0">{auto ? "auto" : "manual"}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Step by Step Guide */}
          <h3 className="font-bold text-foreground mb-4">Step-by-Step Deployment</h3>
          <div>
            <Step num={1} icon={Globe} title="Push Code to GitHub">
              <p>Push your project to a GitHub repository (public or private).</p>
              <p className="mt-1">Go to <span className="text-primary">github.com</span> → New repository → Push your code.</p>
            </Step>

            <Step num={2} icon={Rocket} title="Create Render Account">
              <p>Go to <span className="text-primary">render.com</span> and sign up for a free account.</p>
              <p className="mt-1">Connect your GitHub account when prompted.</p>
            </Step>

            <Step num={3} icon={Database} title="Deploy via Blueprint">
              <p>Click <strong className="text-foreground">New +</strong> → <strong className="text-foreground">Blueprint</strong></p>
              <p>Select your GitHub repository.</p>
              <p>Render auto-detects the <Code>render.yaml</Code> file and creates:</p>
              <ul className="mt-1 ml-4 space-y-1 list-disc">
                <li>A free PostgreSQL database</li>
                <li>A web service running your app</li>
              </ul>
            </Step>

            <Step num={4} icon={Key} title="Set OpenAI Environment Variables">
              <p>In Render dashboard → your web service → <strong className="text-foreground">Environment</strong></p>
              <p>Add these two variables manually:</p>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li><Code>AI_INTEGRATIONS_OPENAI_BASE_URL</Code> = <Code>https://api.openai.com/v1</Code></li>
                <li><Code>AI_INTEGRATIONS_OPENAI_API_KEY</Code> = your key from <span className="text-primary">platform.openai.com</span></li>
              </ul>
              <p className="mt-2">Get your API key: <span className="text-primary">platform.openai.com</span> → API Keys → Create new key</p>
            </Step>

            <Step num={5} icon={Terminal} title="Run Database Migration">
              <p>After first deploy, go to your web service → <strong className="text-foreground">Shell</strong> tab in Render.</p>
              <p>Run:</p>
              <div className="mt-1 bg-background/80 border border-border rounded px-3 py-2 font-mono text-xs text-green-400">
                pnpm --filter @workspace/db run push
              </div>
            </Step>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <div className="pb-2">
                <h3 className="font-semibold text-green-400 text-sm mb-1">Your app is live!</h3>
                <p className="text-sm text-muted-foreground">
                  Render gives you a free URL like <Code>your-app.onrender.com</Code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
