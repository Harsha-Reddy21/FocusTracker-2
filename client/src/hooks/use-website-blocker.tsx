import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { BlockedSite } from "@shared/schema";
import { useMemo } from "react";

export function useWebsiteBlocker() {
  const { timerState, timerMode } = usePomodoro();
  const [isBlocking, setIsBlocking] = useState(false);
  
  // Get the list of blocked sites
  const { data: blockedSites } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
  });
  
  // Should we block websites? Only during work sessions
  const shouldBlock = useMemo(() => {
    return timerState === "running" && timerMode === "work";
  }, [timerState, timerMode]);
  
  // Format the blocked domains for easy checking
  const blockedDomains = useMemo(() => {
    return blockedSites?.map(site => site.domain.toLowerCase()) || [];
  }, [blockedSites]);
  
  // Check if current URL is in the blocklist
  const isCurrentSiteBlocked = useMemo(() => {
    if (!shouldBlock || !blockedDomains.length) return false;
    
    const currentDomain = window.location.hostname.toLowerCase();
    return blockedDomains.some(domain => {
      // Exact match or subdomain (e.g., mail.google.com should be blocked if google.com is in the list)
      return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
    });
  }, [shouldBlock, blockedDomains]);
  
  // Effect to update blocking state
  useEffect(() => {
    setIsBlocking(shouldBlock);
  }, [shouldBlock]);
  
  // Function to block attempt to navigate to blocked sites
  const blockNavigation = useMemo(() => {
    return function blockNavigationHandler(e: MouseEvent) {
      if (!isBlocking || !blockedDomains.length) return;
      
      // Get the clicked element
      const target = e.target as HTMLElement;
      
      // Find the closest anchor tag
      const link = target.closest('a');
      if (!link) return;
      
      // Get the URL
      const href = link.getAttribute('href');
      if (!href) return;
      
      try {
        // Parse the URL
        const url = new URL(href, window.location.origin);
        const domain = url.hostname.toLowerCase();
        
        // Check if the domain is blocked
        const isBlocked = blockedDomains.some(blockedDomain => {
          return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`);
        });
        
        if (isBlocked) {
          e.preventDefault();
          alert(`This site (${domain}) is blocked during focus sessions. Finish your work session to access it.`);
        }
      } catch (error) {
        // URL parsing failed, might be a relative URL or invalid
        // We don't need to block navigation in this case
      }
    };
  }, [isBlocking, blockedDomains]);
  
  // Effect to add/remove the event listener
  useEffect(() => {
    // Add listener to capture clicks before they happen
    document.addEventListener('click', blockNavigation, true);
    
    return () => {
      document.removeEventListener('click', blockNavigation, true);
    };
  }, [blockNavigation]);
  
  // Return current state of website blocking
  return {
    isBlocking,
    isCurrentSiteBlocked,
    blockedDomains
  };
}