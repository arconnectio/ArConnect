import { sendMessage, validateMessage } from "../utils/messenger";
import { comparePermissions, PermissionType } from "../utils/permissions";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { getRealURL } from "../utils/url";
import { createOverlay, createCoinWithAnimation } from "../utils/injected";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

const WalletAPI = {
  connect(
    permissions: PermissionType[],
    appInfo: { name?: string; logo?: string } = {}
  ): Promise<void> {
    const requestPermissionOverlay = createOverlay(
      "This page is requesting permission to connect to your wallet...<br />Please review them in the popup."
    );

    if (!appInfo.logo)
      appInfo.logo =
        document.head
          .querySelector(`link[rel="shortcut icon"]`)
          ?.getAttribute("href") ?? undefined;

    if (!appInfo.name)
      appInfo.name =
        document.title.length < 11
          ? document.title
          : getRealURL(window.location.href);

    return new Promise(async (resolve, reject) => {
      const existingPermissions = await this.getPermissions();

      if (comparePermissions(permissions, existingPermissions))
        return resolve();

      sendMessage(
        {
          type: "connect",
          ext: "arconnect",
          sender: "api",
          permissions,
          appInfo
        },
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
  disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "disconnect", ext: "arconnect", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "disconnect_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res) resolve();
        else reject(e.data.message);
      }
    });
  },
  getActiveAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_active_address", ext: "arconnect", sender: "api" },
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
        { type: "get_all_addresses", ext: "arconnect", sender: "api" },
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
  getWalletNames(): Promise<{ [addr: string]: string }> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_wallet_names", ext: "arconnect", sender: "api" },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "get_wallet_names_result" }))
          return;
        window.removeEventListener("message", callback);

        if (e.data.names) resolve(e.data.names);
        else reject(e.data.message);
      }
    });
  },
  addToken(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "add_token", ext: "arconnect", sender: "api", id },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "add_token_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res) resolve();
        else reject(e.data.message);
      }
    });
  },
  sign(
    transaction: Transaction,
    options?: SignatureOptions
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const arweave = new Arweave({
        host: "arweave.net",
        port: 443,
        protocol: "https"
      });

      sendMessage(
        {
          type: "sign_transaction",
          ext: "arconnect",
          sender: "api",
          transaction,
          signatureOptions: options
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (
          !validateMessage(e.data, {
            type: "sign_transaction_result"
          })
        )
          return;
        window.removeEventListener("message", callback);

        if (e.data.res && e.data.transaction) {
          const decodeTransaction = arweave.transactions.fromRaw(
            e.data.transaction
          );

          if (e.data.arConfetti) {
            for (let i = 0; i < 8; i++)
              setTimeout(() => createCoinWithAnimation(), i * 150);
          }
          resolve(decodeTransaction);
        } else reject(e.data.message);
      }
    });
  },
  getPermissions(): Promise<PermissionType[]> {
    return new Promise((resolve, reject) => {
      sendMessage(
        { type: "get_permissions", ext: "arconnect", sender: "api" },
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
  },
  encrypt(
    data: string,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      sendMessage(
        {
          type: "encrypt",
          ext: "arconnect",
          sender: "api",
          data,
          options
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "encrypt_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res && e.data.data)
          resolve(new Uint8Array(Object.values(e.data.data)));
        else reject(e.data.message);
      }
    });
  },
  decrypt(
    data: Uint8Array,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      sendMessage(
        {
          type: "decrypt",
          ext: "arconnect",
          sender: "api",
          data,
          options
        },
        undefined,
        undefined,
        false
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "decrypt_result" })) return;
        window.removeEventListener("message", callback);

        if (e.data.res && e.data.data) resolve(e.data.data);
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

window.arweaveWallet = WalletAPI;
dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

declare global {
  interface Window {
    arweaveWallet: typeof WalletAPI;
  }
  interface WindowEventMap {
    walletSwitch: CustomEvent<{ address: string }>;
    arweaveWalletLoaded: CustomEvent<{}>;
  }
}

export {};
