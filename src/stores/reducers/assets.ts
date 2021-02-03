export interface Asset {
  id: string;
  ticker: string;
  name: string;
  balance: number;
}

export interface AssetStateItem {
  address: string;
  assets: Asset[];
}

export interface IAssetsAction {
  type: "UPDATE_ASSETS" | "USER_SIGNOUT";
  payload: {
    address: string;
    assets: Asset[];
  };
}

export default function assetsReducer(
  state: AssetStateItem[] = [],
  action: IAssetsAction
): AssetStateItem[] {
  switch (action.type) {
    case "UPDATE_ASSETS":
      return [
        ...state.filter(({ address }) => address !== action.payload.address),
        { address: action.payload.address, assets: action.payload.assets }
      ];

    case "USER_SIGNOUT":
      return [];
  }

  return state;
}
