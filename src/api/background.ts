import { Module } from "./module";

import testModule from "./modules/test";
import test from "./modules/test/test.background";

/** Background modules */
const modules: Module<any>[] = [{ ...testModule, function: test }];

export default modules;
