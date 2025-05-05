import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockedSite } from "@shared/schema";
import { usePomodoro } from "./use-pomodoro";

export function useSiteBlocker() {
  const { timerState, timerMode } = usePomodoro();
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  
  // Get the list of blocked sites
  const { data: blockedSites } = useQuery<BlockedSite[]>({
    queryKey: ["/api/blocked-sites"],
  });
  
  // Should we be blocking? Only during work sessions that are running
  const shouldBlock = timerState === "running" && timerMode === "work";
  
  // Keep track of blocking state
  useEffect(() => {
    setIsBlocking(shouldBlock);
    
    // Store blocking state in localStorage for cross-tab blocking
    if (shouldBlock) {
      localStorage.setItem("focusflow_blocking", "active");
    } else {
      localStorage.setItem("focusflow_blocking", "inactive");
    }
  }, [shouldBlock]);
  
  // Function to check if a URL is blocked
  const isUrlBlocked = (url: string): boolean => {
    if (!isBlocking || !blockedSites || blockedSites.length === 0) {
      return false;
    }
    
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Check if hostname matches any blocked site
      return blockedSites.some(site => {
        const domain = site.domain.toLowerCase();
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });
    } catch (error) {
      return false;
    }
  };
  
  // Check current URL when blocking state or blocklist changes
  useEffect(() => {
    if (!isBlocking || !blockedSites) {
      setBlockedUrl(null);
      return;
    }
    
    // Check if current URL is blocked
    if (isUrlBlocked(window.location.href)) {
      setBlockedUrl(window.location.href);
    } else {
      setBlockedUrl(null);
    }
  }, [isBlocking, blockedSites]);
  
  // Listen for navigation events
  useEffect(() => {
    if (!isBlocking) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (!link) return;
      
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }
      
      try {
        const absoluteUrl = new URL(href, window.location.origin).href;
        
        if (isUrlBlocked(absoluteUrl)) {
          e.preventDefault();
          e.stopPropagation();
          setBlockedUrl(absoluteUrl);
        }
      } catch (error) {
        // Invalid URL, ignore
      }
    };
    
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isBlocking, blockedSites]);
  
  return {
    isBlocking,
    blockedUrl,
    isUrlBlocked,
    blockedSites: blockedSites || []
  };
}