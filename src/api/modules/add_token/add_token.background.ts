import type { ModuleFunction } from "~api/background";
import { getAppURL, isAddress } from "~utils/format";
import type { TokenType } from "~tokens/token";
import { getTokens } from "~tokens";
import Application from "~applications/application";
import authenticate from "../connect/auth";

const background: ModuleFunction<void> = async (
  tab,
  id: string,
  type?: TokenType
) => {
  // grab tab url
  const tabURL = getAppURL(tab.url);

  // check id
  if (!isAddress(id)) {
    throw new Error("Invalid token contract ID");
  }

  // check type
  if (type && type !== "asset" && type !== "collectible") {
    throw new Error("Invalid token type");
  }

  // check if connected
  const app = new Application(tabURL);
  const permissions = await app.getPermissions();

  if (permissions.length === 0) {
    throw new Error("The app needs to be connected be able to add a new token");
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
    tokenType: type
  });
};

export default background;
