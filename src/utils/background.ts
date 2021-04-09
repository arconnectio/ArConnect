import { MessageType, validateMessage } from "../utils/messenger";
import { RootState } from "../stores/reducers";
import { IPermissionState } from "../stores/reducers/permissions";
import { PermissionType } from "./permissions";
import { getRealURL } from "./url";
import { browser } from "webextension-polyfill-ts";
import { run } from "ar-gql";
import limestone from "@limestonefi/api";
import Arweave from "arweave";
import axios from "axios";

// create an authenticator popup
// data: the data sent to the popup
// encoded
export const createAuthPopup = (data: any) =>
  browser.windows.create({
    url: `${browser.extension.getURL("auth.html")}?auth=${encodeURIComponent(
      JSON.stringify(data)
    )}`,
    focused: true,
    type: "popup",
    width: 385,
    height: 635
  });

/** Permission utilities */

// check the given permissions
export async function checkPermissions(
  permissions: PermissionType[],
  url: string
) {
  const storedPermissions = await getPermissions(url);

  if (storedPermissions.length > 0) {
    for (const permission of permissions)
      if (!storedPermissions.includes(permission)) return false;

    return true;
  } else return false;
}

// get permissing for the given url
export async function getPermissions(url: string): Promise<PermissionType[]> {
  const storedPermissions = (await getStoreData())?.["permissions"];
  url = getRealURL(url);

  if (!storedPermissions) return [];

  const sitePermissions: PermissionType[] =
    storedPermissions.find((val: IPermissionState) => val.url === url)
      ?.permissions ?? [];

  return sitePermissions;
}

/** Store data related functions */

export type StoreData = Partial<RootState>;

/**
 * get store data
 *
 * @returns StoreData
 */
export async function getStoreData(): Promise<StoreData> {
  const data = (await browser.storage.local.get("persist:root"))?.[
      "persist:root"
    ],
    parseRoot: StoreData = JSON.parse(data ?? "{}");

  let parsedData: StoreData = {};
  // @ts-ignore
  for (const key in parseRoot) parsedData[key] = JSON.parse(parseRoot[key]);

  return parsedData;
}

/**
 * set store data
 *
 * @param updatedData An object with the reducer name as a key
 */
export async function setStoreData(updatedData: StoreData) {
  const data = { ...(await getStoreData()), ...updatedData };
  // store data, but with stringified values
  let encodedData: { [key: string]: string } = {};

  for (const reducer in data) {
    // @ts-ignore
    encodedData[reducer] = JSON.stringify(data[reducer]);
  }

  await browser.storage.local.set({
    "persist:root": JSON.stringify(encodedData)
  });
}

// create a simple fee
export async function getFeeAmount(address: string, arweave: Arweave) {
  const res = await run(
    `
      query($address: String!) {
        transactions(
          owners: [$address]
          tags: [
            { name: "App-Name", values: "ArConnect" }
            { name: "Type", values: "Fee-Transaction" }
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
  );

  let arPrice = 0;

  try {
    const res = await limestone.getPrice("AR");
    arPrice = res.price;
  } catch {
    const { data: res } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
    );
    arPrice = res.arweave.usd;
  }

  const usdPrice = 1 / arPrice; // 1 USD how much AR

  if (res.data.transactions.edges.length) {
    const usd = res.data.transactions.edges.length >= 10 ? 0.01 : 0.03;

    return arweave.ar.arToWinston((usdPrice * usd).toString());
  } else return arweave.ar.arToWinston((usdPrice * 0.01).toString());
}

// check if there are any wallets stored
export async function walletsStored(): Promise<boolean> {
  try {
    const wallets = (await getStoreData())?.["wallets"];

    if (!wallets || wallets.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

// get decryption key or open a popup
// to enter it
export const authenticateUser = (action: MessageType, tabURL: string) =>
  new Promise<void>(async (resolve, reject) => {
    try {
      const decryptionKey = (await browser.storage.local.get("decryptionKey"))
        ?.decryptionKey;
      if (decryptionKey) return resolve();

      createAuthPopup({
        type: action,
        url: tabURL
      });
      browser.runtime.onMessage.addListener(async (msg) => {
        if (
          !validateMessage(msg, {
            sender: "popup",
            type: `${action}_result` as MessageType
          }) ||
          !msg.decryptionKey ||
          !msg.res
        )
          reject();
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });

export async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]) throw new Error("No tabs opened");
  else return tabs[0];
}
