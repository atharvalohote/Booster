chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ defaultSpeed: 1 });
    console.log('Booster installed. Default speed set to 1x.');
  } else if (details.reason === 'update') {
    console.log('Booster updated.');
  }
}); 