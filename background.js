// background.js
// Listens for keyboard commands and forwards to active tab

// Constants
const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.25;
const MAX_SPEED = 3.0;
const SPEED_INCREMENT = 0.25;

// Debounce tracking for keyboard shortcuts to prevent race conditions
let pendingSpeedChange = false;

// Initialize storage on install with default value
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['ytSpeed'], (res) => {
    if (!res || res.ytSpeed === undefined) {
      // First install - set default
      chrome.storage.sync.set({ ytSpeed: DEFAULT_SPEED });
    }
  });
});

// Initialize badge on startup
chrome.storage.sync.get(['ytSpeed'], (res) => {
  const val = (res && res.ytSpeed) ? Number(res.ytSpeed) : DEFAULT_SPEED;
  let text = (Math.round(val * 100) / 100).toString();
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#333' });
});

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

chrome.commands.onCommand.addListener((command) => {
  // Debounce: ignore rapid successive commands
  if (pendingSpeedChange) return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    if (command === 'increase-speed' || command === 'decrease-speed' || command === 'reset-speed') {
      pendingSpeedChange = true;
      
      // We will request the content script to change speed.
      // But we want increase/decrease to be relative.
      chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' }, (resp) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded (not on YouTube) - bail out
          pendingSpeedChange = false;
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
            pendingSpeedChange = false;
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: next });
          });
        } else if (command === 'decrease-speed') {
          const next = Math.max(MIN_SPEED, Math.round((current - SPEED_INCREMENT) * 100) / 100);
          chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: next }, () => {
            pendingSpeedChange = false;
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: next });
          });
        } else if (command === 'reset-speed') {
          chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: DEFAULT_SPEED }, () => {
            pendingSpeedChange = false;
            if (chrome.runtime.lastError) return;
            chrome.storage.sync.set({ ytSpeed: DEFAULT_SPEED });
          });
        }
      });
    }
  });
});

