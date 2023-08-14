import type { ModuleFunction } from "~api/background";
import { ExtensionStorage } from "~utils/storage";

const background: ModuleFunction<string> = async () => {
  const address = await ExtensionStorage.get("active_address");

  if (!address) throw new Error("No active address");

  return address;
};

export default background;
