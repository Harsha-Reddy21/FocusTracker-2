// Get DOM elements
const domainElement = document.getElementById('domain');
const timerElement = document.getElementById('timer');
const returnButton = document.getElementById('return-button');
const abortButton = document.getElementById('abort-button');

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const blockedDomain = urlParams.get('domain') || 'this website';
const remainingTime = parseInt(urlParams.get('remaining') || '0');

// Set the blocked domain
domainElement.textContent = blockedDomain;

// Set up the timer
let timeRemaining = remainingTime;
updateTimer();

// Update the timer every second
const timerInterval = setInterval(updateTimer, 1000);

// Add event listeners to buttons
returnButton.addEventListener('click', () => {
  window.history.back();
});

abortButton.addEventListener('click', () => {
  // Send message to background script to end session
  chrome.runtime.sendMessage({ type: 'END_SESSION' }, (response) => {
    if (response && response.success) {
      // Redirect to a safe page, like the Chrome new tab page
      window.location.href = 'chrome://newtab';
    }
  });
});

// Update the timer display
function updateTimer() {
  if (timeRemaining <= 0) {
    timerElement.textContent = '00:00:00';
    clearInterval(timerInterval);
    return;
  }
  
  // Decrease by 1 second
  timeRemaining -= 1000;
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeRemaining / 3600000);
  const minutes = Math.floor((timeRemaining % 3600000) / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  // Format the time
  const formattedTime = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update the timer display
  timerElement.textContent = formattedTime;
}