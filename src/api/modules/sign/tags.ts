import { version } from "../../../../package.json";

export const signedTxTags = [
  { name: "Signing-Client", value: "ArConnect" },
  {
    name: "Signing-Client-Version",
    value: version
  }
];
