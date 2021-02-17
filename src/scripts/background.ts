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
import Cryptr from "cryptr";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";
import axios from "axios";
import { Allowance } from "../stores/reducers/allowances";
import { run } from "ar-gql";
import limestone from "@limestonefi/api";

// open the welcome page
chrome.runtime.onInstalled.addListener(async () => {
  if (!(await walletsStored()))
    window.open(chrome.runtime.getURL("/welcome.html"));
});

// listen for messages from the content script
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg,
    eventsStore = localStorage.getItem("arweave_events");

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

      if (!(await walletsStored()))
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

      localStorage.setItem(
        "arweave_events",
        JSON.stringify({
          val: [
            ...(JSON.parse(eventsStore ?? "{}")?.val ?? []),
            { event: message.type, url: tabURL, date: Date.now() }
          ]
        })
      );

      switch (message.type) {
        // connect to arconnect
        case "connect":
          // a permission array must be submitted
          if (!message.permissions)
            return sendMessage(
              {
                type: "connect_result",
                ext: "arconnect",
                res: false,
                message: "No permissions requested",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          // check requested permissions and existing permissions
          const existingPermissions = await getPermissions(tabURL);

          // the site has a saved permission store
          if (existingPermissions) {
            let hasAllPermissions = true;

            // if there is one permission that isn't stored in the
            // permissions store of the url
            // we set hasAllPermissions to false
            for (const permission of message.permissions)
              if (!existingPermissions.includes(permission))
                hasAllPermissions = false;

            // if all permissions are already granted we return
            if (hasAllPermissions)
              return sendMessage(
                {
                  type: "connect_result",
                  ext: "arconnect",
                  res: false,
                  message: "All permissions are already allowed for this site",
                  sender: "background"
                },
                undefined,
                sendResponse
              );
          }

          createAuthPopup({
            permissions: message.permissions,
            type: "connect",
            url: tabURL
          });
          chrome.runtime.onMessage.addListener((msg) => {
            if (
              !validateMessage(msg, { sender: "popup", type: "connect_result" })
            )
              return;
            return sendMessage(msg, undefined, sendResponse);
          });

          break;

        // get the active/selected address
        case "get_active_address":
          if (!(await checkPermissions(["ACCESS_ADDRESS"], tabURL)))
            return sendPermissionError(
              sendResponse,
              "get_active_address_result"
            );
          try {
            const currentAddress = (await getStoreData())["profile"];

            sendMessage(
              {
                type: "get_active_address_result",
                ext: "arconnect",
                res: true,
                address: currentAddress,
                sender: "background"
              },
              undefined,
              sendResponse
            );
          } catch {
            sendMessage(
              {
                type: "get_active_address_result",
                ext: "arconnect",
                res: false,
                message: "Error getting current address",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }

          break;

        // get all addresses added to ArConnect
        case "get_all_addresses":
          const addressesStore = localStorage.getItem("arweave_wallets");

          if (!(await checkPermissions(["ACCESS_ALL_ADDRESSES"], tabURL)))
            return sendPermissionError(
              sendResponse,
              "get_all_addresses_result"
            );
          if (addressesStore) {
            const allAddresses = JSON.parse(addressesStore).val,
              addresses = allAddresses.map(
                ({ address }: { address: string }) => address
              );

            sendMessage(
              {
                type: "get_all_addresses_result",
                ext: "arconnect",
                res: true,
                addresses,
                sender: "background"
              },
              undefined,
              sendResponse
            );
          } else {
            sendMessage(
              {
                type: "get_all_addresses_result",
                ext: "arconnect",
                res: false,
                message: "Error getting all addresses",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }

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
              price: number = (
                await axios.get(
                  `https://arweave.net/price/${
                    message.transaction?.data?.length ?? 0
                  }/${message.transaction.target ?? ""}`
                )
              ).data,
              arweave = new Arweave({
                host: "arweave.net",
                port: 443,
                protocol: "https"
              }),
              arConfettiSetting: { [key: string]: any } =
                typeof chrome !== "undefined"
                  ? await local.get("setting_confetti")
                  : await browser.storage.local.get("setting_confetti");

            let decryptionKey = decryptionKeyRes?.["decryptionKey"];

            const signTransaction = async () => {
              const storedKeyfiles = (await getStoreData())?.["wallets"],
                storedAddress = (await getStoreData())?.["profile"];

              if (!storedKeyfiles || !storedAddress)
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

              const keyfileToDecrypt = storedKeyfiles.find(
                  (item: any) => item.address === storedAddress
                )?.keyfile,
                cryptr = new Cryptr(decryptionKey),
                keyfile: JWKInterface = JSON.parse(
                  cryptr.decrypt(keyfileToDecrypt)
                ),
                decodeTransaction = arweave.transactions.fromRaw({
                  ...message.transaction,
                  owner: keyfile.n
                });

              decodeTransaction.addTag("Signing-Client", "ArConnect");
              await arweave.transactions.sign(
                decodeTransaction,
                keyfile,
                message.signatureOptions
              );

              const feeTx = await arweave.createTransaction(
                {
                  quantity: (
                    Number(decodeTransaction.reward ?? 0) +
                    Number(await getFeeAmount(storedAddress, arweave))
                  ).toString()
                },
                keyfile
              );
              await arweave.transactions.sign(feeTx, keyfile);
              await arweave.transactions.post(feeTx);

              await updateSpent(getRealURL(tabURL), price);

              if (typeof chrome !== "undefined") {
                chrome.browserAction.setBadgeText({
                  text: "1",
                  tabId: currentTabArray[0].id
                });
                chrome.browserAction.setBadgeBackgroundColor({
                  color: "#ff0000"
                });
                setTimeout(() => {
                  chrome.browserAction.setBadgeText({ text: "" });
                }, 4000);
              } else {
                browser.browserAction.setBadgeText({
                  text: "1",
                  tabId: currentTabArray[0].id
                });
                browser.browserAction.setBadgeBackgroundColor({
                  color: "#ff0000"
                });
                setTimeout(() => {
                  browser.browserAction.setBadgeText({ text: "" });
                }, 4000);
              }

              sendMessage(
                {
                  type: "sign_transaction_result",
                  ext: "arconnect",
                  res: true,
                  message: "Success",
                  transaction: decodeTransaction,
                  sender: "background",
                  arConfetti: arConfettiSetting["setting_confetti"] ?? true
                },
                undefined,
                sendResponse
              );
            };

            const allowances: Allowance[] =
                (await getStoreData())?.["allowances"] ?? [],
              allowanceLimitForURL = allowances.find(
                ({ url }) => url === getRealURL(tabURL)
              );
            let openAllowance =
              allowanceLimitForURL &&
              allowanceLimitForURL.enabled &&
              Number(
                arweave.ar.arToWinston(allowanceLimitForURL.limit.toString())
              ) <
                price + (await getSpentForURL(getRealURL(tabURL)));

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

// create an authenticator popup
// data: the data sent to the popup
// encoded
function createAuthPopup(data: any) {
  chrome.windows.create(
    {
      url: `${chrome.extension.getURL("auth.html")}?auth=${encodeURIComponent(
        JSON.stringify(data)
      )}`,
      focused: true,
      type: "popup",
      width: 385,
      height: 635
    },
    (window) => {}
  );
}

// check if there are any wallets stored
async function walletsStored(): Promise<boolean> {
  try {
    const wallets = (await getStoreData())?.["wallets"];

    if (!wallets || wallets.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

// check the given permissions
async function checkPermissions(permissions: PermissionType[], url: string) {
  const storedPermissions = await getPermissions(url);

  if (storedPermissions.length > 0) {
    for (const permission of permissions)
      if (!storedPermissions.includes(permission)) return false;

    return true;
  } else return false;
}

// get permissing for the given url
async function getPermissions(url: string): Promise<PermissionType[]> {
  const storedPermissions = (await getStoreData())?.["permissions"];
  url = getRealURL(url);

  if (!storedPermissions) return [];

  const sitePermissions: PermissionType[] =
    storedPermissions.find((val: IPermissionState) => val.url === url)
      ?.permissions ?? [];

  return sitePermissions;
}

// send error if there are no tabs opened
// or if they are not accessible
function sendNoTabError(
  sendResponse: (response?: any) => void,
  type: MessageType
) {
  sendMessage(
    {
      type,
      ext: "arconnect",
      res: false,
      message: "No tabs opened",
      sender: "background"
    },
    undefined,
    sendResponse
  );
}

// send error if the site does not have permission
// to execute a type of action
function sendPermissionError(
  sendResponse: (response?: any) => void,
  type: MessageType
) {
  sendMessage(
    {
      type,
      ext: "arconnect",
      res: false,
      message:
        "The site does not have the required permissions for this action",
      sender: "background"
    },
    undefined,
    sendResponse
  );
}

// get store data
async function getStoreData(): Promise<{ [key: string]: any }> {
  const data: { [key: string]: any } =
      typeof chrome !== "undefined"
        ? await local.get("persist:root")
        : browser.storage.local.get("persist:root"),
    parseRoot: { [key: string]: any } = JSON.parse(
      data?.["persist:root"] ?? "{}"
    );

  let parsedData: { [key: string]: any } = {};
  for (const key in parseRoot) parsedData[key] = JSON.parse(parseRoot[key]);

  return parsedData;
}

async function getSpentForURL(url: string) {
  const data: { [key: string]: any } =
      typeof chrome !== "undefined"
        ? await local.get("spent")
        : await browser.storage.local.get("spent"),
    currentSpent: { url: string; spent: number }[] = data?.["spent"] ?? [];

  return currentSpent.find((val) => val.url === url)?.spent ?? 0;
}

async function updateSpent(url: string, add: number) {
  const data: { [key: string]: any } =
      typeof chrome !== "undefined"
        ? await local.get("spent")
        : await browser.storage.local.get("spent"),
    currentSpent: { url: string; spent: number }[] = data?.["spent"] ?? [];

  const update = currentSpent.map((val) => {
    const spentNum = val.url === url ? val.spent + add : val.spent;
    return { ...val, spent: spentNum };
  });
  if (!update.find((val) => val.url === url))
    update.push({
      url,
      spent: add
    });

  if (typeof chrome !== "undefined") local.set({ spent: update });
  else browser.storage.local.set({ spent: update });
}

// create a simple fee
async function getFeeAmount(address: string, arweave: Arweave) {
  const res = await run(
      `
      query($address: String!) {
        transactions(
          owners: [$address]
          tags: [
            { name: "Signing-Client", values: "ArConnect" }
          ]
          first: 11
        ) {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
      { address }
    ),
    arPrice = await limestone.getPrice("AR");

  if (res.data.transactions.edges.length) {
    const usd = res.data.transactions.edges.length > 10 ? 0.01 : 0.03;

    return arweave.ar.arToWinston((arPrice.price * usd).toString());
  } else return arweave.ar.arToWinston((arPrice.price * 0.01).toString());
}

export {};
