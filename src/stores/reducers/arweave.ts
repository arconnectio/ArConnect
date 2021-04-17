export interface IArweave {
  host: string;
  port: number;
  protocol: "http" | "https";
}

export interface IArweaveAction {
  type: "SET_ARWEAVE_CONFIG" | "RESET_ARWEAVE_CONFIG";
  payload?: IArweave;
}

export const defaultConfig: IArweave = {
  host: "arweave.net",
  port: 443,
  protocol: "https"
};

export default function arweaveReducer(
  state: IArweave = defaultConfig,
  action: IArweaveAction
): IArweave {
  switch (action.type) {
    case "SET_ARWEAVE_CONFIG":
      if (!action.payload) break;
      return action.payload;

    case "RESET_ARWEAVE_CONFIG":
      return defaultConfig;
  }

  return state;
}
