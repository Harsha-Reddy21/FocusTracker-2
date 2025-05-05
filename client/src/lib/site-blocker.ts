/**
 * Site Blocker Utility
 * 
 * This utility provides functions to manage website blocking during focus sessions.
 * It uses localStorage to persist blocking information across tabs/windows.
 */

// Local storage keys
const BLOCKED_DOMAINS_KEY = 'focusflow_blocked_domains';
const BLOCKING_ACTIVE_KEY = 'focusflow_blocking_active';
const BLOCKING_TIMESTAMP_KEY = 'focusflow_blocking_timestamp';

// Types
type BlockedDomainInfo = {
  domains: string[];
  lastUpdated: number;
};

/**
 * Activate website blocking with the given domains
 */
export function activateBlocking(domains: string[]): void {
  const timestamp = Date.now();
  const cleanDomains = domains.map(d => d.toLowerCase().trim());
  
  // Store blocking info
  localStorage.setItem(BLOCKED_DOMAINS_KEY, JSON.stringify({
    domains: cleanDomains,
    lastUpdated: timestamp
  }));
  localStorage.setItem(BLOCKING_ACTIVE_KEY, 'true');
  localStorage.setItem(BLOCKING_TIMESTAMP_KEY, timestamp.toString());
  
  // Broadcast to other tabs
  const event = new CustomEvent('focusflow_blocking_changed', {
    detail: {
      active: true,
      domains: cleanDomains,
      timestamp
    }
  });
  window.dispatchEvent(event);
  
  console.log('Website blocking activated', { domains: cleanDomains });
}

/**
 * Deactivate website blocking
 */
export function deactivateBlocking(): void {
  localStorage.setItem(BLOCKING_ACTIVE_KEY, 'false');
  
  // Broadcast to other tabs
  const event = new CustomEvent('focusflow_blocking_changed', {
    detail: {
      active: false,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
  
  console.log('Website blocking deactivated');
}

/**
 * Check if blocking is currently active
 */
export function isBlockingActive(): boolean {
  return localStorage.getItem(BLOCKING_ACTIVE_KEY) === 'true';
}

/**
 * Get the list of currently blocked domains
 */
export function getBlockedDomains(): string[] {
  try {
    const data = localStorage.getItem(BLOCKED_DOMAINS_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data) as BlockedDomainInfo;
    return parsed.domains || [];
  } catch (error) {
    console.error('Error retrieving blocked domains:', error);
    return [];
  }
}

/**
 * Check if a specific domain is blocked
 */
export function isDomainBlocked(domain: string): boolean {
  if (!isBlockingActive()) return false;
  
  const blockedDomains = getBlockedDomains();
  const normalizedDomain = domain.toLowerCase().trim();
  
  return blockedDomains.some(blockedDomain => {
    return normalizedDomain === blockedDomain || 
           normalizedDomain.endsWith(`.${blockedDomain}`);
  });
}

/**
 * Listen for blocking status changes
 */
export function listenForBlockingChanges(callback: (active: boolean, domains: string[]) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { active, domains } = customEvent.detail;
    callback(active, domains || []);
  };
  
  window.addEventListener('focusflow_blocking_changed', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('focusflow_blocking_changed', handler);
  };
}