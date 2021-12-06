import { MessageFormat } from "../../utils/messenger";
import { authenticateUser, getStoreData } from "../../utils/background";
import { JWKInterface } from "arweave/node/lib/wallet";
import Arweave from "arweave";
import { Wallet } from "../../stores/reducers/wallets";

// encrypt data using the user's keyfile
export async function encrypt(message: MessageFormat, tabURL: string) {
  return handleMessage(message, tabURL, async (message, wallet) => {
    const keyfile: JWKInterface = JSON.parse(atob(wallet.keyfile!));
    return {
      res: true,
      data: await doEncrypt(message, keyfile),
      message: "Success"
    };
  });
}

export async function decrypt(message: MessageFormat, tabURL: string) {
  return handleMessage(message, tabURL, async (message, wallet) => {
    const keyfile: JWKInterface = JSON.parse(atob(wallet.keyfile!));
    return {
      res: true,
      data: await doDecrypt(message, keyfile),
      message: "Success"
    };
  });
}

export async function signature(message: MessageFormat, tabURL: string) {
  return handleMessage(message, tabURL, async (message, wallet) => {
    const keyfile: JWKInterface = JSON.parse(atob(wallet.keyfile!));
    return {
      res: true,
      data: await doSignature(message, keyfile),
      message: "Success"
    };
  });
}

async function handleMessage(
  message: MessageFormat,
  tabURL: string,
  handler: (
    message: MessageFormat,
    wallet: Wallet
  ) => Promise<Partial<MessageFormat>>
): Promise<Partial<MessageFormat>> {
  if (!message.data)
    return {
      res: false,
      message: "No data submitted"
    };

  if (!message.options)
    return {
      res: false,
      message: "No options submitted"
    };

  try {
    await authenticateUser(message.type, tabURL);

    const storeData = await getStoreData(),
      wallets = storeData.wallets,
      storedAddress = storeData.profile,
      wallet = wallets?.find((item) => item.address === storedAddress);

    if (!wallets || !storedAddress || !wallet)
      throw new Error("No wallets added");

    switch (wallet.type) {
      case "local":
        return handler(message, wallet);
      case "ledger":
        return {
          res: false,
          message: "Action not supported"
        };
      default:
        throw new Error("Unknown wallet type");
    }
  } catch (e: any) {
    return {
      res: false,
      message: e.message || "Error signing data"
    };
  }
}

async function doEncrypt(message: MessageFormat, keyfile: JWKInterface) {
  const obj = {
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

  const encryptedData = await Arweave.crypto.encrypt(dataBuf, keyBuf),
    encryptedKey = await crypto.subtle.encrypt(
      { name: message.options.algorithm },
      key,
      keyBuf
    );

  return Arweave.utils.concatBuffers([encryptedKey, encryptedData]);
}

async function doDecrypt(message: MessageFormat, keyfile: JWKInterface) {
  const obj = {
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

  const res = await Arweave.crypto.decrypt(
    encryptedData,
    new Uint8Array(symmetricKey)
  );

  return Arweave.utils.bufferToString(res).split(message.options.salt)[0];
}

async function doSignature(message: MessageFormat, keyfile: JWKInterface) {
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    keyfile,
    {
      name: "RSA-PSS",
      hash: {
        name: "SHA-256"
      }
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    message.options,
    cryptoKey,
    new Uint8Array(Object.values(message.data))
  );

  return new Uint8Array(signature);
}
