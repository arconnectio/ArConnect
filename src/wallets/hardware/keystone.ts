import {
  ArweaveCryptoAccount,
  ArweaveSignRequest,
  SignType
} from "@keystonehq/bc-ur-registry-arweave";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import type Transaction from "arweave/web/lib/transaction";
import { defaultGateway } from "~applications/gateway";
import type { UR } from "@ngraveio/bc-ur";
import { nanoid } from "nanoid";
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

  const xfp = keyringData.getMasterFingerprint().toString("hex");

  // get address
  const arweave = new Arweave(defaultGateway);
  const address = await arweave.wallets.ownerToAddress(owner);

  return {
    address,
    owner,
    xfp
  };
}

/**
 * Convert an Arweave transaction to an UR object
 * to be encoded into a QR code
 */
export async function transactionToUR(
  transaction: Transaction,
  xfp: string,
  options: SignatureOptions = { saltLength: 32 }
) {
  // create buffer object from transaction
  const txBuff = Buffer.from(JSON.stringify(transaction.toJSON()), "utf-8");

  // request ID
  const requestID = nanoid();

  // construct request
  const signRequest = ArweaveSignRequest.constructArweaveRequest(
    txBuff,
    xfp,
    SignType.Transaction,
    options.saltLength,
    requestID
  );

  return signRequest.toUR();
}
