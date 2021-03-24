import { Wallet } from "./wallets";

export interface IBalanceAction {
  type: "ADD_WALLET" | "REMOVE_WALLET" | "UPDATE_BALANCE";
  payload: {
    address?: string;
    wallet?: Wallet;
    balance?: Balance;
  };
}

export interface Balance {
  address: string;
  arBalance: number;
  fiatBalance: number;
}

export default function balancesReducer(
  state: Balance[] = [],
  action: IBalanceAction
): Balance[] {
  switch (action.type) {
    case "ADD_WALLET":
      if (!action.payload.wallet || !action.payload.wallet.address) break;
      return [
        ...state,
        { address: action.payload.wallet.address, arBalance: 0, fiatBalance: 0 }
      ];

    case "REMOVE_WALLET":
      if (!action.payload.address) break;
      return state.filter(({ address }) => address !== action.payload.address);

    case "UPDATE_BALANCE":
      if (!action.payload.balance) break;
      return [
        ...state.filter(
          (balance) => balance.address !== action.payload.balance?.address
        ),
        action.payload.balance
      ];
  }

  return state;
}
