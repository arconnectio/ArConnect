import { Runtime } from "webextension-polyfill-ts";
import { Module } from "./module";

import testModule from "./modules/test";
import test from "./modules/test/test.background";

/** Background modules */
const modules: BackgroundModule<any>[] = [{ ...testModule, function: test }];

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
