import { JWKInterface } from "arweave/web/lib/wallet";
import { Allowance } from "../../stores/reducers/allowances";
import {
  createAuthPopup,
  getArweaveConfig,
  getFeeAmount,
  getStoreData,
  setStoreData
} from "../../utils/background";
import { MessageFormat, validateMessage } from "../../utils/messenger";
import { getRealURL } from "../../utils/url";
import { browser } from "webextension-polyfill-ts";
import Arweave from "arweave";
import manifest from "../../../public/manifest.json";
import axios from "axios";

// sign a transaction using the currently selected
// wallet's keyfile
export const signTransaction = (message: MessageFormat, tabURL: string) =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    if (!message.transaction)
      return resolve({
        res: false,
        message: "No transaction submitted."
      });

    try {
      const arweave = new Arweave(await getArweaveConfig()),
        // transaction price in winston
        price =
          parseFloat(message.transaction.quantity) +
          parseFloat(message.transaction.reward),
        storeData = await getStoreData(),
        arConfettiSetting = storeData?.["settings"]?.arConfetti,
        allowances: Allowance[] = storeData?.["allowances"] ?? [],
        allowanceForURL = allowances.find(
          ({ url }) => url === getRealURL(tabURL)
        ),
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
        const storedKeyfiles = storeData?.["wallets"] ?? [],
          storedAddress = storeData?.["profile"],
          keyfileToDecrypt = storedKeyfiles.find(
            (item) => item.address === storedAddress
          )?.keyfile;

        if (
          storedKeyfiles.length === 0 ||
          !storedAddress ||
          !keyfileToDecrypt
        ) {
          browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
          return {
            res: false,
            message: "No wallets added"
          };
        }

        const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt)),
          decodeTransaction = arweave.transactions.fromRaw({
            ...message.transaction,
            owner: keyfile.n
          });

        decodeTransaction.addTag("Signing-Client", "ArConnect");
        decodeTransaction.addTag("Signing-Client-Version", manifest.version);

        await arweave.transactions.sign(
          decodeTransaction,
          keyfile,
          message.signatureOptions
        );

        const feeTarget = await selectVRTHolder();

        /*if (feeTarget) {
          const feeTx = await arweave.createTransaction(
            {
              target: feeTarget,
              quantity: await getFeeAmount(storedAddress, arweave)
            },
            keyfile
          );

          feeTx.addTag("App-Name", "ArConnect");
          feeTx.addTag("App-Version", manifest.version);
          feeTx.addTag("Type", "Fee-Transaction");
          feeTx.addTag("Linked-Transaction", decodeTransaction.id);

          await arweave.transactions.sign(feeTx, keyfile);
          await arweave.transactions.post(feeTx);
        }*/

        if (allowanceForURL)
          await setStoreData({
            allowances: [
              ...allowances.filter(({ url }) => url !== getRealURL(tabURL)),
              {
                ...allowanceForURL,
                spent: allowanceForURL.spent + price
              }
            ]
          });

        return {
          res: true,
          message: "Success",
          transaction: decodeTransaction,
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
        browser.runtime.onMessage.addListener(async (msg) => {
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
        });
      } else resolve(await sign());
    } catch {
      resolve({
        res: false,
        message: "Error signing transaction"
      });
    }
  });

async function selectVRTHolder() {
  try {
    const res = (
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
