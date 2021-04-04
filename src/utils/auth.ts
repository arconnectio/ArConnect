import { local } from "chrome-storage-promises";
import bcrypt from "bcryptjs";

// check a given password
export async function checkPassword(password: string) {
  const hashRes: { [key: string]: any } =
      typeof chrome !== "undefined"
        ? await local.get("hash")
        : await browser.storage.local.get("hash"),
    hash = hashRes?.["hash"];

  if (!hash) throw new Error();

  return await bcrypt.compare(password, hash);
}

// update / set password
export async function setPassword(password: string) {
  if (typeof chrome !== "undefined")
    local.set({ hash: await bcrypt.hash(password, 10) });
  else
    browser.storage.local.set({
      hash: await bcrypt.hash(password, 10)
    });
}
