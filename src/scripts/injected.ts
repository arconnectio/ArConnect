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
  async sign(
    transaction: Transaction,
    options?: SignatureOptions
  ): Promise<Transaction> {
    const arweave = new Arweave({
      host: "arweave.net",
      port: 443,
      protocol: "https"
    });

    try {
      const data = await callAPI({
        type: "sign_transaction",
        ext: "arconnect",
        sender: "api",
        transaction,
        signatureOptions: options
      });
      if (!data.res || !data.transaction) throw new Error(data.message);

      const decodeTransaction = arweave.transactions.fromRaw(data.transaction);

      if (data.arConfetti) {
        for (let i = 0; i < 8; i++)
          setTimeout(() => createCoinWithAnimation(), i * 150);
      }

      return decodeTransaction;
    } catch (e) {
      throw new Error(e);
    }
  },
  async getPermissions(): Promise<PermissionType[]> {
    try {
      const data = await callAPI({
        type: "get_permissions",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.permissions) throw new Error(data.message);
      return data.permissions;
    } catch (e) {
      throw new Error(e);
    }
  },
  async encrypt(
    data: string,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<Uint8Array> {
    try {
      const result = await callAPI({
        type: "encrypt",
        ext: "arconnect",
        sender: "api",
        data,
        options
      });
      if (!result.res || !result.data) throw new Error(result.message);
      return new Uint8Array(Object.values(result.data));
    } catch (e) {
      throw new Error(e);
    }
  },
  async decrypt(
    data: Uint8Array,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<string> {
    try {
      const result = await callAPI({
        type: "decrypt",
        ext: "arconnect",
        sender: "api",
        data,
        options
      });
      if (!result.res || !result.data) throw new Error(result.message);
      return result.data;
    } catch (e) {
      throw new Error(e);
    }
  },
  async signature(
    data: Uint8Array,
    options: {
      algorithm: string;
      signing: any;
    }
  ): Promise<string> {
    try {
      const result = await callAPI({
        type: "signature",
        ext: "arconnect",
        sender: "api",
        data,
        options
      });
      if (!result.res || !result.data) throw new Error(result.message);
      return result.data;
    } catch (e) {
      throw new Error(e);
    }
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
