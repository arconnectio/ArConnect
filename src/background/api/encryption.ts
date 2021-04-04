import { MessageFormat } from "../../utils/messenger";
import { authenticateUser, getStoreData } from "../../utils/background";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";

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
      await authenticateUser(message.type, tabURL);

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

export const decrypt = (message: MessageFormat, tabURL: string) =>
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
      await authenticateUser(message.type, tabURL);

      resolve({
        res: true,
        data: await doDecrypt(message),
        message: "Success"
      });
    } catch {
      resolve({
        res: false,
        message: "Error decrypting data"
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

async function doDecrypt(message: MessageFormat) {
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

  if (!storedKeyfiles || !storedAddress || !keyfileToDecrypt)
    throw new Error("No wallets added");

  const keyfile: JWKInterface = JSON.parse(atob(keyfileToDecrypt)),
    obj = {
      ...keyfile,
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
      ["decrypt"]
    );

  const encryptedKey = new Uint8Array(
      new Uint8Array(Object.values(message.data)).slice(0, 512)
    ),
    encryptedData = new Uint8Array(
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

  return arweave.utils.bufferToString(res).split(message.options.salt)[0];
}
