import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockedSite } from "@shared/schema";

interface PomodoroBlockingContextType {
  isBlockingActive: boolean;
  blockedSites: BlockedSite[];
}

const PomodoroBlockingContext = createContext<PomodoroBlockingContextType>({
  isBlockingActive: false,
  blockedSites: []
});

export function usePomodoroBlocking() {
  return useContext(PomodoroBlockingContext);
}

export function PomodoroBlockingProvider({ children }: { children: ReactNode }) {
  const [isBlockingActive, setIsBlockingActive] = useState(false);
  
  // Get the list of blocked sites
  const { data: blockedSites } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
  });
  
  // Poll for active sessions
  useEffect(() => {
    const checkForActiveSessions = async () => {
      try {
        // Check if user is authenticated
        const authRes = await fetch('/api/user');
        if (!authRes.ok) {
          setIsBlockingActive(false);
          return;
        }
        
        // Check for active focus sessions
        const sessionsRes = await fetch('/api/sessions');
        if (!sessionsRes.ok) {
          setIsBlockingActive(false);
          return;
        }
        
        const sessions = await sessionsRes.json();
        
        // Find active session (not completed, not interrupted, no end time)
        const activeSession = sessions.find((session: any) => 
          !session.isCompleted && !session.isInterrupted && !session.endTime
        );
        
        setIsBlockingActive(!!activeSession);
      } catch (error) {
        console.error("Error checking for active sessions:", error);
        setIsBlockingActive(false);
      }
    };
    
    // Check immediately
    checkForActiveSessions();
    
    // Then set up polling every 30 seconds
    const intervalId = setInterval(checkForActiveSessions, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <PomodoroBlockingContext.Provider value={{
      isBlockingActive,
      blockedSites: blockedSites || []
    }}>
      {children}
    </PomodoroBlockingContext.Provider>
  );
}