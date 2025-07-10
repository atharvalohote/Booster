// Load saved speed
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['defaultSpeed'], function(data) {
        const speed = data.defaultSpeed || 1;
        document.getElementById('speedSlider').value = speed;
        document.getElementById('speedValue').textContent = speed + 'x';
    });
});
// Update value label
document.getElementById('speedSlider').addEventListener('input', function(e) {
    document.getElementById('speedValue').textContent = e.target.value + 'x';
});
// Save speed
document.getElementById('saveBtn').addEventListener('click', function() {
    const speed = parseFloat(document.getElementById('speedSlider').value);
    chrome.storage.sync.set({ defaultSpeed: speed }, function() {
        document.getElementById('status').textContent = 'Saved!';
        setTimeout(() => document.getElementById('status').textContent = '', 1500);
    });
}); 