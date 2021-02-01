import { JWKInterface } from "arweave/node/lib/wallet";

export interface Wallet {
  keyfile: JWKInterface;
  address: string;
  name: string;
}

export interface IWalletsAction {
  type: "ADD_WALLET" | "REMOVE_WALLET" | "USER_SIGNOUT" | "RENAME_WALLET";
  payload: {
    name?: string;
    wallet?: Wallet;
    address?: string;
  };
}

export default function walletsReducer(
  state: Wallet[] = [],
  action: IWalletsAction
): Wallet[] {
  switch (action.type) {
    case "ADD_WALLET":
      if (!action.payload.wallet) break;
      return [...state, action.payload.wallet];

    case "REMOVE_WALLET":
      if (!action.payload.address) break;
      return state.filter(({ address }) => address !== action.payload.address);

    case "RENAME_WALLET":
      if (
        !action.payload.address ||
        !action.payload.name ||
        action.payload.name === ""
      )
        break;
      return state.map((wallet) =>
        wallet.address === action.payload.address
          ? { ...wallet, name: action.payload.name ?? "" }
          : wallet
      );

    case "USER_SIGNOUT":
      return [];
  }

  return state;
}
