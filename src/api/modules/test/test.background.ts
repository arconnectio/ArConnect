import { ModuleFunction } from "../../background";

const background: ModuleFunction<string> = async (port, test: string) => {
  return test;
};

export default background;
