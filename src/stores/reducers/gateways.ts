import { IGatewayConfig } from "./arweave";

export interface IAppGateway {
  url: string;
  gateway: IGatewayConfig;
}

export interface IGatewayAction {
  type: "UPDATE_APP_GATEWAY";
  payload: IAppGateway;
}

export default function gatewaysReducer(
  state: IAppGateway[] = [],
  action: IGatewayAction
): IAppGateway[] {
  switch (action.type) {
    case "UPDATE_APP_GATEWAY":
      return [
        ...state.filter(({ url }) => url !== action.payload.url),
        action.payload
      ];
  }

  return state;
}
