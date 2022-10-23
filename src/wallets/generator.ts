import type { OnMessageCallback } from "@arconnect/webext-bridge";
import type { GenerateCall, GenerationResult } from "shim";

export const generateWalletInBackground: OnMessageCallback<
  // @ts-expect-error
  GenerateCall,
  GenerationResult
> = async ({ data, sender }) => {
  if (sender.context !== "web_accessible") return;

  return {
    address: "test"
  };
};
