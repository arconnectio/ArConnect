import { comparePermissions, PermissionType } from "../utils/permissions";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { getRealURL } from "../utils/url";
import { IArweave } from "../stores/reducers/arweave";
import { splitTxToChunks } from "../utils/chunks";
import { DispatchResult } from "../utils/background";
import {
  createOverlay,
  createCoinWithAnimation,
  callAPI
} from "../utils/injected";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

/** Maximum size (in bytes) sponsored for bundles using the Bundlr Network */
const ACCEPTED_DISPATCH_SIZE = 120 * Math.pow(10, 3);

const WalletAPI = {
  walletName: "ArConnect",
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
    } catch (e: any) {
      if (document.body.contains(requestPermissionOverlay)) {
        document.body.removeChild(requestPermissionOverlay);
      }

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
    } catch (e: any) {
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
    } catch (e: any) {
      throw new Error(e);
    }
  },
  async getActivePublicKey() {
    try {
      const data = await callAPI({
        type: "get_active_public_key",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.res) throw new Error(data.message);

      return data.publicKey as string;
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    // generate a unique ID for this transaction's chunks
    // since the transaction does not have an ID yet
    const chunkCollectionID = (
      Date.now() * Math.floor(Math.random() * 100)
    ).toString();

    /**
     * Part one, create chunks from the tags
     * and the data of the transaction
     */
    const {
      transaction: tx,
      dataChunks,
      tagChunks
    } = splitTxToChunks(transaction, chunkCollectionID);

    try {
      /**
       * Part two, send the chunks to the background script
       */

      // we call the api and request it to start receiving
      // the chunks and we also send the tx object (except
      // the data and the tags). now the background script
      // will listen for incoming chunks
      const data = await callAPI({
        type: "sign_transaction",
        chunkCollectionID,
        transaction: tx,
        signatureOptions: options
      });

      // somewhy the chunk streaming was not accepted, most
      // likely because the site does not have the permission
      if (!data.res)
        throw new Error(
          `Failed to initiate transaction chunk stream: \n${data.message}`
        );

      // send data chunks
      for (const chunk of dataChunks) {
        const chunkRes = await callAPI({
          type: "sign_transaction_chunk",
          chunk: chunk
        });

        // chunk fail
        if (!chunkRes.res)
          throw new Error(
            `Error while sending a data chunk of collection "${chunkCollectionID}": \n${data.message}`
          );
      }

      // send tag chunks
      for (const chunk of tagChunks) {
        const chunkRes = await callAPI({
          type: "sign_transaction_chunk",
          chunk
        });

        // chunk fail
        if (!chunkRes.res)
          throw new Error(
            `Error while sending a tag chunk for tx from chunk collection "${chunkCollectionID}": \n${chunkRes.message}`
          );
      }

      /**
       * Parth three, signal the end of the chunk stream
       * and request signing
       */
      const endRes = await callAPI({
        type: "sign_transaction_end",
        chunkCollectionID
      });

      if (!endRes.res)
        throw new Error(
          `Could not end chunk stream with ID "${chunkCollectionID}": \n${endRes.message}`
        );

      if (!endRes.transaction)
        throw new Error(
          `No transaction returned from signing tx from chunk collection "${chunkCollectionID}"`
        );

      if (endRes.chunkCollectionID !== chunkCollectionID)
        throw new Error(
          `Invalid chunk collection ID returned. Should be "${chunkCollectionID}", but it is "${endRes.chunkCollectionID}"`
        );

      // Reconstruct the transaction
      // Since the tags and the data are not sent
      // back, we need to add them back manually
      const decodeTransaction = arweave.transactions.fromRaw({
        ...endRes.transaction,
        // some arconnect tags are sent back, so we need to concat them
        tags: [...transaction.tags, ...endRes.transaction.tags],
        data: transaction.data
      });

      // show a nice confetti eeffect, if enabled
      if (endRes.arConfetti) {
        for (let i = 0; i < 8; i++)
          setTimeout(() => createCoinWithAnimation(), i * 150);
      }

      return decodeTransaction;
    } catch (e: any) {
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
    } catch (e: any) {
      throw new Error(e);
    }
  },
  async getArweaveConfig(): Promise<IArweave> {
    try {
      const data = await callAPI({
        type: "get_arweave_config",
        ext: "arconnect",
        sender: "api"
      });
      if (!data.config) throw new Error(data.message);
      return data.config;
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      throw new Error(e);
    }
  },
  async signature(data: Uint8Array, algorithm: any): Promise<Uint8Array> {
    try {
      const result = await callAPI({
        type: "signature",
        ext: "arconnect",
        sender: "api",
        data,
        options: algorithm
      });
      if (!result.res || !result.data) throw new Error(result.message);
      return new Uint8Array(result.data);
    } catch (e: any) {
      throw new Error(e);
    }
  },
  async dispatch(transaction: Transaction): Promise<DispatchResult> {
    const rawTx = JSON.stringify(transaction.toJSON());
    const size = new TextEncoder().encode(rawTx).byteLength;

    // do not allow size > ACCEPTED_DISPATCH_SIZE
    if (ACCEPTED_DISPATCH_SIZE < size)
      throw new Error(
        `ArConnect does not currently support dispatching transactions that are greater than ${ACCEPTED_DISPATCH_SIZE} bytes.`
      );

    try {
      const result = await callAPI({
        type: "dispatch",
        ext: "arconnect",
        sender: "api",
        transaction: transaction.toJSON()
      });

      if (!result.res || !result.data) throw new Error(result.message);
      return result.data;
    } catch (e: any) {
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
