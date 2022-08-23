import { ModuleProperties } from "../../module";
import { PermissionType } from "../../../utils/permissions";

const permissions: PermissionType[] = ["SIGN_TRANSACTION"];

const sign: ModuleProperties = {
  functionName: "sign",
  permissions
};

export default sign;
