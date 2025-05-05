// FocusFlow Browser Extension
// Popup Script

// DOM elements
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const timerContainer = document.getElementById('timer-container');
const timeRemaining = document.getElementById('time-remaining');
const sitesList = document.getElementById('sites-list');
const sitesCount = document.getElementById('sites-count');
const inactiveControls = document.getElementById('inactive-controls');
const activeControls = document.getElementById('active-controls');
const startSessionButton = document.getElementById('start-session-button');
const endSessionButton = document.getElementById('end-session-button');
const manageSitesButton = document.getElementById('manage-sites-button');
const goToAppButton = document.getElementById('go-to-app-button');
const authSection = document.getElementById('auth-section');
const authAvatar = document.getElementById('auth-avatar');
const authUsername = document.getElementById('auth-username');
const settingsButton = document.getElementById('settings-button');

// Global state
let state = {};
let timerInterval = null;

// Initialize the popup
async function initialize() {
  // Get the current state from the background script
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    if (response && response.state) {
      state = response.state;
      updateUI();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Update the UI based on the current state
function updateUI() {
  // Update status
  if (state.isActive) {
    statusIcon.classList.remove('inactive');
    statusIcon.classList.add('active');
    statusText.textContent = 'Focus Mode Active';
    inactiveControls.style.display = 'none';
    activeControls.style.display = 'flex';
    timerContainer.style.display = 'block';
    
    // Update timer
    if (state.sessionStartTime) {
      updateTimer();
      // Start timer interval
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
    }
  } else {
    statusIcon.classList.remove('active');
    statusIcon.classList.add('inactive');
    statusText.textContent = 'Focus Mode Inactive';
    inactiveControls.style.display = 'flex';
    activeControls.style.display = 'none';
    timerContainer.style.display = 'none';
    
    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  // Update blocked sites
  updateBlockedSites();
  
  // Update auth section
  if (state.authToken && state.userId) {
    authSection.style.display = 'block';
    if (state.username) {
      authUsername.textContent = state.username;
      authAvatar.textContent = state.username.charAt(0).toUpperCase();
    }
  } else {
    authSection.style.display = 'none';
  }
  
  // Set links
  const appUrl = state.apiUrl || 'https://focusflow.replit.app';
  goToAppButton.href = appUrl;
  manageSitesButton.href = `${appUrl}/blocklist`;
}

// Update the timer display
function updateTimer() {
  if (!state.sessionStartTime) return;
  
  const now = Date.now();
  const startTime = state.sessionStartTime;
  const sessionLength = state.sessionTimeout;
  const elapsed = now - startTime;
  const remaining = Math.max(0, sessionLength - elapsed);
  
  const minutes = Math.floor(remaining / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
  
  timeRemaining.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // If timer has expired, refresh the state
  if (remaining <= 0) {
    initialize();
  }
}

// Update the blocked sites list
function updateBlockedSites() {
  // Clear existing items
  sitesList.innerHTML = '';
  
  // If no blocked sites, show a message
  if (!state.blockedSites || state.blockedSites.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.textContent = 'No sites blocked yet. Add sites in the FocusFlow app.';
    emptyMessage.style.fontSize = '0.75rem';
    emptyMessage.style.color = 'var(--muted)';
    emptyMessage.style.padding = '0.25rem';
    sitesList.appendChild(emptyMessage);
    sitesCount.textContent = '0';
    return;
  }
  
  // Add each blocked site
  state.blockedSites.forEach(site => {
    const siteTag = document.createElement('div');
    siteTag.className = 'site-tag';
    siteTag.textContent = site.domain;
    sitesList.appendChild(siteTag);
  });
  
  // Update count
  sitesCount.textContent = state.blockedSites.length.toString();
}

// Event listeners
startSessionButton.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'startSession' });
    if (response && response.success) {
      // Refresh state
      initialize();
    }
  } catch (error) {
    console.error('Error starting session:', error);
  }
});

endSessionButton.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'endSession' });
    if (response && response.success) {
      // Refresh state
      initialize();
    }
  } catch (error) {
    console.error('Error ending session:', error);
  }
});

// Settings button opens a new tab to the settings page
settingsButton.addEventListener('click', () => {
  const appUrl = state.apiUrl || 'https://focusflow.replit.app';
  chrome.tabs.create({ url: `${appUrl}/settings` });
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);

// Clean up on unload
window.addEventListener('unload', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});