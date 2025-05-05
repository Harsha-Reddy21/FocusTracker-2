import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Session, BlockedSite } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, AlertTriangle, Globe, ArrowLeft } from "lucide-react";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { formatTime } from "@/lib/utils";

/**
 * A component that provides focus mode guidance and accountability
 * Since browsers prevent web apps from directly blocking other sites,
 * this provides a clear indicator and focus reminders
 */
export function FocusModeManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [attemptedSite, setAttemptedSite] = useState<string | null>(null);
  
  // Get pomodoro timer state
  const { timerState } = usePomodoro();
  
  // Fetch active sessions
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 3000, // Check frequently
  });
  
  // Fetch blocked sites
  const { data: blockedSites = [] } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
    refetchInterval: 5000,
  });
  
  // Check if there's an active session
  const activeSession = sessions.find(session => 
    !session.isCompleted && !session.isInterrupted && !session.endTime
  );
  
  // Timer for session remaining time
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // Default 25 minutes
  
  // Update remaining time
  useEffect(() => {
    if (!activeSession) return;
    
    // Calculate time remaining
    const startTime = new Date(activeSession.startTime).getTime();
    const elapsedMs = Date.now() - startTime;
    const sessionLengthMs = 25 * 60 * 1000; // Default 25 minutes
    const remainingMs = Math.max(0, sessionLengthMs - elapsedMs);
    setTimeRemaining(Math.floor(remainingMs / 1000));
    
    // Set up timer to count down
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSession]);
  
  // Show focus mode indicator when a session is active
  useEffect(() => {
    if (activeSession && timerState === "running") {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setIsMinimized(false);
    }
  }, [activeSession, timerState]);
  
  // Listen for when user tries to navigate away
  useEffect(() => {
    if (!activeSession) return;
    
    // Function to handle before user leaves the page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only if they're leaving during an active focus session
      if (timerState === "running") {
        e.preventDefault();
        // Modern browsers no longer allow customizing this message
        // but we'll set it anyway
        e.returnValue = "Are you sure you want to leave during a focus session?";
        return e.returnValue;
      }
    };
    
    // Handle actual navigation attempts
    const handleClickCapture = (e: MouseEvent) => {
      if (timerState !== "running") return;
      
      // Find if the click was on a link
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        // Check if this is an external link
        const url = new URL(href, window.location.origin);
        
        // If it's not on our domain and we're in a focus session
        if (url.origin !== window.location.origin) {
          // Check if this domain is on the block list
          const domain = url.hostname;
          
          const isBlocked = blockedSites.some(site => {
            const blockedDomain = site.domain.toLowerCase();
            return domain === blockedDomain || 
                   domain.endsWith(`.${blockedDomain}`);
          });
          
          if (isBlocked) {
            // Prevent the default navigation
            e.preventDefault();
            e.stopPropagation();
            
            // Show accountability reminder
            setAttemptedSite(domain);
            setIsMinimized(false);
            setIsOpen(true);
          }
        }
      } catch (error) {
        // Not a valid URL or other issue
      }
    };
    
    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClickCapture, true);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClickCapture, true);
    };
  }, [activeSession, timerState, blockedSites]);
  
  if (!isOpen) return null;
  
  return (
    <>
      {isMinimized ? (
        // Minimized focus indicator
        <div 
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg cursor-pointer z-50"
          onClick={() => setIsMinimized(false)}
        >
          <Shield className="h-6 w-6" />
        </div>
      ) : (
        // Full focus mode reminder
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-10 duration-300">
          <Card className="overflow-hidden shadow-lg border-primary/20">
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">Focus Session Active</h3>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(true)}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              {attemptedSite ? (
                // Show warning when user tries to visit a blocked site
                <div className="flex flex-col items-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-2">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-semibold mb-1">Focus Reminder</h4>
                  <p className="text-sm text-center text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">{attemptedSite}</span> is on your blocked list. 
                    Consider staying focused on your current task.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={() => setAttemptedSite(null)}
                  >
                    Return to Focus
                  </Button>
                </div>
              ) : (
                // Regular focus mode dashboard
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-medium">Focus Protection</span>
                    </div>
                    <div className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                  
                  {blockedSites && blockedSites.length > 0 ? (
                    <div className="text-sm mb-2">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Globe className="h-3 w-3" />
                        <span className="text-xs">Blocked Sites</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {blockedSites.map(site => (
                          <span 
                            key={site.id}
                            className="text-xs bg-muted px-2 py-0.5 rounded"
                          >
                            {site.domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-2">
                      No sites are currently blocked. Add sites to your blocklist
                      to maximize focus.
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-1">
                    Stay focused! Your productive session is in progress.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}