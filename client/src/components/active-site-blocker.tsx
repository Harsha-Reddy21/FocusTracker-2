import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockedSite, Session } from "@shared/schema";
import { Shield, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ActiveSiteBlocker() {
  // Fetch all blocked sites
  const { data: blockedSites = [] } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
    refetchInterval: 5000,
  });

  // Fetch active sessions
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 2000, 
  });

  // Track the active session
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  // Helper function to check if a given URL/domain is blocked
  const isBlocked = useCallback((url: string) => {
    if (!blockedSites || blockedSites.length === 0) return false;
    
    try {
      // Parse URL to get domain
      const domain = new URL(url).hostname.toLowerCase();
      
      // Check if domain matches any blocked sites
      return blockedSites.some(site => {
        const blockedDomain = site.domain.toLowerCase();
        return domain === blockedDomain || 
               domain.endsWith(`.${blockedDomain}`);
      });
    } catch (error) {
      return false; // Invalid URL
    }
  }, [blockedSites]);

  // Find active session
  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      setActiveSession(null);
      return;
    }

    // Find any active session (not completed, not interrupted, no end time)
    const active = sessions.find(session => 
      !session.isCompleted && !session.isInterrupted && !session.endTime
    );
    
    setActiveSession(active || null);
    
    if (active) {
      // Calculate time remaining
      const startTime = new Date(active.startTime);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const duration = 25 * 60; // Default 25 minutes in seconds
      setTimeRemaining(Math.max(0, duration - elapsed));
    }
  }, [sessions]);

  // Timer for countdown
  useEffect(() => {
    if (!activeSession) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSession]);

  // Set up event listeners to catch navigation attempts
  useEffect(() => {
    if (!activeSession || !blockedSites || blockedSites.length === 0) return;
    
    // Monitor all link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        // Create full URL (handles relative URLs)
        const url = new URL(href, window.location.origin).href;
        
        // Check if this URL is blocked
        if (isBlocked(url)) {
          e.preventDefault();
          e.stopPropagation();
          setCurrentUrl(url);
        }
      } catch (error) {
        // Invalid URL, might be a route change
      }
    };
    
    // Handle location change detection
    const checkCurrentLocation = () => {
      const currentLocation = window.location.href;
      if (isBlocked(currentLocation)) {
        setCurrentUrl(currentLocation);
      } else {
        setCurrentUrl(null);
      }
    };
    
    // Check initial location
    checkCurrentLocation();
    
    // Add listeners
    document.addEventListener('click', handleLinkClick, true);
    
    // Create a mutation observer to monitor DOM changes that might indicate navigation
    const observer = new MutationObserver(() => {
      checkCurrentLocation();
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    
    // Set up cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'focusflow_current_url') {
        checkCurrentLocation();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on visibility change (returning to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkCurrentLocation();
      }
    });
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', checkCurrentLocation);
    };
  }, [activeSession, blockedSites, isBlocked]);

  // If no active session or no blocked URL, don't render anything
  if (!activeSession || !currentUrl) return null;

  // Extract domain for display
  let displayDomain = currentUrl;
  try {
    displayDomain = new URL(currentUrl).hostname;
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-destructive overflow-hidden">
        <div className="bg-destructive text-destructive-foreground p-4 flex gap-2 items-center">
          <AlertTriangle size={18} />
          <h2 className="font-semibold">Site Blocked During Focus Session</h2>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Access Restricted</h3>
            <p className="text-center text-muted-foreground mb-3">
              <span className="font-semibold">{displayDomain}</span> is blocked 
              during your active focus session
            </p>
            
            <div className="bg-muted p-3 rounded-md w-full text-center mt-2">
              <div className="text-xs text-muted-foreground mb-1">Time remaining in focus session:</div>
              <div className="text-xl font-mono font-medium">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => window.history.back()}
            >
              Return to Previous Page
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Go to FocusFlow Home
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              This site is blocked to help you stay focused.
              You can access it once your focus session ends.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}