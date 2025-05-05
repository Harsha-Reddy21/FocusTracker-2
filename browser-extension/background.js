// FocusFlow Browser Extension
// Background.js - Core blocking functionality

// Extension state
let isActive = false;
let sessionStartTime = null;
let sessionDuration = 0;
let blockedSites = [];
let blockPageUrl = chrome.runtime.getURL('block.html');

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(initialize);

// On startup, check if we're in an active session
chrome.runtime.onStartup.addListener(initialize);

// Listen for navigation events to check for blocked sites
chrome.webNavigation.onBeforeNavigate.addListener(checkNavigation);

// Message handlers from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    sendResponse({
      isActive,
      sessionStartTime,
      sessionDuration,
      blockedSites,
      timeRemaining: getTimeRemaining()
    });
    return true;
  }
  
  if (message.type === 'START_SESSION') {
    startFocusSession(message.duration, message.sites)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'END_SESSION') {
    endFocusSession()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'SYNC_WITH_APP') {
    syncWithApp(message.apiUrl)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Initialize extension state
async function initialize() {
  try {
    // Load saved state
    const data = await chrome.storage.local.get([
      'isActive', 
      'sessionStartTime',
      'sessionDuration',
      'blockedSites'
    ]);
    
    isActive = data.isActive || false;
    sessionStartTime = data.sessionStartTime ? new Date(data.sessionStartTime) : null;
    sessionDuration = data.sessionDuration || 25 * 60 * 1000; // Default 25 min
    blockedSites = data.blockedSites || [];
    
    // Check if the session is still valid
    if (isActive && sessionStartTime) {
      const now = new Date();
      const endTime = new Date(sessionStartTime.getTime() + sessionDuration);
      
      if (now > endTime) {
        // Session has ended, reset state
        await endFocusSession();
      } else {
        // Session is still active, update badge
        updateExtensionStatus(true);
      }
    } else {
      updateExtensionStatus(false);
    }
  } catch (error) {
    console.error('Error initializing extension:', error);
    updateExtensionStatus(false);
  }
}

// Update the extension icon and badge
function updateExtensionStatus(isActive) {
  const iconPath = isActive ? 'icons/icon48.png' : 'icons/icon48_inactive.png';
  const badgeText = isActive ? getMinutesRemaining() : '';
  const badgeColor = isActive ? '#4CAF50' : '#757575';
  
  chrome.action.setIcon({ path: iconPath });
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  
  // If active, set up a timer to update the badge countdown
  if (isActive) {
    setTimeout(updateBadgeTime, 60000); // Update every minute
  }
}

// Update the badge time display
function updateBadgeTime() {
  if (!isActive) return;
  
  const minutesLeft = getMinutesRemaining();
  chrome.action.setBadgeText({ text: minutesLeft });
  
  // If time remaining, schedule another update
  if (minutesLeft !== '0') {
    setTimeout(updateBadgeTime, 60000);
  } else {
    endFocusSession();
  }
}

// Get minutes remaining as a string
function getMinutesRemaining() {
  if (!sessionStartTime) return '0';
  
  const now = new Date();
  const endTime = new Date(sessionStartTime.getTime() + sessionDuration);
  const diffMs = endTime - now;
  
  if (diffMs <= 0) return '0';
  
  const diffMinutes = Math.ceil(diffMs / 60000);
  return diffMinutes.toString();
}

// Get milliseconds remaining
function getTimeRemaining() {
  if (!sessionStartTime || !isActive) return 0;
  
  const now = new Date();
  const endTime = new Date(sessionStartTime.getTime() + sessionDuration);
  const diffMs = endTime - now;
  
  return Math.max(0, diffMs);
}

// Start a new focus session
async function startFocusSession(duration, sites) {
  try {
    sessionStartTime = new Date();
    sessionDuration = duration * 60 * 1000; // Convert minutes to ms
    blockedSites = sites || blockedSites;
    isActive = true;
    
    // Save state
    await chrome.storage.local.set({
      isActive,
      sessionStartTime: sessionStartTime.toISOString(),
      sessionDuration,
      blockedSites
    });
    
    updateExtensionStatus(true);
    
    // Notify all open tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'SESSION_STARTED',
        timeRemaining: getTimeRemaining(),
        blockedSites 
      }).catch(() => {
        // Tab might not have content script loaded, ignore errors
      });
    });
    
    // Set up auto-end timer
    setTimeout(() => {
      endFocusSession();
    }, sessionDuration);
    
    return true;
  } catch (error) {
    console.error('Error starting focus session:', error);
    throw error;
  }
}

// End the current focus session
async function endFocusSession() {
  try {
    isActive = false;
    
    // Save state
    await chrome.storage.local.set({
      isActive,
      sessionStartTime: null
    });
    
    updateExtensionStatus(false);
    
    // Notify all open tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'SESSION_ENDED' 
      }).catch(() => {
        // Tab might not have content script loaded, ignore errors
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error ending focus session:', error);
    throw error;
  }
}

// Check navigation to see if we should block
function checkNavigation(details) {
  if (!isActive || details.frameType !== 'outermost_frame') return;
  
  const url = new URL(details.url);
  const domain = url.hostname;
  
  // Check if this domain should be blocked
  if (shouldBlockDomain(domain)) {
    // Redirect to block page
    chrome.tabs.update(details.tabId, {
      url: `${blockPageUrl}?domain=${encodeURIComponent(domain)}&remaining=${getTimeRemaining()}`
    });
  }
}

// Check if a domain should be blocked
function shouldBlockDomain(domain) {
  if (!domain) return false;
  
  return blockedSites.some(site => {
    // Remove www. prefix for comparison
    const siteDomain = site.domain || site;
    const normalizedSite = siteDomain.replace(/^www\./, '');
    const normalizedDomain = domain.replace(/^www\./, '');
    
    // Check for exact match or subdomain match
    return normalizedDomain === normalizedSite || 
           normalizedDomain.endsWith('.' + normalizedSite);
  });
}

// Sync with FocusFlow app
async function syncWithApp(apiUrl) {
  try {
    // Default API url if not provided
    const baseUrl = apiUrl || 'https://focusflow.app';
    
    // Fetch blocked sites
    const sitesResponse = await fetch(`${baseUrl}/api/blocked-sites`, {
      credentials: 'include'
    });
    
    if (sitesResponse.ok) {
      const sites = await sitesResponse.json();
      blockedSites = sites;
      
      // Save to storage
      await chrome.storage.local.set({ blockedSites });
      
      return true;
    } else {
      throw new Error('Failed to sync with FocusFlow app');
    }
  } catch (error) {
    console.error('Error syncing with app:', error);
    throw error;
  }
}