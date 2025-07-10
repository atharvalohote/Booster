// ==UserScript==
// @name         Booster Content Script
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Multi-layered ad handling for YouTube and Coursera
// ==/UserScript==

(function() {
  // --- Configurable selectors and timing ---
  const adSelectors = [
    '.ad-showing',
    '.ytp-ad-player-overlay',
    '[id*="ad"], [class*="ad"]',
  ];
  const skipSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-container button',
  ];
  const adVideoSelector = 'video';
  const mainVideoSelector = 'video.html5-main-video';
  let fallbackTimeout = null;
  let adActive = false;
  let lastUserSpeed = 1;

  // --- OSD (On-Screen Display) ---
  function showAdSkippedOSD() {
    // Remove any existing OSD
    const old = document.getElementById('booster-ad-skipped-osd');
    if (old) old.remove();
    // Create OSD
    const osd = document.createElement('div');
    osd.id = 'booster-ad-skipped-osd';
    osd.textContent = 'Ad Skipped!';
    osd.style.position = 'absolute';
    osd.style.left = '50%';
    osd.style.bottom = '60px'; // just above controls
    osd.style.transform = 'translateX(-50%)';
    osd.style.background = 'rgba(28,28,28,0.9)';
    osd.style.color = '#fff';
    osd.style.fontFamily = 'Roboto, Arial, sans-serif';
    osd.style.fontSize = '1rem';
    osd.style.fontWeight = '400';
    osd.style.padding = '10px 24px';
    osd.style.borderRadius = '4px';
    osd.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    osd.style.zIndex = '99999';
    osd.style.opacity = '0';
    osd.style.pointerEvents = 'none';
    osd.style.transition = 'opacity 0.3s';
    // Find the player area
    const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player') || document.body;
    player.appendChild(osd);
    // Fade in
    setTimeout(() => {
      osd.style.opacity = '1';
    }, 10);
    // Fade out
    setTimeout(() => {
      osd.style.opacity = '0';
      setTimeout(() => osd.remove(), 300);
    }, 1600);
  }

  // --- Utility functions ---
  function muteVideo(mute) {
    const video = document.querySelector(adVideoSelector);
    if (video) video.muted = mute;
  }
  function hideAdContainer(hide) {
    const adContainer = document.querySelector('.ad-showing') || document.querySelector('.ytp-ad-player-overlay');
    if (adContainer) adContainer.style.visibility = hide ? 'hidden' : '';
  }
  function seekAdToEnd() {
    const adVideo = document.querySelector(adVideoSelector);
    if (adVideo && adVideo.duration && adVideo.currentTime < adVideo.duration - 0.5) {
      adVideo.currentTime = adVideo.duration - 0.1;
    } else if (adVideo) {
      adVideo.currentTime = 9999;
    }
  }
  function clickSkipButton() {
    let skipped = false;
    for (const selector of skipSelectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        skipped = true;
        break;
      }
    }
    if (skipped) showAdSkippedOSD();
  }
  function setPlaybackSpeed(speed) {
    const video = document.querySelector(adVideoSelector);
    if (video) video.playbackRate = speed;
  }
  function restoreState() {
    muteVideo(false);
    hideAdContainer(false);
    setPlaybackSpeed(lastUserSpeed);
  }
  function isAdPlaying() {
    return adSelectors.some(sel => document.querySelector(sel));
  }
  function getUserSpeed(cb) {
    try {
      chrome.storage.sync.get(['defaultSpeed'], function(data) {
        cb((data && data.defaultSpeed) ? data.defaultSpeed : 1);
      });
    } catch (e) {
      cb(1);
    }
  }

  // --- Main ad handling workflow ---
  function handleAd() {
    if (adActive) return;
    adActive = true;
    getUserSpeed((userSpeed) => {
      lastUserSpeed = userSpeed;
      muteVideo(true);
      hideAdContainer(true);
      seekAdToEnd();
      clickSkipButton();
      // Fallback: after 1.5s, if ad is still playing, set 16x speed
      fallbackTimeout = setTimeout(() => {
        if (isAdPlaying()) {
          setPlaybackSpeed(16);
          showAdSkippedOSD();
        }
      }, 1500);
    });
  }

  function handleAdEnd() {
    if (!adActive) return;
    adActive = false;
    if (fallbackTimeout) clearTimeout(fallbackTimeout);
    restoreState();
  }

  // --- MutationObserver for ad detection ---
  const observer = new MutationObserver(() => {
    if (isAdPlaying()) {
      handleAd();
      clickSkipButton();
    } else {
      handleAdEnd();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // --- Coursera: always set 16x speed ---
  function courseraSpeed() {
    if (window.location.hostname.includes('coursera.org')) {
      const video = document.querySelector('video');
      if (video) video.playbackRate = 16;
    }
  }
  setInterval(courseraSpeed, 1000);

  // --- Initial state restore ---
  getUserSpeed((userSpeed) => {
    lastUserSpeed = userSpeed;
    restoreState();
  });
})(); 