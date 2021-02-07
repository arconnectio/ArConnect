import { Asset, IAssetsAction } from "./reducers/assets";
import { IPermissionsAction } from "./reducers/permissions";
import { IProfileAction } from "./reducers/profile";
import { IWalletsAction, Wallet } from "./reducers/wallets";

import { PermissionType } from "weavemask";

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

export function setAssets(address: string, assets: Asset[]): IAssetsAction {
  return {
    type: "UPDATE_ASSETS",
    payload: { address, assets }
  };
}

export function setPermissions(
  url: string,
  permissions: PermissionType[]
): IPermissionsAction {
  return {
    type: "SET_PERMISSIONS",
    payload: { url, permissions }
  };
}

export function removePermissions(
  url: string,
  permissions: PermissionType[]
): IPermissionsAction {
  return {
    type: "REMOVE_PERMISSIONS",
    payload: { url, permissions }
  };
}

export function removeAsset(address: string, id: string): IAssetsAction {
  return {
    type: "REMOVE_ASSETS",
    payload: { address, id }
  };
}

export function signOut() {
  return {
    type: "USER_SIGNOUT",
    payload: {}
  };
}
