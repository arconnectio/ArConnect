import type { ModuleFunction } from "~api/background";
import { isAddress } from "~utils/format";
import { getTokens } from "~tokens";

const background: ModuleFunction<boolean> = async (_, id: string) => {
  // check id
  if (!isAddress(id)) {
    throw new Error("Invalid token contract ID");
  }

  // check if the token is added
  const tokens = await getTokens();

  return !!tokens.find((token) => token.id === id);
};

export default background;
