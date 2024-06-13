import { getKeyPairFromSeed } from "human-crypto-keys";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { passwordStrength } from "check-password-strength";
import { isOneOf, isString } from "typed-assert";
import { wordlists, mnemonicToSeed } from "bip39-web-crypto";

/**
 * Credits to arweave.app for the mnemonic wallet generation
 *
 * https://github.com/jfbeats/ArweaveWebWallet/blob/master/src/functions/Wallets.ts
 * https://github.com/jfbeats/ArweaveWebWallet/blob/master/src/functions/Crypto.ts
 */

/**
 * Generate a JWK from a mnemonic seedphrase
 *
 * @param mnemonic Mnemonic seedphrase to generate wallet from
 * @returns Wallet JWK
 */
export async function jwkFromMnemonic(mnemonic: string) {
  let seedBuffer = await mnemonicToSeed(mnemonic);
  let seed = Uint8Array.from(seedBuffer);
  const { privateKey } = await getKeyPairFromSeed(
    seed,
    {
      id: "rsa",
      modulusLength: 4096
    },
    { privateKeyFormat: "pkcs8-der" }
  );
  const jwk = pkcs8ToJwk(privateKey as any);

  return jwk;
}

/**
 * Convert a PKCS8 private key to a JWK
 *
 * @param privateKey PKCS8 private key to convert
 * @returns JWK
 */
async function pkcs8ToJwk(privateKey: Uint8Array): Promise<JWKInterface> {
  const key = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKey,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    ["sign"]
  );
  const jwk = await window.crypto.subtle.exportKey("jwk", key);

  return {
    kty: jwk.kty!,
    e: jwk.e!,
    n: jwk.n!,
    d: jwk.d,
    p: jwk.p,
    q: jwk.q,
    dp: jwk.dp,
    dq: jwk.dq,
    qi: jwk.qi
  };
}

/**
 * Check password strength
 *
 * @param password Password to check
 */
export function checkPasswordValid(password: string) {
  const strength = passwordStrength(password);

  return strength.id === 3;
}

export function isValidMnemonic(mnemonic: string) {
  isString(mnemonic, "Mnemonic has to be a string.");

  const words = mnemonic.split(" ");

  isOneOf(words.length, [12, 24], "Invalid mnemonic length.");

  const wordlist = wordlists.english;

  for (const word of words) {
    isOneOf(word, wordlist, "Invalid word in mnemonic.");
  }
}
