// JavaScript for the block page

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const blockedDomain = urlParams.get('domain');
const originalUrl = urlParams.get('url');

// References to DOM elements
const domainNameElement = document.getElementById('domain-name');
const timeRemainingElement = document.getElementById('time-remaining');
const goBackButton = document.getElementById('go-back-button');
const goToFocusFlowButton = document.getElementById('go-to-focusflow');
const endSessionButton = document.getElementById('end-session-button');

// Set the domain name in the UI
if (blockedDomain) {
  domainNameElement.textContent = blockedDomain;
  document.title = `${blockedDomain} - Site Blocked`;
}

// Get current session state
chrome.runtime.sendMessage({ action: 'getState' }, response => {
  if (response && response.state) {
    const state = response.state;
    
    // Set up timer if there's an active session
    if (state.isActive && state.sessionStartTime) {
      updateTimer(state.sessionStartTime, state.sessionTimeout);
      
      // Set up interval to update the timer
      setInterval(() => {
        updateTimer(state.sessionStartTime, state.sessionTimeout);
      }, 1000);
    } else {
      // No active session, show zeros
      timeRemainingElement.textContent = '00:00';
    }
  }
});

// Update the timer display
function updateTimer(startTimeMs, sessionLengthMs) {
  const now = Date.now();
  const elapsed = now - startTimeMs;
  const remaining = Math.max(0, sessionLengthMs - elapsed);
  
  const minutes = Math.floor(remaining / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
  
  timeRemainingElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // If timer has expired, refresh the page to potentially allow access
  if (remaining <= 0 && originalUrl) {
    window.location.href = originalUrl;
  }
}

// Set up button click handlers
goBackButton.addEventListener('click', () => {
  window.history.back();
});

goToFocusFlowButton.addEventListener('click', () => {
  // Navigate to the FocusFlow app
  chrome.runtime.sendMessage({ action: 'getState' }, response => {
    if (response && response.state && response.state.apiUrl) {
      window.location.href = response.state.apiUrl;
    } else {
      // Fallback to default URL if not configured
      window.location.href = 'https://focusflow.replit.app';
    }
  });
});

endSessionButton.addEventListener('click', () => {
  // End the focus session
  chrome.runtime.sendMessage({ action: 'endSession' }, response => {
    if (response && response.success) {
      // Session ended, redirect to original URL if available
      if (originalUrl) {
        window.location.href = originalUrl;
      } else {
        // Otherwise, go back
        window.history.back();
      }
    }
  });
});