import { JWKInterface } from "arweave/web/lib/wallet";
import { Allowance } from "../../stores/reducers/allowances";
import {
  createAuthPopup,
  DispatchResult,
  getActiveKeyfile,
  getArweaveConfig,
  getFeeAmount,
  getStoreData,
  setStoreData
} from "../../utils/background";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { MessageFormat, validateMessage } from "../../utils/messenger";
import { getRealURL } from "../../utils/url";
import { browser } from "webextension-polyfill-ts";
import Transaction, { Tag } from "arweave/web/lib/transaction";
import Arweave from "arweave";
import manifest from "../../../public/manifest.json";
import axios from "axios";

// sign a transaction using the currently selected
// wallet's keyfile
export const signTransaction = (
  transaction: Transaction,
  tabURL: string,
  signatureOptions: SignatureOptions
) =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      // transaction price in winston
      let price =
        parseFloat(transaction.quantity) + parseFloat(transaction.reward);
      const arweave = new Arweave(await getArweaveConfig()),
        storeData = await getStoreData(),
        arConfettiSetting = storeData?.["settings"]?.arConfetti,
        allowances: Allowance[] = storeData?.["allowances"] ?? [],
        allowanceForURL = allowances.find(
          ({ url }) => url === getRealURL(tabURL)
        ),
        feeMultiplier = storeData?.["settings"]?.feeMultiplier || 1,
        // should we open an auth popup for the user
        // to update their allowance limit
        // this is true, if the user has allowances
        // enabled for the site and the transaction's
        // price + spent is over the spending limit
        // set for this site
        openAllowance =
          allowanceForURL &&
          allowanceForURL.enabled &&
          parseFloat(arweave.ar.arToWinston(allowanceForURL.limit.toString())) <
            allowanceForURL.spent + price;

      let decryptionKey = (await browser.storage.local.get("decryptionKey"))
        ?.decryptionKey;

      const sign = async () => {
        let userData: { address: string; keyfile: JWKInterface };

        try {
          userData = await getActiveKeyfile();
        } catch {
          browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

          return {
            res: false,
            message: "No wallets added"
          };
        }

        const decodeTransaction = arweave.transactions.fromRaw({
          ...transaction,
          owner: userData.keyfile.n
        });
        const arConnectTags = [
          { name: "Signing-Client", value: "ArConnect" },
          { name: "Signing-Client-Version", value: manifest.version }
        ];

        // add some ArConnect tags so the tx can be
        // identified later for debugging, etc.
        for (const arcTag of arConnectTags) {
          decodeTransaction.addTag(arcTag.name, arcTag.value);
        }

        // fee multiplication
        if (feeMultiplier > 1) {
          decodeTransaction.reward = (
            +decodeTransaction.reward * feeMultiplier
          ).toFixed(0);
          price =
            parseFloat(transaction.quantity) +
            parseFloat(decodeTransaction.reward);
        }

        await arweave.transactions.sign(
          decodeTransaction,
          userData.keyfile,
          signatureOptions
        );

        const feeTarget = await selectVRTHolder();

        if (feeTarget) {
          const feeTx = await arweave.createTransaction(
            {
              target: feeTarget,
              quantity: await getFeeAmount(userData.address, arweave),
              data: Math.random().toString().slice(-4)
            },
            userData.keyfile
          );

          feeTx.addTag("App-Name", "ArConnect");
          feeTx.addTag("App-Version", manifest.version);
          feeTx.addTag("Type", "Fee-Transaction");
          feeTx.addTag("Linked-Transaction", decodeTransaction.id);

          // fee multiplication
          if (feeMultiplier > 1) {
            feeTx.reward = (+feeTx.reward * feeMultiplier).toFixed(0);
          }

          await arweave.transactions.sign(feeTx, userData.keyfile);

          const uploader = await arweave.transactions.getUploader(feeTx);

          while (!uploader.isComplete) {
            await uploader.uploadChunk();
          }
        }

        if (allowanceForURL) {
          await setStoreData({
            allowances: [
              ...allowances.filter(({ url }) => url !== getRealURL(tabURL)),
              {
                ...allowanceForURL,
                spent: allowanceForURL.spent + price
              }
            ]
          });
        }

        // remove the two fields that can be massive
        // these don't need to be sent back to the
        // injected script, because they don't
        // change during signing
        // they were still needed tho, because the
        // transaction signer creates a valid signature
        // using those as well
        const returnTransaction = {
          ...decodeTransaction,
          data: undefined,
          // only return the arconnect tags
          tags: decodeTransaction
            .get("tags")
            // @ts-expect-error
            .filter(
              (tag: Tag) =>
                !!arConnectTags.find(
                  ({ name }) =>
                    name === tag.get("name", { decode: true, string: true })
                )
            )
        };

        return {
          res: true,
          message: "Success",
          transaction: returnTransaction,
          arConfetti: arConfettiSetting === undefined ? true : arConfettiSetting
        };
      };

      // open popup if decryptionKey is undefined
      // or if the spending limit is reached
      if (!decryptionKey || openAllowance) {
        createAuthPopup({
          type: "sign_auth",
          url: tabURL,
          spendingLimitReached: openAllowance
        });
        const listenerCallback = async (msg: any) => {
          browser.runtime.onMessage.removeListener(listenerCallback);
          if (
            !validateMessage(msg, {
              sender: "popup",
              type: "sign_auth_result"
            }) ||
            !msg.res
          ) {
            resolve({
              res: false,
              message: msg.message
            });
          } else if (!decryptionKey && !msg.decryptionKey) {
            resolve({
              res: false,
              message: msg.message
            });
          } else {
            decryptionKey = decryptionKey || msg.decryptionKey;
            resolve(await sign());
          }
        };
        browser.runtime.onMessage.addListener(listenerCallback);
      } else resolve(await sign());
    } catch (e) {
      resolve({
        res: false,
        message: `Error signing transaction: ${e}`
      });
    }
  });

/**
 * Dispatch a transaction. This just gets a transaction to the network in one step,
 * if the Bundlr Network accepts it as a bundle. If it is rejected, it ArConnect will
 * try to submit it as a regular transaction.
 *
 * @param transaction Arweave transaction object
 * @returns Result
 */
export async function dispatch(tx: object): Promise<{
  res: boolean;
  data: DispatchResult;
}> {
  const arweave = new Arweave(await getArweaveConfig());
  const transaction = arweave.transactions.fromRaw(tx);

  let userData: { address: string; keyfile: JWKInterface };

  try {
    userData = await getActiveKeyfile();
  } catch {
    // user doesn't have a wallet
    return {
      // we return res: true for everything, because we want to return an object
      // in the injected script, even if the process failed
      res: true,
      data: {
        status: "ERROR",
        message: "No wallets added to ArConnect",
        type: "BUNDLED"
      }
    };
  }

  const data = transaction.get("data", { decode: true, string: false });
  // @ts-expect-error
  const tags = (transaction.get("tags") as Tag[]).map((tag) => ({
    name: tag.get("name", { decode: true, string: true }),
    value: tag.get("value", { decode: true, string: true })
  }));

  try {
    const Bundlr = await import("@bundlr-network/client/web");
    const bundlr = new Bundlr(
      "https://node1.bundlr.network/",
      "Arweave",
      userData.keyfile
    );

    const tx = bundlr.createTransaction(data, { tags });

    await tx.sign();
    await tx.upload();

    return {
      res: true,
      data: {
        status: "OK",
        message: tx.id,
        type: "BUNDLED"
      }
    };
  } catch {
    try {
      // sign & post if there is something wrong with the bundlr
      // check wallet balance
      const balance = parseFloat(
        await arweave.wallets.getBalance(userData.address)
      );
      const cost = parseFloat(
        await arweave.transactions.getPrice(parseFloat(transaction.data_size))
      );

      if (balance < cost) {
        return {
          res: true,
          data: {
            status: "INSUFFICIENT_FUNDS",
            message: `Wallet doesn't have enough AR. Required: ${cost}. Has: ${balance}`,
            type: "BASE"
          }
        };
      }

      await arweave.transactions.sign(transaction, userData.keyfile);
      const uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      return {
        res: true,
        data: {
          status: "OK",
          message: transaction.id,
          type: "BASE"
        }
      };
    } catch (e) {
      return {
        res: true,
        data: {
          status: "ERROR",
          message: e as string,
          type: "BASE"
        }
      };
    }
  }
}

async function selectVRTHolder() {
  try {
    const res: any = (
      await axios.get(
        "https://v2.cache.verto.exchange/usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A"
      )
    ).data;
    const balances = res.state.balances;
    const vault = res.state.vault;
    let totalTokens = 0;

    for (const addr of Object.keys(balances)) {
      totalTokens += balances[addr];
    }

    for (const addr of Object.keys(vault)) {
      if (!vault[addr].length) continue;

      const vaultBalance = vault[addr]
        // @ts-ignore
        .map((a) => a.balance)
        // @ts-ignore
        .reduce((a, b) => a + b, 0);
      totalTokens += vaultBalance;

      if (addr in balances) balances[addr] += vaultBalance;
      else balances[addr] = vaultBalance;
    }

    const weighted: { [addr: string]: number } = {};

    for (const addr of Object.keys(balances)) {
      weighted[addr] = balances[addr] / totalTokens;
    }

    let sum = 0;
    const r = Math.random();

    for (const addr of Object.keys(weighted)) {
      sum += weighted[addr];
      if (r <= sum && weighted[addr] > 0) {
        return addr;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
