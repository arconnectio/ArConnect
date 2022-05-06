export interface IGatewayConfig {
  host: string;
  port: number;
  protocol: "http" | "https";
}

export interface IGatewayConfigAction {
  type: "SET_ARWEAVE_CONFIG" | "RESET_ARWEAVE_CONFIG";
  payload?: IGatewayConfig;
}

export const defaultConfig: IGatewayConfig = {
  host: "arweave.net",
  port: 443,
  protocol: "https"
};

export default function arweaveReducer(
  state: IGatewayConfig = defaultConfig,
  action: IGatewayConfigAction
): IGatewayConfig {
  switch (action.type) {
    case "SET_ARWEAVE_CONFIG":
      if (!action.payload) break;
      return action.payload;

    case "RESET_ARWEAVE_CONFIG":
      return defaultConfig;
  }

  return state;
}
