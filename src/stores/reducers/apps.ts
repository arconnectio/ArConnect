import { IGatewayConfig } from "./arweave";

export interface App {
  url: string;
  gatewayConfig: IGatewayConfig;
}

export interface IAppAction {
  type: "ADD_APP" | "UPDATE_GATEWAY";
  payload: App;
}

export default function appsReducer(
  state: App[] = [],
  action: IAppAction
): App[] {
  switch (action.type) {
    case "ADD_APP":
      return [...state, action.payload];

    case "UPDATE_GATEWAY":
      const app = state.find((app) => app.url === action.payload.url);

      if (!app) break;
      app.gatewayConfig = action.payload.gatewayConfig;

      return state;
  }

  return state;
}
