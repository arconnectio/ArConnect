import { JWKInterface } from "arweave/web/lib/wallet";
import { getStoreData } from "../../../utils/background";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<string> = async () => {
  const stored = await getStoreData();

  if (!stored) throw new Error("Error accessing storage");
  if (!stored.profile) throw new Error("No profile selected");
  if (!stored.wallets) throw new Error("No wallets added");

  // find keyfile to get the public key for
  const keyfileToDecrypt = stored.wallets.find(
    ({ address }) => address === stored.profile
  );

  if (!keyfileToDecrypt) throw new Error("Could not find active keyfile");

  // parse encoded jwk and get the public key
  const jwk: JWKInterface = JSON.parse(atob(keyfileToDecrypt.keyfile));
  const { n: publicKey } = jwk;

  return publicKey;
};

export default background;
