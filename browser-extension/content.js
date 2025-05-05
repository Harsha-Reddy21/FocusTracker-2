// FocusFlow Browser Extension
// Content.js - Content script injected into web pages

// Initialize state
let isActive = false;
let timeRemaining = 0;
let reminderContainer = null;
let updateInterval = null;

// Check if current URL is in the blocked list
// This is a backup check since background.js should already redirect
const checkIfBlocked = async () => {
  try {
    const state = await getExtensionState();
    
    if (state.isActive) {
      const url = new URL(window.location.href);
      const domain = url.hostname;
      
      // Check if this domain should be blocked
      if (shouldBlockDomain(domain, state.blockedSites)) {
        // Redirect to block page
        window.location.href = chrome.runtime.getURL(
          `block.html?domain=${encodeURIComponent(domain)}&remaining=${state.timeRemaining}`
        );
      }
    }
  } catch (error) {
    console.error('Error checking if blocked:', error);
  }
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SESSION_STARTED') {
    isActive = true;
    timeRemaining = message.timeRemaining;
    showFocusReminder();
    sendResponse({ success: true });
  }
  
  if (message.type === 'SESSION_ENDED') {
    isActive = false;
    hideFocusReminder();
    sendResponse({ success: true });
  }
  
  return true;
});

// Get current extension state
async function getExtensionState() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Check if a domain should be blocked
function shouldBlockDomain(domain, blockedSites) {
  if (!domain || !blockedSites || blockedSites.length === 0) return false;
  
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

// Initialize on page load
function initialize() {
  // Check if current URL should be blocked
  checkIfBlocked();
  
  // Check if there's an active session
  getExtensionState().then(state => {
    isActive = state.isActive;
    timeRemaining = state.timeRemaining;
    
    if (isActive) {
      showFocusReminder();
    }
  }).catch(error => {
    console.error('Error initializing content script:', error);
  });
}

// Create and show the focus reminder
function showFocusReminder() {
  if (reminderContainer) return;
  
  // Create the focus reminder element
  reminderContainer = document.createElement('div');
  reminderContainer.className = 'focusflow-reminder';
  reminderContainer.innerHTML = `
    <div class="focusflow-reminder-content">
      <div class="focusflow-reminder-icon">⏱️</div>
      <div class="focusflow-reminder-text">Focus Mode Active</div>
      <div class="focusflow-reminder-time" id="focusflow-time-remaining"></div>
    </div>
    <div class="focusflow-reminder-expand" id="focusflow-expand">↓</div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .focusflow-reminder {
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 9999999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .focusflow-reminder-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .focusflow-reminder-icon {
      font-size: 14px;
    }
    .focusflow-reminder-text {
      font-weight: 500;
    }
    .focusflow-reminder-time {
      font-weight: bold;
    }
    .focusflow-reminder-expand {
      text-align: center;
      margin-top: 4px;
      font-size: 10px;
      opacity: 0.7;
      transition: all 0.2s ease;
    }
    .focusflow-reminder-expand:hover {
      opacity: 1;
    }
    .focusflow-reminder-expanded {
      padding: 12px 16px;
    }
    .focusflow-reminder-details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 11px;
      line-height: 1.4;
    }
    .focusflow-reminder-button {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 8px;
      background-color: #e74c3c;
      color: white;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .focusflow-reminder-button:hover {
      background-color: #c0392b;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(reminderContainer);
  
  // Update the time display
  updateTimeDisplay();
  
  // Set an interval to update the time remaining
  updateInterval = setInterval(updateTimeDisplay, 1000);
  
  // Add click event to expand/collapse
  const expandButton = document.getElementById('focusflow-expand');
  if (expandButton) {
    expandButton.addEventListener('click', expandFocusReminder);
  }
  
  // Make the whole reminder clickable to expand
  reminderContainer.addEventListener('click', function(e) {
    if (e.target.id !== 'focusflow-end-session') {
      expandFocusReminder();
    }
  });
}

// Expand the focus reminder to show details
function expandFocusReminder() {
  if (!reminderContainer) return;
  
  const isExpanded = reminderContainer.classList.contains('focusflow-reminder-expanded');
  
  if (isExpanded) {
    // Collapse
    reminderContainer.classList.remove('focusflow-reminder-expanded');
    document.getElementById('focusflow-expand').innerHTML = '↓';
    
    // Remove details section if it exists
    const details = document.querySelector('.focusflow-reminder-details');
    if (details) {
      details.remove();
    }
  } else {
    // Expand
    reminderContainer.classList.add('focusflow-reminder-expanded');
    document.getElementById('focusflow-expand').innerHTML = '↑';
    
    // Create and add details section
    const details = document.createElement('div');
    details.className = 'focusflow-reminder-details';
    details.innerHTML = `
      <div>Stay focused! The FocusFlow extension is helping you avoid distractions.</div>
      <div id="focusflow-end-session" class="focusflow-reminder-button">End Focus Session</div>
    `;
    
    reminderContainer.appendChild(details);
    
    // Add click event to end session button
    document.getElementById('focusflow-end-session').addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'END_SESSION' }, (response) => {
        if (response.success) {
          hideFocusReminder();
        }
      });
    });
  }
}

// Hide the focus reminder
function hideFocusReminder() {
  if (reminderContainer) {
    reminderContainer.remove();
    reminderContainer = null;
  }
  
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Update the time display in the reminder
function updateTimeDisplay() {
  const timeElement = document.getElementById('focusflow-time-remaining');
  if (!timeElement) return;
  
  // Calculate time remaining
  if (timeRemaining <= 0) {
    timeElement.textContent = '00:00';
    return;
  }
  
  // Decrease time remaining
  timeRemaining = Math.max(0, timeRemaining - 1000);
  
  // Format as MM:SS
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // If time is up, hide the reminder
  if (timeRemaining <= 0) {
    hideFocusReminder();
  }
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}