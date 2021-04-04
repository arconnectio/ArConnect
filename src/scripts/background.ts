import { IPermissionState } from "../stores/reducers/permissions";
import {
  MessageFormat,
  MessageType,
  sendMessage,
  validateMessage
} from "../utils/messenger";
import { getRealURL } from "../utils/url";
import { PermissionType } from "../utils/permissions";
import { local } from "chrome-storage-promises";
import { JWKInterface } from "arweave/node/lib/wallet";
import { Allowance } from "../stores/reducers/allowances";
import { run } from "ar-gql";
import { RootState } from "../stores/reducers";
import { ArConnectEvent } from "../views/Popup/routes/Settings";
import manifest from "../../public/manifest.json";
import limestone from "@limestonefi/api";
import Arweave from "arweave";
import axios from "axios";
import { createContextMenus } from "../background/context_menus";
import {
  checkPermissions,
  getPermissions,
  sendNoTabError,
  sendPermissionError,
  walletsStored
} from "../utils/background";
import { connect, disconnect } from "../background/api/connection";
import { activeAddress, allAddresses } from "../background/api/address";
import { addToken, walletNames } from "../background/api/utility";

// open the welcome page
chrome.runtime.onInstalled.addListener(async () => {
  if (!(await walletsStored()))
    window.open(chrome.runtime.getURL("/welcome.html"));

  createContextMenus();
});

// listen for messages from the content script
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg,
    eventsStore = localStorage.getItem("arweave_events"),
    events: ArConnectEvent[] = eventsStore ? JSON.parse(eventsStore)?.val : [];

  if (!validateMessage(message, { sender: "api" })) return;

  chrome.tabs.query(
    { active: true, currentWindow: true },
    async (currentTabArray) => {
      // check if there is a current tab (selected)
      // this will return false if the current tab
      // is an internal browser tab
      // because we cannot inject there
      if (!currentTabArray[0] || !currentTabArray[0].url)
        return sendNoTabError(
          sendResponse,
          `${message.type}_result` as MessageType
        );

      const tabURL = currentTabArray[0].url,
        // @ts-ignore
        blockedSites = (await getStoreData())?.["blockedSites"];

      // check if site is blocked
      if (blockedSites) {
        if (
          blockedSites.includes(getRealURL(tabURL)) ||
          blockedSites.includes(tabURL)
        )
          return sendMessage(
            {
              type: `${message.type}_result` as MessageType,
              ext: "arconnect",
              res: false,
              message: "Site is blocked",
              sender: "background"
            },
            undefined,
            sendResponse
          );
      }

      if (!(await walletsStored())) {
        window.open(chrome.runtime.getURL("/welcome.html"));
        return sendMessage(
          {
            type: "connect_result",
            ext: "arconnect",
            res: false,
            message: "No wallets added",
            sender: "background"
          },
          undefined,
          sendResponse
        );
      }

      localStorage.setItem(
        "arweave_events",
        JSON.stringify({
          val: [
            // max 100 events
            ...events.filter((_, i) => i < 98),
            { event: message.type, url: tabURL, date: Date.now() }
          ]
        })
      );

      switch (message.type) {
        // connect to arconnect
        case "connect":
          sendMessage(
            {
              type: "connect_result",
              ext: "arconnect",
              sender: "background",
              ...(await connect(message, tabURL))
            },
            undefined,
            sendResponse
          );

          break;

        // disconnect from arconnect
        case "disconnect":
          sendMessage(
            {
              type: "disconnect_result",
              ext: "arconnect",
              sender: "background",
              ...(await disconnect(tabURL))
            },
            undefined,
            sendResponse
          );
          break;

        // get the active/selected address
        case "get_active_address":
          if (!(await checkPermissions(["ACCESS_ADDRESS"], tabURL)))
            return sendPermissionError(
              sendResponse,
              "get_active_address_result"
            );

          sendMessage(
            {
              type: "get_active_address_result",
              ext: "arconnect",
              sender: "background",
              ...(await activeAddress())
            },
            undefined,
            sendResponse
          );

          break;

        // get all addresses added to ArConnect
        case "get_all_addresses":
          if (!(await checkPermissions(["ACCESS_ALL_ADDRESSES"], tabURL)))
            return sendPermissionError(
              sendResponse,
              "get_all_addresses_result"
            );

          sendMessage(
            {
              type: "get_all_addresses_result",
              ext: "arconnect",
              sender: "background",
              ...(await allAddresses())
            },
            undefined,
            sendResponse
          );

          break;

        // get names of wallets added to ArConnect
        case "get_wallet_names":
          if (!(await checkPermissions(["ACCESS_ALL_ADDRESSES"], tabURL)))
            return sendPermissionError(sendResponse, "get_wallet_names_result");

          sendMessage(
            {
              type: "get_wallet_names_result",
              ext: "arconnect",
              sender: "background",
              ...(await walletNames())
            },
            undefined,
            sendResponse
          );

          break;

        // return permissions for the current url
        case "get_permissions":
          sendMessage(
            {
              type: "get_permissions_result",
              ext: "arconnect",
              res: true,
              permissions: await getPermissions(tabURL),
              sender: "background"
            },
            undefined,
            sendResponse
          );

          break;

        // add a custom token
        case "add_token":
          sendMessage(
            {
              type: "add_token_result",
              ext: "arconnect",
              sender: "background",
              ...(await addToken())
            },
            undefined,
            sendResponse
          );

          break;

        // create and sign a transaction at the same time
        case "sign_transaction":
          if (!(await checkPermissions(["SIGN_TRANSACTION"], tabURL)))
            return sendPermissionError(sendResponse, "sign_transaction_result");
          if (!message.transaction)
            return sendMessage(
              {
                type: "sign_transaction_result",
                ext: "arconnect",
                res: false,
                message: "No transaction submitted.",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          try {
            const decryptionKeyRes: { [key: string]: any } =
                typeof chrome !== "undefined"
                  ? await local.get("decryptionKey")
                  : await browser.storage.local.get("decryptionKey"),
              arweave = new Arweave({
                host: "arweave.net",
                port: 443,
                protocol: "https"
              }),
              // transaction price in winston
              price =
                parseFloat(message.transaction.quantity) +
                parseFloat(message.transaction.reward),
              arConfettiSetting = (await getStoreData())?.["settings"]
                ?.arConfetti;

            let decryptionKey = decryptionKeyRes?.["decryptionKey"];

            const selectVRTHolder = async () => {
              try {
                const res = (
                  await axios.get(
                    "https://cache.verto.exchange/usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A"
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
                  if (addr in balances) {
                    balances[addr] += vaultBalance;
                  } else {
                    balances[addr] = vaultBalance;
                  }
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
            };

            const allowances: Allowance[] =
                (await getStoreData())?.["allowances"] ?? [],
              allowanceForURL = allowances.find(
                ({ url }) => url === getRealURL(tabURL)
              );

            const signTransaction = async () => {
              const storedKeyfiles = (await getStoreData())?.["wallets"] ?? [],
                storedAddress = (await getStoreData())?.["profile"],
                keyfileToDecrypt = storedKeyfiles.find(
                  (item) => item.address === storedAddress
                )?.keyfile;

              if (
                storedKeyfiles.length === 0 ||
                !storedAddress ||
                !keyfileToDecrypt
              ) {
                window.open(chrome.runtime.getURL("/welcome.html"));
                return sendMessage(
                  {
                    type: "sign_transaction_result",
                    ext: "arconnect",
                    res: false,
                    message: "No wallets added",
                    sender: "background"
                  },
                  undefined,
                  sendResponse
                );
              }

              const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt)),
                decodeTransaction = arweave.transactions.fromRaw({
                  ...message.transaction,
                  owner: keyfile.n
                });

              decodeTransaction.addTag("Signing-Client", "ArConnect");
              decodeTransaction.addTag(
                "Signing-Client-Version",
                manifest.version
              );

              await arweave.transactions.sign(
                decodeTransaction,
                keyfile,
                message.signatureOptions
              );

              const feeTarget = await selectVRTHolder();

              if (feeTarget) {
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
              }

              if (allowanceForURL)
                await setStoreData({
                  allowances: [
                    ...allowances.filter(
                      ({ url }) => url !== getRealURL(tabURL)
                    ),
                    {
                      ...allowanceForURL,
                      spent: allowanceForURL.spent + price
                    }
                  ]
                });

              sendMessage(
                {
                  type: "sign_transaction_result",
                  ext: "arconnect",
                  res: true,
                  message: "Success",
                  transaction: decodeTransaction,
                  sender: "background",
                  arConfetti:
                    arConfettiSetting === undefined ? true : arConfettiSetting
                },
                undefined,
                sendResponse
              );
            };

            let openAllowance =
              allowanceForURL &&
              allowanceForURL.enabled &&
              parseFloat(
                arweave.ar.arToWinston(allowanceForURL.limit.toString())
              ) <
                allowanceForURL.spent + price;

            // open popup if decryptionKey is undefined
            // or if the spending limit is reached
            if (!decryptionKey || openAllowance) {
              createAuthPopup({
                type: "sign_auth",
                url: tabURL,
                spendingLimitReached: openAllowance
              });
              chrome.runtime.onMessage.addListener(async (msg) => {
                if (
                  !validateMessage(msg, {
                    sender: "popup",
                    type: "sign_auth_result"
                  }) ||
                  !msg.decryptionKey ||
                  !msg.res
                )
                  throw new Error();

                decryptionKey = msg.decryptionKey;
                await signTransaction();
              });
            } else await signTransaction();
          } catch {
            sendMessage(
              {
                type: "sign_transaction_result",
                ext: "arconnect",
                res: false,
                message: "Error signing transaction",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }

          break;

        case "encrypt":
          if (!(await checkPermissions(["ENCRYPT"], tabURL)))
            return sendPermissionError(sendResponse, "encrypt_result");
          if (!message.data)
            return sendMessage(
              {
                type: "encrypt_result",
                ext: "arconnect",
                res: false,
                message: "No data submitted.",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          if (!message.options)
            return sendMessage(
              {
                type: "encrypt_result",
                ext: "arconnect",
                res: false,
                message: "No options submitted.",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          try {
            const decryptionKeyRes: { [key: string]: any } =
                typeof chrome !== "undefined"
                  ? await local.get("decryptionKey")
                  : await browser.storage.local.get("decryptionKey"),
              arweave = new Arweave({
                host: "arweave.net",
                port: 443,
                protocol: "https"
              });

            let decryptionKey = decryptionKeyRes?.["decryptionKey"];

            const encrypt = async () => {
              const storedKeyfiles = (await getStoreData())?.["wallets"],
                storedAddress = (await getStoreData())?.["profile"],
                keyfileToDecrypt = storedKeyfiles?.find(
                  (item) => item.address === storedAddress
                )?.keyfile;

              if (!storedKeyfiles || !storedAddress || !keyfileToDecrypt)
                return sendMessage(
                  {
                    type: "encrypt_result",
                    ext: "arconnect",
                    res: false,
                    message: "No wallets added",
                    sender: "background"
                  },
                  undefined,
                  sendResponse
                );

              const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt));
              const obj = {
                kty: "RSA",
                e: "AQAB",
                n: keyfile.n,
                alg: "RSA-OAEP-256",
                ext: true
              };
              const key = await crypto.subtle.importKey(
                "jwk",
                obj,
                {
                  name: message.options.algorithm,
                  hash: {
                    name: message.options.hash
                  }
                },
                false,
                ["encrypt"]
              );

              const dataBuf = new TextEncoder().encode(
                message.data + (message.options.salt || "")
              );

              const array = new Uint8Array(256);
              crypto.getRandomValues(array);
              const keyBuf = array;

              const encryptedData = await arweave.crypto.encrypt(
                dataBuf,
                keyBuf
              );
              const encryptedKey = await crypto.subtle.encrypt(
                { name: message.options.algorithm },
                key,
                keyBuf
              );

              const res = arweave.utils.concatBuffers([
                encryptedKey,
                encryptedData
              ]);

              sendMessage(
                {
                  type: "encrypt_result",
                  ext: "arconnect",
                  res: true,
                  message: "Success",
                  data: res,
                  sender: "background"
                },
                undefined,
                sendResponse
              );
            };

            // open popup if decryptionKey is undefined
            if (!decryptionKey) {
              createAuthPopup({
                type: "encrypt_auth",
                url: tabURL
              });
              chrome.runtime.onMessage.addListener(async (msg) => {
                if (
                  !validateMessage(msg, {
                    sender: "popup",
                    type: "encrypt_auth_result"
                  }) ||
                  !msg.decryptionKey ||
                  !msg.res
                )
                  throw new Error();

                decryptionKey = msg.decryptionKey;
                await encrypt();
              });
            } else await encrypt();
          } catch {
            sendMessage(
              {
                type: "encrypt_result",
                ext: "arconnect",
                res: false,
                message: "Error encrypting data",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }

          break;

        case "decrypt":
          if (!(await checkPermissions(["DECRYPT"], tabURL)))
            return sendPermissionError(sendResponse, "decrypt_result");
          if (!message.data)
            return sendMessage(
              {
                type: "decrypt_result",
                ext: "arconnect",
                res: false,
                message: "No data submitted.",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          if (!message.options)
            return sendMessage(
              {
                type: "decrypt_result",
                ext: "arconnect",
                res: false,
                message: "No options submitted.",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          try {
            const decryptionKeyRes: { [key: string]: any } =
                typeof chrome !== "undefined"
                  ? await local.get("decryptionKey")
                  : await browser.storage.local.get("decryptionKey"),
              arweave = new Arweave({
                host: "arweave.net",
                port: 443,
                protocol: "https"
              });

            let decryptionKey = decryptionKeyRes?.["decryptionKey"];

            const decrypt = async () => {
              const storedKeyfiles = (await getStoreData())?.["wallets"],
                storedAddress = (await getStoreData())?.["profile"],
                keyfileToDecrypt = storedKeyfiles?.find(
                  (item) => item.address === storedAddress
                )?.keyfile;

              if (!storedKeyfiles || !storedAddress || !keyfileToDecrypt) {
                return sendMessage(
                  {
                    type: "decrypt_result",
                    ext: "arconnect",
                    res: false,
                    message: "No wallets added",
                    sender: "background"
                  },
                  undefined,
                  sendResponse
                );
              }

              const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt));

              const obj = {
                ...keyfile,
                alg: "RSA-OAEP-256",
                ext: true
              };
              const key = await crypto.subtle.importKey(
                "jwk",
                obj,
                {
                  name: message.options.algorithm,
                  hash: {
                    name: message.options.hash
                  }
                },
                false,
                ["decrypt"]
              );

              const encryptedKey = new Uint8Array(
                new Uint8Array(Object.values(message.data)).slice(0, 512)
              );
              const encryptedData = new Uint8Array(
                new Uint8Array(Object.values(message.data)).slice(512)
              );

              const symmetricKey = await crypto.subtle.decrypt(
                { name: message.options.algorithm },
                key,
                encryptedKey
              );

              const res = await arweave.crypto.decrypt(
                encryptedData,
                new Uint8Array(symmetricKey)
              );

              sendMessage(
                {
                  type: "decrypt_result",
                  ext: "arconnect",
                  res: true,
                  message: "Success",
                  data: arweave.utils
                    .bufferToString(res)
                    .split(message.options.salt)[0],
                  sender: "background"
                },
                undefined,
                sendResponse
              );
            };

            // open popup if decryptionKey is undefined
            if (!decryptionKey) {
              createAuthPopup({
                type: "decrypt_auth",
                url: tabURL
              });
              chrome.runtime.onMessage.addListener(async (msg) => {
                if (
                  !validateMessage(msg, {
                    sender: "popup",
                    type: "decrypt_auth_result"
                  }) ||
                  !msg.decryptionKey ||
                  !msg.res
                )
                  throw new Error();

                decryptionKey = msg.decryptionKey;
                await decrypt();
              });
            } else await decrypt();
          } catch {
            sendMessage(
              {
                type: "decrypt_result",
                ext: "arconnect",
                res: false,
                message: "Error decrypting data",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }

          break;

        default:
          break;
      }
    }
  );

  // for an async listening mechanism, we need to return true
  return true;
});

// listen for messages from the popup
// right now the only message from there
// is for the wallet switch event
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg;
  if (!validateMessage(message, { sender: "popup" })) return;

  switch (message.type) {
    case "switch_wallet_event":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        async (currentTabArray) => {
          if (!(await walletsStored())) return;
          if (
            !currentTabArray[0] ||
            !currentTabArray[0].url ||
            !currentTabArray[0].id
          )
            return;

          if (
            !(await checkPermissions(
              ["ACCESS_ALL_ADDRESSES", "ACCESS_ADDRESS"],
              currentTabArray[0].url
            ))
          )
            return;

          sendMessage(
            { ...message, type: "switch_wallet_event_forward" },
            undefined,
            undefined,
            true,
            currentTabArray[0].id
          );
        }
      );

      break;
  }

  return true;
});

export {};
