import { Module } from "./module";

import testModule from "./modules/test";
import test from "./modules/test/test.foreground";

/** Foreground modules */
const modules: Module<any>[] = [{ ...testModule, function: test }];

export default modules;
