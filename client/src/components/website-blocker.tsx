import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockedSite } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Shield, X, ArrowLeft, AlertTriangle } from "lucide-react";
import { formatTime } from "@/lib/utils";

export function WebsiteBlocker() {
  const [showBlockOverlay, setShowBlockOverlay] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes in seconds
  const [currentDomain, setCurrentDomain] = useState("");
  
  // Fetch the list of blocked sites
  const { data: blockedSites } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Fetch current sessions to check for active ones
  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 5000, // Check for active sessions every 5 seconds
  });
  
  // Helper to check if a domain is blocked
  const isDomainBlocked = useCallback((domain: string) => {
    if (!blockedSites || blockedSites.length === 0) return false;
    
    const normalizedDomain = domain.toLowerCase();
    return blockedSites.some(site => {
      const blockedDomain = site.domain.toLowerCase();
      return normalizedDomain === blockedDomain || 
             normalizedDomain.endsWith(`.${blockedDomain}`);
    });
  }, [blockedSites]);
  
  // Check for active sessions and if we should block
  useEffect(() => {
    if (!sessions) return;
    
    // Find any active session (not completed, not interrupted, no end time)
    const active = sessions.find((session: any) => 
      !session.isCompleted && !session.isInterrupted && !session.endTime
    );
    
    setActiveSession(active || null);
    
    // If we have an active session, check the current domain
    if (active) {
      // Calculate time elapsed since session started
      const startTime = new Date(active.startTime);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // Set a default session length of 25 minutes (1500 seconds)
      const sessionLength = 25 * 60;
      const remaining = Math.max(0, sessionLength - elapsedSeconds);
      setTimeLeft(remaining);
      
      // Store the focus mode status in localStorage for potential cross-tab blocking
      localStorage.setItem("focusflow_focus_mode", "active");
      localStorage.setItem("focusflow_focus_end", (Date.now() + remaining * 1000).toString());
      
      // Check if current domain is blocked
      const currentDomain = window.location.hostname.toLowerCase();
      setCurrentDomain(currentDomain);
      
      if (isDomainBlocked(currentDomain)) {
        setShowBlockOverlay(true);
      }
    } else {
      // No active session
      localStorage.removeItem("focusflow_focus_mode");
      localStorage.removeItem("focusflow_focus_end");
      setShowBlockOverlay(false);
    }
  }, [sessions, isDomainBlocked]);
  
  // Check for clicks on links to blocked sites
  useEffect(() => {
    if (!activeSession || !blockedSites || blockedSites.length === 0) return;
    
    const handleClick = (e: MouseEvent) => {
      // Get target element
      const target = e.target as HTMLElement;
      
      // Find closest anchor tag
      const link = target.closest('a');
      if (!link) return;
      
      // Get href attribute
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        // Parse the URL
        const url = new URL(href, window.location.origin);
        const domain = url.hostname.toLowerCase();
        
        // Check if domain is blocked
        if (isDomainBlocked(domain)) {
          e.preventDefault();
          e.stopPropagation();
          
          // Show the block overlay
          setCurrentDomain(domain);
          setShowBlockOverlay(true);
        }
      } catch (error) {
        // Invalid URL, probably a route change or page anchor
      }
    };
    
    // Listen for clicks with the capture phase
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [activeSession, blockedSites, isDomainBlocked]);
  
  // Update the timer countdown
  useEffect(() => {
    if (!activeSession) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSession]);
  
  if (!showBlockOverlay) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-lg overflow-hidden">
        <div className="bg-destructive text-destructive-foreground p-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Site Blocked</h2>
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-auto hover:bg-destructive/20"
            onClick={() => setShowBlockOverlay(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Focus Session Active</h3>
            <p className="text-center text-muted-foreground mb-2">
              <span className="font-medium text-foreground">{currentDomain}</span> is blocked during your focus session.
            </p>
            <div className="bg-muted w-full p-3 rounded-md text-center mt-2">
              <div className="text-sm text-muted-foreground mb-1">Time remaining</div>
              <div className="text-xl font-mono font-medium">{formatTime(timeLeft)}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowBlockOverlay(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to FocusFlow
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              This site is blocked to help you stay focused. You can access it once your session is complete.
            </p>
          </div>
        </div>
      </div>
      
      {blockedSites && blockedSites.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="text-center mb-1">Currently blocking:</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {blockedSites.map(site => (
              <span key={site.id} className="bg-muted px-2 py-1 rounded text-xs">
                {site.domain}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}