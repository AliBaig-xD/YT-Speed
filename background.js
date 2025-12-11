// background.js
// Listens for keyboard commands and forwards to active tab

// Constants
const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.25;
const MAX_SPEED = 3.0;
const SPEED_INCREMENT = 0.25;

// Per-tab debounce tracking for keyboard shortcuts to prevent race conditions
const pendingSpeedChanges = new Map(); // tabId -> timeoutId

// Helper function to initialize badge
function initializeBadge() {
  chrome.storage.sync.get(['ytSpeed'], (res) => {
    const val = (res && res.ytSpeed) ? Number(res.ytSpeed) : DEFAULT_SPEED;
    let text = (Math.round(val * 100) / 100).toString();
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#333' });
  });
}

// Initialize storage on install with default value
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['ytSpeed'], (res) => {
    if (!res || res.ytSpeed === undefined) {
      // First install - set default
      chrome.storage.sync.set({ ytSpeed: DEFAULT_SPEED });
    }
  });
  initializeBadge();
});

// Initialize badge on service worker startup (MV3 lifecycle)
chrome.runtime.onStartup.addListener(() => {
  initializeBadge();
});

// Initialize badge immediately when service worker loads
initializeBadge();

// Update the browser action badge when content script informs of speed change
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'SPEED_UPDATED') {
    const val = Number(msg.value) || 1.0;
    // badge text limited in length; format 2 decimals but trim trailing zeros
    let text = (Math.round(val * 100) / 100).toString();
    chrome.action.setBadgeText({ text });
    // optional: set color
    chrome.action.setBadgeBackgroundColor({ color: '#333' });
  }
});

// Cleanup debounce state when a tab is closed to prevent memory leak
chrome.tabs.onRemoved.addListener((tabId) => {
  if (pendingSpeedChanges.has(tabId)) {
    clearTimeout(pendingSpeedChanges.get(tabId));
    pendingSpeedChanges.delete(tabId);
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id || tab.id < 0) {
      return;
    }
    
    // Per-tab debounce: ignore rapid successive commands on this specific tab
    if (pendingSpeedChanges.has(tab.id)) return;
    
    if (command === 'increase-speed' || command === 'decrease-speed' || command === 'reset-speed') {
      // Safety timeout: clear pending state after 2 seconds in case of failure
      const timeoutId = setTimeout(() => {
        pendingSpeedChanges.delete(tab.id);
      }, 2000);
      
      pendingSpeedChanges.set(tab.id, timeoutId);
      
      // We will request the content script to change speed.
      // But we want increase/decrease to be relative.
      chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' }, (resp) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded (not on YouTube) - bail out
          clearTimeout(timeoutId);
          pendingSpeedChanges.delete(tab.id);
          return;
        }
        let current = DEFAULT_SPEED;
        if (resp && typeof resp.value === 'number') {
          current = Number(resp.value);
        }
        if (command === 'increase-speed') {
          // increment by SPEED_INCREMENT (clamp to MAX_SPEED)
          const next = Math.min(MAX_SPEED, Math.round((current + 0.001 + SPEED_INCREMENT) * 100) / 100);
          chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: next }, () => {
            clearTimeout(timeoutId);
            pendingSpeedChanges.delete(tab.id);
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: next }, () => {
              if (chrome.runtime.lastError) {
                console.warn('Failed to save speed:', chrome.runtime.lastError.message);
              }
            });
          });
        } else if (command === 'decrease-speed') {
          const next = Math.max(MIN_SPEED, Math.round((current - SPEED_INCREMENT) * 100) / 100);
          chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: next }, () => {
            clearTimeout(timeoutId);
            pendingSpeedChanges.delete(tab.id);
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: next }, () => {
              if (chrome.runtime.lastError) {
                console.warn('Failed to save speed:', chrome.runtime.lastError.message);
              }
            });
          });
        } else if (command === 'reset-speed') {
          chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: DEFAULT_SPEED }, () => {
            clearTimeout(timeoutId);
            pendingSpeedChanges.delete(tab.id);
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: DEFAULT_SPEED }, () => {
              if (chrome.runtime.lastError) {
                console.warn('Failed to save speed:', chrome.runtime.lastError.message);
              }
            });
          });
        }
      });
    }
  });
});

