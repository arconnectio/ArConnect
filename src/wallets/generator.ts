import type { JWKInterface } from "arweave/web/lib/wallet";
import { getKeyPairFromMnemonic } from "human-crypto-keys";

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
  const { privateKey } = await getKeyPairFromMnemonic(
    mnemonic,
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
