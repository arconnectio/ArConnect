import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { ArweaveCryptoAccount } from "@keystonehq/bc-ur-registry-arweave";
import { DefaultKeyring } from "@keystonehq/arweave-keyring";
import { defaultGateway } from "~applications/gateway";
import type { UR } from "@ngraveio/bc-ur";
import Arweave from "arweave";

// init keyring instance
const keyring = DefaultKeyring.getEmptyKeyring();

/**
 * Decode cbor result from a keystone QR code
 * with Arweave account info
 *
 * @returns Wallet address & public key
 */
export async function decodeAccount(res: UR) {
  // decode cbor result
  const keyringData = ArweaveCryptoAccount.fromCBOR(res.cbor);

  // get owner
  const publicKey = keyringData.getKeyData();
  const owner = Arweave.utils.bufferTob64Url(publicKey);

  // get address
  const arweave = new Arweave(defaultGateway);
  const address = await arweave.wallets.ownerToAddress(owner);

  return {
    address,
    owner
  };
}

/**
 * Sign a transaction with kestone
 *
 * @param transaction Transaction buffer to sign
 * @param options Signature options
 * @returns Transaction signature
 */
export async function sign(transaction: Buffer, options?: SignatureOptions) {
  const signature = await keyring.signTransaction(
    transaction,
    options?.saltLength || 32
  );

  return signature;
}
