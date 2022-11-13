import { ModuleFunction } from "../../module";

const foreground: ModuleFunction<void> = (_, options) => {
  if (options.algorithm) {
    console.warn("[ArConnect] YOU'RE USING DEPRECATED PARAMS FOR \"decrypt()\". Please check the documentation.\nhttps://github.com/arconnectio/ArConnect#decryptdata-options-promisestring");
  }
};

export default foreground;
