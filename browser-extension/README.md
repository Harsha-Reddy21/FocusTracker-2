# FocusFlow Browser Extension

This browser extension is the most effective solution for blocking distracting websites during your focus sessions. Unlike web-based approaches, browser extensions have the necessary permissions to truly prevent access to specific sites.

## Features

- **True Website Blocking**: Completely blocks access to distracting websites during focus sessions
- **Syncs with FocusFlow App**: Automatically pulls your blocklist from the FocusFlow web app
- **Session Management**: Start, pause, and end focus sessions right from your browser
- **Visual Indicators**: Shows focus status and remaining time for your sessions
- **Elegant Block Page**: Professional-looking page when attempting to access blocked sites
- **Cross-Tab Protection**: Blocks sites in all browser tabs

## Installation

Since this is a custom extension, you'll need to install it in developer mode:

### Chrome / Edge / Brave

1. Download this extension folder to your computer
2. Open your browser and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the downloaded extension folder
5. The FocusFlow extension should now appear in your extensions list
6. Pin it to your toolbar for easy access

### Firefox

1. Download this extension folder to your computer
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the downloaded extension folder and select the `manifest.json` file
5. The FocusFlow extension should now appear in your add-ons

## Usage

1. Click the FocusFlow icon in your browser toolbar
2. Start a focus session using the "Start Focus Session" button
3. The extension will block any attempts to visit sites on your blocklist
4. When you try to visit a blocked site, you'll see a friendly reminder page
5. You can end your session early using the "End Focus Session" button

## Connecting to Your FocusFlow Account

For full functionality, connect the extension to your FocusFlow account:

1. Log in to the FocusFlow web app
2. Go to the settings page
3. In the "Browser Extension" section, click "Connect Extension"
4. Your blocklist and session data will now sync between the app and extension

## Technical Details

This extension uses the following browser APIs:

- `chrome.storage` - For persistence of settings
- `chrome.webNavigation` - To detect and block navigation to distracting sites
- `chrome.webRequest` - For advanced request blocking
- `chrome.tabs` - For tab management and displaying block pages
- `chrome.runtime` - For background processing and messaging

## Privacy

This extension only monitors URLs to check if they match your blocklist. No browsing data is collected or sent to external servers except when syncing with your FocusFlow account. All blocking happens locally in your browser.

## Development

This extension is open-source and can be customized to your needs. The main components are:

- `manifest.json` - Extension configuration
- `background.js` - Core blocking functionality
- `content.js` - Injects into web pages for additional functionality
- `popup.html/js` - User interface when clicking the extension icon
- `block.html/js` - The page shown when a site is blocked

## Comparison to Web App Solutions

While we attempted to implement website blocking directly in the FocusFlow web app, there are fundamental limitations imposed by browser security models that prevent a web application from controlling navigation to other sites. A browser extension doesn't have these limitations and can provide true website blocking.

## Need Help?

If you have any questions or need assistance with the extension, please contact us through the FocusFlow web app or email support@focusflow.app.