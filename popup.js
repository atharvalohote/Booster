document.addEventListener("DOMContentLoaded", function () {
    let toggleExtension = document.getElementById("toggleExtension");
    let speedInput = document.getElementById("speedInput");
    let saveBtn = document.getElementById("saveBtn");

    // Load stored settings
    chrome.storage.sync.get(["enabled", "defaultSpeed"], function (data) {
        toggleExtension.checked = data.enabled !== false; // Default enabled
        speedInput.value = data.defaultSpeed || 1;
    });

    // Save settings
    saveBtn.addEventListener("click", function () {
        let enabled = toggleExtension.checked;
        let defaultSpeed = parseFloat(speedInput.value) || 1;

        chrome.storage.sync.set({ enabled, defaultSpeed }, function () {
            console.log("✅ Settings saved:", { enabled, defaultSpeed });
        });
    });
});
