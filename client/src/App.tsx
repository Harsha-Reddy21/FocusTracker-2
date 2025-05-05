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
import { BlockPage } from "@/components/block-page";
import { PomodoroBlockingProvider, usePomodoroBlocking } from "@/components/pomodoro-provider";

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
  const [showBlockPage, setShowBlockPage] = useState(false);
  const { isBlockingActive, blockedSites } = usePomodoroBlocking();
  
  // Listen for tab visibility changes to check for blocked sites when returning to tab
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && isBlockingActive) {
        // If user returns to a tab with active focus session,
        // check if current domain is blocked
        checkIfCurrentSiteBlocked();
      }
    }
    
    // Check if current URL is on the blocklist during active focus session
    function checkIfCurrentSiteBlocked() {
      try {
        if (!blockedSites || blockedSites.length === 0) return;
        
        // Check current domain
        const currentDomain = window.location.hostname.toLowerCase();
        
        // Check if the current domain is blocked
        const isBlocked = blockedSites.some(site => {
          const domain = site.domain.toLowerCase();
          return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
        });
        
        if (isBlocked) {
          setShowBlockPage(true);
        }
      } catch (error) {
        console.error("Error checking blocked status:", error);
      }
    }
    
    // Check on mount and when focus mode changes
    if (isBlockingActive) {
      checkIfCurrentSiteBlocked();
    } else {
      setShowBlockPage(false);
    }
    
    // Listen for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isBlockingActive, blockedSites]);
  
  // Block attempts to navigate to blocked sites
  useEffect(() => {
    if (!isBlockingActive || !blockedSites || blockedSites.length === 0) return;
    
    const blockNavigation = (e: MouseEvent) => {
      try {
        // Get the clicked element
        const target = e.target as HTMLElement;
        
        // Find the closest anchor tag
        const link = target.closest('a');
        if (!link) return;
        
        // Get the URL
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Try to parse the URL (could be relative)
        let url;
        try {
          url = new URL(href, window.location.origin);
        } catch {
          // Not a valid URL, probably a route change within the app
          return;
        }
        
        // Check if the URL's domain is blocked
        const domain = url.hostname.toLowerCase();
        const isBlocked = blockedSites.some(site => {
          const blockedDomain = site.domain.toLowerCase();
          return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`);
        });
        
        if (isBlocked) {
          e.preventDefault();
          setShowBlockPage(true);
        }
      } catch (error) {
        console.error("Error in blockNavigation:", error);
      }
    };
    
    // Add the click handler with capture phase to catch clicks before they're processed
    document.addEventListener('click', blockNavigation, true);
    
    return () => {
      document.removeEventListener('click', blockNavigation, true);
    };
  }, [isBlockingActive, blockedSites]);
  
  // Render the block page during active focus sessions when blocked
  return showBlockPage && isBlockingActive ? <BlockPage /> : null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="focus-flow-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PomodoroBlockingProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <WebsiteBlocker />
            </TooltipProvider>
          </PomodoroBlockingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
