// content.js
// Runs in YouTube pages. Applies speed to all <video> elements and watches for new ones.

// Constants
const DEFAULT_SPEED = 1.0;
const VIDEO_INIT_DELAY = 120; // ms to wait for video element initialization

window.__yt_speed_controller = {
  desiredSpeed: DEFAULT_SPEED
};

function setAllVideosSpeed(speed) {
  const vids = Array.from(document.querySelectorAll('video'));
  vids.forEach(v => {
    try {
      // Check if element is still attached to DOM
      if (v.isConnected) {
        v.playbackRate = speed;
      }
    } catch (e) {
      // ignore
    }
  });
  // update badge via sending to background (optional)
  chrome.runtime.sendMessage({ type: 'SPEED_UPDATED', value: speed }, () => {
    if (chrome.runtime.lastError) {
      // Extension context invalidated or background not ready
    }
  });
}

function readSavedSpeedAndApply() {
  chrome.storage.sync.get(['ytSpeed'], (res) => {
    const s = (res && res.ytSpeed) ? Number(res.ytSpeed) : DEFAULT_SPEED;
    window.__yt_speed_controller.desiredSpeed = s;
    setAllVideosSpeed(s);
  });
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  
  if (msg.type === 'SET_SPEED') {
    const val = Number(msg.value) || DEFAULT_SPEED;
    window.__yt_speed_controller.desiredSpeed = val;
    // save persistently
    chrome.storage.sync.set({ ytSpeed: val }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to save speed to storage:', chrome.runtime.lastError.message);
      }
    });
    setAllVideosSpeed(val);
    sendResponse({ ok: true, value: val });
  } else if (msg.type === 'GET_SPEED') {
    sendResponse({ value: window.__yt_speed_controller.desiredSpeed });
  }
  
  return true; // Always return true to keep message port open
});

// Watch for DOM changes: YouTube often replaces the video element on navigation/ads
const observer = new MutationObserver((mutations) => {
  const speed = window.__yt_speed_controller.desiredSpeed || DEFAULT_SPEED;
  
  // Optimized: Check if any mutation added a video element directly
  const hasNewVideo = mutations.some(m => {
    if (!m.addedNodes || !m.addedNodes.length) return false;
    return Array.from(m.addedNodes).some(node => 
      node.tagName && node.tagName.toLowerCase() === 'video'
    );
  });
  
  if (hasNewVideo) {
    // small delay to let the video element initialize
    setTimeout(() => setAllVideosSpeed(speed), VIDEO_INIT_DELAY);
  }
});

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true
});

// Cleanup observer on page unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});

// Apply saved speed initially
readSavedSpeedAndApply();

// Also respond to storage changes (if user changed speed in another window)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.ytSpeed) {
    const newVal = Number(changes.ytSpeed.newValue);
    window.__yt_speed_controller.desiredSpeed = newVal;
    setAllVideosSpeed(newVal);
  }
});