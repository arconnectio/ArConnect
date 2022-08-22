import { Module, ModuleFunction } from "./module";

import testModule from "./modules/test";
import test from "./modules/test/test.foreground";

/** Foreground modules */
const modules: ForegroundModule<any>[] = [{ ...testModule, function: test }];

export default modules;

/** Extended module interface */
interface ForegroundModule<T> extends Module<T> {
  /**
   * A function that runs after results were
   * returned from the background script.
   * This is optional and will be ignored if not set.
   */
  finalizer?: ModuleFunction<T>;
}
