import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { DefaultKeyring, BaseKeyring } from "@keystonehq/arweave-keyring";
import { defaultGateway } from "~applications/gateway";
import Arweave from "arweave";

// init keyring instance
const keyring = DefaultKeyring.getEmptyKeyring();

/**
 * Connect to a keystone device using keystone arweave-keyring
 *
 * @returns Wallet address & public key
 */
export async function connect() {
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

class ArConnectKeyring extends BaseKeyring {
  //async signTransaction(txBuf: Buffer, saltLen: number): Promise<Buffer> {}
}
