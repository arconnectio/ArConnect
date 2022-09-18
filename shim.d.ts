import type { ProtocolWithReturn } from "webext-bridge";
import type { Chunk } from "~api/modules/sign/chunks";

declare module "webext-bridge" {
  export interface ProtocolMap {
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;
    auth_result: AuthResult;
    switch_wallet_event: string;
    copy_address: string;
    chunk: ProtocolWithReturn<ApiCall<Chunk>, ApiResponse<number>>;
  }
}

interface ApiCall<DataType = any> extends JsonValue {
  type: string;
  data?: DataType;
  callID: number | string;
}

interface ApiResponse<DataType = any> extends ApiCall<DataType> {
  error?: boolean;
}

interface AuthResult {
  type: string;
  authID: string;
  error?: boolean;
  data?: any;
}
