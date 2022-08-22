import { version } from "../../public/manifest.json";
import { MessageFormat, validateMessage } from "../utils/messenger";
import modules from "../api/foreground";

/* Listen to wallet switch event and dispatch it */
window.addEventListener("message", (e) => {
  if (
    !e.data ||
    !e.data.type ||
    e.data.type !== "switch_wallet_event_forward" ||
    !e.data.address
  )
    return;
  dispatchEvent(
    new CustomEvent("walletSwitch", { detail: { address: e.data.address } })
  );
});

/** Init wallet API */
const WalletAPI: Record<string, any> = {
  walletName: "ArConnect",
  walletVersion: version
};

// unique id for every call
let callID = 0;

/** Inject each module */
for (const mod of modules) {
  /** Handle foreground module and forward the result to the background */
  WalletAPI[mod.functionName] = (...params: any[]) =>
    new Promise<any>(async (resolve, reject) => {
      // execute foreground module
      const foregroundResult = await mod.function(...params);

      // construct data to send to the background
      const data: MessageFormat = {
        type: `api_${mod.functionName}`,
        origin: "injected",
        ext: "arconnect",
        callID,
        data: {
          params: foregroundResult
        }
      };

      // send message to background
      window.postMessage(data, window.location.origin);

      // increment callID
      callID++;

      // wait for result from background
      window.addEventListener("message", callback);

      async function callback(e: MessageEvent<MessageFormat>) {
        const { data: res } = e;
        if (!validateMessage(res, undefined, `${data.type}_result`) || !data)
          return;

        // only resolve when the result matching our callID is deleivered
        if (data.callID !== res.callID) return;

        window.removeEventListener("message", callback);

        // call the finalizer function if it exists
        if (mod.finalizer) {
          await mod.finalizer(res);
        }

        // check for errors
        if (res.error) {
          reject(res.data);
        }

        // resolve promise
        resolve(res.data);
      }
    });
}

// @ts-ignore
window.arweaveWallet = WalletAPI;
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

export {};
