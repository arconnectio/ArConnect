import { browser } from "webextension-polyfill-ts";
import bcrypt from "bcryptjs";

// check a given password
export async function checkPassword(password: string) {
  const hash = (await browser.storage.local.get("hash"))?.hash;
  if (!hash) throw new Error();

  return await bcrypt.compare(password, hash);
}

// update / set password
export async function setPassword(password: string) {
  await browser.storage.local.set({
    hash: await bcrypt.hash(password, 10)
  });
}
