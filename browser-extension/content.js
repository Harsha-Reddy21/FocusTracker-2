// FocusFlow Browser Extension
// Content Script - Runs on every page

// Set up messaging with background script
let isSessionActive = false;
let focusReminderElement = null;

// Initialize content script
function initialize() {
  console.log('FocusFlow Blocker: Content script initialized');
  
  // Check current session status
  chrome.runtime.sendMessage({ action: 'getState' }, response => {
    if (response && response.state) {
      isSessionActive = response.state.isActive;
      
      if (isSessionActive) {
        showFocusReminder();
      }
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sessionStarted') {
      isSessionActive = true;
      showFocusReminder();
    } else if (message.action === 'sessionEnded') {
      isSessionActive = false;
      hideFocusReminder();
    }
    
    // Send acknowledgment
    sendResponse({ received: true });
    return true; // Keep the message channel open for async response
  });
}

// Show a small focus reminder in the corner of the page
function showFocusReminder() {
  // If already showing, don't create another
  if (focusReminderElement) return;
  
  // Create the reminder element
  focusReminderElement = document.createElement('div');
  focusReminderElement.id = 'focusflow-reminder';
  focusReminderElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #111827;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
  `;
  
  // Create the icon
  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 10px;
    height: 10px;
    background-color: #22c55e;
    border-radius: 50%;
  `;
  
  // Create the text
  const text = document.createElement('span');
  text.textContent = 'Focus Mode Active';
  
  // Assemble the reminder
  focusReminderElement.appendChild(icon);
  focusReminderElement.appendChild(text);
  
  // Add hover effect
  focusReminderElement.addEventListener('mouseenter', () => {
    focusReminderElement.style.transform = 'scale(1.05)';
    focusReminderElement.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
  });
  
  focusReminderElement.addEventListener('mouseleave', () => {
    focusReminderElement.style.transform = 'scale(1)';
    focusReminderElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  });
  
  // Add click handler to expand
  let isExpanded = false;
  focusReminderElement.addEventListener('click', () => {
    if (isExpanded) {
      // Collapse
      focusReminderElement.style.width = 'auto';
      focusReminderElement.style.height = 'auto';
      
      // Remove the content except the icon and text
      while (focusReminderElement.childNodes.length > 2) {
        focusReminderElement.removeChild(focusReminderElement.lastChild);
      }
      
      isExpanded = false;
    } else {
      // Expand
      expandFocusReminder();
      isExpanded = true;
    }
  });
  
  // Add to page
  document.body.appendChild(focusReminderElement);
}

// Expand the focus reminder to show more details
function expandFocusReminder() {
  if (!focusReminderElement) return;
  
  // Set expanded styles
  focusReminderElement.style.width = '300px';
  focusReminderElement.style.height = 'auto';
  focusReminderElement.style.padding = '16px';
  focusReminderElement.style.cursor = 'default';
  
  // Clear existing content
  focusReminderElement.innerHTML = '';
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    width: 100%;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = `
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 10px;
    height: 10px;
    background-color: #22c55e;
    border-radius: 50%;
  `;
  
  const titleText = document.createElement('span');
  titleText.textContent = 'Focus Mode Active';
  
  title.appendChild(icon);
  title.appendChild(titleText);
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    font-size: 14px;
  `;
  
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideFocusReminder();
  });
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create content
  const content = document.createElement('div');
  content.style.cssText = `
    margin-bottom: 12px;
  `;
  
  // Get session info
  chrome.runtime.sendMessage({ action: 'getState' }, response => {
    if (response && response.state) {
      const state = response.state;
      
      if (state.sessionStartTime) {
        const startTime = new Date(state.sessionStartTime);
        const elapsed = Date.now() - startTime.getTime();
        const sessionLengthMs = state.sessionTimeout;
        const remaining = Math.max(0, sessionLengthMs - elapsed);
        
        const minutes = Math.floor(remaining / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        
        const timeRemaining = document.createElement('div');
        timeRemaining.style.cssText = `
          background-color: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 12px;
        `;
        
        timeRemaining.innerHTML = `
          <div style="font-size: 12px; margin-bottom: 4px; color: rgba(255, 255, 255, 0.7);">
            Time remaining
          </div>
          <div style="font-size: 24px; font-weight: 600; font-family: monospace;">
            ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
          </div>
        `;
        
        content.appendChild(timeRemaining);
      }
      
      // Show blocked sites
      if (state.blockedSites && state.blockedSites.length > 0) {
        const blockedSitesContainer = document.createElement('div');
        blockedSitesContainer.style.cssText = `
          margin-top: 12px;
        `;
        
        const blockedSitesTitle = document.createElement('div');
        blockedSitesTitle.textContent = 'Currently blocking:';
        blockedSitesTitle.style.cssText = `
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        `;
        
        const blockedSitesList = document.createElement('div');
        blockedSitesList.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        `;
        
        state.blockedSites.forEach(site => {
          const siteTag = document.createElement('span');
          siteTag.textContent = site.domain;
          siteTag.style.cssText = `
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          `;
          
          blockedSitesList.appendChild(siteTag);
        });
        
        blockedSitesContainer.appendChild(blockedSitesTitle);
        blockedSitesContainer.appendChild(blockedSitesList);
        content.appendChild(blockedSitesContainer);
      }
    }
  });
  
  // Create buttons
  const buttons = document.createElement('div');
  buttons.style.cssText = `
    display: flex;
    gap: 8px;
  `;
  
  const endSessionButton = document.createElement('button');
  endSessionButton.textContent = 'End Session';
  endSessionButton.style.cssText = `
    background-color: #ef4444;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
    font-size: 14px;
  `;
  
  endSessionButton.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: 'endSession' }, () => {
      hideFocusReminder();
    });
  });
  
  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = 'Minimize';
  minimizeButton.style.cssText = `
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
    font-size: 14px;
  `;
  
  minimizeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    // Collapse
    hideFocusReminder();
    showFocusReminder();
  });
  
  buttons.appendChild(minimizeButton);
  buttons.appendChild(endSessionButton);
  
  // Assemble the expanded reminder
  focusReminderElement.appendChild(header);
  focusReminderElement.appendChild(content);
  focusReminderElement.appendChild(buttons);
}

// Hide the focus reminder
function hideFocusReminder() {
  if (focusReminderElement && focusReminderElement.parentNode) {
    focusReminderElement.parentNode.removeChild(focusReminderElement);
    focusReminderElement = null;
  }
}

// Wait for the page to load before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}