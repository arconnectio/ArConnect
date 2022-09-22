import { getStoreData } from "../../../utils/background";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<string> = async () => {
  const stored = await getStoreData();

  if (!stored) throw new Error("Error accessing storage");
  if (!stored.profile) throw new Error("No profile selected");

  return stored.profile;
};

export default background;
