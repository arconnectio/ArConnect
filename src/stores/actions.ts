import { IProfileAction } from "./reducers/profile";
import { IWalletsAction, Wallet } from "./reducers/wallets";

export function addWallet(wallet: Wallet): IWalletsAction {
  return {
    type: "ADD_WALLET",
    payload: { wallet }
  };
}

export function removeWallet(address: string): IWalletsAction {
  return {
    type: "REMOVE_WALLET",
    payload: { address }
  };
}

export function renameWallet(address: string, name: string): IWalletsAction {
  return {
    type: "RENAME_WALLET",
    payload: { address, name }
  };
}

export function setWallets(wallets: Wallet[]): IWalletsAction {
  return {
    type: "SET_WALLETS",
    payload: { wallets }
  };
}

export function switchProfile(address: string): IProfileAction {
  return {
    type: "SWITCH_PROFILE",
    payload: { address }
  };
}

export function signOut() {
  return {
    type: "USER_SIGNOUT",
    payload: {}
  };
}
