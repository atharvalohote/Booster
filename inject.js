
// Function to set playback speed safely
function setPlaybackSpeed(speed) {
    let video = document.querySelector('video');
    if (video) {
        let maxSpeed = 16; // Maximum supported playback speed
        let finalSpeed = Math.min(speed, maxSpeed);
        video.playbackRate = finalSpeed;
    }
}

// Function to mute/unmute video
function setMuted(muted) {
    let video = document.querySelector('video');
    if (video) {
        video.muted = muted;
    }
}

// Function to auto-click YouTube ad skip button if present
function trySkipAd(force=false) {
    // Try all known skip button selectors
    const skipSelectors = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button-container button',
    ];
    for (const selector of skipSelectors) {
        const btn = document.querySelector(selector);
        if (btn && (btn.offsetParent !== null || force)) { // visible or force
            btn.click();
            break;
        }
    }
}

// Track ad state to restore mute after ad
let adWasPlaying = false;

// Function to detect ads, adjust speed, mute, and try to skip
function checkForAds(defaultSpeed) {
    let adOverlay = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
    let video = document.querySelector('video');

    if (adOverlay && video) {
        setPlaybackSpeed(16); // Speed up ads to max 16x
        setMuted(true); // Mute ad
        trySkipAd(); // Try to skip as soon as possible
        adWasPlaying = true;
    } else if (video) {
        setPlaybackSpeed(defaultSpeed); // Restore normal speed for videos
        if (adWasPlaying) {
            setMuted(false); // Unmute after ad
            adWasPlaying = false;
        }
        // After ad overlay is gone, try to click skip button in case it's still present
        trySkipAd(true);
    }
}

// MutationObserver for instant skip (optional, fallback to interval)
(function setupAdSkipObserver() {
    if (window.location.hostname.includes('youtube.com')) {
        const observer = new MutationObserver(() => {
            trySkipAd();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();

// Function to enable 16x speed on Coursera
function checkForCoursera() {
    let video = document.querySelector('video');
    if (video && window.location.href.includes("coursera.org")) {
        setPlaybackSpeed(16);
    }
}

// Get default speed from storage and run checks, with error handling
function runBooster() {
    try {
        chrome.storage.sync.get(["defaultSpeed"], function (data) {
            let normalSpeed = (data && data.defaultSpeed) ? data.defaultSpeed : 1;
            checkForAds(normalSpeed);
            checkForCoursera();
        });
    } catch (e) {
        // If extension context is invalid, fallback to default speed
        checkForAds(1);
        checkForCoursera();
    }
}

// Run the function repeatedly to check for ads and Coursera
setInterval(runBooster, 500);
