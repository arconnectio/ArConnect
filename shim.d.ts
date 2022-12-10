import type { ProtocolWithReturn } from "@arconnect/webext-bridge";
import type { DisplayTheme } from "@arconnect/components";
import type { Chunk } from "~api/modules/sign/chunks";
import "styled-components";

declare module "@arconnect/webext-bridge" {
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

declare module "styled-components" {
  export interface DefaultTheme {
    displayTheme: DisplayTheme;
    theme: string;
    primaryText: string;
    secondaryText: string;
    background: string;
    cardBorder: string;
    cardBackground: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    BETA_VERSION?: string;
  }
}
