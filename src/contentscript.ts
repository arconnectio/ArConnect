function addScriptToWindow(path: string) {
  try {
    const container = document.head || document.documentElement,
      script = document.createElement("script");

    script.setAttribute("async", "false");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", path);
    container.insertBefore(script, container.children[0]);
    container.removeChild(script);
  } catch (e) {
    console.error("Failed to inject WeaveMask api", e);
  }
}

addScriptToWindow(chrome.extension.getURL("/static/js/api.js"));

export {};
