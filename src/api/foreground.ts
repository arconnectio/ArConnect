import { Module, ModuleFunction } from "./module";

import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.foreground";

/** Foreground modules */
const modules: ForegroundModule<any>[] = [
  { ...permissionsModule, function: permissions }
];

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
