import { sendMessage, validateMessage } from "../utils/messenger";
import { PermissionType } from "../utils/permissions";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

function createOverlay(text: string) {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 1000000000000; background-color: rgba(0, 0, 0, .73); font-family: 'Inter', sans-serif;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff;">
        <h1 style="text-align: center; margin: 0; font-size: 3em; font-weight: 600; margin-bottom: .35em; line-height: 1em;">Arweave</h1>
        <p style="text-align: center; font-size: 1.2em; font-weight: 500;">${text}</p>
      </div>
    </div>
  `;

  return container;
}

const WeaveMaskAPI = {
  connect(permissions: PermissionType[]): Promise<void> {
    const requestPermissionOverlay = createOverlay(
      "This page is requesting permission to connect to your wallet...<br />Please review them in the popup."
    );

    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "connect", ext: "weavemask", sender: "api", permissions },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);
      document.body.appendChild(requestPermissionOverlay);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "connect_result" })) return;
        window.removeEventListener("message", callback);
        document.body.removeChild(requestPermissionOverlay);

        if (e.data.res) resolve();
        else reject(e.data.message);
      }
    });
  },
  getActiveAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_active_address", ext: "weavemask", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_active_address_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.address) resolve(e.data.address);
        else reject(e.data.message);
      }
    });
  },
  getAllAddresses(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_all_addresses", ext: "weavemask", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_all_addresses_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.addresses) resolve(e.data.addresses);
        else reject(e.data.message);
      }
    });
  },
  sign(
    transaction: Transaction,
    options?: SignatureOptions
  ): Promise<Transaction> {
    const transactionOverlay = createOverlay(
      "This page is trying to sign a transaction with Arweave...<br />Please use the popup to log in and continue."
    );

    return new Promise((resolve, reject) => {
      const arweave = new Arweave({
        host: "arweave.net",
        port: 443,
        protocol: "https"
      });

      sendMessage(
        {
          type: "sign_transaction",
          ext: "weavemask",
          sender: "api",
          transaction,
          signatureOptions: options
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);
      document.body.appendChild(transactionOverlay);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (
          !validateMessage(e.data, {
            type: "sign_transaction_result"
          })
        )
          return;
        window.removeEventListener("message", callback);
        document.body.removeChild(transactionOverlay);

        if (e.data.res && e.data.transaction) {
          const decodeTransaction = arweave.transactions.fromRaw(
            e.data.transaction
          );
          resolve(decodeTransaction);
        } else reject(e.data.message);
      }
    });
  },
  getPermissions(): Promise<PermissionType[]> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_permissions", ext: "weavemask", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_permissions_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.permissions) resolve(e.data.permissions);
        else reject(e.data.message);
      }
    });
  }
};

// listen to wallet switch event and dispatch it
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

window.weavemask = WeaveMaskAPI;
dispatchEvent(new CustomEvent("weaveMaskLoaded", { detail: {} }));

declare global {
  interface Window {
    weavemask: typeof WeaveMaskAPI;
  }
  interface WindowEventMap {
    walletSwitch: CustomEvent<{ address: string }>;
    weaveMaskLoaded: CustomEvent<{}>;
  }
}

export {};
