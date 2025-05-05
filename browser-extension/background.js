// FocusFlow Browser Extension
// Background Script

// Default configuration
const DEFAULT_CONFIG = {
  blockedSites: [],
  isActive: false,
  apiUrl: 'https://focusflow.replit.app',
  syncEnabled: true,
  sessionTimeout: 25 * 60 * 1000, // 25 minutes
  sessionStartTime: null,
  authToken: null,
  userId: null
};

// Current state
let state = { ...DEFAULT_CONFIG };

// Initialize the extension
async function initialize() {
  console.log('FocusFlow Blocker: Initializing...');
  
  // Load saved configuration
  const savedState = await chrome.storage.sync.get('focusFlowState');
  if (savedState.focusFlowState) {
    state = { ...DEFAULT_CONFIG, ...savedState.focusFlowState };
  }
  
  // Check if there's an active session that needs to be restored
  if (state.isActive && state.sessionStartTime) {
    const now = Date.now();
    const elapsed = now - state.sessionStartTime;
    
    if (elapsed < state.sessionTimeout) {
      // Session is still valid, set alarm to end it
      const remaining = state.sessionTimeout - elapsed;
      chrome.alarms.create('sessionEnd', { delayInMinutes: remaining / (60 * 1000) });
      
      // Update the extension icon
      updateExtensionStatus(true);
    } else {
      // Session has expired, end it
      await endFocusSession();
    }
  } else {
    updateExtensionStatus(false);
  }
  
  // Set up navigation blocking
  chrome.webNavigation.onBeforeNavigate.addListener(checkNavigation);
  
  // Check for app sync if enabled
  if (state.syncEnabled && state.authToken) {
    syncWithApp();
    
    // Set up periodic sync
    chrome.alarms.create('syncWithApp', { periodInMinutes: 1 });
  }
  
  console.log('FocusFlow Blocker: Initialization complete');
}

// Update the extension's icon to reflect active/inactive state
function updateExtensionStatus(isActive) {
  const iconPath = isActive ? 'images/icon-active' : 'images/icon';

  chrome.action.setIcon({
    path: {
      16: `${iconPath}16.png`,
      48: `${iconPath}48.png`,
      128: `${iconPath}128.png`
    }
  });
  
  chrome.action.setBadgeText({
    text: isActive ? 'ON' : ''
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: isActive ? '#22c55e' : '#ef4444'
  });
}

// Start a new focus session
async function startFocusSession(duration) {
  const sessionDuration = duration || state.sessionTimeout;
  
  state.isActive = true;
  state.sessionStartTime = Date.now();
  
  // Save state
  await chrome.storage.sync.set({ focusFlowState: state });
  
  // Set alarm to end session
  chrome.alarms.create('sessionEnd', { delayInMinutes: sessionDuration / (60 * 1000) });
  
  // Update icon
  updateExtensionStatus(true);
  
  // Notify content scripts
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'sessionStarted' });
    } catch (e) {
      // Tab might not have content script loaded
    }
  });
  
  console.log('FocusFlow Blocker: Focus session started');
  
  return { success: true };
}

// End the current focus session
async function endFocusSession() {
  state.isActive = false;
  state.sessionStartTime = null;
  
  // Save state
  await chrome.storage.sync.set({ focusFlowState: state });
  
  // Clear the alarm
  chrome.alarms.clear('sessionEnd');
  
  // Update icon
  updateExtensionStatus(false);
  
  // Notify content scripts
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'sessionEnded' });
    } catch (e) {
      // Tab might not have content script loaded
    }
  });
  
  console.log('FocusFlow Blocker: Focus session ended');
  
  return { success: true };
}

// Check if navigation should be blocked
function checkNavigation(details) {
  // If not in an active session, allow all navigation
  if (!state.isActive) return;
  
  // Check if the URL is in our block list
  const url = new URL(details.url);
  const domain = url.hostname;
  
  const isBlocked = state.blockedSites.some(site => {
    // Direct match
    if (domain === site.domain) return true;
    
    // Subdomain match
    if (domain.endsWith(`.${site.domain}`)) return true;
    
    return false;
  });
  
  if (isBlocked) {
    console.log(`FocusFlow Blocker: Blocking navigation to ${domain}`);
    
    // Show block page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('block.html') +
           `?domain=${encodeURIComponent(domain)}` + 
           `&url=${encodeURIComponent(details.url)}`
    });
  }
}

// Sync blocked sites and session state with the FocusFlow app
async function syncWithApp() {
  if (!state.authToken || !state.apiUrl) return;
  
  try {
    // Fetch blocked sites
    const sitesResponse = await fetch(`${state.apiUrl}/api/blocked-sites`, {
      headers: {
        'Authorization': `Bearer ${state.authToken}`
      }
    });
    
    if (sitesResponse.ok) {
      const sites = await sitesResponse.json();
      state.blockedSites = sites;
      
      // Save state
      await chrome.storage.sync.set({ focusFlowState: state });
    }
    
    // Check for active sessions
    const sessionsResponse = await fetch(`${state.apiUrl}/api/sessions`, {
      headers: {
        'Authorization': `Bearer ${state.authToken}`
      }
    });
    
    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json();
      
      // Find active session (not completed, not interrupted, no end time)
      const activeSession = sessions.find(session => 
        !session.isCompleted && !session.isInterrupted && !session.endTime
      );
      
      // If there's an active session in the app but not in the extension, start it
      if (activeSession && !state.isActive) {
        const startTime = new Date(activeSession.startTime).getTime();
        const elapsed = Date.now() - startTime;
        const defaultDuration = 25 * 60 * 1000; // 25 minutes in milliseconds
        
        if (elapsed < defaultDuration) {
          // There's still time left in the session
          state.sessionStartTime = startTime;
          state.isActive = true;
          
          // Save state
          await chrome.storage.sync.set({ focusFlowState: state });
          
          // Set alarm to end session
          const remaining = defaultDuration - elapsed;
          chrome.alarms.create('sessionEnd', { 
            delayInMinutes: Math.max(0.1, remaining / (60 * 1000)) 
          });
          
          // Update icon
          updateExtensionStatus(true);
        }
      }
      // If there's no active session in the app but there is in the extension, end it
      else if (!activeSession && state.isActive) {
        await endFocusSession();
      }
    }
  } catch (error) {
    console.error('FocusFlow Blocker: Error syncing with app', error);
  }
}

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sessionEnd') {
    await endFocusSession();
  } else if (alarm.name === 'syncWithApp') {
    await syncWithApp();
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'getState') {
        sendResponse({ state });
      } else if (message.action === 'startSession') {
        const result = await startFocusSession(message.duration);
        sendResponse(result);
      } else if (message.action === 'endSession') {
        const result = await endFocusSession();
        sendResponse(result);
      } else if (message.action === 'updateSettings') {
        // Update settings
        state = { ...state, ...message.settings };
        
        // Save state
        await chrome.storage.sync.set({ focusFlowState: state });
        sendResponse({ success: true });
      } else if (message.action === 'updateBlockedSites') {
        // Update blocked sites
        state.blockedSites = message.sites;
        
        // Save state
        await chrome.storage.sync.set({ focusFlowState: state });
        sendResponse({ success: true });
      } else if (message.action === 'login') {
        // Store auth token
        state.authToken = message.token;
        state.userId = message.userId;
        
        // Save state
        await chrome.storage.sync.set({ focusFlowState: state });
        
        // Sync with app immediately
        await syncWithApp();
        sendResponse({ success: true });
      } else if (message.action === 'logout') {
        // Clear auth token
        state.authToken = null;
        state.userId = null;
        
        // Save state
        await chrome.storage.sync.set({ focusFlowState: state });
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Initialize extension when loaded
initialize();