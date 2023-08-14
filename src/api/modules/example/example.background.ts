import type { ModuleFunction } from "~api/background";

/**
 * Background functionality of the module
 */
const background: ModuleFunction<string> = async (port, test: string) => {
  return "fffff";
};

export default background;
