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
      // apply only to HTMLMediaElement
      v.playbackRate = speed;
    } catch (e) {
      // ignore
    }
  });
  // update badge via sending to background (optional)
  chrome.runtime.sendMessage({ type: 'SPEED_UPDATED', value: speed }, () => {});
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
    chrome.storage.sync.set({ ytSpeed: val }, () => {});
    setAllVideosSpeed(val);
    sendResponse({ ok: true, value: val });
  } else if (msg.type === 'GET_SPEED') {
    sendResponse({ value: window.__yt_speed_controller.desiredSpeed });
  }
  // keep channel open for async
  return true;
});

// Watch for DOM changes: YouTube often replaces the video element on navigation/ads
const observer = new MutationObserver((mutations) => {
  const speed = window.__yt_speed_controller.desiredSpeed || DEFAULT_SPEED;
  // If there are added nodes that include <video>, apply speed
  let foundVideo = false;
  for (const m of mutations) {
    if (foundVideo) break; // Early exit once we find a video
    if (m.addedNodes && m.addedNodes.length) {
      for (const node of m.addedNodes) {
        if (node.tagName && node.tagName.toLowerCase() === 'video') {
          foundVideo = true;
          break;
        }
        // also check subtree (only if node has querySelector)
        if (node.querySelector) {
          if (node.querySelector('video')) {
            foundVideo = true;
            break;
          }
        }
      }
    }
  }
  if (foundVideo) {
    // small delay to let the video element initialize
    setTimeout(() => setAllVideosSpeed(speed), VIDEO_INIT_DELAY);
  }
});

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true
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