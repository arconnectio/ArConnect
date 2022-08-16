import { Module, ModuleFunction } from "../module";
import { PermissionType } from "../../utils/permissions";

const permissions: PermissionType[] = [];

interface ResultType {
  test: string;
}

const background: ModuleFunction<ResultType> = async (test: any) => {
  return test;
};

const injected: ModuleFunction<ResultType> = async (test: any) => {
  return test;
};

const testModule: Module<ResultType> = {
  functionName: "test",
  permissions,
  background,
  injected
};

export default testModule;
