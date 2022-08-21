import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const testModule: ModuleProperties = {
  functionName: "test",
  permissions
};

export default testModule;
