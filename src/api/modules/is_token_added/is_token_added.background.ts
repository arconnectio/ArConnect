import type { ModuleFunction } from "~api/background";
import { isAddressFormat } from "~utils/format";
import { getTokens } from "~tokens";
import { isAddress } from "~utils/assertions";

const background: ModuleFunction<boolean> = async (_, id: string) => {
  // check id
  isAddress(id);

  // check if the token is added
  const tokens = await getTokens();

  return !!tokens.find((token) => token.id === id);
};

export default background;
