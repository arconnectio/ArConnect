import { ArweaveCryptoAccount } from "@keystonehq/bc-ur-registry-arweave";
import { defaultGateway } from "~applications/gateway";
import type { UR } from "@ngraveio/bc-ur";
import Arweave from "arweave";

/**
 * Decode cbor result from a keystone QR code
 * with Arweave account info
 *
 * @returns Wallet address & public key
 */
export async function decodeAccount(res: UR) {
  // check UR type
  if (res.type !== "arweave-crypto-account") {
    throw new Error(
      `Invalid UR result. Expected "arweave-crypto-account", received "${res.type}".`
    );
  }

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
