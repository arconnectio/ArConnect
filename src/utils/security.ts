import type { JWKInterface } from "arweave/node/lib/wallet";

// salt and iv lengths
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Create a PBKDF2 key and use it to derive an AES-GCM key.
 *
 * @param password Password to create the key from
 * @param salt Salt used for the derivation
 * @param keyUsages What the derived key will be used for
 * @returns AES-GCM key to use for encryption/decryption
 */
async function deriveKey(
  password: string,
  salt: BufferSource,
  keyUsages: KeyUsage[]
) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsages
  );

  return key;
}

/**
 * Encrypt an Arweave wallet to securely store in the browser
 *
 * @param wallet Wallet in Json Web Key format
 * @param password Password to encrypt with
 * @returns Encrypted wallet as a base64 encoded string
 */
export async function encryptWallet(wallet: JWKInterface, password: string) {
  // generate iv and salt for later usage
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // derive key for encryption
  const key = await deriveKey(password, salt, ["encrypt"]);

  // encrypt data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    new TextEncoder().encode(JSON.stringify(wallet))
  );
  const data = new Uint8Array(encrypted);

  // construct the encrypted data + info that we need for decryption
  const buffer = new Uint8Array(
    // encrypted data + iv + salt
    iv.byteLength + salt.byteLength + data.byteLength
  );

  // add data to the buffer
  buffer.set(iv, 0);
  buffer.set(salt, iv.byteLength);
  buffer.set(data, iv.byteLength + salt.byteLength);

  // create a string from the full data + info
  const base64 = btoa(String.fromCharCode.apply(null, buffer));

  return base64;
}

/**
 * Decrypt an Arweave wallet from the browser's storage
 *
 * @param wallet Base64 encoded string of the encrypted wallet
 * @param password Passoword to decrypt the wallet with
 * @return Wallet Json Web Key
 */
export async function decryptWallet(wallet: string, password: string) {
  // re-construct buffer of data + info for decryption
  const buffer = new TextEncoder().encode(atob(wallet));

  // get salt, iv and data
  const iv = buffer.slice(0, IV_LENGTH);
  const salt = buffer.slice(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
  const data = buffer.slice(IV_LENGTH + SALT_LENGTH);

  // derive key for decryption
  const key = await deriveKey(password, salt, ["decrypt"]);

  // decrypt data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    data
  );

  // construct JWK
  const jwk: JWKInterface = JSON.parse(new TextDecoder().decode(decrypted));

  return jwk;
}

/**
 * Read an Arweave wallet from a file
 *
 * @param file File to read from
 * @returns JWK key
 */
export const readWalletFromFile = (file: File) =>
  new Promise<JWKInterface>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onerror = (e) => reject(e);
    reader.onabort = () => reject("Aborted reading");
    reader.onload = async (e) => {
      const res = e!.target!.result;

      if (!res || typeof res !== "string")
        return reject("Invalid result from reader");

      try {
        const jwk = JSON.parse(res);

        resolve(jwk);
      } catch (e) {
        reject(e.message || e);
      }
    };
  });
