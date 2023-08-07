import type { ModuleFunction } from "~api/background";

const background: ModuleFunction<number[]> = async () => {
  throw new Error("The signature() function is deprecated.");
};

export default background;
