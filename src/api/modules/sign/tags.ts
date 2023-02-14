import { version } from "../../../../package.json";

export interface DecodedTag {
  name: string;
  value: string;
}

export const signedTxTags = [
  { name: "Signing-Client", value: "ArConnect" },
  {
    name: "Signing-Client-Version",
    value: version
  }
];
