import type { Tabs } from "webextension-polyfill";
import type { Module } from "./module";

// import modules
import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.background";
import activeAddressModule from "./modules/active_address";
import activeAddress from "./modules/active_address/active_address.background";
import allAddressesModule from "./modules/all_addresses";
import allAddresses from "./modules/all_addresses/all_addresses.background";
import publicKeyModule from "./modules/public_key";
import publicKey from "./modules/public_key/public_key.background";
import walletNamesModule from "./modules/wallet_names";
import walletNames from "./modules/wallet_names/wallet_names.background";
import arweaveConfigModule from "./modules/arweave_config";
import arweaveConfig from "./modules/arweave_config/arweave_config.background";
import disconnectModule from "./modules/disconnect";
import disconnect from "./modules/disconnect/disconnect.background";
import connectModule from "./modules/connect";
import connect from "./modules/connect/connect.background";
import signModule from "./modules/sign";
import sign from "./modules/sign/sign.background";
import dispatchModule from "./modules/dispatch";
import dispatch from "./modules/dispatch/dispatch.background";
import encryptModule from "./modules/encrypt";
import encrypt from "./modules/encrypt/encrypt.background";
import decryptModule from "./modules/decrypt";
import decrypt from "./modules/decrypt/decrypt.background";
import signatureModule from "./modules/signature";
import signature from "./modules/signature/signature.background";
import addTokenModule from "./modules/add_token";
import addToken from "./modules/add_token/add_token.background";

/** Background modules */
const modules: BackgroundModule<any>[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress },
  { ...allAddressesModule, function: allAddresses },
  { ...publicKeyModule, function: publicKey },
  { ...walletNamesModule, function: walletNames },
  { ...arweaveConfigModule, function: arweaveConfig },
  { ...disconnectModule, function: disconnect },
  { ...connectModule, function: connect },
  { ...addTokenModule, function: addToken }
  /*{ ...signModule, function: sign },
  { ...dispatchModule, function: dispatch },
  { ...encryptModule, function: encrypt },
  { ...decryptModule, function: decrypt },
  { ...signatureModule, function: signature }*/
];

export default modules;

/** Extended module interface */
interface BackgroundModule<T> extends Module<T> {
  function: ModuleFunction<T>;
}

/**
 * Extended module function
 */
export type ModuleFunction<ResultType> = (
  tab: Tabs.Tab,
  ...params: any[]
) => Promise<ResultType> | ResultType;
