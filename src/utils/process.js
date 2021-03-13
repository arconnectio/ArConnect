import { process as processPolyfill } from "@esbuild-plugins/node-globals-polyfill/process";

export const process = {
  ...processPolyfill,
  env: {
    ...processPolyfill.env,
    NODE_ENV: "production"
  }
};
