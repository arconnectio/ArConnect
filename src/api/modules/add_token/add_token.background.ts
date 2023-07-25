import { isAddress, isGateway, isTokenType } from "~utils/assertions";
import type { ModuleFunction } from "~api/background";
import authenticate from "../connect/auth";
import { getTokens } from "~tokens";

const background: ModuleFunction<void> = async (
  appData,
  id: unknown,
  type?: unknown,
  gateway?: unknown
) => {
  // validate input
  isAddress(id);

  if (type) isTokenType(type);
  if (gateway) isGateway(gateway);

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
