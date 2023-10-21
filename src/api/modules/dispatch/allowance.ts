import { freeDecryptedWallet } from "~wallets/encryption";
import type { Allowance } from "~applications/allowance";
import type { ModuleAppData } from "~api/background";
import { defaultGateway } from "~gateways/gateway";
import type { JWKInterface } from "warp-contracts";
import { allowanceAuth } from "../sign/allowance";
import { signAuth } from "../sign/sign_auth";
import Arweave from "arweave";

/**
 * Ensure allowance for dispatch
 */
export async function ensureAllowanceDispatch(
  appData: ModuleAppData,
  allowance: Allowance,
  keyfile: JWKInterface,
  price: number
) {
  const arweave = new Arweave(defaultGateway);

  // allowance or sign auth
  try {
    if (allowance.enabled) {
      await allowanceAuth(allowance, appData.appURL, price);
    } else {
      // get address
      const address = await arweave.wallets.jwkToAddress(keyfile);

      await signAuth(
        appData.appURL,
        // @ts-expect-error
        dataEntry.toJSON(),
        address
      );
    }
  } catch (e) {
    freeDecryptedWallet(keyfile);
    throw new Error(e?.message || e);
  }
}
