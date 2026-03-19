import React, { useState, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import ChatPage from "@/pages/chat";
import Dashboard from "@/pages/dashboard";
import WorkspacePage from "@/pages/workspace";
import DeveloperPage from "@/pages/developer";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import OurAppsPage from "@/pages/our-apps";
import SettingsPage from "@/pages/settings";
import UsagePage from "@/pages/usage";
import AdminPage from "@/pages/admin";
import AnalyticsPage from "@/pages/analytics";
import ComparePage from "@/pages/compare";
import PlaygroundPage from "@/pages/playground";
import TemplatesPage from "@/pages/templates";
import PromptGeneratorPage from "@/pages/prompt-generator";
import ExplorePage from "@/pages/explore";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ZorvixIntro } from "@/components/zorvix-intro";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const PUBLIC_ROUTES = ["/login", "/signup", "/about", "/contact", "/our-apps", "/developer", "/analytics", "/compare", "/playground", "/templates", "/prompt-generator", "/explore"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.some(r => location === r || location.startsWith(r + "/"));
  if (!user && !isPublic) {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/our-apps" component={OurAppsPage} />
      <Route path="/" component={ChatPage} />
      <Route path="/projects" component={Dashboard} />
      <Route path="/workspace/:id" component={WorkspacePage} />
      <Route path="/developer" component={DeveloperPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/usage" component={UsagePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/playground" component={PlaygroundPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/prompt-generator" component={PromptGeneratorPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const AUTH_ROUTES = ["/login", "/signup"];

function App() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isAuthRoute = AUTH_ROUTES.some(r => currentPath === r || currentPath.endsWith(r));
  const alreadySeen = typeof window !== "undefined" && !!localStorage.getItem("zorvix_intro_seen");

  const [introComplete, setIntroComplete] = useState(isAuthRoute || alreadySeen);
  const handleIntroComplete = useCallback(() => {
    localStorage.setItem("zorvix_intro_seen", "1");
    setIntroComplete(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!introComplete && <ZorvixIntro onComplete={handleIntroComplete} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard>
            <Router />
            <OnboardingTour />
          </AuthGuard>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
