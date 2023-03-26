import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import type { TokenType } from "~tokens/token";
import { isAddress } from "~utils/format";
import { getTokens } from "~tokens";
import authenticate from "../connect/auth";

const background: ModuleFunction<void> = async (
  appData,
  id: string,
  type?: TokenType,
  gateway?: Gateway
) => {
  // check id
  if (!isAddress(id)) {
    throw new Error("Invalid token contract ID");
  }

  // check type
  if (type && !["asset", "collectible"].includes(type)) {
    throw new Error("Invalid token type");
  }

  // check if the token is added already
  const tokens = await getTokens();

  if (tokens.find((token) => token.id === id)) {
    throw new Error("Token already added");
  }

  // request "add token" popup
  await authenticate({
    type: "token",
    url: appData.appURL,
    tokenID: id,
    tokenType: type,
    gateway
  });
};

export default background;
