import { process as processPolyfill } from "@esbuild-plugins/node-globals-polyfill/process";
import { Buffer } from "buffer";

export const process = {
  ...processPolyfill,
  env: {
    ...processPolyfill.env,
    NODE_ENV: "production"
  }
};

export { Buffer };
