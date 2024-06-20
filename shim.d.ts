import type { ProtocolWithReturn } from "@arconnect/webext-bridge";
import type { DisplayTheme } from "@arconnect/components";
import type { Chunk } from "~api/modules/sign/chunks";
import type { InjectedEvents } from "~utils/events";
import "styled-components";

declare module "@arconnect/webext-bridge" {
  export interface ProtocolMap {
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;
    auth_result: AuthResult;
    switch_wallet_event: string | null;
    copy_address: string;
    chunk: ProtocolWithReturn<ApiCall<Chunk>, ApiResponse<number>>;
    event: Event;
    auth_listening: number;
    auth_chunk: Chunk;
    ar_protocol: ProtocolWithReturn<{ url: string }, { url: sting }>;
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

interface AuthResult<DataType = any> {
  type: string;
  authID: string;
  error?: boolean;
  data?: DataType;
}

interface Event {
  name: keyof InjectedEvents;
  value: unknown;
}

declare module "styled-components" {
  export interface DefaultTheme {
    displayTheme: DisplayTheme;
    theme: string;
    primaryText: string;
    secondaryText: string;
    secondaryTextv2: string;
    background: string;
    backgroundSecondary: string;
    secondaryBtnHover: string;
    inputField: string;
    primary: string;
    cardBorder: string;
    fail: string;
    secondaryDelete: string;
    delete: string;
    cardBackground: string;
    primaryBtnHover: string;
    primaryTextv2: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    BETA_VERSION?: string;
  }
}
