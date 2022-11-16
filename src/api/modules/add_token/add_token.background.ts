import type { ModuleFunction } from "~api/background";
import { getAppURL, isAddress } from "~utils/format";
import authenticate from "../connect/auth";

const background: ModuleFunction<void> = async (tab, id: string) => {
  // grab tab url
  const tabURL = getAppURL(tab.url);

  // check id
  if (!isAddress(id)) {
    throw new Error("Invalid token contract ID");
  }

  // request "add token" popup
  await authenticate({
    type: "token",
    url: tabURL,
    tokenID: id
  });
};

export default background;
