import { Asset, IAssetsAction } from "./reducers/assets";
import { IPermissionsAction } from "./reducers/permissions";
import { IProfileAction } from "./reducers/profile";
import { IWalletsAction, Wallet } from "./reducers/wallets";
import { IBlockedAction } from "./reducers/blocked_sites";
import { IArweaveAction, IArweave } from "./reducers/arweave";

import { PermissionType } from "../utils/permissions";
import { IAllowancesAction } from "./reducers/allowances";
import { ISettings, ISettingsAction } from "./reducers/settings";
import { IBalanceAction, Balance } from "./reducers/balances";

import { browser } from "webextension-polyfill-ts";

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

export function readdAsset(address: string, id: string): IAssetsAction {
  return {
    type: "READD_ASSETS",
    payload: { address, id }
  };
}

export function blockURL(url: string): IBlockedAction {
  return {
    type: "ADD_SITE",
    payload: url
  };
}

export function unblockURL(url: string): IBlockedAction {
  return {
    type: "REMOVE_SITE",
    payload: url
  };
}

export function updateArweaveConfig(config: IArweave): IArweaveAction {
  return {
    type: "SET_ARWEAVE_CONFIG",
    payload: config
  };
}

export function resetArweaveConfig(): IArweaveAction {
  return {
    type: "RESET_ARWEAVE_CONFIG"
  };
}

export function addAllowance(
  url: string,
  enabled: boolean,
  limit: number
): IAllowancesAction {
  return {
    type: "ADD_ALLOWANCE",
    payload: { url, enabled, limit }
  };
}

export function removeAllowance(url: string): IAllowancesAction {
  return {
    type: "REMOVE_ALLOWANCE",
    payload: { url }
  };
}

export function toggleAllowance(
  url: string,
  enabled: boolean
): IAllowancesAction {
  return {
    type: "TOGGLE_ALLOWANCE",
    payload: { url, enabled }
  };
}

export function setAllowanceLimit(
  url: string,
  limit: number
): IAllowancesAction {
  return {
    type: "SET_LIMIT",
    payload: { url, limit }
  };
}

export function resetAllowanceSpent(url: string): IAllowancesAction {
  return {
    type: "RESET_ALLOWANCE",
    payload: { url }
  };
}

export function updateSettings(
  settingsToUpdate: Partial<ISettings>
): ISettingsAction {
  return {
    type: "UPDATE_SETTINGS",
    payload: settingsToUpdate
  };
}

export function signOut() {
  // give time for state update
  setTimeout(
    () => browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") }),
    500
  );
  return {
    type: "USER_SIGNOUT",
    payload: {}
  };
}

export function setBalance(balance: Balance): IBalanceAction {
  return {
    type: "UPDATE_BALANCE",
    payload: { balance }
  };
}
