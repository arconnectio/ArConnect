import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_ADDRESS"];

const activeAddress: ModuleProperties = {
  functionName: "getActiveAddress",
  permissions
};

export default activeAddress;
