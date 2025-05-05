/**
 * This module simulates a browser extension's behavior within the limits of a web application.
 * It uses localStorage to communicate between tabs and intercepts navigation attempts.
 */

// Constants
const ACTIVE_SESSION_KEY = 'focusflow_active_session';
const BLOCKED_SITES_KEY = 'focusflow_blocked_sites';
const LAST_CHECK_KEY = 'focusflow_last_check';

// Types
type ActiveSession = {
  startTime: string;
  endTime?: string;
  isActive: boolean;
};

type BlockedSite = {
  id: number;
  domain: string;
};

/**
 * Initialize the blocker system
 */
export function initBlocker() {
  // Clean up any old data
  if (!isSessionActive()) {
    removeBlockerData();
  }

  // Set up event listeners
  document.addEventListener('click', handleLinkClick, true);
  window.addEventListener('beforeunload', checkBeforeUnload);
  
  // Set up periodic check for active sessions
  setInterval(checkCurrentPage, 1000);
  
  // Check the current page immediately
  checkCurrentPage();
}

/**
 * Store the active session data in localStorage
 */
export function setActiveSession(session: ActiveSession) {
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  
  // Force an immediate check after setting a new session
  checkCurrentPage();
}

/**
 * Store the blocked sites list in localStorage
 */
export function setBlockedSites(sites: BlockedSite[]) {
  localStorage.setItem(BLOCKED_SITES_KEY, JSON.stringify(sites));
}

/**
 * Check if there is an active session
 */
export function isSessionActive(): boolean {
  const sessionData = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!sessionData) return false;
  
  try {
    const session = JSON.parse(sessionData) as ActiveSession;
    
    // If the session has an end time or is explicitly marked as inactive, it's not active
    if (session.endTime || session.isActive === false) return false;
    
    // Check if the session is still within its time window
    const startTime = new Date(session.startTime).getTime();
    const currentTime = Date.now();
    const sessionLength = 25 * 60 * 1000; // Default 25 minutes in milliseconds
    
    return currentTime < (startTime + sessionLength);
  } catch (error) {
    console.error('Error parsing session data:', error);
    return false;
  }
}

/**
 * End the active session
 */
export function endSession() {
  const sessionData = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!sessionData) return;
  
  try {
    const session = JSON.parse(sessionData) as ActiveSession;
    session.endTime = new Date().toISOString();
    session.isActive = false;
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error ending session:', error);
  }
}

/**
 * Check if a given URL should be blocked
 */
export function shouldBlockUrl(url: string): boolean {
  if (!isSessionActive()) return false;
  
  const sitesData = localStorage.getItem(BLOCKED_SITES_KEY);
  if (!sitesData) return false;
  
  try {
    const sites = JSON.parse(sitesData) as BlockedSite[];
    if (!sites || sites.length === 0) return false;
    
    // Parse the URL to get its domain
    let domain: string;
    try {
      domain = new URL(url).hostname.toLowerCase();
    } catch {
      // If URL parsing fails, it might be a relative URL
      domain = new URL(url, window.location.origin).hostname.toLowerCase();
    }
    
    // Check if the domain matches any blocked site
    return sites.some(site => {
      const blockedDomain = site.domain.toLowerCase();
      return domain === blockedDomain || 
             domain.endsWith(`.${blockedDomain}`);
    });
  } catch (error) {
    console.error('Error checking if URL should be blocked:', error);
    return false;
  }
}

/**
 * Handle clicks on links to potentially block them
 */
function handleLinkClick(event: MouseEvent) {
  if (!isSessionActive()) return;
  
  // Find the clicked link
  const target = event.target as HTMLElement;
  const link = target.closest('a');
  if (!link) return;
  
  const href = link.getAttribute('href');
  if (!href) return;
  
  try {
    // Check if this is a link to a blocked site
    const fullUrl = new URL(href, window.location.origin).href;
    
    if (shouldBlockUrl(fullUrl)) {
      console.log('Blocking navigation to:', fullUrl);
      
      // Prevent the default navigation
      event.preventDefault();
      event.stopPropagation();
      
      // Instead of navigating, show a blocked page overlay
      showBlockedOverlay(fullUrl);
    }
  } catch (error) {
    // Might be an invalid URL or other issue
    console.error('Error handling link click:', error);
  }
}

/**
 * Check the current page to see if it should be blocked
 */
function checkCurrentPage() {
  // Throttle checks to avoid excessive processing
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const now = Date.now();
  
  if (lastCheck && (now - parseInt(lastCheck)) < 500) {
    return; // Don't check more often than every 500ms
  }
  
  localStorage.setItem(LAST_CHECK_KEY, now.toString());
  
  if (!isSessionActive()) return;
  
  const currentUrl = window.location.href;
  
  if (shouldBlockUrl(currentUrl)) {
    console.log('Current page should be blocked:', currentUrl);
    showBlockedOverlay(currentUrl);
  }
}

/**
 * Show the blocked page overlay
 */
function showBlockedOverlay(blockedUrl: string) {
  // Check if overlay already exists
  if (document.getElementById('focus-flow-blocker-overlay')) return;
  
  // Create the overlay
  const overlay = document.createElement('div');
  overlay.id = 'focus-flow-blocker-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.95)'; // Dark blue background
  overlay.style.backdropFilter = 'blur(8px)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  
  // Create the content container
  const container = document.createElement('div');
  container.style.backgroundColor = 'white';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  container.style.width = '450px';
  container.style.maxWidth = '90%';
  container.style.overflow = 'hidden';
  
  // Header
  const header = document.createElement('div');
  header.style.backgroundColor = '#ef4444'; // Red
  header.style.color = 'white';
  header.style.padding = '16px';
  header.style.fontWeight = 'bold';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '8px';
  header.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
    </svg>
    <span>Site Blocked</span>
  `;
  
  // Body
  const body = document.createElement('div');
  body.style.padding = '24px';
  
  try {
    // Extract domain for display
    const url = new URL(blockedUrl);
    const domain = url.hostname;
    
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
        <div style="width: 80px; height: 80px; background-color: #fee2e2; border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
            <path d="M12 13h.01"></path>
            <path d="M16 9h.01"></path>
            <path d="M8 9h.01"></path>
            <path d="M16 17h.01"></path>
            <path d="M8 17h.01"></path>
          </svg>
        </div>
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Focus Session Active</h2>
        <p style="text-align: center; color: #64748b; margin-bottom: 8px;">
          <strong style="color: #0f172a;">${domain}</strong> is blocked during your focus session.
        </p>
        <div style="background-color: #f1f5f9; width: 100%; padding: 12px; border-radius: 6px; text-align: center; margin-top: 8px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Time remaining in session</div>
          <div id="focus-flow-time-remaining" style="font-size: 20px; font-weight: 500; font-family: monospace;">25:00</div>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="focus-flow-back-button" style="width: 100%; padding: 10px 16px; background-color: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 500; cursor: pointer;">
          Return to Previous Page
        </button>
        <button id="focus-flow-home-button" style="width: 100%; padding: 10px 16px; background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 500; cursor: pointer;">
          Go to FocusFlow Home
        </button>
      </div>
      
      <div style="margin-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #64748b;">
          This site is blocked to help you stay focused. You can access it once your session ends.
        </p>
      </div>
    `;
  } catch (error) {
    body.innerHTML = `
      <div style="text-align: center;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Site Blocked</h2>
        <p style="color: #64748b;">This site is blocked during your focus session.</p>
      </div>
    `;
  }
  
  // Assemble the overlay
  container.appendChild(header);
  container.appendChild(body);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  // Set up the timer
  updateRemainingTime();
  const timerInterval = setInterval(updateRemainingTime, 1000);
  
  // Add event listeners to buttons
  const backButton = document.getElementById('focus-flow-back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      overlay.remove();
      clearInterval(timerInterval);
      history.back();
    });
  }
  
  const homeButton = document.getElementById('focus-flow-home-button');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      overlay.remove();
      clearInterval(timerInterval);
      window.location.href = '/';
    });
  }
}

/**
 * Update the remaining time in the overlay
 */
function updateRemainingTime() {
  const timeElement = document.getElementById('focus-flow-time-remaining');
  if (!timeElement) return;
  
  const sessionData = localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!sessionData) {
    timeElement.textContent = '00:00';
    return;
  }
  
  try {
    const session = JSON.parse(sessionData) as ActiveSession;
    const startTime = new Date(session.startTime).getTime();
    const currentTime = Date.now();
    const sessionLength = 25 * 60 * 1000; // 25 minutes in milliseconds
    const endTime = startTime + sessionLength;
    
    if (currentTime >= endTime) {
      timeElement.textContent = '00:00';
      return;
    }
    
    const remainingMs = endTime - currentTime;
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error updating remaining time:', error);
    timeElement.textContent = '--:--';
  }
}

/**
 * Check before the user leaves the page
 */
function checkBeforeUnload(event: BeforeUnloadEvent) {
  const currentUrl = window.location.href;
  
  if (isSessionActive() && shouldBlockUrl(currentUrl)) {
    // This won't actually block navigation in most browsers,
    // but it's worth trying as a last resort
    event.preventDefault();
    event.returnValue = 'You are trying to access a blocked site during a focus session.';
    return event.returnValue;
  }
}

/**
 * Remove all blocker data from localStorage
 */
function removeBlockerData() {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
  // We don't remove BLOCKED_SITES_KEY since that's persistent configuration
}