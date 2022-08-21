import { ModuleFunction } from "../../module";

const background: ModuleFunction<string> = async (test: string) => {
  return test;
};

export default background;
