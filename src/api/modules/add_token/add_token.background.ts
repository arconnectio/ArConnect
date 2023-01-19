import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import { getAppURL, isAddress } from "~utils/format";
import type { TokenType } from "~tokens/token";
import { getTokens } from "~tokens";
import Application from "~applications/application";
import authenticate from "../connect/auth";

const background: ModuleFunction<void> = async (
  tab,
  id: string,
  type?: TokenType,
  gateway?: Gateway
) => {
  // grab tab url
  const tabURL = getAppURL(tab.url);

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
    url: tabURL,
    tokenID: id,
    tokenType: type,
    gateway
  });
};

export default background;
