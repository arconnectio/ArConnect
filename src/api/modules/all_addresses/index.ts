import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ACCESS_ALL_ADDRESSES"];

const allAddresses: ModuleProperties = {
  functionName: "getAllAddresses",
  permissions
};

export default allAddresses;
