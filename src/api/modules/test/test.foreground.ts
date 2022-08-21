import { ModuleFunction } from "../../module";

const content: ModuleFunction<string> = async (test: string) => {
  console.log("content");
  return test;
};

export default content;
