declare global {
  interface Window {
    weavemask_id: string;
    arweave: typeof ArweaveAPI;
    weavemask: typeof WeaveMaskAPI;
  }
}

function createHTMLFromString(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;

  return container;
}

const WeaveMaskAPI = {
  connect(): Promise<any> {
    const requestPermissionOverlay = createHTMLFromString(`
      <div style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 100000000; background-color: rgba(0, 0, 0, .73); font-family: 'Inter', sans-serif;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff;">
          <h1 style="text-align: center; margin: 0; font-size: 3em; font-weight: 600; margin-bottom: .35em; line-height: 1em;">WeaveMask</h1>
          <p style="text-align: center; font-size: 1.2em; font-weight: 500;">This page is requesting permission to connect to WeaveMask...<br />Please open the extension popup to continue.</p>
        </div>
      </div>
    `);

    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: "connect", ext: "weavemask", sender: "api" },
        window.location.origin
      );
      window.addEventListener("message", callback);
      document.body.appendChild(requestPermissionOverlay);

      function callback(e: MessageEvent<any>) {
        if (
          !e.data.type ||
          e.data.ext !== "weavemask" ||
          e.data.type !== "connect_result"
        )
          return;
        window.removeEventListener("message", callback);
        document.body.removeChild(requestPermissionOverlay);
        if (e.data.res) resolve(e.data.message);
        else reject(e.data.message);
      }
    });
  }
};

const ArweaveAPI = {};

window.weavemask = WeaveMaskAPI;
window.arweave = ArweaveAPI;

export {};
