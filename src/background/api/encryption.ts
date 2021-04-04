import { local } from "chrome-storage-promises";
import { MessageFormat, validateMessage } from "../../utils/messenger";
import Arweave from "arweave";
import { createAuthPopup, getStoreData } from "../../utils/background";
import { JWKInterface } from "arweave/node/lib/wallet";

// encrypt data using the user's keyfile
export const encrypt = (message: MessageFormat, tabURL: string) =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    if (!message.data)
      return resolve({
        res: false,
        message: "No data submitted"
      });

    if (!message.options)
      return resolve({
        res: false,
        message: "No options submitted"
      });

    try {
      const decryptionKeyRes: { [key: string]: any } =
        typeof chrome !== "undefined"
          ? await local.get("decryptionKey")
          : await browser.storage.local.get("decryptionKey");
      let decryptionKey = decryptionKeyRes?.["decryptionKey"];

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

          return resolve({
            res: true,
            data: await doEncrypt(message),
            message: "Success"
          });
        });
      } else
        resolve({
          res: true,
          data: await doEncrypt(message),
          message: "Success"
        });
    } catch {
      resolve({
        res: false,
        message: "Error encrypting data"
      });
    }
  });

async function doEncrypt(message: MessageFormat) {
  const arweave = new Arweave({
      host: "arweave.net",
      port: 443,
      protocol: "https"
    }),
    storeData = await getStoreData(),
    storedKeyfiles = storeData?.["wallets"],
    storedAddress = storeData?.["profile"],
    keyfileToDecrypt = storedKeyfiles?.find(
      (item) => item.address === storedAddress
    )?.keyfile;

  // this should not happen, we already check for wallets in background.ts
  if (!storedKeyfiles || !storedAddress || !keyfileToDecrypt)
    throw new Error("No wallets added");

  const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt)),
    obj = {
      kty: "RSA",
      e: "AQAB",
      n: keyfile.n,
      alg: "RSA-OAEP-256",
      ext: true
    },
    key = await crypto.subtle.importKey(
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
    ),
    array = new Uint8Array(256);

  crypto.getRandomValues(array);

  const keyBuf = array;

  const encryptedData = await arweave.crypto.encrypt(dataBuf, keyBuf),
    encryptedKey = await crypto.subtle.encrypt(
      { name: message.options.algorithm },
      key,
      keyBuf
    );

  return arweave.utils.concatBuffers([encryptedKey, encryptedData]);
}
