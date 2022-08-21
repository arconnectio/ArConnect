import { version } from "../../public/manifest.json";

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

/** Inject each module */
for (const mod of modules) {
  WalletAPI[mod.functionName] = async (...params: any[]) => {
    /** Handle foreground module and forward the result to the background */
    const foregroundResult = await mod.function(...params);
    console.log(foregroundResult);
  };
}

// @ts-ignore
window.arweaveWallet = WalletAPI;
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

export {};
