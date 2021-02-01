chrome.runtime.onInstalled.addListener(() => {
  window.open(chrome.runtime.getURL("/welcome.html"));
});

export {};
