import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import BlocklistPage from "@/pages/blocklist-page";
import AnalyticsPage from "@/pages/analytics-page";
import SettingsPage from "@/pages/settings-page";
import SessionHistoryPage from "@/pages/session-history-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { SiteBlockedOverlay } from "@/components/site-blocked-overlay";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/blocklist" component={BlocklistPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/history" component={SessionHistoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WebsiteBlocker() {
  const [showBlockOverlay, setShowBlockOverlay] = useState(false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false);
  
  // When the user is authenticated, fetch their blocked sites and active session status
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          setIsAuthenticated(true);
          
          // Fetch blocked domains
          const blockedRes = await fetch('/api/blocked-sites');
          if (blockedRes.ok) {
            const sites = await blockedRes.json();
            setBlockedDomains(sites.map((site: any) => site.domain.toLowerCase()));
          }
          
          // Check if there's an active session
          const sessionsRes = await fetch('/api/sessions');
          if (sessionsRes.ok) {
            const sessions = await sessionsRes.json();
            const activeSession = sessions.find((session: any) => 
              !session.isCompleted && !session.isInterrupted && !session.endTime
            );
            setIsActiveSession(!!activeSession);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    }
    
    checkAuth();
    
    // Poll every 30 seconds to update status
    const intervalId = setInterval(checkAuth, 30000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Check if current site is blocked when domains or session status changes
  useEffect(() => {
    if (!isAuthenticated || !isActiveSession || blockedDomains.length === 0) {
      return;
    }
    
    const currentDomain = window.location.hostname.toLowerCase();
    
    const isBlocked = blockedDomains.some(domain => {
      // Exact match or subdomain check
      return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
    });
    
    if (isBlocked) {
      setShowBlockOverlay(true);
    }
  }, [isAuthenticated, isActiveSession, blockedDomains]);
  
  // Add event listener to block navigation to blocked sites
  useEffect(() => {
    if (!isAuthenticated || !isActiveSession || blockedDomains.length === 0) {
      return;
    }
    
    function blockNavigation(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        const url = new URL(href, window.location.origin);
        const domain = url.hostname.toLowerCase();
        
        const isBlocked = blockedDomains.some(blockedDomain => {
          return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`);
        });
        
        if (isBlocked) {
          e.preventDefault();
          setShowBlockOverlay(true);
        }
      } catch (error) {
        // URL parsing failed, might be a relative URL
      }
    }
    
    document.addEventListener('click', blockNavigation, true);
    return () => document.removeEventListener('click', blockNavigation, true);
  }, [isAuthenticated, isActiveSession, blockedDomains]);
  
  return showBlockOverlay ? (
    <SiteBlockedOverlay 
      domain={window.location.hostname} 
      onClose={() => setShowBlockOverlay(false)} 
    />
  ) : null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="focus-flow-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <WebsiteBlocker />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
