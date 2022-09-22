import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["ENCRYPT"];

const encrypt: ModuleProperties = {
  functionName: "encrypt",
  permissions
};

export default encrypt;
