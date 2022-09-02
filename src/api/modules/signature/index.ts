import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["SIGNATURE"];

const signature: ModuleProperties = {
  functionName: "signature",
  permissions
};

export default signature;
