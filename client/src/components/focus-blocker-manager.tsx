import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockedSite, Session } from "@shared/schema";
import { 
  initBlocker, 
  setActiveSession, 
  setBlockedSites, 
  endSession 
} from "@/lib/blocker-extension";

/**
 * Invisible component that manages the focus blocker functionality
 * This initializes and updates the website blocker "extension"
 */
export function FocusBlockerManager() {
  // Fetch blocked sites
  const { data: blockedSites } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch active sessions
  const { data: sessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Initialize the blocker system
  useEffect(() => {
    console.log("Initializing website blocker system");
    initBlocker();
  }, []);

  // Update blocked sites when they change
  useEffect(() => {
    if (blockedSites) {
      console.log("Updating blocked sites:", blockedSites);
      setBlockedSites(blockedSites);
    }
  }, [blockedSites]);

  // Update active session when it changes
  useEffect(() => {
    if (!sessions || sessions.length === 0) {
      console.log("No active sessions found");
      endSession();
      return;
    }

    // Find the active session (not completed, not interrupted, no end time)
    const activeSession = sessions.find(session => 
      !session.isCompleted && !session.isInterrupted && !session.endTime
    );

    if (activeSession) {
      console.log("Active session found:", activeSession);
      setActiveSession({
        startTime: activeSession.startTime,
        isActive: true
      });
    } else {
      console.log("No active session found in sessions list");
      endSession();
    }
  }, [sessions]);

  // This component doesn't render anything, it just manages the blocking system
  return null;
}