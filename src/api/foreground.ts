import { Module, ModuleFunction } from "./module";

// import modules
import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.foreground";
import activeAddressModule from "./modules/active_address";
import activeAddress from "./modules/active_address/active_address.foreground";

/** Foreground modules */
const modules: ForegroundModule<any>[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress }
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
