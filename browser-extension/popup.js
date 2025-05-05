// DOM elements
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const statusMessage = document.getElementById('status-message');
const sessionActive = document.getElementById('session-active');
const sessionInactive = document.getElementById('session-inactive');
const timer = document.getElementById('timer');
const startSessionButton = document.getElementById('start-session-button');
const endSessionButton = document.getElementById('end-session-button');
const syncButton = document.getElementById('sync-button');
const hoursInput = document.getElementById('session-hours');
const minutesInput = document.getElementById('session-minutes');
const blockedSitesList = document.getElementById('blocked-sites-list');
const blockedSitesListInactive = document.getElementById('blocked-sites-list-inactive');

// State
let isActive = false;
let sessionStartTime = null;
let sessionDuration = 0;
let blockedSites = [];
let timeRemaining = 0;
let timerInterval = null;

// Initialize
function initialize() {
  // Get state from background script
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    updateState(response);
    updateUI();
  });
  
  // Add event listeners
  startSessionButton.addEventListener('click', startSession);
  endSessionButton.addEventListener('click', endSession);
  syncButton.addEventListener('click', syncWithApp);
}

// Update state based on background script response
function updateState(state) {
  if (!state) return;
  
  isActive = state.isActive;
  sessionStartTime = state.sessionStartTime ? new Date(state.sessionStartTime) : null;
  sessionDuration = state.sessionDuration || 0;
  blockedSites = state.blockedSites || [];
  timeRemaining = state.timeRemaining || 0;
}

// Update UI based on current state
function updateUI() {
  if (isActive) {
    // Active session UI
    statusIcon.classList.remove('inactive');
    statusIcon.classList.add('active');
    statusText.textContent = 'Focus Mode: Active';
    statusMessage.textContent = 'Distracting websites are currently blocked';
    
    sessionActive.classList.add('visible');
    sessionInactive.classList.remove('visible');
    
    // Start timer updates
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    // Inactive session UI
    statusIcon.classList.remove('active');
    statusIcon.classList.add('inactive');
    statusText.textContent = 'Focus Mode: Inactive';
    statusMessage.textContent = 'Start a focus session to block distractions';
    
    sessionActive.classList.remove('visible');
    sessionInactive.classList.add('visible');
    
    // Stop timer updates
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  // Update blocked sites lists
  updateBlockedSites();
}

// Update timer display
function updateTimer() {
  if (!isActive || timeRemaining <= 0) {
    timer.textContent = '00:00:00';
    return;
  }
  
  // Decrease time remaining
  timeRemaining = Math.max(0, timeRemaining - 1000);
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeRemaining / 3600000);
  const minutes = Math.floor((timeRemaining % 3600000) / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  // Format the time
  const formattedTime = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update the timer display
  timer.textContent = formattedTime;
  
  // If time is up, refresh state
  if (timeRemaining <= 0) {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      updateState(response);
      updateUI();
    });
  }
}

// Update blocked sites lists
function updateBlockedSites() {
  // Clear current lists
  blockedSitesList.innerHTML = '';
  blockedSitesListInactive.innerHTML = '';
  
  if (blockedSites.length === 0) {
    // No sites blocked
    const noSitesMsg = document.createElement('li');
    noSitesMsg.className = 'blocked-site';
    noSitesMsg.textContent = 'No sites blocked yet';
    noSitesMsg.style.fontStyle = 'italic';
    noSitesMsg.style.color = '#94a3b8';
    
    blockedSitesList.appendChild(noSitesMsg.cloneNode(true));
    blockedSitesListInactive.appendChild(noSitesMsg);
    return;
  }
  
  // Add each site to both lists
  blockedSites.forEach(site => {
    const domain = site.domain || site;
    
    // For active session list
    const activeLi = document.createElement('li');
    activeLi.className = 'blocked-site';
    activeLi.innerHTML = `<div class="blocked-site-domain">${domain}</div>`;
    blockedSitesList.appendChild(activeLi);
    
    // For inactive session list
    const inactiveLi = document.createElement('li');
    inactiveLi.className = 'blocked-site';
    inactiveLi.innerHTML = `<div class="blocked-site-domain">${domain}</div>`;
    blockedSitesListInactive.appendChild(inactiveLi);
  });
}

// Start a new focus session
function startSession() {
  const hours = parseInt(hoursInput.value) || 0;
  const minutes = parseInt(minutesInput.value) || 25;
  
  // Calculate total duration in minutes
  const durationMinutes = (hours * 60) + minutes;
  
  if (durationMinutes < 1) {
    alert('Please set a valid duration (at least 1 minute)');
    return;
  }
  
  chrome.runtime.sendMessage({
    type: 'START_SESSION',
    duration: durationMinutes,
    sites: blockedSites
  }, (response) => {
    if (response && response.success) {
      // Session started successfully
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (stateResponse) => {
        updateState(stateResponse);
        updateUI();
      });
    } else {
      // Error starting session
      alert('Failed to start focus session: ' + (response.error || 'Unknown error'));
    }
  });
}

// End the current focus session
function endSession() {
  chrome.runtime.sendMessage({ type: 'END_SESSION' }, (response) => {
    if (response && response.success) {
      // Session ended successfully
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (stateResponse) => {
        updateState(stateResponse);
        updateUI();
      });
    } else {
      // Error ending session
      alert('Failed to end focus session: ' + (response.error || 'Unknown error'));
    }
  });
}

// Sync with FocusFlow web app
function syncWithApp() {
  chrome.runtime.sendMessage({ type: 'SYNC_WITH_APP' }, (response) => {
    if (response && response.success) {
      // Sync successful
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (stateResponse) => {
        updateState(stateResponse);
        updateUI();
        alert('Successfully synced with FocusFlow app');
      });
    } else {
      // Error syncing
      alert('Failed to sync with FocusFlow app. Please ensure you are logged in to the web app.');
    }
  });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);