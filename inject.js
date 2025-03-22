// Helper functions
function setPlaybackSpeed(video, speed) {
    if (!video) return;
    const maxSpeed = 16;
    video.playbackRate = Math.min(speed, maxSpeed);
    console.log(`🎥 Speed set to ${video.playbackRate}x`);
}

function muteVideo(video) {
    if (!video) return;
    video.muted = true;
    console.log("🔇 Muted");
}

function unmuteVideo(video) {
    if (!video) return;
    video.muted = false;
    console.log("🔊 Unmuted");
}

function hideAdElements() {
    const adSelectors = [
        ".ytp-ad-player-overlay",
        ".ytp-ad-image",
        ".video-ads",
        ".ytp-ad-skip-button-container",
        ".ytp-ad-text",
        ".ytp-ad-module"
    ];
    adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => (el.style.display = "none"));
    });
    console.log("🛑 Ad elements hidden");
}

function showVideoElements() {
    const adSelectors = [
        ".ytp-ad-player-overlay",
        ".ytp-ad-image",
        ".video-ads",
        ".ytp-ad-skip-button-container",
        ".ytp-ad-text",
        ".ytp-ad-module"
    ];
    adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => (el.style.display = ""));
    });
    console.log("🎬 Video elements restored");
}

function skipAd() {
    const skipButton = document.querySelector(".ytp-ad-skip-button");
    if (skipButton) {
        skipButton.click();
        console.log("⏭️ Ad skipped");
        return true;
    }
    return false;
}

// Ad detection
function isAdPlaying(video) {
    if (!video) return false;

    const adSigns = [
        document.querySelector(".ad-showing"),
        document.querySelector(".ytp-ad-player-overlay"),
        document.querySelector(".ytp-ad-skip-button"),
        document.querySelector(".ytp-ad-text"),
        document.querySelector(".ytp-ad-interrupting")
    ].some(sign => sign !== null);

    const isWatchPage = window.location.pathname.startsWith("/watch");
    const isAd = adSigns && isWatchPage;

    console.log(`🔍 Is ad? ${isAd} | Signs detected: ${adSigns}`);
    return isAd;
}

// Main logic with error handling
function handlePlayback() {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
        console.log("❌ Extension context invalidated, stopping execution");
        return;
    }

    const video = document.querySelector("video");
    if (!video) {
        console.log("❌ No video found");
        return;
    }

    chrome.storage.sync.get(["enabled", "defaultSpeed"], (data) => {
        // Check again after async call
        if (!chrome.runtime?.id) {
            console.log("❌ Extension context lost during storage fetch");
            return;
        }

        if (!data.enabled) {
            setPlaybackSpeed(video, 1);
            unmuteVideo(video);
            showVideoElements();
            console.log("🚫 Extension disabled, reset to normal");
            return;
        }

        const normalSpeed = data.defaultSpeed || 1;

        if (window.location.href.includes("coursera.org")) {
            setPlaybackSpeed(video, 16);
            console.log("📚 Coursera: 16x speed");
            return;
        }

        if (isAdPlaying(video)) {
            setPlaybackSpeed(video, 16);
            muteVideo(video);
            hideAdElements();
            skipAd();
            console.log("🚀 Handling ad");
        } else {
            setPlaybackSpeed(video, normalSpeed);
            unmuteVideo(video);
            showVideoElements();
            console.log(`🎥 Regular video at ${normalSpeed}x`);
        }
    });
}

// Monitor page and playback
function startMonitoring() {
    if (!chrome.runtime?.id) {
        console.log("❌ Extension not loaded, cannot start monitoring");
        return;
    }

    let lastVideo = null;

    function checkPlayback() {
        if (!chrome.runtime?.id) return;

        const video = document.querySelector("video");
        if (video && video !== lastVideo) {
            lastVideo = video;
            video.addEventListener("play", handlePlayback);
            video.addEventListener("ended", () => {
                console.log("🏁 Segment ended");
                setTimeout(handlePlayback, 500);
            });
            console.log("👀 New video detected, listeners added");
        }
        handlePlayback();
    }

    const observer = new MutationObserver(() => {
        if (chrome.runtime?.id) checkPlayback();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    checkPlayback();
    setInterval(() => {
        if (chrome.runtime?.id) checkPlayback();
    }, 2000);

    console.log("🔄 Monitoring started");
}

// Storage updates
if (chrome.runtime?.id) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync" && chrome.runtime?.id) {
            console.log("🔄 Settings changed");
            handlePlayback();
        }
    });
}

// Start everything
startMonitoring();
handlePlayback();