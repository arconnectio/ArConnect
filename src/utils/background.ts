import { MessageType, validateMessage } from "../utils/messenger";
import { RootState } from "../stores/reducers";
import { IPermissionState } from "../stores/reducers/permissions";
import { IArweave, defaultConfig } from "../stores/reducers/arweave";
import { PermissionType } from "./permissions";
import { JWKInterface } from "arweave/node/lib/wallet";
import { getRealURL } from "./url";
import { browser } from "webextension-polyfill-ts";
import { DataItem } from "arbundles";
import { run } from "ar-gql";
import axios, { AxiosResponse } from "axios";
import limestone from "@limestonefi/api";
import Arweave from "arweave";

/**
 * Create an authenticator popup
 *
 * @param data The data sent to the popup
 *
 * @returns AuthPopup window
 */
export const createAuthPopup = (data: any) =>
  browser.windows.create({
    url: `${browser.runtime.getURL("auth.html")}?auth=${encodeURIComponent(
      JSON.stringify(data)
    )}`,
    focused: true,
    type: "popup",
    width: 385,
    height: 635
  });

/** Permission utilities */

/**
 * Check permissions for an application
 *
 * @param permissions Permissions to check for
 * @param url App URL
 *
 * @returns if the app has the checked permissions
 */
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

/**
 * Get permissions for an application
 *
 * @param url App URL
 *
 * @returns Permissions for the app
 */
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
 * Get store data
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
 * Set store data
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

/**
 * Calculate the fee amount needed for a signing
 *
 * @param address The address to base off the calculation
 * @param arweave Arweave client
 *
 * @returns Fee amount in string
 */
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
    const { data: res }: any = await axios.get(
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

/**
 * Check if any wallets are in the local storage
 */
export async function walletsStored(): Promise<boolean> {
  try {
    const wallets = (await getStoreData())?.["wallets"];

    if (!wallets || wallets.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Authenticate the user.
 * Opens an auth window if the user has not authenticated
 * themselves.
 *
 * @param action Reason of the auth request
 * @param tabURL The URL of the current app
 */
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
    } catch (e: any) {
      reject(e);
    }
  });

/**
 * Get the currently active browser tab
 *
 * @param returnFromCache If true, it returns a cached tab object,
 * so if the browser loses focus or the user opens an internal page,
 * ArConnect can keep handling the last opened tab
 *
 * @returns Active tab object
 */
export async function getActiveTab(returnFromCache = true) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let activeTab = tabs[0];

  if (!activeTab && !returnFromCache) throw new Error("No tabs opened");
  // if there is an active tab (that is not a chrome/firefox/internal tab)
  else if (activeTab && !isInternalURL(activeTab.url || "")) {
    // the active tab can be cached in the browser's localstorage
    // because it does not change often and it does not hold
    // any sensitive information
    localStorage.setItem("lastActiveTab", JSON.stringify(activeTab));

    return activeTab;
  }

  // this continues, if the cache loading
  // is enabled and the activeTab is undefined
  const storedTab = localStorage.getItem("lastActiveTab");

  if (!storedTab) throw new Error("No active tab cached");
  activeTab = JSON.parse(storedTab);

  return activeTab;
}

/**
 * Get the custom Arweave config from the
 * browser's storage
 *
 * @returns Arweave config object
 */
export async function getArweaveConfig(): Promise<IArweave> {
  try {
    const storage = await getStoreData();
    return storage.arweave ?? defaultConfig;
  } catch {
    return defaultConfig;
  }
}

const getCommunityContractId = async (
  url: string
): Promise<string | undefined> => {
  const response = await axios.head(url);
  return response.headers["x-community-contract"];
};

/**
 * @brief Checks if current resource relates to Arweave community by testing 'X-Community-Contract' header.
 * @param url Resource that needs to be checked for community contract.
 * @returns Transaction ID if it is Arweave resource, otherwise - undefined.
 */
export async function checkCommunityContract(
  url: string
): Promise<string | undefined> {
  try {
    if (url.startsWith("chrome://") || url.startsWith("about:"))
      return undefined;
    const id = await getCommunityContractId(url);
    return id && /[a-z0-9_-]{43}/i.test(id) ? id : undefined;
  } catch (err) {
    console.log("Error: ", err);
  }

  return undefined;
}

/**
 * Get if the URL is an internal URL, such as "chrome://settings"
 *
 * @param url The URL to check
 *
 * @returns Whether the if the url is internal or not
 */
export function isInternalURL(url: string) {
  const urlObject = new URL(url);

  return !!urlObject.protocol.match(
    /^(chrome|brave|edge|opera|firefox|about):/
  );
}

/**
 * Get active JWK key or error and open browser tab top add a new wallet
 * (if no wallets are added yet)
 *
 * @returns Active JWK key
 */
export async function getActiveKeyfile() {
  const storeData = await getStoreData();
  const storedKeyfiles = storeData?.["wallets"] ?? [];
  const storedAddress = storeData?.["profile"];
  const keyfileToDecrypt = storedKeyfiles.find(
    (item) => item.address === storedAddress
  )?.keyfile;

  if (storedKeyfiles.length === 0 || !storedAddress || !keyfileToDecrypt) {
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No keyfiles added");
  }

  const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt));

  return {
    keyfile,
    address: storedAddress
  };
}

export interface DispatchResult {
  status: "OK" | "INSUFFICIENT_FUNDS" | "ERROR";
  message?: string; // id for now
  type?: "BASE" | "BUNDLED";
}

export function generateBundlrAnchor() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  // we can do this, because we know that the randomBytes buffer
  // will be 32 bytes of length
  // for larger buffers, String.fromCharCode should not be used
  const base64str = btoa(String.fromCharCode(...randomBytes));

  return base64str;
}

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @returns Bundlr node response
 */
export async function uploadDataToBundlr(dataItem: DataItem) {
  const res = await axios.post(
    "https://node1.bundlr.network/tx/arweave",
    dataItem.getRaw(),
    {
      headers: { "Content-Type": "application/octet-stream" },
      timeout: 20000,
      maxBodyLength: Infinity
    }
  );

  if (res.status >= 400)
    throw new Error(
      `Error uploading DataItem: ${res.status} ${res.statusText}`
    );
}
