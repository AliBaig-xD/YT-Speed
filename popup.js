// popup.js
// Constants
const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.25;
const MAX_SPEED = 3.0;

const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const speedInput = document.getElementById('speedInput');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const container = document.querySelector('.container');

// Set platform-specific keyboard shortcut hint
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? 'Cmd' : 'Ctrl';
document.getElementById('keyboardHint').textContent = 
  `Keyboard: ${modKey}+Shift+. / , (increase / decrease)`;

// Check if current tab is YouTube
function checkYouTubeTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) {
      callback(false);
      return;
    }
    const isYouTube = tab.url && (tab.url.includes('youtube.com') || tab.url.includes('youtu.be'));
    callback(isYouTube, tab);
  });
}

function showWarning(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message warning';
  statusMessage.style.display = 'block';
  document.querySelectorAll('.presets, .custom, .footer button').forEach(el => {
    el.classList.add('controls-disabled');
  });
}

function hideWarning() {
  statusMessage.style.display = 'none';
  document.querySelectorAll('.presets, .custom, .footer button').forEach(el => {
    el.classList.remove('controls-disabled');
  });
}

// presets buttons
document.querySelectorAll('.presets button').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = Number(btn.dataset.speed);
    updateUI(v);
    applySpeedToActiveTab(v, () => {
      saveSpeed(v);
    });
  });
});

function updateUI(v) {
  speedRange.value = v;
  speedInput.value = Number(v).toFixed(2);
  speedValue.textContent = Number(v).toFixed(2);
}

speedRange.addEventListener('input', (e) => {
  const v = Number(e.target.value);
  updateUI(v);
});

applyBtn.addEventListener('click', () => {
  const v = Number(speedInput.value) || Number(speedRange.value) || DEFAULT_SPEED;
  const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, v));
  updateUI(clamped);
  applySpeedToActiveTab(clamped, () => {
    saveSpeed(clamped);
  });
});

resetBtn.addEventListener('click', () => {
  updateUI(DEFAULT_SPEED);
  applySpeedToActiveTab(DEFAULT_SPEED, () => {
    saveSpeed(DEFAULT_SPEED);
  });
});

speedInput.addEventListener('change', () => {
  let v = Number(speedInput.value);
  if (!isFinite(v)) v = Number(speedRange.value);
  v = Math.min(3, Math.max(0.25, v));
  updateUI(v);
});

// helper: send message to active tab to set speed
function applySpeedToActiveTab(speed, onSuccess) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const t = tabs[0];
    if (!t) return;
    chrome.tabs.sendMessage(t.id, { type: 'SET_SPEED', value: Number(speed) }, (resp) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded (not on YouTube) - ignore silently
        return;
      }
      if (resp && resp.ok) {
        if (onSuccess) onSuccess();
      }
    });
  });
}

function saveSpeed(speed) {
  chrome.storage.sync.set({ ytSpeed: Number(speed) });
}

// On open: check if we're on YouTube and load current speed
checkYouTubeTab((isYouTube, tab) => {
  if (!isYouTube) {
    showWarning('This extension only works on YouTube.com');
    // Still show last saved speed for reference
    chrome.storage.sync.get(['ytSpeed'], (res) => {
      const val = (res && res.ytSpeed) ? Number(res.ytSpeed) : DEFAULT_SPEED;
      updateUI(val);
    });
    return;
  }
  
  hideWarning();
  
  // Load current saved speed and also ask content script for current speed
  chrome.storage.sync.get(['ytSpeed'], (res) => {
    const val = (res && res.ytSpeed) ? Number(res.ytSpeed) : DEFAULT_SPEED;
    updateUI(val);
    // in case tab has different value, try to fetch it (best-effort)
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' }, (resp) => {
        // Silently handle errors - popup may close before response
        if (chrome.runtime.lastError) return;
        if (resp && resp.value) {
          updateUI(Number(resp.value));
        }
      });
    }
  });
});