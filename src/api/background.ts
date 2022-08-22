import { Runtime } from "webextension-polyfill-ts";
import { Module } from "./module";

import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.background";

/** Background modules */
const modules: BackgroundModule<any>[] = [
  { ...permissionsModule, function: permissions }
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
