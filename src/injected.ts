import type { ApiCall, ApiResponse } from "shim";
import { version } from "../package.json";
import { nanoid } from "nanoid";
import modules from "~api/foreground";

/** Init wallet API */
const WalletAPI: Record<string, any> = {
  walletName: "ArConnect",
  walletVersion: version
};

/** Inject each module */
for (const mod of modules) {
  /** Handle foreground module and forward the result to the background */
  WalletAPI[mod.functionName] = (...params: any[]) =>
    new Promise<any>(async (resolve, reject) => {
      // execute foreground module
      const foregroundResult = await mod.function(...params);

      // construct data to send to the background
      const callID = nanoid();
      const data: ApiCall & { ext: "arconnect" } = {
        type: `api_${mod.functionName}`,
        ext: "arconnect",
        callID,
        data: {
          params: foregroundResult || params
        }
      };

      // send message to background
      window.postMessage(data, window.location.origin);

      // wait for result from background
      window.addEventListener("message", callback);

      async function callback(e: MessageEvent<ApiResponse>) {
        let { data: res } = e;

        // validate return message
        if (`${data.type}_result` !== res.type) return;

        // only resolve when the result matching our callID is deleivered
        if (data.callID !== res.callID) return;

        window.removeEventListener("message", callback);

        // check for errors
        if (res.error) {
          return reject(res.data);
        }

        // call the finalizer function if it exists
        if (mod.finalizer) {
          const finalizerResult = await mod.finalizer(
            res.data,
            foregroundResult,
            params
          );

          // if the finalizer transforms data
          // update the result
          if (finalizerResult) {
            res.data = finalizerResult;
          }
        }

        // check for errors after the finalizer
        if (res.error) {
          return reject(res.data);
        }

        // resolve promise
        return resolve(res.data);
      }
    });
}

// @ts-expect-error
window.arweaveWallet = WalletAPI;

// at the end of the injected script,
// we dispatch the wallet loaded event
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

export {};