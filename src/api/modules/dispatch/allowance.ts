import { freeDecryptedWallet } from "~wallets/encryption";
import type { Allowance, AllowanceBigNumber } from "~applications/allowance";
import type { ModuleAppData } from "~api/background";
import { defaultGateway } from "~gateways/gateway";
import type { JWKInterface } from "warp-contracts";
import { allowanceAuth } from "../sign/allowance";
import { signAuth } from "../sign/sign_auth";
import Arweave from "arweave";
import type { DataItem } from "arbundles";
import type Transaction from "arweave/web/lib/transaction";
import type BigNumber from "bignumber.js";

/**
 * Ensure allowance for dispatch
 */
export async function ensureAllowanceDispatch(
  dataEntry: DataItem | Transaction,
  appData: ModuleAppData,
  allowance: AllowanceBigNumber,
  keyfile: JWKInterface,
  price: number | BigNumber,
  alwaysAsk?: boolean
) {
  const arweave = new Arweave(defaultGateway);

  // allowance or sign auth
  try {
    if (alwaysAsk) {
      const address = await arweave.wallets.jwkToAddress(keyfile);

      await signAuth(
        appData.appURL,
        // @ts-expect-error
        dataEntry.toJSON(),
        address
      );
    }

    if (allowance.enabled) {
      await allowanceAuth(allowance, appData.appURL, price, alwaysAsk);
    }
  } catch (e) {
    freeDecryptedWallet(keyfile);
    throw new Error(e?.message || e);
  }
  return;
}
