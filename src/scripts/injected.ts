import { validateMessage } from "../utils/messenger";
import { comparePermissions, PermissionType } from "../utils/permissions";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { getRealURL } from "../utils/url";
import {
  createOverlay,
  createCoinWithAnimation,
  callAPI
} from "../utils/injected";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

const WalletAPI = {
  async connect(
    permissions: PermissionType[],
    appInfo: { name?: string; logo?: string } = {}
  ) {
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

    try {
      const existingPermissions = await this.getPermissions();

      if (comparePermissions(permissions, existingPermissions)) return;

      document.body.appendChild(requestPermissionOverlay);
      await callAPI({
        type: "connect",
        ext: "arconnect",
        sender: "api",
        permissions,
        appInfo
      });
      document.body.removeChild(requestPermissionOverlay);
    } catch (e) {
      if (document.body.contains(requestPermissionOverlay))
        document.body.removeChild(requestPermissionOverlay);

      throw new Error(e);
    }
  },
  async disconnect() {
    try {
      const data = await callAPI({
        type: "disconnect",
        ext: "arconnect",
        sender: "api"
      });

      if (!data.res) throw new Error(data.message);
    } catch (e) {
      throw new Error(e);
    }
  },
  async getActiveAddress() {
    try {
      const data = await callAPI({
        type: "get_active_address",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.res) throw new Error(data.message);

      return data.address as string;
    } catch (e) {
      throw new Error(e);
    }
  },
  async getAllAddresses() {
    try {
      const data = await callAPI({
        type: "get_all_addresses",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.res) throw new Error(data.message);

      return data.addresses as string[];
    } catch (e) {
      throw new Error(e);
    }
  },
  async getWalletNames(): Promise<{ [addr: string]: string }> {
    try {
      const data = await callAPI({
        type: "get_wallet_names",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.res) throw new Error(data.message);

      return data.names;
    } catch (e) {
      throw new Error(e);
    }
  },
  async addToken(id: string): Promise<void> {
    try {
      const data = await callAPI({
        type: "add_token",
        ext: "arconnect",
        sender: "api",
        id
      });
      if (!data.res) throw new Error(data.message);
    } catch (e) {
      throw new Error(e);
    }
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

      window.postMessage(
        {
          type: "sign_transaction",
          ext: "arconnect",
          sender: "api",
          transaction,
          signatureOptions: options
        },
        window.location.origin
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
      window.postMessage(
        { type: "get_permissions", ext: "arconnect", sender: "api" },
        window.location.origin
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
      window.postMessage(
        {
          type: "encrypt",
          ext: "arconnect",
          sender: "api",
          data,
          options
        },
        window.location.origin
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
      window.postMessage(
        {
          type: "decrypt",
          ext: "arconnect",
          sender: "api",
          data,
          options
        },
        window.location.origin
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
  },
  signature(
    data: Uint8Array,
    options: {
      algorithm: string;
      signing: any;
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      window.postMessage(
        {
          type: "signature",
          ext: "arconnect",
          sender: "api",
          data,
          options
        },
        window.location.origin
      );
      window.addEventListener("message", callback);

      // @ts-ignore
      function callback(e: MessageEvent<any>) {
        if (!validateMessage(e.data, { type: "signature_result" })) return;
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
