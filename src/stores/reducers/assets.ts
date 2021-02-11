export interface Asset {
  id: string;
  ticker: string;
  name: string;
  balance: number;
  arBalance: number;
  logo?: string;
  removed: boolean;
}

export interface AssetStateItem {
  address: string;
  assets: Asset[];
}

export interface IAssetsAction {
  type: "UPDATE_ASSETS" | "USER_SIGNOUT" | "REMOVE_ASSETS" | "READD_ASSETS";
  payload: {
    address: string;
    assets?: Asset[];
    id?: string;
  };
}

export default function assetsReducer(
  state: AssetStateItem[] = [],
  action: IAssetsAction
): AssetStateItem[] {
  switch (action.type) {
    case "UPDATE_ASSETS":
      if (!action.payload.assets) break;
      return [
        ...state.filter(({ address }) => address !== action.payload.address),
        { address: action.payload.address, assets: action.payload.assets }
      ];

    case "REMOVE_ASSETS":
      if (!action.payload.id) break;
      return state.map(({ address, assets }) => ({
        address,
        assets:
          address === action.payload.address
            ? assets.map((asset) => ({
                ...asset,
                removed: action.payload.id === asset.id ? true : asset.removed
              }))
            : assets
      }));

    case "READD_ASSETS":
      if (!action.payload.id) break;
      return state.map(({ address, assets }) => ({
        address,
        assets:
          address === action.payload.address
            ? assets.map((asset) => ({
                ...asset,
                removed: action.payload.id === asset.id ? false : asset.removed
              }))
            : assets
      }));

    case "USER_SIGNOUT":
      return [];
  }

  return state;
}
