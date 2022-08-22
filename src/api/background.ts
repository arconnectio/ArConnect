import { Runtime } from "webextension-polyfill-ts";
import { Module } from "./module";

// import modules
import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.background";
import activeAddressModule from "./modules/active_address";
import activeAddress from "./modules/active_address/active_address.background";

/** Background modules */
const modules: BackgroundModule<any>[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress }
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
  port: Runtime.Port,
  ...params: any[]
) => Promise<ResultType> | ResultType;
