import { DefaultKeyring } from "@keystonehq/arweave-keyring";
import { defaultGateway } from "~applications/gateway";
import Arweave from "arweave";

/**
 * Connect to a keystone device using keystone arweave-keyring
 *
 * @returns Wallet address & public key
 */
export async function connect() {
  // init keyring instance
  const keyring = DefaultKeyring.getEmptyKeyring();

  // call qr scanner
  await keyring.readKeyring();

  // get owner
  const publicKey = keyring.getKeyData();
  const owner = Arweave.utils.bufferTob64Url(publicKey);

  // get address
  const arweave = new Arweave(defaultGateway);
  const address = await arweave.wallets.ownerToAddress(owner);

  return {
    address,
    owner
  };
}
