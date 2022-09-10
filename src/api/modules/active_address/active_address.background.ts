import type { ModuleFunction } from "~api/background";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";

const background: ModuleFunction<string> = async () => {
  const storage = new Storage(getStorageConfig());
  const address = await storage.get("active_address");

  if (!address) throw new Error("No active address");

  return address;
};

export default background;
