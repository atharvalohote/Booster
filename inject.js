
// Function to set playback speed safely
function setPlaybackSpeed(speed) {
    let video = document.querySelector('video');
    if (video) {
        let maxSpeed = 16; // Maximum supported playback speed
        let finalSpeed = Math.min(speed, maxSpeed);
        video.playbackRate = finalSpeed;
        console.log(`🎥 Playback speed set to ${finalSpeed}x`);
    }
}

// Function to detect ads and adjust speed
function checkForAds() {
    let adOverlay = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
    let video = document.querySelector('video');

    if (adOverlay && video) {
        setPlaybackSpeed(16); // Speed up ads to max 16x
        console.log('🚀 Ad detected! Speeding up to 16x...');
    } else if (video) {
        chrome.storage.sync.get(["defaultSpeed"], function (data) {
            let normalSpeed = data.defaultSpeed || 1;
            setPlaybackSpeed(normalSpeed); // Restore normal speed for videos
        });
    }
}

// Function to enable 16x speed on Coursera
function checkForCoursera() {
    let video = document.querySelector('video');
    if (video && window.location.href.includes("coursera.org")) {
        setPlaybackSpeed(16);
        console.log('📚 Coursera detected! Setting speed to 16x.');
    }
}

// Run the function repeatedly to check for ads and Coursera
setInterval(() => {
    checkForAds();
    checkForCoursera();
}, 500);
