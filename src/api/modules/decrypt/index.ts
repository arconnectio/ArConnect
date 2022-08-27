import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["DECRYPT"];

const decrypt: ModuleProperties = {
  functionName: "decrypt",
  permissions
};

export default decrypt;
