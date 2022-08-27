import { browser } from "webextension-polyfill-ts";
import { walletsStored } from "./background";
import bcrypt from "bcryptjs";

/**
 * Check if the password is valid
 *
 * @param password Password to check for
 *
 * @returns if the password is valid
 */
export async function checkPassword(password: string) {
  const hash = (await browser.storage.local.get("hash"))?.hash;
  if (!hash) throw new Error();

  return await bcrypt.compare(password, hash);
}

/**
 * Update / set password
 *
 * @param password Password to set
 */
export async function setPassword(password: string) {
  await browser.storage.local.set({
    hash: await bcrypt.hash(password, 10)
  });
}

/**
 * Sign out from ArConnect
 * Deletes everything from storage
 */
export async function logOut() {
  await browser.storage.local.clear();
  browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
}
