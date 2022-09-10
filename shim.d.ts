import { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
  export interface ProtocolMap {
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;
  }
}

interface ApiCall {
  type: string;
  data?: any;
  callID: number | string;
}

interface ApiResponse extends ApiCall {
  error?: boolean;
}